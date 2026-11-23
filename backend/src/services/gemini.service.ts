import { GoogleGenAI } from '@google/genai';
import { config, calculateCost } from '../config/index.js';
import { ConceptDefinition, DiagramResult, GenerationMetadata } from '../types/index.js';
import { svgValidator } from './svg-validator.service.js';

export interface GenerationRunResult {
  svg: string;
  metadata: GenerationMetadata;
  validation: ReturnType<typeof svgValidator.validate>;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  private modelName: string;

  constructor() {
    this.modelName = config.gemini.model;
    if (config.gemini.apiKey) {
      this.client = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    }
  }

  /**
   * Allows setting or updating the API key at runtime (e.g. from environment or request)
   */
  public setApiKey(apiKey: string) {
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Generates a validated SVG diagram for a given concept.
   * Enforces:
   * 1. Exponential backoff on HTTP 429/503 for up to 3 API retries.
   * 2. Exactly one validation retry if any of the 5 checks fail, feeding back the exact errors.
   */
  public async generateDiagram(
    concept: ConceptDefinition,
    customInstructions?: string
  ): Promise<DiagramResult> {
    const startTime = Date.now();
    let totalApiRetries = 0;
    let validationRetries = 0;
    let accumulatedInputTokens = 0;
    let accumulatedOutputTokens = 0;

    const basePrompt = this.buildSystemPrompt(concept, customInstructions);

    // Initial Generation Call
    const initialCall = await this.callGeminiWithRetry(basePrompt);
    totalApiRetries += initialCall.apiRetries;
    accumulatedInputTokens += initialCall.inputTokens;
    accumulatedOutputTokens += initialCall.outputTokens;

    let finalSvg = svgValidator.cleanSvgString(initialCall.text);
    let validation = svgValidator.validate(finalSvg);

    // If validation fails, perform exactly ONE validation retry providing exact failure reasons
    if (!validation.isValid && config.gemini.maxValidationRetries > 0) {
      validationRetries += 1;
      const retryPrompt = this.buildValidationRetryPrompt(concept, finalSvg, validation.errors);

      try {
        const retryCall = await this.callGeminiWithRetry(retryPrompt);
        totalApiRetries += retryCall.apiRetries;
        accumulatedInputTokens += retryCall.inputTokens;
        accumulatedOutputTokens += retryCall.outputTokens;

        const fixedSvg = svgValidator.cleanSvgString(retryCall.text);
        const retryValidation = svgValidator.validate(fixedSvg);

        // If the retry improved or succeeded, adopt it
        finalSvg = fixedSvg;
        validation = retryValidation;
      } catch (retryError) {
        // If retry failed due to API error, retain previous output with its validation errors
        console.error('Validation retry failed:', retryError);
      }
    }

    const totalTimeMs = Date.now() - startTime;
    const estimatedCostUsd = calculateCost(this.modelName, accumulatedInputTokens, accumulatedOutputTokens);

    const metadata: GenerationMetadata = {
      model: this.modelName,
      inputTokens: accumulatedInputTokens,
      outputTokens: accumulatedOutputTokens,
      estimatedCostUsd,
      apiRetries: totalApiRetries,
      validationRetries,
      totalTimeMs,
      generatedAt: new Date().toISOString(),
    };

    return {
      id: `${concept.id}-${Date.now()}`,
      conceptId: concept.id,
      conceptName: concept.name,
      subject: concept.subject,
      prompt: concept.prompt,
      svg: finalSvg,
      validation,
      metadata,
    };
  }

  /**
   * Executes a Gemini API call with exponential backoff on 429/503 errors.
   */
  public async callGeminiWithRetry(
    prompt: string,
    maxRetries: number = config.gemini.maxApiRetries,
    initialDelayMs: number = config.gemini.initialRetryDelayMs
  ): Promise<{ text: string; inputTokens: number; outputTokens: number; apiRetries: number }> {
    if (!this.client) {
      // If client not initialized with API key, check if env was updated
      if (process.env.GEMINI_API_KEY) {
        this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      } else {
        throw new Error(
          'GEMINI_API_KEY is not configured on the backend. Please configure GEMINI_API_KEY in your environment or .env file.'
        );
      }
    }

    let attempt = 0;
    let apiRetries = 0;
    let delay = initialDelayMs;

    while (attempt <= maxRetries) {
      try {
        const response = await this.client.models.generateContent({
          model: this.modelName,
          contents: prompt,
        });

        const text = response.text || '';
        const usage = response.usageMetadata;
        const inputTokens = usage?.promptTokenCount || Math.ceil(prompt.length / 4);
        const outputTokens = usage?.candidatesTokenCount || Math.ceil(text.length / 4);

        return {
          text,
          inputTokens,
          outputTokens,
          apiRetries,
        };
      } catch (error: any) {
        const status = error.status || error.statusCode || (error.message?.includes('429') ? 429 : error.message?.includes('503') ? 503 : 500);
        const isRateLimit = status === 429 || error.message?.toLowerCase().includes('resource has been exhausted') || error.message?.toLowerCase().includes('quota');
        const isServiceUnavailable = status === 503 || error.message?.toLowerCase().includes('service unavailable');

        if ((isRateLimit || isServiceUnavailable) && attempt < maxRetries) {
          attempt++;
          apiRetries++;
          // Exponential backoff with jitter
          const jitter = Math.random() * 200;
          const waitTime = delay + jitter;
          console.warn(`[Gemini API] Encountered HTTP ${status} (Attempt ${attempt}/${maxRetries}). Retrying in ${Math.round(waitTime)}ms...`);
          await new Promise((res) => setTimeout(res, waitTime));
          delay *= 2;
        } else {
          // Unrecoverable error or max retries exhausted
          const friendlyMessage = isRateLimit
            ? `Gemini API rate limit exceeded (HTTP 429). Exhausted all ${maxRetries} backoff retries. Please verify quota or try again shortly.`
            : isServiceUnavailable
            ? `Gemini API service temporarily unavailable (HTTP 503). Exhausted ${maxRetries} retries.`
            : `Gemini API request failed: ${error.message || String(error)}`;

          const err = new Error(friendlyMessage);
          (err as any).statusCode = status;
          (err as any).apiRetries = apiRetries;
          throw err;
        }
      }
    }

    throw new Error(`Failed to generate diagram after ${maxRetries} API retries.`);
  }

  private buildSystemPrompt(concept: ConceptDefinition, customInstructions?: string): string {
    return `You are an expert scientific diagram designer and SVG engineer creating high-grade educational visual aids for UK GCSE science students.

Generate a complete, self-contained, valid SVG diagram for the following concept:
CONCEPT: "${concept.name}" (${concept.subject})
CORE EDUCATIONAL SPECIFICATION:
"${concept.prompt}"
${customInstructions ? `ADDITIONAL INSTRUCTION: ${customInstructions}` : ''}

MANDATORY TECHNICAL CONSTRAINTS:
1. OUTPUT FORMAT: Output ONLY pure valid SVG markup starting with <svg> and ending with </svg>. Do NOT include markdown code blocks, do NOT write explanations or introductory remarks.
2. VIEWBOX: Use viewBox="0 0 800 600" width="100%" height="100%". All drawn elements must have coordinates strictly between (0, 0) and (800, 600).
3. TITLE: Must include a <title> element inside the <svg> (e.g. <title>${concept.name} Diagram</title>).
4. LABELS: Must include AT LEAST 3 distinct, meaningful <text> label elements explaining the parts (e.g., formula, components, arrows, values, keywords).
5. ANIMATION: Must include at least ONE animation demonstrating the dynamic scientific principle (either CSS @keyframes with animation, or SMIL <animate> / <animateTransform>). Examples: flowing electrons, moving molecules, glowing formula, vibrating bonds, or sunlight rays.
6. STYLING & ACCESSIBILITY:
   - Use clean, modern scientific styling with a light background (#f8fafc or #ffffff), distinct contrast, clear legible sans-serif fonts, and polished stroke accents.
   - Contrast colors clearly for clarity and educational value.
7. SECURITY RULES:
   - Strictly NO <script> tags.
   - Strictly NO <foreignObject> tags.
   - Strictly NO inline javascript event handlers (e.g. onload, onclick).
   - Strictly NO external network links or external images in href/xlink:href. Everything must be pure native SVG vectors.

Generate the complete SVG now:`;
  }

  private buildValidationRetryPrompt(
    concept: ConceptDefinition,
    failedSvg: string,
    validationErrors: string[]
  ): string {
    return `You previously generated an SVG for "${concept.name}" but it failed programmatic validation with the following critical error(s):
${validationErrors.map((e, i) => `${i + 1}. ${e}`).join('\n')}

Previous failed SVG snippet:
${failedSvg.substring(0, 500)}...

Please fix the SVG and return the corrected, complete SVG markup.
Remember:
- Must be valid well-formed XML/SVG.
- Must fit entirely within viewBox="0 0 800 600".
- Must contain <title>${concept.name}</title>.
- Must contain at least 3 distinct <text> labels.
- Must contain at least 1 working animation (SMIL <animate> or CSS @keyframes).
- NO <script>, NO <foreignObject>, NO external URLs.
- Return ONLY raw SVG code, without markdown quotes or markdown code fences.`;
  }
}

export const geminiService = new GeminiService();

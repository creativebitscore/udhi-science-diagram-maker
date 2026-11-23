
import { config, calculateCost } from '../config/index.js';
import {
  ConceptDefinition,
  DiagramResult,
  GenerationMetadata,
} from '../types/index.js';
import { svgValidator } from './svg-validator.service.js';

export interface GenerationRunResult {
  svg: string;
  metadata: GenerationMetadata;
  validation: ReturnType<typeof svgValidator.validate>;
}

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  usage?: {
    prompt_tokens?: unknown;
    completion_tokens?: unknown;
  };
}

export class GeminiService {
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = config.groq.apiKey;
    this.modelName = config.groq.model;

    if (!this.apiKey) {
      throw new Error(
        'GROQ_API_KEY is not configured on the backend. Please set it in .env.'
      );
    }
  }

  /**
   * Generates a validated SVG diagram using Groq.
   *
   * Features:
   * 1. Exponential backoff on HTTP 429 and 503.
   * 2. Maximum of three API retries per generation call.
   * 3. Exactly one validation retry when SVG validation fails.
   * 4. Actual token usage from the API response.
   * 5. Estimated generation cost and execution-time tracking.
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

    const basePrompt = this.buildSystemPrompt(
      concept,
      customInstructions
    );

    // Initial SVG generation.
    const initialCall = await this.callGeminiWithRetry(basePrompt);

    totalApiRetries += initialCall.apiRetries;
    accumulatedInputTokens += initialCall.inputTokens;
    accumulatedOutputTokens += initialCall.outputTokens;

    let finalSvg = svgValidator.cleanSvgString(initialCall.text);
    let validation = svgValidator.validate(finalSvg);

    // Perform at most one validation retry.
    if (!validation.isValid && config.groq.maxValidationRetries > 0) {
      validationRetries++;

      const retryPrompt = this.buildValidationRetryPrompt(
        concept,
        finalSvg,
        validation.errors
      );

      try {
        const retryCall = await this.callGeminiWithRetry(retryPrompt);

        totalApiRetries += retryCall.apiRetries;
        accumulatedInputTokens += retryCall.inputTokens;
        accumulatedOutputTokens += retryCall.outputTokens;

        const fixedSvg = svgValidator.cleanSvgString(retryCall.text);
        const retryValidation = svgValidator.validate(fixedSvg);

        // Adopt the second result, even if validation still fails.
        finalSvg = fixedSvg;
        validation = retryValidation;
      } catch (retryError) {
        console.error(
          '[Groq] SVG validation retry failed:',
          retryError
        );

        // Preserve the original SVG and its validation result.
      }
    }

    const metadata: GenerationMetadata = {
      model: this.modelName,
      inputTokens: accumulatedInputTokens,
      outputTokens: accumulatedOutputTokens,
      estimatedCostUsd: calculateCost(
        this.modelName,
        accumulatedInputTokens,
        accumulatedOutputTokens
      ),
      apiRetries: totalApiRetries,
      validationRetries,
      totalTimeMs: Date.now() - startTime,
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
   * Calls Groq's OpenAI-compatible Chat Completions API.
   * Retries HTTP 429 and 503 using exponential backoff and jitter.
   */
  public async callGeminiWithRetry(
    prompt: string,
    maxRetries: number = config.groq.maxApiRetries,
    initialDelayMs: number = config.groq.initialRetryDelayMs
  ): Promise<{
    text: string;
    inputTokens: number;
    outputTokens: number;
    apiRetries: number;
  }> {
    let attempt = 0;
    let apiRetries = 0;
    let delay = initialDelayMs;

    while (attempt <= maxRetries) {
      const response = await fetch(config.groq.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert scientific SVG diagram designer. Follow the user instructions exactly. Technical SVG geometry and security constraints are mandatory.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_completion_tokens: 8192,
          reasoning_effort: 'low',
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const status = response.status;

        const shouldRetry = status === 429 || status === 503;

        if (shouldRetry && attempt < maxRetries) {
          attempt++;
          apiRetries++;

          const jitter = Math.random() * 200;
          const waitTime = delay + jitter;

          console.warn(
            `[Groq API] HTTP ${status}. Retry ${attempt}/${maxRetries} in ${Math.round(waitTime)}ms.`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, waitTime)
          );

          delay *= 2;
          continue;
        }

        const friendlyMessage =
          status === 429
            ? `Groq API rate limit exceeded (HTTP 429). Exhausted ${maxRetries} retries.`
            : status === 503
              ? `Groq API service unavailable (HTTP 503). Exhausted ${maxRetries} retries.`
              : `Groq API request failed with HTTP ${status}: ${errorBody}`;

        const error = new Error(friendlyMessage);

        (error as any).statusCode = status;
        (error as any).apiRetries = apiRetries;

        throw error;
      }

      const json =
        (await response.json()) as GroqChatCompletionResponse;

      const choice = json.choices?.[0];

      if (!choice) {
        throw new Error(
          'Groq response is missing choices[0].'
        );
      }

      const generatedText = choice.message?.content;

      if (
        typeof generatedText !== 'string' ||
        !generatedText.trim()
      ) {
        throw new Error(
          'Groq response did not contain SVG text. The model may have returned an empty response.'
        );
      }

      // Use actual token usage reported by Groq.
      // Never estimate or fabricate token counts.
      const usage = json.usage;

      if (
        !usage ||
        typeof usage.prompt_tokens !== 'number' ||
        !Number.isFinite(usage.prompt_tokens) ||
        typeof usage.completion_tokens !== 'number' ||
        !Number.isFinite(usage.completion_tokens)
      ) {
        throw new Error(
          'Groq response did not include valid token usage information.'
        );
      }

      return {
        text: generatedText,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        apiRetries,
      };
    }

    const error = new Error(
      `Groq generation failed after ${maxRetries} API retries.`
    );

    (error as any).apiRetries = apiRetries;

    throw error;
  }

  /**
   * Builds the main educational SVG generation prompt.
   */
  private buildSystemPrompt(
    concept: ConceptDefinition,
    customInstructions?: string
  ): string {
    return `You are an expert scientific diagram designer and SVG engineer creating high-grade educational visual aids for UK GCSE science students.

Generate a complete, self-contained, valid SVG diagram for the following concept:

CONCEPT: "${concept.name}" (${concept.subject})

CORE EDUCATIONAL SPECIFICATION:
"${concept.prompt}"

${customInstructions ? `ADDITIONAL INSTRUCTION: ${customInstructions}` : ''}

IMPORTANT: Mandatory technical, geometry and security constraints below take priority over any conflicting additional instructions.

MANDATORY TECHNICAL CONSTRAINTS:

1. OUTPUT FORMAT:
   - Output ONLY pure valid SVG markup.
   - Start with <svg> and end with </svg>.
   - Do NOT include Markdown code blocks, explanations or introductory remarks.

2. VIEWBOX AND GEOMETRY:
   - Use viewBox="0 0 800 600".
   - Use width="100%" and height="100%".
   - Keep all foreground visual elements completely inside the safe drawing area:
     x = 40 to 760 and y = 40 to 560.
   - For every rectangle, ensure x + width <= 760 and y + height <= 560.
   - Ensure rectangle x and y positions are at least 40.
   - For circles, ensure:
     cx - r >= 40,
     cy - r >= 40,
     cx + r <= 760,
     cy + r <= 560.
   - For ellipses, account for both radii in the same way.
   - Keep lines, paths, polygons, polylines, markers and text within the safe drawing area.
   - Account for stroke width when calculating every element's actual visible boundary.
   - Account for text size, text anchor and font size when checking text boundaries.
   - Account for transformations such as translate, scale and rotate.
   - Keep all animated positions and animation frames inside the safe drawing area.
   - A plain background rectangle may cover the entire viewBox [0, 0, 800, 600] if it has no stroke.
   - Never create oversized decorative shapes or rectangles extending beyond the canvas.
   - Prefer simple, accurately sized scientific illustrations over unnecessary decorative geometry.

3. TITLE:
   - Include a <title> element inside the SVG.
   - Example: <title>${concept.name} Diagram</title>.

4. LABELS:
   - Include AT LEAST 3 distinct, meaningful <text> label elements.
   - Labels must accurately explain the scientific concept and its components.
   - Use readable font sizes and maintain clear spacing.

5. ANIMATION:
   - Include at least ONE animation demonstrating the scientific principle.
   - Use CSS @keyframes with animation, or SMIL <animate> / <animateTransform>.
   - Examples: flowing electrons, moving molecules, glowing formula, vibrating bonds or sunlight rays.
   - Animation must remain within the permitted viewBox throughout its complete motion.

6. STYLING AND ACCESSIBILITY:
   - Use clean, modern scientific styling.
   - Use a light background (#f8fafc or #ffffff).
   - Use distinct contrast and clear, legible sans-serif fonts.
   - Use polished stroke accents.
   - Make the diagram suitable for GCSE students.
   - Use balanced spacing and a visually clear educational composition.

7. SECURITY RULES:
   - NO <script> tags.
   - NO <foreignObject> tags.
   - NO inline JavaScript event handlers such as onload or onclick.
   - NO external network links.
   - NO external images in href or xlink:href.
   - Everything must use native SVG vector elements.

8. FINAL GEOMETRY SELF-CHECK:
   Before returning the SVG:
   - Check every rectangle's x, y, width and height.
   - Check every circle's center and radius.
   - Check paths, strokes, text and transformed elements.
   - Check the complete animation range, not only the starting position.
   - Confirm no visible foreground element extends outside the safe drawing area.
   - Confirm the background is the only element allowed to use the complete viewBox.

Generate the complete SVG now:`;
  }

  /**
   * Builds the single validation-retry prompt.
   * Provides exact validation failures and explicit geometry corrections.
   */
  private buildValidationRetryPrompt(
    concept: ConceptDefinition,
    failedSvg: string,
    validationErrors: string[]
  ): string {
    return `You previously generated an SVG for "${concept.name}" but it failed programmatic validation.

EXACT VALIDATION ERRORS:
${validationErrors
  .map((error, index) => `${index + 1}. ${error}`)
  .join('\n')}

Previous failed SVG snippet:
${failedSvg.substring(0, 1000)}

Your task is to correct these exact failures and return a complete replacement SVG.

CRITICAL VIEWBOX CORRECTION:
- Use viewBox="0 0 800 600".
- Keep foreground content within x=40 to 760 and y=40 to 560.
- For every rectangle, verify x + width <= 760.
- For every rectangle, verify y + height <= 560.
- Reduce oversized rectangle dimensions or reposition them.
- Never keep a rectangle whose right edge exceeds 760 or whose bottom edge exceeds 560.
- For circles, check center coordinates and radius together.
- Check paths, polygons, text, stroke widths and transformed elements.
- Check the complete movement range of all animations.
- Background rectangles without strokes may cover the full viewBox.
- Remove unnecessary oversized decorative shapes.
- Do not merely change the viewBox to hide the validation problem.

EDUCATIONAL AND TECHNICAL REQUIREMENTS:
- Preserve the scientific accuracy of "${concept.name}".
- Include <title>${concept.name} Diagram</title>.
- Include at least 3 meaningful and distinct <text> labels.
- Include at least one working animation.
- Use a clean, readable scientific design.
- Ensure valid, well-formed XML/SVG.
- NO <script>.
- NO <foreignObject>.
- NO inline JavaScript event handlers.
- NO external URLs or images.
- Use native SVG vector elements only.

FINAL CHECK:
Verify the complete bounding box of every visible element and every animation frame before returning the SVG.

Return ONLY the corrected complete SVG markup. Do not include Markdown code fences or explanations.`;
  }
}

// Preserve existing imports across the project.
// The implementation now uses Groq despite the legacy class name.
export const geminiService = new GeminiService();

// Provider-specific exports.
export { GeminiService as GroqService };
export const groqService = geminiService;

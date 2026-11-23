import { Router, Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';
import { config } from '../config/index.js';
import { ConceptDefinition, DiagramResult } from '../types/index.js';
import { geminiService } from '../services/gemini.service.js';
import { svgValidator } from '../services/svg-validator.service.js';

export const diagramRouter = Router();

// Load concepts from JSON
function getConcepts(): ConceptDefinition[] {
  const content = fs.readFileSync(config.paths.conceptsJson, 'utf8');
  return JSON.parse(content);
}

// Load results from JSON
function getSavedResults(): DiagramResult[] {
  if (!fs.existsSync(config.paths.resultsJson)) {
    return [];
  }
  const content = fs.readFileSync(config.paths.resultsJson, 'utf8');
  return JSON.parse(content);
}

// Save results to JSON
function persistResults(results: DiagramResult[]): void {
  fs.writeFileSync(config.paths.resultsJson, JSON.stringify(results, null, 2), 'utf8');
}

/**
 * GET /api/health
 */
diagramRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: {
      model: config.gemini.model,
      hasApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    },
  });
});

/**
 * GET /api/concepts
 * Returns the 5 GCSE science concepts
 */
diagramRouter.get('/concepts', (_req: Request, res: Response) => {
  try {
    const concepts = getConcepts();
    res.json({ success: true, data: concepts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to load concepts: ' + error.message });
  }
});

/**
 * GET /api/diagrams
 * Instant load of the 5 saved results from results.json (No Gemini call!)
 */
diagramRouter.get('/diagrams', (_req: Request, res: Response) => {
  try {
    const diagrams = getSavedResults();
    res.json({ success: true, data: diagrams });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Failed to load saved diagrams: ' + error.message });
  }
});

/**
 * POST /api/validate
 * Validates any SVG string against all 5 programmatic checks
 */
diagramRouter.post('/validate', (req: Request, res: Response) => {
  try {
    const { svg } = req.body;
    if (typeof svg !== 'string') {
      return res.status(400).json({ success: false, error: 'Expected "svg" string in request body' });
    }
    const validation = svgValidator.validate(svg);
    res.json({ success: true, data: validation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const generateSchema = z.object({
  conceptId: z.string({
    required_error: 'conceptId is required',
    invalid_type_error: 'conceptId must be a string',
  }).trim().min(1, 'conceptId cannot be empty'),
  customPrompt: z.string().optional(),
  apiKey: z.string().optional(),
});

/**
 * POST /api/generate
 * Live generation endpoint for one selected concept using Gemini
 */
diagramRouter.post('/generate', async (req: Request, res: Response) => {
  const parseResult = generateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues.map((i) => i.message).join('; ');
    return res.status(400).json({
      success: false,
      error: `Invalid request payload: ${errorDetails}`,
    });
  }

  const { conceptId, customPrompt, apiKey } = parseResult.data;

  // Find concept
  const concepts = getConcepts();
  const concept = concepts.find((c) => c.id === conceptId);
  if (!concept) {
    const availableIds = concepts.map((c) => c.id).join(', ');
    return res.status(400).json({
      success: false,
      error: `Invalid concept ID "${conceptId}". Valid concept IDs are: ${availableIds}`,
    });
  }

  // Allow optional user-provided API key from frontend session if server env key is unset
  if (apiKey && apiKey.trim().length > 10) {
    geminiService.setApiKey(apiKey.trim());
  }

  try {
    console.log(`[API /generate] Initiating generation for "${concept.name}"...`);
    const newDiagram = await geminiService.generateDiagram(concept, customPrompt);

    // Update in-memory results.json with latest version for this concept
    const currentResults = getSavedResults();
    const existingIndex = currentResults.findIndex((d) => d.conceptId === concept.id);
    if (existingIndex >= 0) {
      // Preserve existing review decision if present
      newDiagram.review = currentResults[existingIndex].review;
      currentResults[existingIndex] = newDiagram;
    } else {
      currentResults.push(newDiagram);
    }
    persistResults(currentResults);

    console.log(`[API /generate] Successfully generated & validated diagram for "${concept.name}"`);
    res.json({
      success: true,
      diagram: newDiagram,
    });
  } catch (error: any) {
    console.error(`[API /generate] Error generating diagram:`, error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message || 'An unexpected error occurred during diagram generation.',
      apiRetries: error.apiRetries ?? 0,
    });
  }
});

/**
 * POST /api/reviews
 * Sync reviewer decisions (Approve/Reject + notes) to backend storage
 */
diagramRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { diagramId, status, notes } = req.body;
    if (!diagramId || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid review payload' });
    }

    const currentResults = getSavedResults();
    const target = currentResults.find((d) => d.id === diagramId || d.conceptId === diagramId);
    if (target) {
      target.review = {
        status,
        notes: notes || '',
        reviewedAt: new Date().toISOString(),
      };
      persistResults(currentResults);
    }

    res.json({ success: true, message: 'Review decision saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

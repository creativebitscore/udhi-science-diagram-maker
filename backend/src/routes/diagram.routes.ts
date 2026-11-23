
import { Router, Request, Response } from 'express';
import fs from 'fs';
import { z } from 'zod';
import { config } from '../config/index.js';
import { ConceptDefinition, DiagramResult } from '../types/index.js';
import { geminiService } from '../services/gemini.service.js';
import { svgValidator } from '../services/svg-validator.service.js';

export const diagramRouter = Router();

function getConcepts(): ConceptDefinition[] {
  const content = fs.readFileSync(config.paths.conceptsJson, 'utf8');
  return JSON.parse(content);
}

function getSavedResults(): DiagramResult[] {
  if (!fs.existsSync(config.paths.resultsJson)) {
    return [];
  }

  const content = fs.readFileSync(config.paths.resultsJson, 'utf8');
  return JSON.parse(content);
}

function persistResults(results: DiagramResult[]): void {
  fs.writeFileSync(
    config.paths.resultsJson,
    JSON.stringify(results, null, 2),
    'utf8'
  );
}

/**
 * GET /api/health
 */
diagramRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    groq: {
      provider: 'Groq',
      model: config.groq.model,
      hasApiKeyConfigured: Boolean(config.groq.apiKey),
    },
  });
});

/**
 * GET /api/concepts
 */
diagramRouter.get('/concepts', (_req: Request, res: Response) => {
  try {
    const concepts = getConcepts();
    res.json({ success: true, data: concepts });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load concepts: ' + error.message,
    });
  }
});

/**
 * GET /api/diagrams
 * Loads saved diagrams without making any AI API calls.
 */
diagramRouter.get('/diagrams', (_req: Request, res: Response) => {
  try {
    const diagrams = getSavedResults();
    res.json({ success: true, data: diagrams });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to load saved diagrams: ' + error.message,
    });
  }
});

/**
 * POST /api/validate
 * Validates an SVG against all five programmatic checks.
 */
diagramRouter.post('/validate', (req: Request, res: Response) => {
  try {
    const { svg } = req.body;

    if (typeof svg !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Expected "svg" string in request body',
      });
    }

    const validation = svgValidator.validate(svg);
    res.json({ success: true, data: validation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Zod 4-compatible generation request validation.
 */
const generateSchema = z.object({
  conceptId: z.string({
    error: (issue) =>
      issue.input === undefined
        ? 'conceptId is required'
        : 'conceptId must be a string',
  }).trim().min(1, 'conceptId cannot be empty'),

  customPrompt: z.string().optional(),
});

/**
 * POST /api/generate
 * Generates one selected concept using Groq.
 */
diagramRouter.post('/generate', async (req: Request, res: Response) => {
  const parseResult = generateSchema.safeParse(req.body);

  if (!parseResult.success) {
    const errorDetails = parseResult.error.issues
      .map((issue) => issue.message)
      .join('; ');

    return res.status(400).json({
      success: false,
      error: `Invalid request payload: ${errorDetails}`,
    });
  }

  const { conceptId, customPrompt } = parseResult.data;

  try {
    const concepts = getConcepts();
    const concept = concepts.find((item) => item.id === conceptId);

    if (!concept) {
      const availableIds = concepts.map((item) => item.id).join(', ');

      return res.status(400).json({
        success: false,
        error: `Invalid concept ID "${conceptId}". Valid concept IDs are: ${availableIds}`,
      });
    }

    console.log(
      `[API /generate] Initiating Groq generation for "${concept.name}"...`
    );

    const newDiagram = await geminiService.generateDiagram(
      concept,
      customPrompt
    );

    const currentResults = getSavedResults();
    const existingIndex = currentResults.findIndex(
      (diagram) => diagram.conceptId === concept.id
    );

    if (existingIndex >= 0) {
      // Preserve the existing reviewer decision.
      newDiagram.review = currentResults[existingIndex].review;
      currentResults[existingIndex] = newDiagram;
    } else {
      currentResults.push(newDiagram);
    }

    persistResults(currentResults);

    console.log(
      `[API /generate] Successfully generated diagram for "${concept.name}". Validation: ${newDiagram.validation.isValid ? 'PASS' : 'FAIL'}`
    );

    res.json({
      success: true,
      diagram: newDiagram,
    });
  } catch (error: any) {
    console.error('[API /generate] Generation error:', error);

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      error:
        error.message ||
        'An unexpected error occurred during diagram generation.',
      apiRetries: error.apiRetries ?? 0,
    });
  }
});

/**
 * POST /api/reviews
 * Saves approve/reject decisions and reviewer notes.
 */
diagramRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { diagramId, status, notes } = req.body;

    if (
      !diagramId ||
      !['approved', 'rejected', 'pending'].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid review payload',
      });
    }

    const currentResults = getSavedResults();

    const target = currentResults.find(
      (diagram) =>
        diagram.id === diagramId || diagram.conceptId === diagramId
    );

    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Diagram not found',
      });
    }

    target.review = {
      status,
      notes: notes || '',
      reviewedAt: new Date().toISOString(),
    };

    persistResults(currentResults);

    res.json({
      success: true,
      message: 'Review decision saved successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

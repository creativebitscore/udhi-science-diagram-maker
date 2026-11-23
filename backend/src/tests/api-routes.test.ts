
import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  afterAll,
  afterEach,
} from 'vitest';

import fs from 'fs';
import request from 'supertest';

import { app } from '../server.js';
import { geminiService } from '../services/gemini.service.js';
import { config } from '../config/index.js';

describe('Express API Endpoints & Groq Generation Regression Tests', () => {
  let initialResultsBackup: string | undefined;
  let resultsFileExisted = false;

  beforeAll(() => {
    if (fs.existsSync(config.paths.resultsJson)) {
      resultsFileExisted = true;
      initialResultsBackup = fs.readFileSync(
        config.paths.resultsJson,
        'utf8'
      );
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    // Restore the original saved diagrams after all tests.
    if (resultsFileExisted && initialResultsBackup !== undefined) {
      fs.writeFileSync(
        config.paths.resultsJson,
        initialResultsBackup,
        'utf8'
      );
    } else if (
      !resultsFileExisted &&
      fs.existsSync(config.paths.resultsJson)
    ) {
      fs.unlinkSync(config.paths.resultsJson);
    }
  });

  it('GET /api/health returns server status and Groq configuration', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();

    expect(res.body.groq).toBeDefined();
    expect(res.body.groq.provider).toBe('Groq');
    expect(res.body.groq.model).toBe(config.groq.model);
    expect(res.body.groq.hasApiKeyConfigured).toBe(true);

    expect(config.groq.model).toBe('openai/gpt-oss-20b');
  });

  it('GET /api/concepts returns all 5 required concepts with stable IDs', async () => {
    const res = await request(app).get('/api/concepts');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);

    const requiredConcepts = [
      {
        id: 'pythagoras-theorem',
        name: "Pythagoras' theorem",
        subject: 'Maths',
      },
      {
        id: 'parts-of-a-circle',
        name: 'Parts of a circle',
        subject: 'Maths',
      },
      {
        id: 'series-circuit',
        name: 'Series circuit',
        subject: 'Physics',
      },
      {
        id: 'photosynthesis',
        name: 'Photosynthesis',
        subject: 'Biology',
      },
      {
        id: 'states-of-matter',
        name: 'States of matter',
        subject: 'Chemistry',
      },
    ];

    for (const requiredConcept of requiredConcepts) {
      const found = res.body.data.find(
        (concept: any) => concept.id === requiredConcept.id
      );

      expect(found).toBeDefined();
      expect(found.name).toBe(requiredConcept.name);
      expect(found.subject).toBe(requiredConcept.subject);
      expect(found.id).toBeTruthy();
      expect(found.prompt).toBeTruthy();
    }
  });

  it('GET /api/diagrams loads all 5 saved diagrams without AI generation', async () => {
    const generationSpy = vi.spyOn(
      geminiService,
      'generateDiagram'
    );

    const res = await request(app).get('/api/diagrams');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);

    res.body.data.forEach((diagram: any) => {
      expect(diagram.svg).toContain('<svg');
      expect(diagram.validation.isValid).toBe(true);
      expect(diagram.metadata.estimatedCostUsd).toBeGreaterThan(0);
      expect(diagram.metadata.inputTokens).toBeGreaterThan(0);
      expect(diagram.metadata.outputTokens).toBeGreaterThan(0);
    });

    // Loading saved diagrams must not consume AI API calls.
    expect(generationSpy).not.toHaveBeenCalled();
  });

  it('POST /api/validate validates SVG markup against all five checks', async () => {
    const sample =
      '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="10" y="30">2</text><text x="10" y="50">3</text><animate attributeName="x" dur="1s" values="0;10" /></svg>';

    const res = await request(app)
      .post('/api/validate')
      .send({ svg: sample });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.checks).toHaveLength(5);
  });

  it('POST /api/validate rejects a non-string SVG payload', async () => {
    const res = await request(app)
      .post('/api/validate')
      .send({ svg: 123 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/svg.*string/i);
  });

  it('POST /api/generate rejects an empty conceptId', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ conceptId: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId cannot be empty/i);
  });

  it('POST /api/generate rejects a whitespace-only conceptId', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({ conceptId: '    ' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId cannot be empty/i);
  });

  it('POST /api/generate rejects a missing conceptId', async () => {
    const res = await request(app)
      .post('/api/generate')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId is required/i);
  });

  it('POST /api/generate rejects an unknown concept ID with useful options', async () => {
    const generationSpy = vi.spyOn(
      geminiService,
      'generateDiagram'
    );

    const res = await request(app)
      .post('/api/generate')
      .send({ conceptId: 'quantum-physics' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain(
      'Invalid concept ID "quantum-physics"'
    );
    expect(res.body.error).toContain('pythagoras-theorem');
    expect(res.body.error).toContain('parts-of-a-circle');

    expect(generationSpy).not.toHaveBeenCalled();
  });

  it('POST /api/generate accepts a valid concept and invokes the Groq generation service', async () => {
    const mockDiagramResult = {
      id: 'pythagoras-theorem-mock-123',
      conceptId: 'pythagoras-theorem',
      conceptName: "Pythagoras' theorem",
      subject: 'Maths',
      prompt: 'mock prompt',

      svg: '<svg viewBox="0 0 800 600"><title>Mock</title><text x="10" y="10">1</text><text x="10" y="30">2</text><text x="10" y="50">3</text><animate attributeName="x" dur="1s" values="0;10"/></svg>',

      validation: {
        isValid: true,
        checks: [
          {
            checkId: 'xml_valid',
            name: 'Valid XML/SVG',
            passed: true,
            message: 'OK',
          },
          {
            checkId: 'viewbox_bounds',
            name: 'ViewBox Bounds',
            passed: true,
            message: 'OK',
          },
          {
            checkId: 'title_and_labels',
            name: 'Title and Labels',
            passed: true,
            message: 'OK',
          },
          {
            checkId: 'has_animation',
            name: 'Animation Presence',
            passed: true,
            message: 'OK',
          },
          {
            checkId: 'security_clean',
            name: 'Security and Integrity',
            passed: true,
            message: 'OK',
          },
        ],
        errors: [],
      },

      metadata: {
        model: 'openai/gpt-oss-20b',
        inputTokens: 380,
        outputTokens: 890,
        estimatedCostUsd: 0.0003,
        apiRetries: 0,
        validationRetries: 0,
        totalTimeMs: 1200,
        generatedAt: new Date().toISOString(),
      },
    };

    const generationSpy = vi
      .spyOn(geminiService, 'generateDiagram')
      .mockResolvedValueOnce(mockDiagramResult as any);

    const res = await request(app)
      .post('/api/generate')
      .send({
        conceptId: 'pythagoras-theorem',
        customPrompt: 'test instructions',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.diagram).toBeDefined();
    expect(res.body.diagram.conceptId).toBe('pythagoras-theorem');
    expect(res.body.diagram.metadata.model).toBe(
      'openai/gpt-oss-20b'
    );

    expect(generationSpy).toHaveBeenCalledTimes(1);

    expect(generationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pythagoras-theorem',
        name: "Pythagoras' theorem",
      }),
      'test instructions'
    );

    // Verify the generated result was persisted.
    const savedResults = JSON.parse(
      fs.readFileSync(config.paths.resultsJson, 'utf8')
    );

    expect(
      savedResults.some(
        (diagram: any) =>
          diagram.id === 'pythagoras-theorem-mock-123'
      )
    ).toBe(true);
  });

  it('POST /api/reviews saves approval status and reviewer notes', async () => {
    const diagramsBeforeReview = await request(app).get('/api/diagrams');

    expect(diagramsBeforeReview.status).toBe(200);
    expect(diagramsBeforeReview.body.data.length).toBeGreaterThan(0);

    const targetDiagram = diagramsBeforeReview.body.data[0];

    const res = await request(app)
      .post('/api/reviews')
      .send({
        diagramId: targetDiagram.conceptId,
        status: 'approved',
        notes: 'Diagram reviewed and approved.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const diagramsAfterReview = await request(app).get('/api/diagrams');

    const updatedDiagram = diagramsAfterReview.body.data.find(
      (diagram: any) =>
        diagram.conceptId === targetDiagram.conceptId
    );

    expect(updatedDiagram.review.status).toBe('approved');
    expect(updatedDiagram.review.notes).toBe(
      'Diagram reviewed and approved.'
    );
    expect(updatedDiagram.review.reviewedAt).toBeTruthy();
  });

  it('POST /api/reviews rejects an invalid review status', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({
        diagramId: 'pythagoras-theorem',
        status: 'invalid',
        notes: 'Invalid status test',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/reviews returns 404 when the diagram does not exist', async () => {
    const res = await request(app)
      .post('/api/reviews')
      .send({
        diagramId: 'non-existent-diagram',
        status: 'approved',
        notes: 'Test',
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

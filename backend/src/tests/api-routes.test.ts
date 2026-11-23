import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import request from 'supertest';
import { app } from '../server.js';
import { geminiService } from '../services/gemini.service.js';
import { config } from '../config/index.js';

describe('Express API Endpoints & Live Generation Regression Tests', () => {
  let initialResultsBackup: string;

  beforeAll(() => {
    if (fs.existsSync(config.paths.resultsJson)) {
      initialResultsBackup = fs.readFileSync(config.paths.resultsJson, 'utf8');
    }
  });

  afterAll(() => {
    if (initialResultsBackup) {
      fs.writeFileSync(config.paths.resultsJson, initialResultsBackup, 'utf8');
    }
  });
  it('GET /api/health returns server status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.gemini).toBeDefined();
  });

  it('GET /api/concepts returns all 5 required concepts with stable, non-empty IDs', async () => {
    const res = await request(app).get('/api/concepts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);

    const requiredConcepts = [
      { id: 'pythagoras-theorem', name: "Pythagoras' theorem", subject: 'Maths' },
      { id: 'parts-of-a-circle', name: 'Parts of a circle', subject: 'Maths' },
      { id: 'series-circuit', name: 'Series circuit', subject: 'Physics' },
      { id: 'photosynthesis', name: 'Photosynthesis', subject: 'Biology' },
      { id: 'states-of-matter', name: 'States of matter', subject: 'Chemistry' },
    ];

    for (const reqConcept of requiredConcepts) {
      const found = res.body.data.find((c: any) => c.id === reqConcept.id);
      expect(found).toBeDefined();
      expect(found.name).toBe(reqConcept.name);
      expect(found.subject).toBe(reqConcept.subject);
      expect(found.id).toBeTruthy();
      expect(found.prompt).toBeTruthy();
    }
  });

  it('GET /api/diagrams loads the 5 saved results immediately', async () => {
    const res = await request(app).get('/api/diagrams');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
    res.body.data.forEach((diagram: any) => {
      expect(diagram.svg).toContain('<svg');
      expect(diagram.validation.isValid).toBe(true);
      expect(diagram.metadata.estimatedCostUsd).toBeGreaterThan(0);
      expect(diagram.metadata.inputTokens).toBeGreaterThan(0);
    });
  });

  it('POST /api/validate validates raw SVG markup', async () => {
    const sample =
      '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="10" y="30">2</text><text x="10" y="50">3</text><animate attributeName="x" dur="1s" values="0;10" /></svg>';
    const res = await request(app).post('/api/validate').send({ svg: sample });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.checks).toHaveLength(5);
  });

  // REGRESSION TESTS FOR LIVE GENERATION & CONCEPT SELECTION

  it('POST /api/generate rejects empty string conceptId with 400 Bad Request', async () => {
    const res = await request(app).post('/api/generate').send({ conceptId: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId cannot be empty/i);
  });

  it('POST /api/generate rejects whitespace conceptId with 400 Bad Request', async () => {
    const res = await request(app).post('/api/generate').send({ conceptId: '    ' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId cannot be empty/i);
  });

  it('POST /api/generate rejects missing conceptId payload with 400 Bad Request', async () => {
    const res = await request(app).post('/api/generate').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/conceptId is required/i);
  });

  it('POST /api/generate rejects invalid/unknown concept ID with useful 400 error listing valid options', async () => {
    const res = await request(app).post('/api/generate').send({ conceptId: 'quantum-physics' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid concept ID "quantum-physics"');
    expect(res.body.error).toContain('pythagoras-theorem');
    expect(res.body.error).toContain('parts-of-a-circle');
  });

  it('POST /api/generate successfully accepts valid conceptId and invokes generation service', async () => {
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
          { checkId: 'xml_valid', name: 'Valid XML/SVG', passed: true, message: 'OK' },
          { checkId: 'viewbox_bounds', name: 'ViewBox Bounds', passed: true, message: 'OK' },
          { checkId: 'title_and_labels', name: 'Title and Labels', passed: true, message: 'OK' },
          { checkId: 'has_animation', name: 'Animation Presence', passed: true, message: 'OK' },
          { checkId: 'security_clean', name: 'Security & Integrity', passed: true, message: 'OK' },
        ],
        errors: [],
      },
      metadata: {
        model: 'gemini-2.5-flash',
        inputTokens: 380,
        outputTokens: 890,
        estimatedCostUsd: 0.0003,
        apiRetries: 0,
        validationRetries: 0,
        totalTimeMs: 1200,
        generatedAt: new Date().toISOString(),
      },
    };

    const spy = vi
      .spyOn(geminiService, 'generateDiagram')
      .mockResolvedValueOnce(mockDiagramResult as any);

    const res = await request(app)
      .post('/api/generate')
      .send({ conceptId: 'pythagoras-theorem', customPrompt: 'test instructions' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.diagram).toBeDefined();
    expect(res.body.diagram.conceptId).toBe('pythagoras-theorem');
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'pythagoras-theorem', name: "Pythagoras' theorem" }),
      'test instructions'
    );

    spy.mockRestore();
  });
});

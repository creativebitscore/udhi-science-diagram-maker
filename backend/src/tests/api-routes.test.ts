import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../server.js';

describe('Express API Endpoints', () => {
  it('GET /api/health returns server status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.gemini).toBeDefined();
  });

  it('GET /api/concepts returns the 5 required concepts', async () => {
    const res = await request(app).get('/api/concepts');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(5);
    const names = res.body.data.map((c: any) => c.name);
    expect(names).toContain("Pythagoras' theorem");
    expect(names).toContain("Parts of a circle");
    expect(names).toContain("Series circuit");
    expect(names).toContain("Photosynthesis");
    expect(names).toContain("States of matter");
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
    const sample = '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="10" y="30">2</text><text x="10" y="50">3</text><animate attributeName="x" dur="1s" values="0;10" /></svg>';
    const res = await request(app).post('/api/validate').send({ svg: sample });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isValid).toBe(true);
    expect(res.body.data.checks).toHaveLength(5);
  });
});

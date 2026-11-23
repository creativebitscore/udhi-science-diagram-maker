import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiService } from '../services/api.js';

describe('Frontend apiService & Generation Request Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects empty string conceptId before network call', async () => {
    await expect(apiService.generateDiagram('')).rejects.toThrow(
      /valid concept ID is required/i
    );
  });

  it('rejects whitespace conceptId before network call', async () => {
    await expect(apiService.generateDiagram('   ')).rejects.toThrow(
      /valid concept ID is required/i
    );
  });

  it('sends correct conceptId payload to /api/generate on valid input', async () => {
    const mockDiagram = {
      id: 'pythagoras-theorem-1',
      conceptId: 'pythagoras-theorem',
      conceptName: "Pythagoras' theorem",
      subject: 'Maths',
      prompt: 'a² + b² = c²',
      svg: '<svg></svg>',
      validation: { isValid: true, checks: [], errors: [] },
      metadata: {
        model: 'gemini-2.5-flash',
        inputTokens: 100,
        outputTokens: 200,
        estimatedCostUsd: 0.0001,
        apiRetries: 0,
        validationRetries: 0,
        totalTimeMs: 1000,
        generatedAt: new Date().toISOString(),
      },
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, diagram: mockDiagram }),
    } as any);

    const result = await apiService.generateDiagram('pythagoras-theorem', 'custom notes', 'test-key');
    expect(result).toEqual(mockDiagram);
    expect(fetchSpy).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conceptId: 'pythagoras-theorem',
        customPrompt: 'custom notes',
        apiKey: 'test-key',
      }),
    });
  });

  it('surfaces backend 400 error message cleanly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Invalid concept ID "unknown". Valid concept IDs are: pythagoras-theorem, parts-of-a-circle, series-circuit, photosynthesis, states-of-matter',
      }),
    } as any);

    await expect(apiService.generateDiagram('unknown')).rejects.toThrow(
      /Invalid concept ID "unknown"/
    );
  });
});

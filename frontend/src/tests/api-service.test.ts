
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { apiService } from '../services/api.js';

describe('Frontend API Service & Groq Generation Request Validation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects an empty conceptId before making a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      apiService.generateDiagram('')
    ).rejects.toThrow(/valid concept ID is required/i);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only conceptId before making a network request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(
      apiService.generateDiagram('   ')
    ).rejects.toThrow(/valid concept ID is required/i);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sends the correct Groq generation payload without exposing an API key', async () => {
    const mockDiagram = {
      id: 'pythagoras-theorem-1',
      conceptId: 'pythagoras-theorem',
      conceptName: "Pythagoras' theorem",
      subject: 'Maths',
      prompt: 'a² + b² = c²',
      svg: '<svg viewBox="0 0 800 600"><title>Test</title></svg>',
      validation: {
        isValid: true,
        checks: [],
        errors: [],
      },
      metadata: {
        model: 'openai/gpt-oss-20b',
        inputTokens: 100,
        outputTokens: 200,
        estimatedCostUsd: 0.0001,
        apiRetries: 0,
        validationRetries: 0,
        totalTimeMs: 1000,
        generatedAt: new Date().toISOString(),
      },
    };

    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          diagram: mockDiagram,
        }),
      } as Response);

    // The third argument is retained temporarily for compatibility.
    // It must never be forwarded to the backend.
    const result = await apiService.generateDiagram(
      'pythagoras-theorem',
      'custom notes',
      'legacy-test-key'
    );

    expect(result).toEqual(mockDiagram);

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    expect(fetchSpy).toHaveBeenCalledWith('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conceptId: 'pythagoras-theorem',
        customPrompt: 'custom notes',
      }),
    });

    const requestOptions = fetchSpy.mock.calls[0][1];
    const requestBody = JSON.parse(
      requestOptions?.body as string
    );

    expect(requestBody.apiKey).toBeUndefined();
    expect(requestBody.model).toBeUndefined();
    expect(requestBody.conceptId).toBe('pythagoras-theorem');
  });

  it('surfaces backend validation errors cleanly', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error:
          'Invalid concept ID "unknown". Valid concept IDs are: pythagoras-theorem, parts-of-a-circle, series-circuit, photosynthesis, states-of-matter',
      }),
    } as Response);

    await expect(
      apiService.generateDiagram('unknown')
    ).rejects.toThrow(/Invalid concept ID "unknown"/);
  });

  it('returns the Groq health response correctly', async () => {
    const healthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      groq: {
        provider: 'Groq',
        model: 'openai/gpt-oss-20b',
        hasApiKeyConfigured: true,
      },
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => healthResponse,
    } as Response);

    const result = await apiService.getHealth();

    expect(result).toEqual(healthResponse);
    expect(result.groq.provider).toBe('Groq');
    expect(result.groq.model).toBe('openai/gpt-oss-20b');
    expect(result.groq.hasApiKeyConfigured).toBe(true);
  });
});

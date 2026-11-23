
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { GroqService } from '../services/gemini.service.js';

describe('GroqService Diagram Generation Tests', () => {
  let service: GroqService;
  const mockFetch = vi.fn();

  const validSvg =
    '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="10" y="30">2</text><text x="10" y="50">3</text><animate attributeName="x" dur="1s" values="0;10" /></svg>';

  const successResponse = (
    svg: string,
    inputTokens = 10,
    outputTokens = 20
  ) => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: svg,
          },
        },
      ],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
      },
    }),
  });

  const errorResponse = (status: number, body: string) => ({
    ok: false,
    status,
    text: async () => body,
  });

  const concept = {
    id: 'c1',
    name: "Pythagoras' theorem",
    subject: 'Maths',
    prompt: 'Explain the theorem with a diagram.',
  } as const;

  beforeEach(() => {
    service = new GroqService();

    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);

    // Make retry jitter deterministic for predictable test execution.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('generates a valid SVG and records actual API token usage', async () => {
    mockFetch.mockResolvedValueOnce(
      successResponse(validSvg, 10, 20)
    );

    const result = await service.generateDiagram(concept);

    expect(result.svg).toContain('<svg');
    expect(result.validation.isValid).toBe(true);

    expect(result.metadata.model).toBe('openai/gpt-oss-20b');
    expect(result.metadata.inputTokens).toBe(10);
    expect(result.metadata.outputTokens).toBe(20);

    expect(result.metadata.estimatedCostUsd).toBeGreaterThan(0);
    expect(result.metadata.apiRetries).toBe(0);
    expect(result.metadata.validationRetries).toBe(0);
    expect(result.metadata.totalTimeMs).toBeGreaterThanOrEqual(0);
    expect(result.metadata.generatedAt).toBeTruthy();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('handles a Groq response with missing choices gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      service.generateDiagram(concept)
    ).rejects.toThrow('Groq response is missing choices[0].');

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('retries after HTTP 429 and successfully generates the diagram', async () => {
    mockFetch
      .mockResolvedValueOnce(
        errorResponse(429, 'Rate limit exceeded')
      )
      .mockResolvedValueOnce(
        successResponse(validSvg, 5, 15)
      );

    const result = await service.generateDiagram(concept);

    expect(result.validation.isValid).toBe(true);
    expect(result.svg).toContain('<svg');

    expect(result.metadata.apiRetries).toBe(1);
    expect(result.metadata.validationRetries).toBe(0);

    expect(result.metadata.inputTokens).toBe(5);
    expect(result.metadata.outputTokens).toBe(15);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('performs exactly one validation retry when the first SVG is invalid', async () => {
    const invalidSvg = '<svg><title>Invalid diagram</title></svg>';

    mockFetch
      .mockResolvedValueOnce(
        successResponse(invalidSvg, 10, 20)
      )
      .mockResolvedValueOnce(
        successResponse(validSvg, 15, 25)
      );

    const result = await service.generateDiagram(concept);

    expect(result.validation.isValid).toBe(true);
    expect(result.svg).toContain('<svg');

    expect(result.metadata.validationRetries).toBe(1);

    // Token usage from both actual Groq responses is accumulated.
    expect(result.metadata.inputTokens).toBe(25);
    expect(result.metadata.outputTokens).toBe(45);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

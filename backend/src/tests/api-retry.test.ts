
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';

import { config } from '../config/index.js';
import { GroqService } from '../services/gemini.service.js';

describe('Groq API Retry & Backoff Logic', () => {
  let service: GroqService;
  let mockFetch: ReturnType<typeof vi.fn>;

  const validSvg =
    '<svg viewBox="0 0 800 600"><title>Test</title><text x="50" y="50">A</text><text x="50" y="80">B</text><text x="50" y="110">C</text><animate attributeName="opacity" dur="1s" values="0;1" /></svg>';

  const successResponse = (
    inputTokens = 150,
    outputTokens = 220
  ) => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            content: validSvg,
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

  beforeEach(() => {
    service = new GroqService();

    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Makes retry-delay jitter deterministic during tests.
    vi.spyOn(Math, 'random').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('succeeds on the first attempt without retries', async () => {
    mockFetch.mockResolvedValueOnce(successResponse());

    const result = await service.callGeminiWithRetry(
      'Generate test',
      3,
      10
    );

    expect(result.apiRetries).toBe(0);
    expect(result.inputTokens).toBe(150);
    expect(result.outputTokens).toBe(220);
    expect(result.text).toMatch(/<svg(?:\s|>)/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('sends a Groq Chat Completions request with Bearer authentication', async () => {
    mockFetch.mockResolvedValueOnce(successResponse());

    await service.callGeminiWithRetry('Generate test', 3, 10);

    const [url, options] = mockFetch.mock.calls[0];

    expect(url).toBe(config.groq.endpoint);
    expect(options.method).toBe('POST');
    expect(options.headers.Authorization).toMatch(/^Bearer /);
    expect(options.headers['Content-Type']).toBe('application/json');

    const requestBody = JSON.parse(options.body);

    // Verify the configured model is the intended Groq model.
    expect(config.groq.model).toBe('openai/gpt-oss-20b');
    expect(requestBody.model).toBe(config.groq.model);

    expect(requestBody.messages).toHaveLength(2);
    expect(requestBody.messages[0].role).toBe('system');
    expect(requestBody.messages[1].role).toBe('user');
    expect(requestBody.stream).toBe(false);
  });

  it('retries after HTTP 429 and succeeds on the next attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(
        errorResponse(429, 'Rate limit exceeded')
      )
      .mockResolvedValueOnce(successResponse(100, 150));

    const result = await service.callGeminiWithRetry(
      'Generate rate limit test',
      3,
      10
    );

    expect(result.apiRetries).toBe(1);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(150);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('retries after HTTP 503 twice and succeeds on the third attempt', async () => {
    mockFetch
      .mockResolvedValueOnce(
        errorResponse(503, 'Service unavailable')
      )
      .mockResolvedValueOnce(
        errorResponse(503, 'Model temporarily overloaded')
      )
      .mockResolvedValueOnce(successResponse(100, 150));

    const result = await service.callGeminiWithRetry(
      'Generate 503 test',
      3,
      10
    );

    expect(result.apiRetries).toBe(2);
    expect(result.inputTokens).toBe(100);
    expect(result.outputTokens).toBe(150);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('stops after three retries when HTTP 429 persists', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(429, 'Rate limit exceeded continuously')
    );

    await expect(
      service.callGeminiWithRetry('Exhaust test', 3, 5)
    ).rejects.toThrow(/Groq API rate limit exceeded/);

    // Initial request + three retries = four requests.
    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('stops after three retries when HTTP 503 persists', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(503, 'Service unavailable continuously')
    );

    await expect(
      service.callGeminiWithRetry('Exhaust 503 test', 3, 5)
    ).rejects.toThrow(/Groq API service unavailable/);

    expect(mockFetch).toHaveBeenCalledTimes(4);
  });

  it('fails immediately on a non-retryable HTTP 400 error', async () => {
    mockFetch.mockResolvedValueOnce(
      errorResponse(400, 'API_KEY_INVALID: Invalid API key')
    );

    await expect(
      service.callGeminiWithRetry('Bad request test', 3, 5)
    ).rejects.toThrow(/API_KEY_INVALID/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a successful HTTP response with missing token usage', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: validSvg,
            },
          },
        ],
      }),
    });

    await expect(
      service.callGeminiWithRetry('Missing usage test', 3, 5)
    ).rejects.toThrow(/valid token usage information/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a successful HTTP response with empty model output', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 0,
        },
      }),
    });

    await expect(
      service.callGeminiWithRetry('Empty output test', 3, 5)
    ).rejects.toThrow(/did not contain SVG text/);

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

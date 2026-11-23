import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService } from '../services/gemini.service.js';

describe('GeminiService API Retry & Backoff Logic', () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  it('succeeds on first attempt without retries', async () => {
    const mockGenerateContent = vi.fn().mockResolvedValue({
      text: '<svg viewBox="0 0 800 600"><title>Test</title><text x="50" y="50">A</text><text x="50" y="80">B</text><text x="50" y="110">C</text><animate attributeName="opacity" dur="1s" values="0;1" /></svg>',
      usageMetadata: { promptTokenCount: 150, candidatesTokenCount: 220 },
    });

    (service as any).client = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const res = await service.callGeminiWithRetry('Generate test', 3, 10);
    expect(res.apiRetries).toBe(0);
    expect(res.inputTokens).toBe(150);
    expect(res.outputTokens).toBe(220);
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('retries with exponential backoff on HTTP 429 and succeeds', async () => {
    const mockGenerateContent = vi
      .fn()
      .mockRejectedValueOnce({ status: 429, message: 'Resource has been exhausted (rate limit)' })
      .mockResolvedValueOnce({
        text: '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="20" y="20">2</text><text x="30" y="30">3</text><animate attributeName="x" dur="1s" values="10;20" /></svg>',
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 150 },
      });

    (service as any).client = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const res = await service.callGeminiWithRetry('Generate rate limit test', 3, 10);
    expect(res.apiRetries).toBe(1);
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('retries with exponential backoff on HTTP 503 twice and succeeds on 3rd attempt', async () => {
    const mockGenerateContent = vi
      .fn()
      .mockRejectedValueOnce({ status: 503, message: 'The model is overloaded. Please try again later.' })
      .mockRejectedValueOnce({ status: 503, message: 'Service Unavailable' })
      .mockResolvedValueOnce({
        text: '<svg viewBox="0 0 800 600"><title>Test</title><text x="10" y="10">1</text><text x="20" y="20">2</text><text x="30" y="30">3</text><animate attributeName="x" dur="1s" values="10;20" /></svg>',
        usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 150 },
      });

    (service as any).client = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    const res = await service.callGeminiWithRetry('Generate 503 test', 3, 10);
    expect(res.apiRetries).toBe(2);
    expect(mockGenerateContent).toHaveBeenCalledTimes(3);
  });

  it('throws and stops after exceeding max 3 retries on persistent 429', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue({
      status: 429,
      message: 'Rate limit exceeded continuously',
    });

    (service as any).client = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    await expect(service.callGeminiWithRetry('Exhaust test', 3, 5)).rejects.toThrow(
      /Gemini API rate limit exceeded/
    );
    // Initial attempt (1) + 3 retries = 4 total calls
    expect(mockGenerateContent).toHaveBeenCalledTimes(4);
  });

  it('fails immediately without retrying on non-retryable 400 Bad Request error', async () => {
    const mockGenerateContent = vi.fn().mockRejectedValue({
      status: 400,
      message: 'API_KEY_INVALID: API key not valid.',
    });

    (service as any).client = {
      models: {
        generateContent: mockGenerateContent,
      },
    };

    await expect(service.callGeminiWithRetry('Bad request test', 3, 5)).rejects.toThrow(
      /API_KEY_INVALID/
    );
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});

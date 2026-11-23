import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env if present
dotenv.config();

function resolveDataPath(filename: string): string {
  // Check src/data first, then dist/data, then relative to process.cwd()
  const candidate1 = path.resolve(__dirname, '../data', filename);
  const candidate2 = path.resolve(__dirname, '../../src/data', filename);
  const candidate3 = path.resolve(process.cwd(), 'src/data', filename);
  const candidate4 = path.resolve(process.cwd(), 'data', filename);

  for (const p of [candidate1, candidate2, candidate3, candidate4]) {
    if (fs.existsSync(p)) return p;
  }
  return candidate1;
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    // Retry limits
    maxApiRetries: 3,
    initialRetryDelayMs: 1000,
    maxValidationRetries: 1,
  },
  // Pricing per 1M tokens in USD
  pricing: {
    'gemini-2.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
    'gemini-2.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00 },
    'gemini-1.5-flash': { inputPer1M: 0.075, outputPer1M: 0.30 },
    'gemini-1.5-pro': { inputPer1M: 1.25, outputPer1M: 5.00 },
    'gemini-2.0-flash': { inputPer1M: 0.10, outputPer1M: 0.40 },
    'gemini-2.0-flash-lite': { inputPer1M: 0.075, outputPer1M: 0.30 },
    default: { inputPer1M: 0.075, outputPer1M: 0.30 },
  },
  paths: {
    resultsJson: resolveDataPath('results.json'),
    conceptsJson: resolveDataPath('concepts.json'),
  },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const modelKey = (Object.keys(config.pricing) as Array<keyof typeof config.pricing>).find((k) =>
    model.toLowerCase().includes(k.toLowerCase())
  ) || 'default';

  const rates = config.pricing[modelKey];
  const inputCost = (inputTokens / 1_000_000) * rates.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPer1M;
  return Number((inputCost + outputCost).toFixed(6));
}

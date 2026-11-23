
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

function resolveDataPath(filename: string): string {
  const candidates = [
    path.resolve(__dirname, '../data', filename),
    path.resolve(__dirname, '../../src/data', filename),
    path.resolve(process.cwd(), 'src/data', filename),
    path.resolve(process.cwd(), 'data', filename),
  ];

  return candidates.find((p) => fs.existsSync(p)) || candidates[0];
}

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    maxApiRetries: 3,
    initialRetryDelayMs: 1000,
    maxValidationRetries: 1,
  },

  pricing: {
    'openai/gpt-oss-20b': {
      inputPer1M: 0.075,
      outputPer1M: 0.30,
    },
    'openai/gpt-oss-120b': {
      inputPer1M: 0.15,
      outputPer1M: 0.60,
    },
    default: {
      inputPer1M: 0,
      outputPer1M: 0,
    },
  },

  paths: {
    resultsJson: resolveDataPath('results.json'),
    conceptsJson: resolveDataPath('concepts.json'),
  },
};

export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const modelKey = Object.keys(config.pricing).find(
    (key) => key !== 'default' && model.toLowerCase() === key.toLowerCase()
  ) as Exclude<keyof typeof config.pricing, 'default'> | undefined;

  const rates = modelKey ? config.pricing[modelKey] : config.pricing.default;

  const inputCost = (inputTokens / 1_000_000) * rates.inputPer1M;
  const outputCost = (outputTokens / 1_000_000) * rates.outputPer1M;

  return Number((inputCost + outputCost).toFixed(8));
}

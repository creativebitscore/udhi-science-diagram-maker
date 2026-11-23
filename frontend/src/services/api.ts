
import {
  ConceptDefinition,
  DiagramResult,
  ReviewStatus,
} from '../types/index.js';

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || '/api'
).replace(/\/$/, '');

export interface HealthResponse {
  status: string;
  timestamp: string;
  groq: {
    provider: string;
    model: string;
    hasApiKeyConfigured: boolean;
  };
}

export class ApiError extends Error {
  statusCode?: number;
  apiRetries?: number;

  constructor(
    message: string,
    statusCode?: number,
    apiRetries?: number
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.apiRetries = apiRetries;
  }
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE}/health`);

    if (!res.ok) {
      throw new ApiError(
        `Backend health check failed (${res.status})`,
        res.status
      );
    }

    return (await res.json()) as HealthResponse;
  },

  async getConcepts(): Promise<ConceptDefinition[]> {
    const res = await fetch(`${API_BASE}/concepts`);

    if (!res.ok) {
      throw new ApiError(
        `Failed to fetch concepts (${res.status})`,
        res.status
      );
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.data)) {
      throw new ApiError('Backend returned an invalid concepts response.');
    }

    return data.data as ConceptDefinition[];
  },

  async getSavedDiagrams(): Promise<DiagramResult[]> {
    const res = await fetch(`${API_BASE}/diagrams`);

    if (!res.ok) {
      throw new ApiError(
        `Failed to fetch saved diagrams (${res.status})`,
        res.status
      );
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.data)) {
      throw new ApiError('Backend returned an invalid diagrams response.');
    }

    return data.data as DiagramResult[];
  },

  async generateDiagram(
    conceptId: string,
    customPrompt?: string,
    _legacyApiKey?: string
  ): Promise<DiagramResult> {
    const trimmedId = conceptId?.trim();

    if (!trimmedId) {
      throw new ApiError(
        'A valid concept ID is required before requesting diagram generation.',
        400
      );
    }

    // The Groq API key remains securely on the backend.
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conceptId: trimmedId,
        customPrompt: customPrompt?.trim() || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new ApiError(
        data.error || 'Failed to generate diagram',
        res.status,
        data.apiRetries
      );
    }

    if (!data.diagram) {
      throw new ApiError(
        'Backend returned an empty diagram response.',
        res.status
      );
    }

    return data.diagram as DiagramResult;
  },

  async syncReview(
    diagramId: string,
    status: ReviewStatus,
    notes: string
  ): Promise<void> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        diagramId,
        status,
        notes,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new ApiError(
        data.error || 'Failed to synchronize review with backend.',
        res.status
      );
    }
  },
};

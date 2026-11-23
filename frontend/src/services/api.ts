import { ConceptDefinition, DiagramResult, ReviewStatus } from '../types/index.js';

const API_BASE = '/api';

export class ApiError extends Error {
  statusCode?: number;
  apiRetries?: number;

  constructor(message: string, statusCode?: number, apiRetries?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.apiRetries = apiRetries;
  }
}

export const apiService = {
  async getHealth(): Promise<{ status: string; gemini: { model: string; hasApiKeyConfigured: boolean } }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) {
      throw new ApiError(`Health check failed (${res.status})`, res.status);
    }
    return res.json();
  },

  async getConcepts(): Promise<ConceptDefinition[]> {
    const res = await fetch(`${API_BASE}/concepts`);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch concepts (${res.status})`, res.status);
    }
    const data = await res.json();
    return data.data;
  },

  async getSavedDiagrams(): Promise<DiagramResult[]> {
    const res = await fetch(`${API_BASE}/diagrams`);
    if (!res.ok) {
      throw new ApiError(`Failed to fetch saved diagrams (${res.status})`, res.status);
    }
    const data = await res.json();
    return data.data;
  },

  async generateDiagram(
    conceptId: string,
    customPrompt?: string,
    apiKey?: string
  ): Promise<DiagramResult> {
    const trimmedId = conceptId?.trim();
    if (!trimmedId) {
      throw new ApiError('A valid concept ID is required before requesting diagram generation.', 400);
    }

    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conceptId: trimmedId,
        customPrompt: customPrompt?.trim() || undefined,
        apiKey: apiKey?.trim() || undefined,
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

    return data.diagram;
  },

  async syncReview(diagramId: string, status: ReviewStatus, notes: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramId, status, notes }),
      });
    } catch (e) {
      console.warn('Backend review sync failed (localStorage remains intact):', e);
    }
  },
};

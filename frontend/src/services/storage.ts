import { ReviewDecision } from '../types/index.js';

const STORAGE_KEY_REVIEWS = 'udhi_diagram_reviews_v1';
const STORAGE_KEY_API_KEY = 'udhi_gemini_api_key_session';

export const storageService = {
  getReviews(): Record<string, ReviewDecision> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load reviews from localStorage', e);
      return {};
    }
  },

  getReview(conceptId: string): ReviewDecision {
    const all = this.getReviews();
    return all[conceptId] || { status: 'pending', notes: '' };
  },

  saveReview(conceptId: string, decision: ReviewDecision): void {
    try {
      const all = this.getReviews();
      all[conceptId] = {
        ...decision,
        reviewedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save review to localStorage', e);
    }
  },

  getApiKey(): string {
    return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  },

  saveApiKey(key: string): void {
    if (key) {
      localStorage.setItem(STORAGE_KEY_API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    }
  },

  clearAllReviews(): void {
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
  },
};

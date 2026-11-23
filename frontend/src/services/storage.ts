
import { ReviewDecision } from '../types/index.js';

const STORAGE_KEY_REVIEWS = 'udhi_diagram_reviews_v1';

export const storageService = {
  getReviews(): Record<string, ReviewDecision> {
    try {
      const data = localStorage.getItem(STORAGE_KEY_REVIEWS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load reviews from localStorage:', error);
      return {};
    }
  },

  getReview(conceptId: string): ReviewDecision {
    const all = this.getReviews();

    return all[conceptId] || {
      status: 'pending',
      notes: '',
    };
  },

  saveReview(conceptId: string, decision: ReviewDecision): void {
    try {
      const all = this.getReviews();

      all[conceptId] = {
        ...decision,
        reviewedAt: new Date().toISOString(),
      };

      localStorage.setItem(
        STORAGE_KEY_REVIEWS,
        JSON.stringify(all)
      );
    } catch (error) {
      console.error('Failed to save review to localStorage:', error);
    }
  },

  clearAllReviews(): void {
    localStorage.removeItem(STORAGE_KEY_REVIEWS);
  },
};

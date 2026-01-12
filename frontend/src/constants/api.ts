/**
 * SSE Event type constants
 * Must match backend EVENT_TYPES
 */
export const EVENT_TYPES = {
  INIT: 'init',
  ARTICLE: 'article',
  PROGRESS: 'progress',
  ERROR: 'error',
  DONE: 'done',
} as const;

/**
 * API base URL from environment
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  SOURCES: `${API_BASE_URL}/api/sources`,
  ARTICLES: `${API_BASE_URL}/api/articles`,
  STREAM: `${API_BASE_URL}/api/fake-news/stream`,
} as const;

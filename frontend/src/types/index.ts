/**
 * Shared TypeScript types for frontend
 * Mirrors backend types
 */

export interface ArticleStub {
  id: string;
  source: string;
  realTitle: string;
  realUrl: string;
  dateISO: string;
}

export interface FullArticle extends ArticleStub {
  fakeTitle?: string;
  category?: string;
  error?: string;
}

export type StreamEventType = 'init' | 'article' | 'progress' | 'error' | 'done';

export interface InitEvent {
  type: 'init';
  total: number;
  articles: ArticleStub[];
}

export interface ArticleEvent {
  type: 'article';
  article: FullArticle;
}

export interface ProgressEvent {
  type: 'progress';
  completed: number;
  total: number;
}

export interface ErrorEvent {
  type: 'error';
  articleId?: string;
  message: string;
}

export interface DoneEvent {
  type: 'done';
}

export type StreamEvent = InitEvent | ArticleEvent | ProgressEvent | ErrorEvent | DoneEvent;

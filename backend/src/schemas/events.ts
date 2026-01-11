import { z } from 'zod';
import { articleStubSchema, fullArticleSchema } from './article.js';

/**
 * SSE Event type constants
 */
export const EVENT_TYPES = {
  INIT: 'init',
  ARTICLE: 'article',
  PROGRESS: 'progress',
  ERROR: 'error',
  DONE: 'done',
} as const;

/**
 * Event schemas for SSE streaming
 */
export const initEventSchema = z.object({
  type: z.literal(EVENT_TYPES.INIT),
  total: z.number(),
  articles: z.array(articleStubSchema),
});

export const articleEventSchema = z.object({
  type: z.literal(EVENT_TYPES.ARTICLE),
  article: fullArticleSchema,
});

export const progressEventSchema = z.object({
  type: z.literal(EVENT_TYPES.PROGRESS),
  completed: z.number(),
  total: z.number(),
});

export const errorEventSchema = z.object({
  type: z.literal(EVENT_TYPES.ERROR),
  articleId: z.string().optional(),
  message: z.string(),
});

export const doneEventSchema = z.object({
  type: z.literal(EVENT_TYPES.DONE),
});

export type InitEvent = z.infer<typeof initEventSchema>;
export type ArticleEvent = z.infer<typeof articleEventSchema>;
export type ProgressEvent = z.infer<typeof progressEventSchema>;
export type ErrorEvent = z.infer<typeof errorEventSchema>;
export type DoneEvent = z.infer<typeof doneEventSchema>;

export type StreamEvent = InitEvent | ArticleEvent | ProgressEvent | ErrorEvent | DoneEvent;

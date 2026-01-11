import { z } from 'zod';

/**
 * Article stub schema - basic article information
 */
export const articleStubSchema = z.object({
  id: z.string(),
  source: z.string(),
  realTitle: z.string(),
  realUrl: z.string().url(),
  dateISO: z.string().datetime(),
});

/**
 * Full article schema - includes generated fake content
 */
export const fullArticleSchema = articleStubSchema.extend({
  fakeTitle: z.string().optional(),
  category: z.string().optional(),
  error: z.string().optional(),
});

export type ArticleStub = z.infer<typeof articleStubSchema>;
export type FullArticle = z.infer<typeof fullArticleSchema>;

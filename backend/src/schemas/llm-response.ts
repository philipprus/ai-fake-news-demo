import { z } from 'zod';

/**
 * LLM response schema for fake news generation
 */
export const llmResponseSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  fakeTitle: z.string().min(1, 'Fake title is required').max(140, 'Fake title must be max 140 characters'),
});

export type LLMResponse = z.infer<typeof llmResponseSchema>;

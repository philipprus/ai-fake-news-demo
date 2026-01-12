import { describe, it, expect } from 'vitest';
import { ArticleService } from './article-service';
import { ArticleStub } from '../schemas/article';

describe('ArticleService', () => {
  const service = new ArticleService();

  const createArticle = (id: string, dateISO: string): ArticleStub => ({
    id,
    source: 'bbc',
    realTitle: `Title ${id}`,
    realUrl: `https://example.com/${id}`,
    dateISO,
  });

  it('should sort articles by date and deduplicate', () => {
    const articles: ArticleStub[] = [
      createArticle('1', '2024-01-01T10:00:00Z'),
      createArticle('2', '2024-01-03T10:00:00Z'),
      createArticle('1', '2024-01-01T10:00:00Z'), // Duplicate
      createArticle('3', '2024-01-02T10:00:00Z'),
    ];

    const result = service.selectTopArticles(articles, 3);

    expect(result).toHaveLength(3);
    expect(result[0]?.id).toBe('2'); // Newest first
    expect(result.map(a => a.id)).toEqual(['2', '3', '1']); // No duplicates
  });
});

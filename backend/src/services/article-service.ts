import { ArticleStub } from '../schemas/article.js';
import { logger } from '../utils/logger.js';

/**
 * Article service for processing and filtering articles
 */
export class ArticleService {
  /**
   * Select top N articles from a list
   * - Deduplicates by ID
   * - Sorts by date (newest first)
   * - Returns exactly N articles
   */
  selectTopArticles(articles: ArticleStub[], count: number = 10): ArticleStub[] {
    logger.debug('Selecting top articles', { 
      inputCount: articles.length, 
      requestedCount: count 
    });

    // Deduplicate by ID
    const uniqueArticles = this.deduplicateById(articles);

    // Sort by date (newest first)
    const sorted = this.sortByDate(uniqueArticles);

    // Take top N
    const selected = sorted.slice(0, count);

    logger.info('Articles selected', {
      inputCount: articles.length,
      afterDedup: uniqueArticles.length,
      selected: selected.length,
    });

    return selected;
  }

  /**
   * Deduplicate articles by ID
   */
  private deduplicateById(articles: ArticleStub[]): ArticleStub[] {
    const seen = new Set<string>();
    const unique: ArticleStub[] = [];

    for (const article of articles) {
      if (!seen.has(article.id)) {
        seen.add(article.id);
        unique.push(article);
      }
    }

    const duplicatesRemoved = articles.length - unique.length;
    if (duplicatesRemoved > 0) {
      logger.debug('Duplicates removed', { count: duplicatesRemoved });
    }

    return unique;
  }

  /**
   * Sort articles by date (newest first)
   */
  private sortByDate(articles: ArticleStub[]): ArticleStub[] {
    return [...articles].sort((a, b) => {
      const dateA = new Date(a.dateISO).getTime();
      const dateB = new Date(b.dateISO).getTime();
      return dateB - dateA; // Descending (newest first)
    });
  }

  /**
   * Filter articles by date range
   */
  filterByDateRange(
    articles: ArticleStub[],
    startDate: Date,
    endDate: Date
  ): ArticleStub[] {
    return articles.filter((article) => {
      const articleDate = new Date(article.dateISO);
      return articleDate >= startDate && articleDate <= endDate;
    });
  }

  /**
   * Filter articles by source
   */
  filterBySource(articles: ArticleStub[], source: string): ArticleStub[] {
    return articles.filter((article) => article.source === source);
  }

  /**
   * Group articles by source
   */
  groupBySource(articles: ArticleStub[]): Map<string, ArticleStub[]> {
    const grouped = new Map<string, ArticleStub[]>();

    for (const article of articles) {
      const existing = grouped.get(article.source) || [];
      existing.push(article);
      grouped.set(article.source, existing);
    }

    return grouped;
  }
}

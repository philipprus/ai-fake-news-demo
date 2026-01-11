import { ArticleStub } from '../schemas/article.js';

/**
 * Base interface for news providers
 * Each provider must implement this interface to fetch articles from their RSS feed
 */
export interface NewsProvider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string;

  /**
   * Display name of the provider
   */
  readonly name: string;

  /**
   * Fetch articles from the RSS feed
   * @returns Array of article stubs
   */
  fetchArticles(): Promise<ArticleStub[]>;
}

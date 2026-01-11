import { XMLParser } from 'fast-xml-parser';
import { NewsProvider } from './base.js';
import { ArticleStub } from '../schemas/article.js';
import { hashUrl } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

/**
 * Standard RSS 2.0 structure
 */
export interface StandardRSSFeed {
  rss?: {
    channel?: {
      item?: StandardRSSItem[];
    };
  };
}

/**
 * Standard RSS Item structure
 */
export interface StandardRSSItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  guid?: string;
  [key: string]: unknown;
}

/**
 * Atom Feed structure
 */
export interface AtomFeed {
  feed?: {
    entry?: AtomEntry[];
  };
}

/**
 * Atom Entry structure
 */
export interface AtomEntry {
  title?: string | { '#text'?: string };
  link?: string | { '@_href'?: string };
  updated?: string;
  published?: string;
  summary?: string;
  [key: string]: unknown;
}

/**
 * Base RSS Provider with common fetch logic
 * Implements the Template Method pattern
 * @template TFeed - Type of the parsed feed structure
 * @template TItem - Type of individual feed items
 */
export abstract class BaseRSSProvider<
  TFeed = StandardRSSFeed,
  TItem = StandardRSSItem
> implements NewsProvider {
  abstract readonly id: string;
  abstract readonly name: string;
  protected abstract readonly rssUrl: string;
  
  private readonly parser = new XMLParser();
  private readonly timeout = 10000; // 10 seconds

  /**
   * Extract items from parsed RSS data
   * Override this if RSS structure is different (e.g., Atom feeds)
   */
  protected extractItems(parsed: TFeed): TItem[] {
    const standardFeed = parsed as StandardRSSFeed;
    return (standardFeed?.rss?.channel?.item || []) as TItem[];
  }

  /**
   * Extract title from RSS item
   * Override this if title field has a different name
   */
  protected extractTitle(item: TItem): string | null {
    const standardItem = item as StandardRSSItem;
    return standardItem.title || null;
  }

  /**
   * Extract URL from RSS item
   * Override this if link field has a different name
   */
  protected extractUrl(item: TItem): string | null {
    const standardItem = item as StandardRSSItem;
    return standardItem.link || standardItem.guid || null;
  }

  /**
   * Extract publication date from RSS item
   * Override this if date field has a different name or format
   */
  protected extractDate(item: TItem): string {
    const standardItem = item as StandardRSSItem;
    if (standardItem.pubDate) {
      try {
        return new Date(standardItem.pubDate).toISOString();
      } catch {
        return new Date().toISOString();
      }
    }
    return new Date().toISOString();
  }

  /**
   * Validate if item has required fields
   * Override this for custom validation logic
   */
  protected isValidItem(item: TItem): boolean {
    return !!(this.extractTitle(item) && this.extractUrl(item));
  }

  async fetchArticles(): Promise<ArticleStub[]> {
    const startTime = Date.now();
    
    try {
      logger.info(`Fetching articles from ${this.name}`, { source: this.id });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.rssUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const xmlText = await response.text();
      const parsed = this.parser.parse(xmlText);

      const items = this.extractItems(parsed);
      const articles: ArticleStub[] = [];

      for (const item of items) {
        if (this.isValidItem(item)) {
          const title = this.extractTitle(item);
          const url = this.extractUrl(item);
          
          if (title && url) {
            articles.push({
              id: hashUrl(url),
              source: this.id,
              realTitle: title,
              realUrl: url,
              dateISO: this.extractDate(item),
            });
          }
        }
      }

      const duration = Date.now() - startTime;
      logger.info(`Fetched ${articles.length} articles from ${this.name}`, {
        source: this.id,
        duration,
        count: articles.length,
      });

      return articles;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to fetch articles from ${this.name}`, {
        source: this.id,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

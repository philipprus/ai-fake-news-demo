import { BaseRSSProvider, StandardRSSFeed, StandardRSSItem } from './base-rss-provider.js';

/**
 * BBC News RSS Provider
 * Uses standard RSS 2.0 format
 */
export class BBCProvider extends BaseRSSProvider<StandardRSSFeed, StandardRSSItem> {
  readonly id = 'bbc';
  readonly name = 'BBC News';
  protected readonly rssUrl = 'http://feeds.bbci.co.uk/news/rss.xml';
}

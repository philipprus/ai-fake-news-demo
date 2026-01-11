import { BaseRSSProvider, StandardRSSFeed, StandardRSSItem } from './base-rss-provider.js';

/**
 * ESPN Sports RSS Provider
 * Uses standard RSS 2.0 format
 */
export class ESPNProvider extends BaseRSSProvider<StandardRSSFeed, StandardRSSItem> {
  readonly id = 'espn';
  readonly name = 'ESPN';
  protected readonly rssUrl = 'https://www.espn.com/espn/rss/news';
}

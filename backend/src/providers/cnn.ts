import { BaseRSSProvider, StandardRSSFeed, StandardRSSItem } from './base-rss-provider.js';

/**
 * CNN News RSS Provider
 * Uses standard RSS 2.0 format
 */
export class CNNProvider extends BaseRSSProvider<StandardRSSFeed, StandardRSSItem> {
  readonly id = 'cnn';
  readonly name = 'CNN';
  protected readonly rssUrl = 'http://rss.cnn.com/rss/edition.rss';
}

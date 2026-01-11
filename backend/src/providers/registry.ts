import { NewsProvider } from './base.js';
import { BBCProvider } from './bbc.js';
import { CNNProvider } from './cnn.js';
import { ESPNProvider } from './espn.js';

/**
 * Provider registry
 * Central registry for all news providers
 */
class ProviderRegistry {
  private providers: Map<string, NewsProvider> = new Map();

  constructor() {
    // Register all providers
    this.register(new BBCProvider());
    this.register(new CNNProvider());
    this.register(new ESPNProvider());
  }

  /**
   * Register a news provider
   */
  private register(provider: NewsProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Get a provider by ID
   */
  getProvider(id: string): NewsProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all provider IDs
   */
  getAllProviderIds(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all providers
   */
  getAllProviders(): NewsProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check if a provider exists
   */
  hasProvider(id: string): boolean {
    return this.providers.has(id);
  }
}

// Export singleton instance
export const providerRegistry = new ProviderRegistry();

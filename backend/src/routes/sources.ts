import { FastifyInstance } from 'fastify';
import { providerRegistry } from '../providers/registry.js';
import { logger } from '../utils/logger.js';
import { lenientRateLimit } from '../config/rate-limit.js';

/**
 * GET /api/sources
 * Returns list of available news sources
 */
export async function sourcesRoute(fastify: FastifyInstance) {
  fastify.get('/sources', {
    config: {
      rateLimit: lenientRateLimit,
    },
  }, () => {
    try {
      const sources = providerRegistry.getAllProviderIds();
      
      logger.info('Sources requested', { count: sources.length });
      
      return {
        sources,
        count: sources.length,
      };
    } catch (error) {
      logger.error('Failed to get sources', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      throw error;
    }
  });
}

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { providerRegistry } from '../providers/registry.js';
import { ArticleService } from '../services/article-service.js';
import { CacheService } from '../services/cache-service.js';
import { logger } from '../utils/logger.js';

interface ArticlesQuerystring {
  source?: string;
  limit?: string;
}

/**
 * GET /api/articles?source=bbc&limit=10
 * Returns top articles from a source (cached)
 */
export async function articlesRoute(
  fastify: FastifyInstance,
  options: { cacheService: CacheService; articleService: ArticleService }
) {
  fastify.get<{ Querystring: ArticlesQuerystring }>(
    '/articles',
    async (request: FastifyRequest<{ Querystring: ArticlesQuerystring }>, reply: FastifyReply) => {
      const { source, limit = '10' } = request.query;

      // Validate source parameter
      if (!source) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Source parameter is required', 
        });
      }

      // Check if provider exists
      const provider = providerRegistry.getProvider(source);
      if (!provider) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `Source '${source}' not found`,
          availableSources: providerRegistry.getAllProviderIds(),
        });
      }

      const limitNum = parseInt(limit, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Limit must be a number between 1 and 50',
        });
      }

      try {
        const cacheKey = `articles-${source}`;
        
        // Check cache first
        const cached = options.cacheService.get<typeof articles>(cacheKey);
        if (cached) {
          logger.info('Returning cached articles', { source, count: cached.length });
          return {
            source,
            articles: cached.slice(0, limitNum),
            cached: true,
          };
        }

        // Fetch from provider
        logger.info('Fetching articles', { source });
        const rawArticles = await provider.fetchArticles();
        
        // Select top articles
        const articles = options.articleService.selectTopArticles(rawArticles, limitNum);
        
        // Cache results
        options.cacheService.set(cacheKey, articles);

        return {
          source,
          articles,
          cached: false,
        };
      } catch (error) {
        logger.error('Failed to fetch articles', {
          source,
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch articles',
        });
      }
    }
  );
}

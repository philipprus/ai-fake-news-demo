import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { LLMService } from '../services/llm-service.js';
import { CacheService } from '../services/cache-service.js';
import { FullArticle } from '../schemas/article.js';
import { logger } from '../utils/logger.js';
import { moderateRateLimit } from '../config/rate-limit.js';

interface RegenerateBody {
  articleId?: string;
  source?: string;
  realTitle?: string;
}

/**
 * POST /api/regenerate
 * Regenerate fake news for a specific article
 */
export async function regenerateRoute(
  fastify: FastifyInstance,
  options: { llmService: LLMService; cacheService: CacheService }
) {
  fastify.post<{ Body: RegenerateBody }>(
    '/regenerate',
    {
      config: {
        rateLimit: moderateRateLimit,
      },
    },
    async (request: FastifyRequest<{ Body: RegenerateBody }>, reply: FastifyReply) => {
      const { articleId, source, realTitle } = request.body;

      // Validate required fields
      if (!articleId || !source || !realTitle) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'articleId, source, and realTitle are required',
        });
      }

      logger.info('Regeneration requested', { articleId, source });

      try {
        // Generate new fake news
        const llmResult = await options.llmService.generateFakeNews(realTitle, articleId);

        const regeneratedArticle = {
          id: articleId,
          fakeTitle: llmResult.fakeTitle,
          category: llmResult.category,
        };

        // Update cache
        const fakeNewsCacheKey = `fake-news-${source}`;
        const cachedFakeNews = options.cacheService.get<Map<string, FullArticle>>(fakeNewsCacheKey);
        
        if (cachedFakeNews) {
          // Get existing article from cache to preserve all fields
          const existingArticle = cachedFakeNews.get(articleId);
          if (existingArticle) {
            // Update with new fake title and category
            const updatedArticle: FullArticle = {
              ...existingArticle,
              fakeTitle: llmResult.fakeTitle,
              category: llmResult.category,
            };
            cachedFakeNews.set(articleId, updatedArticle);
            options.cacheService.set(fakeNewsCacheKey, cachedFakeNews);
            
            logger.info('Cache updated with regenerated article', { articleId, source });
          } else {
            logger.warn('Article not found in cache during regeneration', { articleId, source });
          }
        } else {
          logger.warn('Cache not found during regeneration', { source });
        }

        logger.info('Article regenerated successfully', { 
          articleId, 
          source,
          category: llmResult.category 
        });

        return reply.code(200).send({
          success: true,
          article: regeneratedArticle,
        });
      } catch (error) {
        logger.error('Failed to regenerate article', {
          articleId,
          source,
          error: error instanceof Error ? error.message : String(error),
        });

        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to regenerate article',
        });
      }
    }
  );
}


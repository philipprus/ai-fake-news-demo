import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { providerRegistry } from '../providers/registry.js';
import { ArticleService } from '../services/article-service.js';
import { CacheService } from '../services/cache-service.js';
import { LLMService } from '../services/llm-service.js';
import { FullArticle } from '../schemas/article.js';
import { EVENT_TYPES } from '../schemas/events.js';
import { logger } from '../utils/logger.js';

interface StreamQuerystring {
  source?: string;
}

/**
 * GET /api/fake-news/stream?source=bbc
 * Server-Sent Events endpoint for streaming fake news generation
 */
export async function streamRoute(
  fastify: FastifyInstance,
  options: {
    cacheService: CacheService;
    articleService: ArticleService;
    llmService: LLMService;
  }
) {
  fastify.get<{ Querystring: StreamQuerystring }>(
    '/fake-news/stream',
    async (request: FastifyRequest<{ Querystring: StreamQuerystring }>, reply: FastifyReply) => {
      const { source } = request.query;

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

      // Set SSE headers
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      logger.info('SSE stream started', { source });

      try {
        // Fetch articles (from cache if available)
        const cacheKey = `articles-${source}`;
        let articles = options.cacheService.get<FullArticle[]>(cacheKey);
        
        if (!articles) {
          const rawArticles = await provider.fetchArticles();
          articles = options.articleService.selectTopArticles(rawArticles, 10);
          options.cacheService.set(cacheKey, articles);
        }

        // Send init event
        sendSSE(reply, EVENT_TYPES.INIT, {
          type: EVENT_TYPES.INIT,
          total: articles.length,
          articles: articles,
        });

        // Process articles with LLM
        let completed = 0;
        const fullArticles: FullArticle[] = [];

        // Process articles sequentially (concurrency handled by LLMService)
        const promises = articles.map(async (article) => {
          try {
            // Generate fake news
            const llmResult = await options.llmService.generateFakeNews(
              article.realTitle,
              article.id
            );

            const fullArticle: FullArticle = {
              ...article,
              fakeTitle: llmResult.fakeTitle,
              category: llmResult.category,
            };

            fullArticles.push(fullArticle);

            // Send article event
            sendSSE(reply, EVENT_TYPES.ARTICLE, {
              type: EVENT_TYPES.ARTICLE,
              article: fullArticle,
            });

            completed++;

            // Send progress event
            sendSSE(reply, EVENT_TYPES.PROGRESS, {
              type: EVENT_TYPES.PROGRESS,
              completed,
              total: articles.length,
            });
          } catch (error) {
            logger.error('Failed to generate fake news for article', {
              articleId: article.id,
              source,
              error: error instanceof Error ? error.message : String(error),
            });

            // Send error event for this article
            sendSSE(reply, EVENT_TYPES.ERROR, {
              type: EVENT_TYPES.ERROR,
              articleId: article.id,
              message: error instanceof Error ? error.message : 'Failed to generate fake news',
            });

            completed++;

            // Send progress event even on error
            sendSSE(reply, EVENT_TYPES.PROGRESS, {
              type: EVENT_TYPES.PROGRESS,
              completed,
              total: articles.length,
            });
          }
        });

        // Wait for all to complete
        await Promise.all(promises);

        // Send done event
        sendSSE(reply, EVENT_TYPES.DONE, {
          type: EVENT_TYPES.DONE,
        });

        logger.info('SSE stream completed', {
          source,
          total: articles.length,
          successful: fullArticles.length,
          failed: articles.length - fullArticles.length,
        });

        // Close connection
        reply.raw.end();
      } catch (error) {
        logger.error('SSE stream failed', {
          source,
          error: error instanceof Error ? error.message : String(error),
        });

        // Send error event
        sendSSE(reply, EVENT_TYPES.ERROR, {
          type: EVENT_TYPES.ERROR,
          message: error instanceof Error ? error.message : 'Stream failed',
        });

        reply.raw.end();
      }
    }
  );
}

/**
 * Send Server-Sent Event
 */
function sendSSE(reply: FastifyReply, event: string, data: unknown): void {
  reply.raw.write(`event: ${event}\n`);
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

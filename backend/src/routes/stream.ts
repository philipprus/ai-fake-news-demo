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
  cachedIds?: string; // Comma-separated list of article IDs that are already cached
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
      reply.raw.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

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

        // Check for cached fake news
        const fakeNewsCacheKey = `fake-news-${source}`;
        const cachedFakeNews = options.cacheService.get<Map<string, FullArticle>>(fakeNewsCacheKey);
        const cachedFakeNewsMap = cachedFakeNews || new Map<string, FullArticle>();
        
        // Merge with cache: use cached fake news if available
        const mergedArticles = articles.map(article => {
          const cached = cachedFakeNewsMap.get(article.id);
          if (cached && cached.fakeTitle && cached.category) {
            logger.debug('Using cached fake news', { articleId: article.id, source });
            return cached;
          }
          return article;
        });
        
        const cachedCount = mergedArticles.filter(a => a.fakeTitle).length;
        const needsGeneration = mergedArticles.length - cachedCount;
        
        if (cachedCount > 0) {
          logger.info('Found cached fake news', {
            source,
            total: mergedArticles.length,
            cached: cachedCount,
            needsGeneration,
          });
        }

        // Send init event with merged articles (some may already have fake titles)
        sendSSE(reply, EVENT_TYPES.INIT, {
          type: EVENT_TYPES.INIT,
          total: mergedArticles.length,
          articles: mergedArticles,
        });

        // Filter articles that need generation
        const articlesToGenerate = mergedArticles.filter(article => !article.fakeTitle);

        // Process articles with LLM
        let completed = cachedCount; // Start from cached count
        const fullArticles: FullArticle[] = [...mergedArticles.filter(a => a.fakeTitle)]; // Include cached

        // Process articles sequentially (concurrency handled by LLMService)
        const promises = articlesToGenerate.map(async (article) => {
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
            
            // Cache the generated fake news
            cachedFakeNewsMap.set(article.id, fullArticle);

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
              total: mergedArticles.length,
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
              total: mergedArticles.length,
            });
          }
        });

        // Wait for all to complete
        await Promise.all(promises);
        
        // Save updated cache
        options.cacheService.set(fakeNewsCacheKey, cachedFakeNewsMap);
        logger.debug('Saved fake news cache', { 
          source, 
          totalCached: cachedFakeNewsMap.size 
        });

        // Send done event
        sendSSE(reply, EVENT_TYPES.DONE, {
          type: EVENT_TYPES.DONE,
        });

        logger.info('SSE stream completed', {
          source,
          total: mergedArticles.length,
          successful: fullArticles.length,
          failed: mergedArticles.length - fullArticles.length,
          cached: cachedCount,
          generated: needsGeneration,
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

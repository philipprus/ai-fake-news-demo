import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';
import { CacheService } from './services/cache-service.js';
import { ArticleService } from './services/article-service.js';
import { LLMService } from './services/llm-service.js';
import { sourcesRoute } from './routes/sources.js';
import { articlesRoute } from './routes/articles.js';
import { streamRoute } from './routes/stream.js';
import { regenerateRoute } from './routes/regenerate.js';

/**
 * Main server entry point
 */
async function start() {
  // Validate environment variables
  const env = validateEnv();
  
  logger.info('Starting Fake News Generator API', {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    corsOrigin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : 'all origins (development)',
    cacheTTL: env.RSS_CACHE_TTL_MINUTES,
  });

  // Initialize services
  const cacheService = new CacheService(env.RSS_CACHE_TTL_MINUTES);
  const articleService = new ArticleService();
  const llmService = new LLMService(env.OPENAI_API_KEY);

  // Create Fastify instance
  const fastify = Fastify({
    logger: false, // Using custom logger
  });

  // Register CORS
  await fastify.register(cors, {
    origin: env.NODE_ENV === 'production' ? env.CORS_ORIGIN : true,
    credentials: true,
    exposedHeaders: ['Content-Type', 'Cache-Control', 'X-Accel-Buffering'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Health check endpoint
  fastify.get('/health', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register routes
  await fastify.register(sourcesRoute, { prefix: '/api' });
  
  await fastify.register(articlesRoute, { 
    prefix: '/api',
    cacheService,
    articleService,
  });
  
  await fastify.register(streamRoute, { 
    prefix: '/api',
    cacheService,
    articleService,
    llmService,
    corsOrigin: env.CORS_ORIGIN,
  });
  
  await fastify.register(regenerateRoute, {
    prefix: '/api',
    llmService,
    cacheService,
  });

  // Start server
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    logger.error('Failed to start server', { error: err instanceof Error ? err : String(err) });
    process.exit(1);
  }
}

void start();

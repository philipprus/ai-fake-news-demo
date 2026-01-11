import Fastify from 'fastify';
import cors from '@fastify/cors';
import { validateEnv } from './config/env.js';
import { logger } from './utils/logger.js';

/**
 * Main server entry point
 */
async function start() {
  // Validate environment variables
  const env = validateEnv();
  
  logger.info('Starting Fake News Generator API', {
    port: env.PORT,
    corsOrigin: env.CORS_ORIGIN,
    cacheTTL: env.RSS_CACHE_TTL_MINUTES,
  });

  // Create Fastify instance
  const fastify = Fastify({
    logger: false, // Using custom logger
  });

  // Register CORS
  await fastify.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // TODO: Register routes
  // await fastify.register(sourcesRoute, { prefix: '/api' });
  // await fastify.register(articlesRoute, { prefix: '/api' });
  // await fastify.register(streamRoute, { prefix: '/api' });

  // Start server
  try {
    await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`Server listening on port ${env.PORT}`);
  } catch (err) {
    logger.error('Failed to start server', { error: err instanceof Error ? err : String(err) });
    process.exit(1);
  }
}

start();

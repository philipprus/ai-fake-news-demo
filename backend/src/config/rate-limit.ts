import { RateLimitPluginOptions } from '@fastify/rate-limit';

/**
 * Rate limiting configuration
 * Protects API from abuse and controls OpenAI costs
 */
export const rateLimitConfig: RateLimitPluginOptions = {
  global: true,
  max: 100, // Default: 100 requests per timeWindow
  timeWindow: '1 minute',
  cache: 10000, // Keep 10k IP addresses in memory
  allowList: ['127.0.0.1'], // Localhost not rate limited (for health checks)
  errorResponseBuilder: (_request, context) => ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: `Rate limit exceeded. Retry after ${context.after}`,
  }),
};

/**
 * Strict rate limit for expensive LLM endpoints
 */
export const strictRateLimit = {
  max: 5, // Only 5 requests per minute
  timeWindow: '1 minute',
};

/**
 * Moderate rate limit for standard API endpoints
 */
export const moderateRateLimit = {
  max: 30, // 30 requests per minute
  timeWindow: '1 minute',
};

/**
 * Lenient rate limit for read-only endpoints
 */
export const lenientRateLimit = {
  max: 100, // 100 requests per minute
  timeWindow: '1 minute',
};

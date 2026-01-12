/**
 * Reusable JSON Schema definitions for Fastify validation
 * These schemas are registered with Fastify and can be referenced using $id
 */

/**
 * Article schema - matches the Article type
 */
export const articleSchema = {
  $id: 'Article',
  type: 'object',
  properties: {
    id: { type: 'string' },
    source: { type: 'string' },
    realTitle: { type: 'string' },
    realUrl: { type: 'string', format: 'uri' },
    dateISO: { type: 'string', format: 'date-time' },
    fakeTitle: { type: 'string' },
    category: { type: 'string' },
  },
  required: ['id', 'source', 'realTitle', 'realUrl', 'dateISO'],
} as const;

/**
 * Error response schema
 */
export const errorSchema = {
  $id: 'ErrorResponse',
  type: 'object',
  properties: {
    statusCode: { type: 'number' },
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const;

/**
 * Success response schema
 */
export const successSchema = {
  $id: 'SuccessResponse',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
  },
} as const;

/**
 * Query parameter schemas
 */
export const sourceQuerySchema = {
  type: 'object',
  required: ['source'],
  properties: {
    source: { 
      type: 'string', 
      description: 'News source (bbc, cnn, espn)' 
    },
  },
} as const;

export const articlesQuerySchema = {
  type: 'object',
  required: ['source'],
  properties: {
    source: { 
      type: 'string', 
      description: 'News source' 
    },
    limit: { 
      type: 'string', 
      description: 'Number of articles (1-50)', 
      default: '10' 
    },
  },
} as const;

/**
 * Response schemas
 */
export const articlesResponseSchema = {
  type: 'object',
  properties: {
    source: { type: 'string' },
    articles: {
      type: 'array',
      items: { $ref: 'Article#' },
    },
    cached: { type: 'boolean' },
  },
} as const;

export const sourcesResponseSchema = {
  type: 'object',
  properties: {
    sources: {
      type: 'array',
      items: { type: 'string' },
    },
    count: { type: 'number' },
  },
} as const;

/**
 * Body schemas
 */
export const regenerateBodySchema = {
  type: 'object',
  required: ['articleId', 'source', 'realTitle'],
  properties: {
    articleId: { type: 'string', description: 'Article ID' },
    source: { type: 'string', description: 'News source' },
    realTitle: { type: 'string', description: 'Original headline' },
  },
} as const;

export const regenerateResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    article: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        fakeTitle: { type: 'string' },
        category: { type: 'string' },
      },
    },
  },
} as const;

/**
 * All schemas that need to be registered with Fastify
 */
export const schemasToRegister = [
  articleSchema,
  errorSchema,
  successSchema,
];

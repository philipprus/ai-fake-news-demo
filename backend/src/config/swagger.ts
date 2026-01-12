import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

/**
 * Swagger/OpenAPI configuration
 */
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Fake News Generator API',
      description: 'Streaming AI demo that generates obviously fake, absurd, and humorous news headlines based on real news',
      version: '1.0.0',
      contact: {
        name: 'API Support',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'sources', description: 'News sources management' },
      { name: 'articles', description: 'Real articles from RSS feeds' },
      { name: 'streaming', description: 'Server-Sent Events streaming' },
      { name: 'regenerate', description: 'Regenerate fake headlines' },
      { name: 'health', description: 'Health check' },
    ],
    components: {
      schemas: {
        Source: {
          type: 'string',
          enum: ['bbc', 'cnn', 'espn'],
          description: 'Available news sources',
        },
        Article: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique article ID' },
            source: { type: 'string', description: 'News source' },
            realTitle: { type: 'string', description: 'Original headline' },
            realUrl: { type: 'string', format: 'uri', description: 'Original article URL' },
            dateISO: { type: 'string', format: 'date-time', description: 'Publication date' },
            fakeTitle: { type: 'string', description: 'Generated fake headline' },
            category: { type: 'string', description: 'Article category' },
          },
          required: ['id', 'source', 'realTitle', 'realUrl', 'dateISO'],
        },
        Error: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
};

/**
 * Swagger UI configuration
 */
export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
};

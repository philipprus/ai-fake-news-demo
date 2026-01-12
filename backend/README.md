# Backend - Fake News Generator API

FastAPI-based backend server for generating fake news headlines using OpenAI.

## Quick Start

```bash
# Install dependencies
yarn install

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
yarn dev

# Run tests
yarn test
```

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run all tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Fix ESLint errors

## Testing

The backend includes focused unit tests for critical business logic:

### Test Coverage

**Services:**
- `article-service.test.ts` - Article sorting, deduplication, and selection
- `cache-service.test.ts` - Cache operations with TTL management

**Utilities:**
- `hash.test.ts` - URL hashing for article IDs

### Running Tests

```bash
# Run all tests once
yarn test

# Watch mode for development
yarn test:watch

# Generate coverage report
yarn test:coverage
```

## Architecture

### Services
- **ArticleService** - Article processing and filtering
- **CacheService** - Two-tier caching (RSS + fake news)
- **LLMService** - OpenAI integration with concurrency control

### Providers
- **BaseRSSProvider** - Template method pattern for RSS parsing
- **BBCProvider, CNNProvider, ESPNProvider** - Concrete implementations

### Routes
- `/api/sources` - List available news sources
- `/api/articles` - Fetch real articles (cached)
- `/api/fake-news/stream` - SSE streaming endpoint
- `/api/regenerate` - Regenerate single article
- `/health` - Health check

## Environment Variables

See main README for detailed environment configuration.

## Tech Stack

- **Fastify** - Fast web framework
- **OpenAI** - GPT-3.5 for headline generation
- **TypeScript** - Type safety
- **Zod** - Runtime validation
- **Vitest** - Testing framework
- **p-limit** - Concurrency control

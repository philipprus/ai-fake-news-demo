# 🎭 Fake News Generator

A streaming AI demo that generates obviously fake, absurd, and humorous news headlines based on real news.

## Features

- ✅ **Real-time Streaming** - Watch fake headlines generate live via Server-Sent Events (SSE)
- ✅ **Multiple Sources** - BBC, CNN, ESPN news feeds
- ✅ **AI-Powered** - Uses OpenAI GPT-3.5 to create satirical headlines
- ✅ **Regenerate on Demand** - Don't like a headline? Click regenerate for a new one
- ✅ **Clean Architecture** - SOLID principles, plugin-based providers, type-safe TypeScript
- ✅ **Beautiful UI** - Modern React interface with Ant Design
- ✅ **Progressive UX** - Live progress tracking, graceful error handling

---

## Tech Stack

### Backend
- **Fastify** - Fast web framework
- **OpenAI API** - GPT-3.5 for headline generation
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **node-cache** - In-memory caching
- **fast-xml-parser** - RSS parsing
- **p-limit** - Concurrency control

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **Ant Design** - UI components
- **TypeScript** - Type safety
- **EventSource API** - SSE client

---

## Project Structure

```
fakeNews/
├── backend/          # Fastify API server
│   ├── src/
│   │   ├── config/   # Environment validation
│   │   ├── providers/ # News sources (BBC, CNN, ESPN)
│   │   ├── services/ # Business logic
│   │   ├── routes/   # API endpoints
│   │   ├── schemas/  # Zod schemas
│   │   └── utils/    # Utilities
│   └── package.json
├── frontend/         # React app
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/    # Custom hooks
│   │   ├── types/    # TypeScript types
│   │   └── constants/ # API endpoints
│   └── package.json
└── shared/           # Shared types
```

### Shared Types

The `shared/types/` directory contains TypeScript types used by both backend and frontend:

```typescript
// Article without fake headline
interface ArticleStub {
  id: string;
  source: string;
  realTitle: string;
  realUrl: string;
  dateISO: string;
}

// Article with generated fake headline
interface FullArticle extends ArticleStub {
  fakeTitle?: string;
  category?: string;
  error?: string;
}

// SSE event types
type StreamEvent = 
  | InitEvent      // Stream started with articles
  | ArticleEvent   // Fake headline generated
  | ProgressEvent  // Progress update
  | ErrorEvent     // Error for specific article
  | DoneEvent;     // Stream complete
```

This ensures type consistency across the entire stack.

---

## Setup Instructions

### Prerequisites

- **Node.js** 18+ 
- **Yarn** package manager
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install dependencies:**

```bash
cd fakeNews
yarn install
```

2. **Configure backend environment:**

```bash
cd backend
cp .env.example .env
# Edit .env and add your OpenAI API key
```

**`.env` file:**
```env
NODE_ENV=development
OPENAI_API_KEY=sk-proj-your_key_here
PORT=3000
CORS_ORIGIN=http://localhost:5173
RSS_CACHE_TTL_MINUTES=10
```

**Note:** In `development` mode, CORS allows all origins. In `production` mode, only `CORS_ORIGIN` is allowed.

3. **Configure frontend environment (optional):**

```bash
cd frontend
echo "VITE_API_BASE_URL=http://localhost:3000" > .env
```

---

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
yarn dev
```
Server will start on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
yarn dev
```
App will open on `http://localhost:5173`

### Or run both together:
```bash
# From root directory
yarn dev
```

---

## API Endpoints

### `GET /api/sources`
Returns list of available news sources.

**Response:**
```json
{
  "sources": ["bbc", "cnn", "espn"],
  "count": 3
}
```

### `GET /api/articles?source=bbc&limit=10`
Returns top N real articles from a source (cached).

**Response:**
```json
{
  "source": "bbc",
  "articles": [...],
  "cached": true
}
```

### `GET /api/fake-news/stream?source=bbc`
Server-Sent Events endpoint for streaming fake news generation.

**Events:**
- `init` - Stream started with article list
- `article` - Fake headline generated
- `progress` - Progress update
- `error` - Error for specific article
- `done` - Generation complete

### `POST /api/regenerate`
Regenerates fake news headline for a specific article.

**Request Body:**
```json
{
  "articleId": "string",
  "source": "string",
  "realTitle": "string"
}
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "abc123",
    "fakeTitle": "New fake headline",
    "category": "Politics"
  }
}
```

**Use case:** Allows users to regenerate a fake headline if they don't like the current one. Used by the "Regenerate" button in the UI.

### `GET /health`
Health check endpoint for monitoring and load balancers.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-12T10:00:00.000Z"
}
```

---

## Architecture Highlights

### Backend Patterns

- **Template Method** - `BaseRSSProvider` for RSS parsing
- **Registry** - `ProviderRegistry` for provider management
- **Service Layer** - Business logic separated from routes
- **Dependency Injection** - Services injected into routes

### Frontend Patterns

- **Custom Hooks** - `useStreaming`, `useFakeNews`
- **Reducer Pattern** - State management for streaming
- **Component Composition** - Reusable UI components

### Key Features

- ✅ **Type Safety** - Strict TypeScript, no `any`
- ✅ **Error Isolation** - One article failure doesn't stop others
- ✅ **Concurrency Control** - 3 concurrent LLM requests max
- ✅ **Smart Caching** - Two-tier caching: RSS feeds (10 min) + generated headlines (persistent)
- ✅ **Timeout Protection** - 30s timeout for LLM requests
- ✅ **Automatic Retries** - LLM requests retry once on failure with 1s delay
- ✅ **Structured Logging** - Context-rich logs
- ✅ **Graceful Degradation** - Handles partial failures

---

## Adding New News Sources

1. Create provider in `backend/src/providers/`:

```typescript
export class MyProvider extends BaseRSSProvider<StandardRSSFeed, StandardRSSItem> {
  readonly id = 'my-source';
  readonly name = 'My Source';
  protected readonly rssUrl = 'https://my-source.com/rss';
}
```

2. Register in `backend/src/providers/registry.ts`:

```typescript
this.register(new MyProvider());
```

That's it! The source will automatically appear in the frontend dropdown.

---

## Testing

### Backend
```bash
cd backend
yarn test   # 1 focused test for core business logic
yarn lint   # Type checking and linting
```

**Test Coverage:**
- ✅ Article Service - sorting, deduplication, selection (core business logic)

### Frontend
```bash
cd frontend
yarn build  # Type checking
```

---

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ❌ No | development | Environment (development/production/test) |
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `PORT` | ❌ No | 3000 | Server port |
| `CORS_ORIGIN` | ❌ No | http://localhost:5173 | Allowed origin (strict in production) |
| `RSS_CACHE_TTL_MINUTES` | ❌ No | 10 | Cache TTL (5-15) |

**CORS behavior:**
- **development:** Allows all origins (`origin: true`)
- **production:** Only allows `CORS_ORIGIN` (strict mode)

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | ❌ No | http://localhost:3000 | Backend URL |

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**TL;DR:** Free to use, modify, and distribute with attribution.

---

## Notes

This is a **technical demo** showcasing:
- Clean architecture principles (SOLID)
- Real-time streaming (SSE)
- AI integration (OpenAI)
- Modern TypeScript practices
- React best practices

**Not for production use.** No authentication, persistence, or advanced error recovery.

---

## Demo Flow

1. User selects news source (BBC/CNN/ESPN)
2. Backend fetches top 10 real headlines from RSS
3. AI generates fake headlines progressively (3 concurrent)
4. Results stream to frontend in real-time
5. Table updates live with fake headlines + categories
6. Progress bar shows completion status

---

## Regenerate Feature

Each generated fake headline can be regenerated individually:

1. Click the **🔄 Regenerate** button next to any article
2. A new fake headline is generated using OpenAI
3. The result updates instantly in the table
4. New headline is cached for future requests

This allows users to get different variations without reloading all articles.

---

## Caching Strategy

The application uses a two-tier caching approach:

### 1. RSS Feed Cache
- **TTL:** 10 minutes (configurable via `RSS_CACHE_TTL_MINUTES`)
- **Key:** `articles-{source}`
- **Purpose:** Reduce load on external RSS feeds

### 2. Fake News Cache
- **TTL:** Same as RSS cache
- **Key:** `fake-news-{source}`
- **Storage:** Map<articleId, FullArticle>
- **Purpose:** Avoid regenerating headlines that were already created

**Behavior:**
- First request: Fetches RSS + generates all fake headlines
- Subsequent requests: Returns cached fake headlines instantly
- Only missing headlines trigger LLM calls
- Regenerate endpoint updates the cache immediately

---

Enjoy generating fake news! 🎭

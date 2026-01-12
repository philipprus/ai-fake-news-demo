# Frontend - Fake News Generator UI

React-based frontend for displaying fake news headlines.

## Quick Start

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Run tests
yarn test
```

## Available Scripts

- `yarn dev` - Start development server (http://localhost:5173)
- `yarn build` - Build for production
- `yarn preview` - Preview production build
- `yarn test` - Run tests
- `yarn test:watch` - Run tests in watch mode

## Testing

Minimal unit test for critical custom hook:

```bash
yarn test
```

**Test Coverage:**
- ✅ `useStreaming` hook - SSE connection management

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Ant Design** - UI components
- **TypeScript** - Type safety
- **Vitest** - Testing framework
- **Testing Library** - React testing utilities

## Architecture

### Hooks
- `useStreaming` - Server-Sent Events connection management
- `useFakeNews` - Fake news state management with streaming

### Components
- `ArticleTable` - Display articles with fake headlines
- `ProgressBar` - Show generation progress
- `SourceSelector` - Select news source
- `ErrorDisplay` - Show errors gracefully

## Environment Variables

See main README for configuration details.

---
description: "Core TypeScript and code quality standards for Fake News Generator"
alwaysApply: true
---

# General Development Rules

## TypeScript Standards

### Type Safety

- NO `any` type - use explicit types, `unknown`, or generics
- NO type assertions with `any` - use type guards instead
- Prefer `interface` for object shapes, `type` for unions/intersections

### Code Quality

- All code must pass ESLint before commits
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)

## SOLID Principles

### Single Responsibility

- One class/module = one responsibility
- ✅ `ArticleService` fetches articles only
- ✅ `LLMService` generates fake news only
- ❌ Don't mix concerns in one class

## Error Handling

### Requirements

- Isolate errors per article/request
- Add timeout protection for all external calls
- Implement retry logic for transient failures (max 1 retry)
- Never swallow errors silently

### Error Logging Format

```typescript
{
  source: string,      // Provider name (e.g., 'bbc', 'cnn')
  articleId: string,   // Article unique ID
  duration: number,    // Execution time in ms
  error: Error,        // Error object
  timestamp: string    // ISO string
}
```

## Documentation

Always use Context7 MCP when I need library/API documentation, code generation, setup or configuration steps without me having to explicitly ask.
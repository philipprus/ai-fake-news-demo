import { useReducer, useCallback, useMemo, useState } from 'react';
import { useStreaming } from './useStreaming';
import { API_ENDPOINTS, EVENT_TYPES } from '../constants/api';
import { FullArticle, StreamEvent } from '../types';

interface State {
  articles: FullArticle[];
  progress: {
    completed: number;
    total: number;
  };
  isStreaming: boolean;
  error: string | null;
}

type Action =
  | { type: 'START_STREAM' }
  | { type: 'INIT'; payload: { total: number; articles: FullArticle[] } }
  | { type: 'ARTICLE'; payload: FullArticle }
  | { type: 'UPDATE_ARTICLE'; payload: FullArticle }
  | { type: 'PROGRESS'; payload: { completed: number; total: number } }
  | { type: 'ERROR'; payload: string }
  | { type: 'DONE' }
  | { type: 'RESET' };

const initialState: State = {
  articles: [],
  progress: { completed: 0, total: 0 },
  isStreaming: false,
  error: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_STREAM':
      return {
        ...initialState,
        isStreaming: true,
      };

    case 'INIT': {
      const cachedCount = action.payload.articles.filter(a => a.fakeTitle).length;
      return {
        ...state,
        articles: action.payload.articles,
        progress: { completed: cachedCount, total: action.payload.total },
      };
    }

    case 'ARTICLE': {
      const updatedArticles = state.articles.map((article) =>
        article.id === action.payload.id ? action.payload : article
      );
      return {
        ...state,
        articles: updatedArticles,
      };
    }

    case 'UPDATE_ARTICLE': {
      const updatedArticles = state.articles.map((article) =>
        article.id === action.payload.id ? { ...article, ...action.payload } : article
      );
      return {
        ...state,
        articles: updatedArticles,
      };
    }

    case 'PROGRESS':
      return {
        ...state,
        progress: action.payload,
      };

    case 'ERROR':
      return {
        ...state,
        error: action.payload,
        isStreaming: false,
      };

    case 'DONE':
      return {
        ...state,
        isStreaming: false,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Main hook for managing fake news generation
 */
export function useFakeNews() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const handleEvent = useCallback((event: StreamEvent) => {
    switch (event.type) {
      case EVENT_TYPES.INIT:
        dispatch({
          type: 'INIT',
          payload: {
            total: event.total,
            articles: event.articles,
          },
        });
        break;

      case EVENT_TYPES.ARTICLE:
        dispatch({
          type: 'ARTICLE',
          payload: event.article,
        });
        break;

      case EVENT_TYPES.PROGRESS:
        dispatch({
          type: 'PROGRESS',
          payload: {
            completed: event.completed,
            total: event.total,
          },
        });
        break;

      case EVENT_TYPES.ERROR:
        // Don't stop streaming on per-article errors
        break;

      case EVENT_TYPES.DONE:
        dispatch({ type: 'DONE' });
        break;
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    dispatch({
      type: 'ERROR',
      payload: error.message,
    });
  }, []);

  const handleComplete = useCallback(() => {
    dispatch({ type: 'DONE' });
  }, []);

  useStreaming(streamUrl, {
    onEvent: handleEvent,
    onError: handleError,
    onComplete: handleComplete,
  });

  const startStream = useCallback((source: string) => {
    dispatch({ type: 'START_STREAM' });
    const url = `${API_ENDPOINTS.STREAM}?source=${source}`;
    setStreamUrl(url);
  }, []);

  const reset = useCallback(() => {
    setStreamUrl(null);
    dispatch({ type: 'RESET' });
  }, []);

  const updateArticle = useCallback((article: FullArticle) => {
    dispatch({ type: 'UPDATE_ARTICLE', payload: article });
  }, []);

  return useMemo(
    () => ({
      articles: state.articles,
      progress: state.progress,
      isStreaming: state.isStreaming,
      error: state.error,
      startStream,
      reset,
      updateArticle,
    }),
    [state, startStream, reset, updateArticle]
  );
}

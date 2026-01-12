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
  console.log('🔧 Reducer: Action dispatched', action.type, action);
  
  switch (action.type) {
    case 'START_STREAM':
      console.log('🚀 Reducer: Starting stream');
      return {
        ...initialState,
        isStreaming: true,
      };

    case 'INIT':
      console.log('📋 Reducer: Initializing with', action.payload.total, 'articles');
      const cachedCount = action.payload.articles.filter(a => a.fakeTitle).length;
      if (cachedCount > 0) {
        console.log('💾 Backend sent', cachedCount, 'cached articles');
      }
      return {
        ...state,
        articles: action.payload.articles,
        progress: { completed: cachedCount, total: action.payload.total },
      };

    case 'ARTICLE': {
      console.log('📝 Reducer: Updating article', action.payload.id);
      const updatedArticles = state.articles.map((article) =>
        article.id === action.payload.id ? action.payload : article
      );
      return {
        ...state,
        articles: updatedArticles,
      };
    }

    case 'UPDATE_ARTICLE': {
      console.log('🔄 Reducer: Manually updating article', action.payload.id);
      const updatedArticles = state.articles.map((article) =>
        article.id === action.payload.id ? { ...article, ...action.payload } : article
      );
      return {
        ...state,
        articles: updatedArticles,
      };
    }

    case 'PROGRESS':
      console.log('📊 Reducer: Progress update', action.payload);
      return {
        ...state,
        progress: action.payload,
      };

    case 'ERROR':
      console.error('❌ Reducer: Error', action.payload);
      return {
        ...state,
        error: action.payload,
        isStreaming: false,
      };

    case 'DONE':
      console.log('✅ Reducer: Stream done');
      return {
        ...state,
        isStreaming: false,
      };

    case 'RESET':
      console.log('🔄 Reducer: Reset to initial state');
      return initialState;

    default:
      return state;
  }
}

/**
 * Main hook for managing fake news generation
 */
export function useFakeNews() {
  console.log('🔄 useFakeNews: Hook called');
  
  const [state, dispatch] = useReducer(reducer, initialState);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  console.log('📊 useFakeNews: Current state', { 
    articlesCount: state.articles.length,
    isStreaming: state.isStreaming,
    streamUrl,
    progress: state.progress,
  });

  const handleEvent = useCallback((event: StreamEvent) => {
    console.log('📨 useFakeNews: Event received', event.type, event);
    
    switch (event.type) {
      case EVENT_TYPES.INIT:
        console.log('🎬 useFakeNews: INIT event - articles:', event.total);
        dispatch({
          type: 'INIT',
          payload: {
            total: event.total,
            articles: event.articles,
          },
        });
        break;

      case EVENT_TYPES.ARTICLE:
        console.log('📰 useFakeNews: ARTICLE event - id:', event.article.id);
        dispatch({
          type: 'ARTICLE',
          payload: event.article,
        });
        break;

      case EVENT_TYPES.PROGRESS:
        console.log('📈 useFakeNews: PROGRESS event', `${event.completed}/${event.total}`);
        dispatch({
          type: 'PROGRESS',
          payload: {
            completed: event.completed,
            total: event.total,
          },
        });
        break;

      case EVENT_TYPES.ERROR:
        console.error('❌ useFakeNews: ERROR event', event.message);
        // Don't stop streaming on per-article errors
        break;

      case EVENT_TYPES.DONE:
        console.log('✅ useFakeNews: DONE event');
        dispatch({ type: 'DONE' });
        break;
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('💥 useFakeNews: Stream error', error.message);
    dispatch({
      type: 'ERROR',
      payload: error.message,
    });
  }, []);

  const handleComplete = useCallback(() => {
    console.log('🎉 useFakeNews: Stream complete');
    dispatch({ type: 'DONE' });
  }, []);

  useStreaming(streamUrl, {
    onEvent: handleEvent,
    onError: handleError,
    onComplete: handleComplete,
  });

  const startStream = useCallback((source: string) => {
    console.log('▶️ useFakeNews: Starting stream', { source });
    const url = `${API_ENDPOINTS.STREAM}?source=${source}`;
    console.log('🌐 Starting SSE connection to:', url);
    dispatch({ type: 'START_STREAM' });
    setStreamUrl(url);
  }, []);

  const reset = useCallback(() => {
    console.log('🔄 useFakeNews: Resetting');
    setStreamUrl(null);
    dispatch({ type: 'RESET' });
  }, []);

  const updateArticle = useCallback((article: FullArticle) => {
    console.log('🔄 useFakeNews: Updating article', article.id);
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

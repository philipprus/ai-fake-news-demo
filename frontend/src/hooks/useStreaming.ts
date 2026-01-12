import { useEffect, useRef, useState } from 'react';
import { EVENT_TYPES } from '../constants/api';
import { StreamEvent } from '../types';

interface UseStreamingOptions {
  onEvent?: (event: StreamEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

// Global flag to prevent multiple simultaneous connections
let globalConnectionLock = false;
let globalEventSource: EventSource | null = null;

/**
 * Hook for managing Server-Sent Events (SSE) connection
 */
export function useStreaming(url: string | null, options: UseStreamingOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const { onEvent, onError, onComplete } = options;

  useEffect(() => {
    // Don't connect if no URL
    if (!url) {
      // Close connection if exists
      if (eventSourceRef.current) {
        console.log('❌ No URL, closing connection');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        currentUrlRef.current = null;
        globalConnectionLock = false;
        globalEventSource = null;
        setIsConnected(false);
      }
      return;
    }

    // Don't reconnect if URL hasn't changed
    if (currentUrlRef.current === url && eventSourceRef.current) {
      console.log('⏸️ URL unchanged, skipping reconnect');
      return;
    }

    // GLOBAL LOCK: Prevent multiple connections
    if (globalConnectionLock && globalEventSource) {
      console.warn('🔒 BLOCKED: Another SSE connection is already active!');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      console.log('🔄 Closing previous SSE connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Close global connection if exists
    if (globalEventSource) {
      console.log('🌐 Closing global SSE connection');
      globalEventSource.close();
      globalEventSource = null;
    }

    console.log('🚀 Opening NEW SSE connection to:', url);
    currentUrlRef.current = url;
    globalConnectionLock = true;
    
    try {
      setIsConnected(false);
      setError(null);

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      globalEventSource = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        console.log('✅ SSE connected');
      };

      eventSource.onerror = (err) => {
        console.error('❌ SSE error:', err);
        const error = new Error('Stream connection failed');
        setError(error);
        setIsConnected(false);
        onError?.(error);
        
        // Close connection on error
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
          currentUrlRef.current = null;
        }
        globalConnectionLock = false;
        globalEventSource = null;
      };

      // Listen to all event types
      Object.values(EVENT_TYPES).forEach((eventType) => {
        eventSource.addEventListener(eventType, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data) as StreamEvent;
            onEvent?.(data);

            // Auto-close on done event
            if (data.type === EVENT_TYPES.DONE) {
              console.log('✅ Stream DONE, closing connection');
              onComplete?.();
              if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
                currentUrlRef.current = null;
              }
              globalConnectionLock = false;
              globalEventSource = null;
              setIsConnected(false);
            }
          } catch (error) {
            console.error('Failed to parse SSE event:', error);
          }
        });
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to connect');
      setError(err);
      onError?.(err);
    }

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up SSE connection');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        currentUrlRef.current = null;
        setIsConnected(false);
      }
      globalConnectionLock = false;
      globalEventSource = null;
    };
  }, [url]); // ONLY url in dependencies!

  return {
    isConnected,
    error,
  };
}

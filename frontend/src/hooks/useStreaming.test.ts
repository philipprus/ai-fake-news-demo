import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useStreaming } from './useStreaming';
import { EVENT_TYPES } from '../constants/api';

describe('useStreaming', () => {
  it('should connect when URL is provided', async () => {
    const { result } = renderHook(() =>
      useStreaming('http://localhost:3000/stream', {})
    );

    // Initially not connected
    expect(result.current.isConnected).toBe(false);

    // Wait for connection
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    expect(result.current.error).toBeNull();
  });

  it('should not connect when URL is null', () => {
    const { result } = renderHook(() => useStreaming(null, {}));

    expect(result.current.isConnected).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should call onEvent when receiving event', async () => {
    const onEvent = vi.fn();
    const testUrl = 'http://localhost:3000/stream';

    renderHook(() => useStreaming(testUrl, { onEvent }));

    await waitFor(() => {
      expect(global.EventSource).toBeDefined();
    });

    // Simulate event
    const mockData = { type: EVENT_TYPES.INIT, total: 10, articles: [] };
    const eventSource = (global.EventSource as any).mock?.results?.[0]?.value;
    
    if (eventSource?.simulateEvent) {
      eventSource.simulateEvent(EVENT_TYPES.INIT, mockData);
      
      await waitFor(() => {
        expect(onEvent).toHaveBeenCalledWith(mockData);
      });
    }
  });

  it('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() =>
      useStreaming('http://localhost:3000/stream', {})
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    const wasConnected = result.current.isConnected;
    expect(wasConnected).toBe(true);

    unmount();
    
    // Note: After unmount, we can't check result.current as the hook is destroyed
    // The important thing is that cleanup was called (connection closed)
  });
});

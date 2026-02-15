import { useEffect, useRef, useState, useCallback } from 'react';

export type MetricType = 'performance' | 'forecast' | 'optimization';

export interface WebSocketMessage {
  type: MetricType;
  data?: Record<string, unknown>;
  metrics?: unknown;
  forecasts?: unknown;
  recommendations?: unknown;
  timestamp: number;
}

/**
 * useWebSocket Hook
 * Manages WebSocket connection and subscriptions
 * Automatically reconnects on disconnect
 */
export function useWebSocket(
  metricTypes: MetricType[] = ['performance', 'forecast', 'optimization'],
  onMessage?: (message: WebSocketMessage) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const getWebSocketURL = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}`;
  }, []);

  const subscribe = useCallback((types: MetricType[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'subscribe',
          types,
        })
      );
    }
  }, []);

  const unsubscribe = useCallback((types: MetricType[]) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: 'unsubscribe',
          types,
        })
      );
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current) {
      return; // Already connecting or connected
    }

    try {
      const wsURL = getWebSocketURL();
      console.log('[useWebSocket] Connecting to', wsURL);

      const ws = new WebSocket(wsURL);

      ws.onopen = () => {
        console.log('[useWebSocket] Connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to metric types
        subscribe(metricTypes);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[useWebSocket] Received message:', message.type);

          if (onMessage) {
            onMessage(message);
          }
        } catch (err) {
          console.error('[useWebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[useWebSocket] Error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('[useWebSocket] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[useWebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        } else {
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[useWebSocket] Connection error:', err);
      setError(String(err));
    }
  }, [getWebSocketURL, metricTypes, subscribe, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    disconnect,
  };
}

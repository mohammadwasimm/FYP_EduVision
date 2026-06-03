import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV_CONFIG } from '../config/env';

let _socket: Socket | null = null;

function getSocket(): Socket {
  if (!_socket || _socket.disconnected) {
    _socket = io(ENV_CONFIG.API_BASE_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
  }
  return _socket;
}

type EventMap = Record<string, (data: any) => void>;

export function useSocket(events?: EventMap) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (events) {
      Object.entries(events).forEach(([event, handler]) => {
        socket.on(event, handler);
      });
    }

    return () => {
      if (events) {
        Object.entries(events).forEach(([event, handler]) => {
          socket.off(event, handler);
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef, emit };
}

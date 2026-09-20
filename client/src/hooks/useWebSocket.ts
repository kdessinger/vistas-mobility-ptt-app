import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parseMessage, send } from '../lib/signaling';
import type {
  ClientMessage,
  PendingRequest,
  ServerMessage,
  User,
  UserRole,
} from '../types';
import { isNative } from '../lib/platform';

// In the native shell, the device loads the app from `https://localhost`
// (Capacitor scheme) and cannot reach the demo signaling server on its own.
// The signaling URL is read from `window.__PTT_WS_URL__` (set in capacitor.config
// via injected config) with a fallback to the live demo.
const DEFAULT_PUBLIC_WS = 'wss://ptt-demo.kdessinger.com';

function getWsUrl(): string {
  const fromGlobal = (window as unknown as { __PTT_WS_URL__?: string }).__PTT_WS_URL__;
  if (fromGlobal) return fromGlobal;
  if (isNative()) return DEFAULT_PUBLIC_WS;
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'ws://localhost:3001';
  }
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
}

const WS_URL = getWsUrl();
const RECONNECT_DELAY = 3000;

interface UseWebSocketApi {
  sendMessage: (msg: ClientMessage) => boolean;
  wsRef: React.MutableRefObject<WebSocket | null>;
}

/**
 * Manages the singleton WebSocket connection for the lifetime of the hook.
 *
 * - Opens on mount, sends a `join` frame as soon as the socket opens.
 * - Routes every ServerMessage into the Zustand store.
 * - Auto-reconnects with a 3s delay on close.
 */
export function useWebSocket(role: UserRole | null, name: string | null): UseWebSocketApi {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedByClient = useRef<boolean>(false);

  const setConnectionStatus = useStore((s) => s.setConnectionStatus);
  const setCurrentUserId = useStore((s) => s.setCurrentUserId);
  const setRoomState = useStore((s) => s.setRoomState);
  const upsertUser = useStore((s) => s.upsertUser);
  const removeUser = useStore((s) => s.removeUser);
  const setActiveBroadcast = useStore((s) => s.setActiveBroadcast);
  const upsertRequest = useStore((s) => s.upsertRequest);
  const removeRequest = useStore((s) => s.removeRequest);
  const appendAuditEvent = useStore((s) => s.appendAuditEvent);
  const setCallActive = useStore((s) => s.setCallActive);

  const handleMessage = useCallback(
    (msg: ServerMessage) => {
      switch (msg.type) {
        case 'room-state': {
          setRoomState(msg.state);
          break;
        }

        case 'joined': {
          setCurrentUserId(msg.userId);
          break;
        }

        case 'driver-motion': {
          upsertUser({
            id: msg.userId,
            role: 'driver',
            name: '',
            joinedAt: new Date().toISOString(),
            inMotion: msg.inMotion,
          });
          break;
        }

        case 'broadcast-started': {
          setActiveBroadcast({
            driverId: msg.driverId,
            startedAt: msg.startedAt,
          });
          appendAuditEvent({
            type: 'broadcast-started',
            payload: { driverId: msg.driverId, startedAt: msg.startedAt },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'broadcast-ended': {
          setActiveBroadcast(null);
          appendAuditEvent({
            type: 'broadcast-ended',
            payload: { driverId: msg.driverId },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'request-received': {
          upsertRequest(msg.request);
          appendAuditEvent({
            type: 'request-received',
            payload: { request: msg.request as unknown as Record<string, unknown> },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'request-accepted': {
          upsertRequest(msg.request);
          appendAuditEvent({
            type: 'request-accepted',
            payload: { request: msg.request as unknown as Record<string, unknown> },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'request-declined': {
          removeRequest(msg.request.parentId);
          appendAuditEvent({
            type: 'request-declined',
            payload: { request: msg.request as unknown as Record<string, unknown> },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'request-completed': {
          upsertRequest(msg.request);
          appendAuditEvent({
            type: 'request-completed',
            payload: { request: msg.request as unknown as Record<string, unknown> },
            timestamp: new Date().toISOString(),
          });
          break;
        }

        case 'call-started': {
          if (role !== 'parent') {
            setCallActive(true, msg.caller);
          }
          break;
        }

        case 'call-ended': {
          if (role !== 'parent') {
            setCallActive(false, null);
          }
          break;
        }

        case 'webrtc-offer':
        case 'webrtc-answer':
        case 'webrtc-ice':
        case 'user-left':
        case 'emergency-message':
        case 'audio-chunk':
          // WebRTC signaling is dispatched via window events from useWebRTC.
          // user-left is already reflected in the next room-state.
          // emergency-message is logged as an audit event.
          if (msg.type === 'emergency-message') {
            appendAuditEvent({
              type: 'emergency-message',
              payload: {
                senderId: msg.senderId,
                message: msg.message,
              },
              timestamp: msg.timestamp,
            });
          } else if (msg.type === 'user-left') {
            removeUser(msg.userId);
          }
          // Re-broadcast on a window event for useWebRTC listeners
          window.dispatchEvent(
            new CustomEvent('ptt-message', { detail: msg })
          );
          break;

        case 'error': {
          // Surface server-side errors to the console; UI surfaces them indirectly.
          console.error('[ptt] server error:', msg.message);
          break;
        }

        default: {
          // Exhaustiveness — ignore unknown messages.
          break;
        }
      }
    },
    [
      setRoomState,
      setCurrentUserId,
      upsertUser,
      removeUser,
      setActiveBroadcast,
      upsertRequest,
      removeRequest,
      appendAuditEvent,
      setCallActive,
    ]
  );

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    closedByClient.current = false;
    setConnectionStatus('connecting');

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus('connected');
      if (role) {
        // Send the join frame as soon as the socket opens.
        const joined: ClientMessage = {
          type: 'join',
          role,
          routeId: 'route-42',
          name: name ?? undefined,
        };
        send(ws, joined);
      }
    };

    ws.onmessage = (event) => {
      const parsed = parseMessage(event.data as string);
      if (parsed) handleMessage(parsed);
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnectionStatus('disconnected');
      if (!closedByClient.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      }
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [role, name, handleMessage, setConnectionStatus]);

  useEffect(() => {
    if (!role) return;
    connect();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // Safari kills WebSockets in the background; reconnect immediately when returning.
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          connect();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // iOS Safari often skips visibilitychange for app-switch / home-button;
    // pageshow is more reliable for foreground return.
    const onPageShow = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connect();
      }
    };
    window.addEventListener('pageshow', onPageShow);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('pageshow', onPageShow);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      closedByClient.current = true;
      if (wsRef.current) {
        try {
          send(wsRef.current, { type: 'leave' });
        } catch {
          // ignore
        }
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [connect, role]);

  const sendMessage = useCallback((msg: ClientMessage): boolean => {
    return send(wsRef.current, msg);
  }, []);

  return { sendMessage, wsRef };
}
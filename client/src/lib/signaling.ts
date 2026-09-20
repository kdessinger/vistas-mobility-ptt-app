import type { ClientMessage, ServerMessage } from '../types';

/**
 * Send a client message over the open WebSocket.
 * Returns true if the frame was queued, false if the socket is not open.
 */
export function send(ws: WebSocket | null, msg: ClientMessage): boolean {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
    return true;
  }
  return false;
}

/**
 * Parse a raw WebSocket frame into a ServerMessage.
 * Returns null if the payload isn't valid JSON with a string `type` field.
 */
export function parseMessage(data: string): ServerMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object' && typeof parsed.type === 'string') {
      return parsed as ServerMessage;
    }
  } catch {
    // ignore non-JSON frames
  }
  return null;
}
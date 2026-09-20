import { WebSocket } from 'ws';
import { Room } from './room';
import { ClientMessage, ServerMessage, UserRole } from './types';

const room = new Room();

function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcast(message: ServerMessage, excludeWs?: WebSocket): void {
  const data = JSON.stringify(message);
  for (const ws of room.getAllSockets()) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

function broadcastRoomState(): void {
  broadcast({ type: 'room-state', state: room.getRoomState() });
}

export function handleConnection(ws: WebSocket): void {
  ws.on('message', (rawData) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(rawData.toString());
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    if (!msg || typeof msg !== 'object' || !msg.type) {
      send(ws, { type: 'error', message: 'Missing message type' });
      return;
    }

    const userId = (ws as any).userId as string | undefined;
    const userRole = (ws as any).userRole as UserRole | undefined;

    if (msg.type === 'join') {
      const { role, routeId, name } = msg;
      if (!role || !['driver', 'parent', 'operations'].includes(role)) {
        send(ws, { type: 'error', message: 'Invalid role' });
        return;
      }
      const user = room.addUser(ws, role, routeId, name);
      (ws as any).userId = user.id;
      (ws as any).userRole = user.role;
      send(ws, { type: 'joined', userId: user.id });
      broadcastRoomState();
      return;
    }

    if (!userId) {
      send(ws, { type: 'error', message: 'Not joined' });
      return;
    }

    switch (msg.type) {
      case 'motion-state': {
        if (userRole !== 'driver') {
          send(ws, { type: 'error', message: 'Only drivers can set motion state' });
          break;
        }
        const updated = room.setMotionState(userId, msg.inMotion);
        if (updated) {
          broadcast({ type: 'driver-motion', userId, inMotion: msg.inMotion });
          broadcastRoomState();
        }
        break;
      }

      case 'bus-sensors': {
        if (userRole !== 'driver') {
          send(ws, { type: 'error', message: 'Only drivers can set bus sensors' });
          break;
        }
        const updated = room.setBusSensors(userId, {
          yellowLights: msg.yellowLights,
          redLights: msg.redLights,
          doorOpen: msg.doorOpen,
        });
        if (updated) {
          broadcastRoomState();
        }
        break;
      }

      case 'location-state': {
        if (userRole !== 'driver') {
          send(ws, { type: 'error', message: 'Only drivers can set location' });
          break;
        }
        if (typeof msg.location !== 'string' || !msg.location.trim()) break;
        if (room.setLocation(userId, msg.location.trim())) {
          broadcastRoomState();
        }
        break;
      }

      case 'broadcast-start': {
        if (userRole !== 'driver' && userRole !== 'operations') {
          send(ws, { type: 'error', message: 'Only drivers or operations can start broadcast' });
          break;
        }
        const broadcastState = room.startBroadcast(userId);
        if (broadcastState) {
          broadcast({
            type: 'broadcast-started',
            driverId: broadcastState.driverId,
            startedAt: broadcastState.startedAt,
          });
          broadcastRoomState();
        }
        break;
      }

      case 'broadcast-end': {
        if (userRole !== 'driver' && userRole !== 'operations') {
          send(ws, { type: 'error', message: 'Only drivers or operations can end broadcast' });
          break;
        }
        const ended = room.endBroadcast();
        if (ended) {
          broadcast({ type: 'broadcast-ended', driverId: userId });
          broadcastRoomState();
        }
        break;
      }

      case 'parent-transmit-start': {
        if (userRole !== 'parent') {
          send(ws, { type: 'error', message: 'Only an accepted parent can start a transmission' });
          break;
        }
        if (room.startParentTransmit(userId)) {
          broadcastRoomState();
        } else {
          send(ws, { type: 'error', message: 'No active speaking permission' });
        }
        break;
      }

      case 'parent-transmit-end': {
        if (userRole === 'parent' && room.endParentTransmit(userId)) {
          broadcastRoomState();
        }
        break;
      }

      case 'request-speak': {
        if (userRole !== 'parent') {
          send(ws, { type: 'error', message: 'Only parents can request to speak' });
          break;
        }
        if (!room.hasDriverOrOperations()) {
          send(ws, { type: 'error', message: 'A driver or dispatch must be connected before requesting to speak' });
          break;
        }
        if (msg.parentId && msg.parentId !== userId) {
          send(ws, { type: 'error', message: 'parentId mismatch' });
          break;
        }
        const request = room.addRequest(userId, msg.reason || '');
        if (request) {
          broadcast({ type: 'request-received', request });
          broadcastRoomState();
        }
        break;
      }

      case 'end-speak': {
        if (userRole !== 'parent') {
          send(ws, { type: 'error', message: 'Only parents can end their speaking authorization' });
          break;
        }
        const completed = room.completeRequest(userId);
        if (completed) {
          broadcast({ type: 'request-completed', request: completed });
          broadcastRoomState();
        }
        break;
      }

      case 'accept-request': {
        if (userRole !== 'driver' && userRole !== 'operations') {
          send(ws, { type: 'error', message: 'Only drivers or operations can accept requests' });
          break;
        }
        const request = room.acceptRequest(msg.parentId);
        if (request) {
          broadcast({ type: 'request-accepted', request });
          broadcastRoomState();
        }
        break;
      }

      case 'decline-request': {
        if (userRole !== 'driver' && userRole !== 'operations') {
          send(ws, { type: 'error', message: 'Only drivers or operations can decline requests' });
          break;
        }
        const request = room.declineRequest(msg.parentId);
        if (request) {
          broadcast({ type: 'request-declined', request });
          broadcastRoomState();
        }
        break;
      }

      case 'call-start': {
        if (userRole !== 'parent') {
          send(ws, { type: 'error', message: 'Only parents can start an accepted call' });
          break;
        }
        if (!room.hasAcceptedRequest(userId)) {
          send(ws, { type: 'error', message: 'No accepted speaking request' });
          break;
        }
        const caller = room.getUser(userId);
        if (caller) broadcast({ type: 'call-started', caller }, ws);
        break;
      }

      case 'call-end': {
        if (userRole !== 'parent' && userRole !== 'driver') {
          send(ws, { type: 'error', message: 'Only the parent or driver can end this call' });
          break;
        }
        broadcast({ type: 'call-ended', callerId: userId }, ws);
        break;
      }

      case 'webrtc-offer': {
        const target = room.getUserSocket(msg.targetId);
        if (target && target.readyState === WebSocket.OPEN) {
          send(target, { type: 'webrtc-offer', sdp: msg.sdp, senderId: userId });
        }
        break;
      }

      case 'webrtc-answer': {
        const target = room.getUserSocket(msg.targetId);
        if (target && target.readyState === WebSocket.OPEN) {
          send(target, { type: 'webrtc-answer', sdp: msg.sdp, senderId: userId });
        }
        break;
      }

      case 'webrtc-ice': {
        const target = room.getUserSocket(msg.targetId);
        if (target && target.readyState === WebSocket.OPEN) {
          send(target, { type: 'webrtc-ice', candidate: msg.candidate, senderId: userId });
        }
        break;
      }

      case 'emergency-broadcast': {
        broadcast({
          type: 'emergency-message',
          message: msg.message,
          senderId: userId,
          timestamp: new Date().toISOString(),
        });
        broadcastRoomState();
        break;
      }

      case 'audio-chunk': {
        // Allow driver to broadcast to everyone
        // OR allow parent to speak if their request is accepted
        if (userRole === 'driver' || userRole === 'operations') {
          if (!msg.chunk || typeof msg.chunk !== 'string') {
            send(ws, { type: 'error', message: 'Invalid audio chunk' });
            break;
          }
          const data = JSON.stringify({
            type: 'audio-chunk',
            chunk: msg.chunk,
            mimeType: msg.mimeType,
            senderId: userId,
            targetId: msg.targetId,
          });
          if (userRole === 'driver' && msg.targetId) {
            const target = room.getUser(msg.targetId);
            if (!target || (target.role !== 'parent' && target.role !== 'operations')) {
              send(ws, { type: 'error', message: 'Driver audio target must be a parent or dispatcher in this room' });
              break;
            }
            const targetSocket = room.getUserSocket(msg.targetId);
            if (targetSocket && targetSocket !== ws && targetSocket.readyState === WebSocket.OPEN) {
              targetSocket.send(data);
            }
            for (const socket of room.getAllSockets()) {
              const role = (socket as any).userRole as UserRole | undefined;
              if (socket !== ws && socket !== targetSocket && role === 'operations' && socket.readyState === WebSocket.OPEN) {
                socket.send(data);
              }
            }
          } else {
            for (const socket of room.getAllSockets()) {
              if (socket !== ws && socket.readyState === WebSocket.OPEN) {
                socket.send(data);
              }
            }
          }
          break;
        }

        if (userRole === 'parent') {
          // Only relay if this parent has an accepted request
          const accepted = room.hasAcceptedRequest(userId);
          if (!accepted) {
            send(ws, { type: 'error', message: 'No active speaking permission' });
            break;
          }
          if (!msg.chunk || typeof msg.chunk !== 'string') {
            send(ws, { type: 'error', message: 'Invalid audio chunk' });
            break;
          }
          // Relay to driver and ops only
          const driver = room.getDriverSocket();
          if (driver && driver.readyState === WebSocket.OPEN) {
            driver.send(JSON.stringify({
              type: 'audio-chunk',
              chunk: msg.chunk,
              mimeType: msg.mimeType,
              senderId: userId,
            }));
          }
          for (const socket of room.getAllSockets()) {
            const uid = (socket as any).userId as string | undefined;
            const role = (socket as any).userRole as UserRole | undefined;
            if (socket !== ws && socket.readyState === WebSocket.OPEN && role === 'operations') {
              socket.send(JSON.stringify({
                type: 'audio-chunk',
                chunk: msg.chunk,
                mimeType: msg.mimeType,
                senderId: userId,
              }));
            }
          }
          break;
        }

        send(ws, { type: 'error', message: 'Only drivers or accepted parents can stream audio' });
        break;
      }

      case 'leave': {
        const removed = room.removeUser(userId);
        if (removed) {
          (ws as any).userId = undefined;
          (ws as any).userRole = undefined;
          broadcast({ type: 'user-left', userId });
          broadcastRoomState();
        }
        break;
      }

      default:
        send(ws, { type: 'error', message: `Unknown message type: ${(msg as any).type}` });
    }
  });

  ws.on('close', () => {
    const uid = (ws as any).userId as string | undefined;
    if (uid) {
      room.removeUser(uid);
      broadcast({ type: 'user-left', userId: uid });
      broadcastRoomState();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';
import {
  User,
  UserRole,
  ActiveBroadcast,
  PendingRequest,
  AuditEvent,
  RoomState,
} from './types';

export class Room {
  private users = new Map<string, User>();
  private userSockets = new Map<string, WebSocket>();
  private activeBroadcast: ActiveBroadcast | null = null;
  private activeParentSpeakerId: string | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private auditEvents: AuditEvent[] = [];

  addUser(ws: WebSocket, role: UserRole, routeId?: string, name?: string): User {
    const id = randomUUID();
    const user: User = {
      id,
      role,
      name: name || `${role}-${id.slice(0, 4)}`,
      joinedAt: new Date().toISOString(),
      inMotion: false,
    };
    this.users.set(id, user);
    this.userSockets.set(id, ws);
    this.addAuditEvent('user-joined', { userId: id, name: user.name, role, routeId });
    return user;
  }

  removeUser(userId: string): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    this.users.delete(userId);
    this.userSockets.delete(userId);
    this.clearUserRequests(userId);

    if (this.activeBroadcast && this.activeBroadcast.driverId === userId) {
      this.activeBroadcast = null;
    }
    if (this.activeParentSpeakerId === userId) {
      this.activeParentSpeakerId = null;
    }

    this.addAuditEvent('user-left', { userId, name: user.name });
    return user;
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId);
  }

  getUserSocket(userId: string): WebSocket | undefined {
    return this.userSockets.get(userId);
  }

  getDriverSocket(): WebSocket | undefined {
    for (const [id, user] of this.users) {
      if (user.role === 'driver') {
        return this.userSockets.get(id);
      }
    }
    return undefined;
  }

  hasDriverAndOperations(): boolean {
    let hasDriver = false;
    let hasOperations = false;
    for (const user of this.users.values()) {
      if (user.role === 'driver') hasDriver = true;
      if (user.role === 'operations') hasOperations = true;
    }
    return hasDriver && hasOperations;
  }

  hasDriverOrOperations(): boolean {
    for (const user of this.users.values()) {
      if (user.role === 'driver' || user.role === 'operations') return true;
    }
    return false;
  }

  hasAcceptedRequest(parentId: string): boolean {
    for (const req of this.pendingRequests.values()) {
      if (req.parentId === parentId && req.status === 'accepted') {
        return true;
      }
    }
    return false;
  }

  getAllSockets(): WebSocket[] {
    return Array.from(this.userSockets.values());
  }

  setMotionState(userId: string, inMotion: boolean): boolean {
    const user = this.users.get(userId);
    if (!user || user.role !== 'driver') return false;
    user.inMotion = inMotion;
    this.addAuditEvent('motion-state', { userId, inMotion });
    return true;
  }

  setBusSensors(userId: string, sensors: { yellowLights?: boolean; redLights?: boolean; doorOpen?: boolean }): boolean {
    const user = this.users.get(userId);
    if (!user || user.role !== 'driver') return false;
    if (sensors.yellowLights !== undefined) user.yellowLights = sensors.yellowLights;
    if (sensors.redLights !== undefined) user.redLights = sensors.redLights;
    if (sensors.doorOpen !== undefined) user.doorOpen = sensors.doorOpen;
    this.addAuditEvent('bus-sensors', { userId, ...sensors });
    return true;
  }

  setLocation(userId: string, location: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.role !== 'driver') return false;
    user.location = location;
    return true;
  }

  startBroadcast(senderId: string): ActiveBroadcast | null {
    const user = this.users.get(senderId);
    if (!user || (user.role !== 'driver' && user.role !== 'operations')) return null;
    if (this.activeBroadcast) return null;

    this.activeBroadcast = {
      driverId: senderId,
      startedAt: new Date().toISOString(),
    };
    this.addAuditEvent('broadcast-start', { driverId: senderId, role: user.role });
    return this.activeBroadcast;
  }

  endBroadcast(): boolean {
    if (!this.activeBroadcast) return false;
    const driverId = this.activeBroadcast.driverId;
    this.activeBroadcast = null;
    this.addAuditEvent('broadcast-end', { driverId });
    return true;
  }

  startParentTransmit(parentId: string): boolean {
    const parent = this.users.get(parentId);
    if (!parent || parent.role !== 'parent' || !this.hasAcceptedRequest(parentId)) return false;
    this.activeParentSpeakerId = parentId;
    return true;
  }

  endParentTransmit(parentId: string): boolean {
    if (this.activeParentSpeakerId !== parentId) return false;
    this.activeParentSpeakerId = null;
    return true;
  }

  addRequest(parentId: string, reason: string): PendingRequest | null {
    const parent = this.users.get(parentId);
    if (!parent || parent.role !== 'parent' || !this.hasDriverOrOperations()) return null;

    for (const existing of this.pendingRequests.values()) {
      if (existing.parentId === parentId && (existing.status === 'pending' || existing.status === 'accepted')) {
        return null;
      }
    }

    const id = randomUUID();
    const request: PendingRequest = {
      id,
      parentId,
      parentName: parent.name,
      reason,
      status: 'pending',
      timestamp: new Date().toISOString(),
    };
    this.pendingRequests.set(id, request);
    this.addAuditEvent('request-speak', { requestId: id, parentId, reason });
    return request;
  }

  acceptRequest(parentId: string): PendingRequest | null {
    const request = this.findPendingRequestByParentId(parentId);
    if (!request) return null;
    request.status = 'accepted';
    this.addAuditEvent('request-accepted', { requestId: request.id, parentId });
    return request;
  }

  declineRequest(parentId: string): PendingRequest | null {
    const request = this.findPendingRequestByParentId(parentId);
    if (!request) return null;
    request.status = 'declined';
    this.addAuditEvent('request-declined', { requestId: request.id, parentId });
    return request;
  }

  completeRequest(parentId: string): PendingRequest | null {
    for (const request of this.pendingRequests.values()) {
      if (request.parentId === parentId && request.status === 'accepted') {
        request.status = 'completed';
        this.addAuditEvent('request-completed', { requestId: request.id, parentId });
        return request;
      }
    }
    return null;
  }

  private findPendingRequestByParentId(parentId: string): PendingRequest | undefined {
    for (const req of this.pendingRequests.values()) {
      if (req.parentId === parentId && req.status === 'pending') {
        return req;
      }
    }
    return undefined;
  }

  private clearUserRequests(userId: string): void {
    for (const [id, req] of this.pendingRequests) {
      if (req.parentId === userId) {
        this.pendingRequests.delete(id);
      }
    }
  }

  addAuditEvent(type: string, payload: Record<string, unknown>): void {
    this.auditEvents.push({
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
    if (this.auditEvents.length > 500) {
      this.auditEvents = this.auditEvents.slice(-500);
    }
  }

  getRoomState(): RoomState {
    return {
      users: Array.from(this.users.values()),
      activeBroadcast: this.activeBroadcast,
      activeParentSpeakerId: this.activeParentSpeakerId,
      pendingRequests: Array.from(this.pendingRequests.values()),
      auditEvents: this.auditEvents,
    };
  }
}

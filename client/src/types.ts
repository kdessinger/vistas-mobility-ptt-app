// Client-side types must match /root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo/server/src/types.ts

export type UserRole = 'driver' | 'parent' | 'operations';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  joinedAt: string;
  inMotion: boolean;
  yellowLights?: boolean;
  redLights?: boolean;
  doorOpen?: boolean;
  location?: string;
}

export interface ActiveBroadcast {
  driverId: string;
  startedAt: string;
}

export interface PendingRequest {
  id: string;
  parentId: string;
  parentName: string;
  reason: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  timestamp: string;
}

export interface AuditEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface RoomState {
  users: User[];
  activeBroadcast: ActiveBroadcast | null;
  activeParentSpeakerId: string | null;
  pendingRequests: PendingRequest[];
  auditEvents: AuditEvent[];
}

// ---- Client -> Server messages ----

export interface JoinMessage {
  type: 'join';
  role: UserRole;
  routeId?: string;
  name?: string;
}

export interface MotionStateMessage {
  type: 'motion-state';
  inMotion: boolean;
}

export interface BroadcastStartMessage {
  type: 'broadcast-start';
}

export interface BroadcastEndMessage {
  type: 'broadcast-end';
}

export interface ParentTransmitStartMessage {
  type: 'parent-transmit-start';
}

export interface ParentTransmitEndMessage {
  type: 'parent-transmit-end';
}

export interface RequestSpeakMessage {
  type: 'request-speak';
  reason: string;
  parentId?: string;
}

export interface AcceptRequestMessage {
  type: 'accept-request';
  parentId: string;
}

export interface DeclineRequestMessage {
  type: 'decline-request';
  parentId: string;
}

export interface EndSpeakMessage {
  type: 'end-speak';
}

export interface WebRTCOfferMessage {
  type: 'webrtc-offer';
  sdp: string;
  targetId: string;
}

export interface WebRTCAnswerMessage {
  type: 'webrtc-answer';
  sdp: string;
  targetId: string;
}

export interface WebRTCIceMessage {
  type: 'webrtc-ice';
  candidate: RTCIceCandidateInit;
  targetId: string;
}

export interface EmergencyBroadcastMessage {
  type: 'emergency-broadcast';
  message: string;
}

export interface LeaveMessage {
  type: 'leave';
}

export interface BusSensorsMessage {
  type: 'bus-sensors';
  yellowLights?: boolean;
  redLights?: boolean;
  doorOpen?: boolean;
}

export interface LocationMessage {
  type: 'location-state';
  location: string;
}

export interface AudioChunkMessage {
  type: 'audio-chunk';
  chunk: string; // base64
  mimeType?: string;
  targetId?: string;
}

export interface CallStartMessage {
  type: 'call-start';
}

export interface CallEndMessage {
  type: 'call-end';
}

export type ClientMessage =
  | JoinMessage
  | MotionStateMessage
  | BusSensorsMessage
  | LocationMessage
  | BroadcastStartMessage
  | BroadcastEndMessage
  | ParentTransmitStartMessage
  | ParentTransmitEndMessage
  | RequestSpeakMessage
  | AcceptRequestMessage
  | DeclineRequestMessage
  | EndSpeakMessage
  | WebRTCOfferMessage
  | WebRTCAnswerMessage
  | WebRTCIceMessage
  | EmergencyBroadcastMessage
  | AudioChunkMessage
  | CallStartMessage
  | CallEndMessage
  | LeaveMessage;

// ---- Server -> Client messages ----

export type ServerMessage =
  | { type: 'room-state'; state: RoomState }
  | { type: 'joined'; userId: string }
  | { type: 'driver-motion'; userId: string; inMotion: boolean }
  | { type: 'broadcast-started'; driverId: string; startedAt: string }
  | { type: 'broadcast-ended'; driverId: string }
  | { type: 'request-received'; request: PendingRequest }
  | { type: 'request-accepted'; request: PendingRequest }
  | { type: 'request-declined'; request: PendingRequest }
  | { type: 'request-completed'; request: PendingRequest }
  | { type: 'webrtc-offer'; sdp: string; senderId: string }
  | { type: 'webrtc-answer'; sdp: string; senderId: string }
  | { type: 'webrtc-ice'; candidate: RTCIceCandidateInit; senderId: string }
  | { type: 'emergency-message'; message: string; senderId: string; timestamp: string }
  | { type: 'audio-chunk'; chunk: string; senderId: string; mimeType?: string; targetId?: string }
  | { type: 'call-started'; caller: User }
  | { type: 'call-ended'; callerId: string }
  | { type: 'error'; message: string }
  | { type: 'user-left'; userId: string };
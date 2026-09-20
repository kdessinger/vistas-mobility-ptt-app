import { create } from 'zustand';
import type {
  ActiveBroadcast,
  AuditEvent,
  PendingRequest,
  RoomState,
  User,
  UserRole,
} from '../types';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

interface AppState {
  // Identity
  role: UserRole | null;
  name: string | null;
  currentUserId: string | null;

  // Connection
  connectionStatus: ConnectionStatus;

  // Room state (mirrors server's authoritative RoomState)
  users: User[];
  activeBroadcast: ActiveBroadcast | null;
  activeParentSpeakerId: string | null;
  pendingRequests: PendingRequest[];
  auditEvents: AuditEvent[];

  // Call state (client-local convenience)
  callActive: boolean;
  callStartTime: number | null;
  callPartner: { id: string; name: string; role: UserRole } | null;

  // UI state
  requestModalOpen: boolean;

  // Setters / mutators
  setRole: (role: UserRole | null) => void;
  setName: (name: string | null) => void;
  setCurrentUserId: (id: string | null) => void;
  setConnectionStatus: (s: ConnectionStatus) => void;

  setRoomState: (state: RoomState) => void;

  upsertUser: (user: User) => void;
  removeUser: (userId: string) => void;

  setActiveBroadcast: (b: ActiveBroadcast | null) => void;

  upsertRequest: (req: PendingRequest) => void;
  removeRequest: (parentId: string) => void;

  appendAuditEvent: (evt: AuditEvent) => void;

  setCallActive: (
    active: boolean,
    partner?: { id: string; name: string; role: UserRole } | null
  ) => void;

  setRequestModalOpen: (open: boolean) => void;

  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  role: null,
  name: null,
  currentUserId: null,

  connectionStatus: 'disconnected',

  users: [],
  activeBroadcast: null,
  activeParentSpeakerId: null,
  pendingRequests: [],
  auditEvents: [],

  callActive: false,
  callStartTime: null,
  callPartner: null,

  requestModalOpen: false,

  setRole: (role) => set({ role }),
  setName: (name) => set({ name }),
  setCurrentUserId: (currentUserId) => set({ currentUserId }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setRoomState: (state) =>
    set({
      users: state.users,
      activeBroadcast: state.activeBroadcast,
      activeParentSpeakerId: state.activeParentSpeakerId,
      pendingRequests: state.pendingRequests,
      auditEvents: state.auditEvents,
    }),

  upsertUser: (user) =>
    set((state) => {
      const idx = state.users.findIndex((u) => u.id === user.id);
      if (idx === -1) return { users: [...state.users, user] };
      const next = state.users.slice();
      next[idx] = { ...next[idx], ...user };
      return { users: next };
    }),

  removeUser: (userId) =>
    set((state) => ({ users: state.users.filter((u) => u.id !== userId) })),

  setActiveBroadcast: (activeBroadcast) => set({ activeBroadcast }),

  upsertRequest: (req) =>
    set((state) => {
      const idx = state.pendingRequests.findIndex((r) => r.id === req.id);
      if (idx === -1) return { pendingRequests: [req, ...state.pendingRequests] };
      const next = state.pendingRequests.slice();
      next[idx] = req;
      return { pendingRequests: next };
    }),

  removeRequest: (parentId) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter((r) => r.parentId !== parentId),
    })),

  appendAuditEvent: (evt) =>
    set((state) => ({ auditEvents: [...state.auditEvents, evt] })),

  setCallActive: (active, partner = null) =>
    set({
      callActive: active,
      callStartTime: active ? Date.now() : null,
      callPartner: partner,
    }),

  setRequestModalOpen: (requestModalOpen) => set({ requestModalOpen }),

  reset: () =>
    set({
      role: null,
      name: null,
      currentUserId: null,
      connectionStatus: 'disconnected',
      users: [],
      activeBroadcast: null,
      activeParentSpeakerId: null,
      pendingRequests: [],
      auditEvents: [],
      callActive: false,
      callStartTime: null,
      callPartner: null,
      requestModalOpen: false,
    }),
}));
import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import ConnectionBar from '../components/ConnectionBar';
import PTTButton from '../components/PTTButton';
import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useWebRTCAudio } from '../hooks/useWebRTCAudio';
import { playRequestAlert } from '../lib/audioFeedback';
import {
  Activity,
  AlertTriangle,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Radio,
  Bus,
  Shield,
  Users as UsersIcon,
  LogIn,
  LogOut,
  Mic,
  MessageSquare,
  Ban,
  Signal,
} from 'lucide-react';
import type { ClientMessage, PendingRequest, UserRole, AuditEvent } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

const ROLE_DOT: Record<UserRole, string> = {
  driver: 'bg-emerald-400',
  parent: 'bg-amber-400',
  operations: 'bg-sky-400',
};

const ROLE_LABEL: Record<UserRole, string> = {
  driver: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  parent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  operations: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

function formatAuditEvent(evt: AuditEvent): { icon: React.ReactNode; title: string; detail: string } {
  const p = evt.payload as Record<string, string | boolean | number>;
  switch (evt.type) {
    case 'user-joined':
      return {
        icon: <LogIn className="w-3.5 h-3.5 text-emerald-400" />,
        title: 'User joined',
        detail: `${p.name || p.userId} (${p.role})`,
      };
    case 'user-left':
      return {
        icon: <LogOut className="w-3.5 h-3.5 text-slate-500" />,
        title: 'User left',
        detail: `${p.name || p.userId}`,
      };
    case 'motion-state':
      return {
        icon: <Bus className="w-3.5 h-3.5 text-blue-400" />,
        title: p.inMotion ? 'Bus in motion' : 'Bus stopped',
        detail: `Driver: ${p.userId}`,
      };
    case 'broadcast-start':
      return {
        icon: <Mic className="w-3.5 h-3.5 text-red-400" />,
        title: 'Broadcast started',
        detail: `Driver: ${p.driverId}`,
      };
    case 'broadcast-end':
      return {
        icon: <Ban className="w-3.5 h-3.5 text-slate-500" />,
        title: 'Broadcast ended',
        detail: `Driver: ${p.driverId}`,
      };
    case 'request-speak':
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-amber-400" />,
        title: 'Speak request',
        detail: `Parent: ${p.parentId} — ${(p.reason as string)?.replace('_', ' ')}`,
      };
    case 'request-accepted':
      return {
        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        title: 'Request accepted',
        detail: `Request: ${p.requestId}`,
      };
    case 'request-declined':
      return {
        icon: <XCircle className="w-3.5 h-3.5 text-red-400" />,
        title: 'Request declined',
        detail: `Request: ${p.requestId}`,
      };
    case 'emergency-message':
      return {
        icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
        title: 'Emergency broadcast',
        detail: p.message as string,
      };
    case 'bus-sensors':
      return {
        icon: <Bus className="w-3.5 h-3.5 text-amber-400" />,
        title: 'Bus sensors updated',
        detail: [
          p.yellowLights !== undefined ? `Yellow: ${p.yellowLights ? 'ON' : 'OFF'}` : '',
          p.redLights !== undefined ? `Red: ${p.redLights ? 'ON' : 'OFF'}` : '',
          p.doorOpen !== undefined ? `Door: ${p.doorOpen ? 'OPEN' : 'CLOSED'}` : '',
        ].filter(Boolean).join(' · '),
      };
    default:
      return {
        icon: <Activity className="w-3.5 h-3.5 text-slate-500" />,
        title: evt.type,
        detail: '',
      };
  }
}

export default function OperationsPortal({ sendMessage }: Props) {
  const users = useStore((s) => s.users);
  const activeBroadcast = useStore((s) => s.activeBroadcast);
  const activeParentSpeakerId = useStore((s) => s.activeParentSpeakerId);
  const pendingRequests = useStore((s) => s.pendingRequests);
  const auditEvents = useStore((s) => s.auditEvents);
  const connectionStatus = useStore((s) => s.connectionStatus);

  const [emergencyText, setEmergencyText] = useState('');

  const sendEmergency = useCallback(() => {
    const text = emergencyText.trim() || 'Emergency broadcast issued by dispatch.';
    sendMessage({ type: 'emergency-broadcast', message: text });
    setEmergencyText('');
  }, [emergencyText, sendMessage]);

  const exportJSON = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      roomState: {
        users,
        activeBroadcast,
        pendingRequests,
        auditEvents,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ops-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users, activeBroadcast, pendingRequests, auditEvents]);

  const driver = users.find((u) => u.role === 'driver') ?? null;

  // Alert dispatch when a new pending request arrives.
  const prevPendingCountRef = useRef(pendingRequests.filter((r) => r.status === 'pending').length);
  useEffect(() => {
    const current = pendingRequests.filter((r) => r.status === 'pending').length;
    if (current > prevPendingCountRef.current) {
      playRequestAlert();
    }
    prevPendingCountRef.current = current;
  }, [pendingRequests]);

  // Keep the receiver mounted from page load so a user tap can unlock audio
  // before a driver starts broadcasting.
  useAudioPlayback(true);
  useWebRTCAudio(sendMessage);

  const statusIcon = (s: PendingRequest['status']) => {
    if (s === 'pending') return <AlertCircle className="w-4 h-4 text-amber-400" />;
    if (s === 'accepted') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (s === 'declined') return <XCircle className="w-4 h-4 text-red-400" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
  };

  const acceptRequest = (request: PendingRequest) => {
    sendMessage({ type: 'accept-request', parentId: request.parentId });
  };

  const rejectRequest = (request: PendingRequest) => {
    sendMessage({ type: 'decline-request', parentId: request.parentId });
  };

  return (
    <div className="min-h-full flex flex-col bg-[#0a0f1c]">
      <ConnectionBar />

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Room Monitor */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Signal className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Room Monitor
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Users</div>
              <div className="text-lg font-bold text-slate-200">{users.length}</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Driver</div>
              <div className="text-sm font-bold text-slate-200 truncate">
                {driver ? driver.name || driver.id : 'Offline'}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Motion</div>
              <div className={`text-sm font-bold ${driver?.inMotion ? 'text-emerald-400' : 'text-slate-400'}`}>
                {driver?.inMotion ? 'Moving' : 'Stopped'}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Broadcast</div>
              <div className={`text-sm font-bold ${activeBroadcast ? 'text-red-400' : 'text-slate-400'}`}>
                {activeBroadcast ? 'Live' : 'Idle'}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pending</div>
              <div className="text-lg font-bold text-slate-200">
                {pendingRequests.filter((r) => r.status === 'pending').length}
              </div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Connection</div>
              <div className={`text-sm font-bold ${connectionStatus === 'connected' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {connectionStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Users list */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Connected Users
          </h2>
          {users.length === 0 && (
            <p className="text-xs text-slate-600">No users connected.</p>
          )}
          <div className="space-y-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 text-sm py-2 px-2 rounded-xl hover:bg-white/[0.03] transition-colors"
              >
                <div className={`w-2.5 h-2.5 rounded-full ${ROLE_DOT[u.role]}`} />
                <span className="font-medium text-slate-300 flex-1 truncate">
                  {u.name || u.id}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border ${ROLE_LABEL[u.role]}`}>
                  {u.role}
                </span>
                {u.id === activeParentSpeakerId && (
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-red-300">
                    <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                    <span className="relative -ml-3 h-2 w-2 rounded-full bg-red-400" />
                    <span className="ml-1">Speaking</span>
                  </span>
                )}
                <span className="text-[10px] text-slate-600">
                  {new Date(u.joinedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending requests */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Pending Requests
            </h2>
          </div>
          {pendingRequests.length === 0 && (
            <p className="text-xs text-slate-600">No requests.</p>
          )}
          <div className="space-y-2">
            {pendingRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 text-xs bg-white/[0.03] rounded-xl p-3 border border-white/5"
              >
                {statusIcon(r.status)}
                <div className="flex-1">
                  <div className="font-semibold text-slate-200">{r.parentName}</div>
                  <div className="text-slate-500 text-[10px] capitalize">
                    {r.reason.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(r.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {r.status === 'pending' && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => acceptRequest(r)}
                      className="min-h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => rejectRequest(r)}
                      className="min-h-11 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Audit feed */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Audit Events
            </h2>
          </div>
          {auditEvents.length === 0 && (
            <p className="text-xs text-slate-600">No audit events yet.</p>
          )}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {auditEvents.map((evt, idx) => {
              const { icon, title, detail } = formatAuditEvent(evt);
              return (
                <div
                  key={`${evt.timestamp}-${idx}`}
                  className="flex items-start gap-2.5 text-sm bg-white/[0.03] rounded-xl p-2.5 border border-white/5"
                >
                  {icon}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-300 text-xs">{title}</div>
                    {detail && (
                      <div className="text-slate-600 text-[10px] truncate">{detail}</div>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-600 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency broadcast */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 flex items-center gap-5">
          <PTTButton sendMessage={sendMessage} />
          <div>
            <h2 className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Operations PTT</h2>
            <p className="text-sm text-slate-300 mt-2">Press and hold to send a voice message to everyone in the room.</p>
          </div>
        </div>

        {/* Emergency broadcast */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h2 className="text-[11px] font-bold text-red-400 uppercase tracking-widest">
              Emergency Broadcast
            </h2>
          </div>
          <textarea
            value={emergencyText}
            onChange={(e) => setEmergencyText(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm text-slate-200 placeholder:text-slate-600"
            placeholder="Enter emergency message..."
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={sendEmergency}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-red-500/20 transition-all"
            >
              <Send className="w-4 h-4" />
              Broadcast
            </button>
            <button
              onClick={exportJSON}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-slate-200 rounded-xl font-bold text-sm transition-all border border-white/5"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

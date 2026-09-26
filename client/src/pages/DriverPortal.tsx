import { useStore } from '../store/useStore';
import { useState, useEffect, useRef } from 'react';
import ConnectionBar from '../components/ConnectionBar';
import PTTButton from '../components/PTTButton';
import AudioVisualizer from '../components/AudioVisualizer';
import BusSensorsBar from '../components/BusSensorsBar';

import { useAudioPlayback } from '../hooks/useAudioPlayback';
import Speedometer from '../components/Speedometer';
import TranscriptFeed from '../components/TranscriptFeed';
import { playRequestAlert } from '../lib/audioFeedback';
import {
  AlertCircle,
  Users as UsersIcon,
  Radio,
  Activity,
  Signal,
  MapPin,
} from 'lucide-react';
import type { ClientMessage, PendingRequest } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

export default function DriverPortal({ sendMessage }: Props) {
  const users = useStore((s) => s.users);
  const activeBroadcast = useStore((s) => s.activeBroadcast);
  const activeParentSpeakerId = useStore((s) => s.activeParentSpeakerId);
  const pendingRequests = useStore((s) => s.pendingRequests);
  const currentUserId = useStore((s) => s.currentUserId);

  const self = users.find((u) => u.id === currentUserId) ?? null;
  const inMotion = self?.inMotion ?? false;

  // Consume accepted parent audio on the driver's tablet too.
  useAudioPlayback(true);
  const [speed, setSpeed] = useState(0);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const replyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LOCATIONS = [
    'I-88 heading north',
    'I-88 / Exit 25 interchange',
    'Central Avenue heading east',
    'Corner of 3rd & 8th St',
    'Main Street approaching Oak Avenue',
  ];

  useEffect(() => {
    if (!inMotion) {
      setSpeed(0);
      sendMessage({ type: 'location-state', location: 'Corner of 3rd & 8th St' });
      return;
    }

    let locationIndex = 0;
    sendMessage({ type: 'location-state', location: LOCATIONS[locationIndex] });
    const interval = setInterval(() => {
      setSpeed(25 + Math.round(Math.sin(Date.now() / 2000) * 15));
      locationIndex = (locationIndex + 1) % LOCATIONS.length;
      sendMessage({ type: 'location-state', location: LOCATIONS[locationIndex] });
    }, 5000);
    return () => clearInterval(interval);
  }, [inMotion, sendMessage]);

  useEffect(() => {
    const onMessage = (event: Event) => {
      const detail = (event as CustomEvent).detail as { type?: string; senderId?: string } | undefined;
      if (detail?.type !== 'audio-chunk' || !detail.senderId) return;
      const sender = useStore.getState().users.find((user) => user.id === detail.senderId);
      if (sender?.role === 'parent') {
        setReplyTargetId(sender.id);
        if (replyResetTimerRef.current) clearTimeout(replyResetTimerRef.current);
        replyResetTimerRef.current = setTimeout(() => setReplyTargetId(null), 30000);
      }
    };
    window.addEventListener('ptt-message', onMessage);
    return () => {
      window.removeEventListener('ptt-message', onMessage);
      if (replyResetTimerRef.current) clearTimeout(replyResetTimerRef.current);
      if (targetHoldTimerRef.current) clearTimeout(targetHoldTimerRef.current);
    };
  }, []);

  const incoming: PendingRequest[] = pendingRequests.filter(
    (r) => r.status === 'pending'
  );

  // Alert the driver when a new pending request arrives.
  const prevIncomingCountRef = useRef(incoming.length);
  useEffect(() => {
    if (incoming.length > prevIncomingCountRef.current) {
      playRequestAlert();
    }
    prevIncomingCountRef.current = incoming.length;
  }, [incoming.length]);

  const parentUsers = users.filter((user) => user.role === 'parent');
  const replyTarget = users.find((user) => user.id === replyTargetId) ?? null;

  const selectReplyTarget = (targetId: string | null) => {
    if (replyResetTimerRef.current) clearTimeout(replyResetTimerRef.current);
    setReplyTargetId(targetId);
  };

  const beginTargetHold = (targetId: string | null) => {
    if (targetHoldTimerRef.current) clearTimeout(targetHoldTimerRef.current);
    targetHoldTimerRef.current = setTimeout(() => {
      selectReplyTarget(targetId);
      targetHoldTimerRef.current = null;
    }, 600);
  };

  const cancelTargetHold = () => {
    if (targetHoldTimerRef.current) clearTimeout(targetHoldTimerRef.current);
    targetHoldTimerRef.current = null;
  };

  const accept = (req: PendingRequest) => {
    sendMessage({ type: 'accept-request', parentId: req.parentId });
  };

  const decline = (req: PendingRequest) => {
    sendMessage({ type: 'decline-request', parentId: req.parentId });
  };

  return (
    <div className="min-h-full flex flex-col bg-[#0a0f1c]">
      <ConnectionBar />

      {/* Main content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left: speedometer above broadcast controls */}
        <div className="flex flex-col items-center justify-between gap-3 w-[40%]">
          <Speedometer speed={speed} />

          <div className="flex flex-col items-center gap-2">
            <PTTButton sendMessage={sendMessage} targetUserId={replyTarget?.id ?? null} />
            <div className="w-full max-w-[200px]">
              <AudioVisualizer active={Boolean(activeBroadcast)} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Signal className={`w-3.5 h-3.5 ${activeBroadcast ? 'text-red-400' : 'text-slate-500'}`} />
              <span className="text-slate-400">
                {activeBroadcast ? 'Broadcasting' : inMotion ? 'PTT disabled' : 'Ready'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Info panels */}
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          {/* Status */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                Status
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Broadcast</div>
                <div className={`text-sm font-bold ${activeBroadcast ? 'text-red-400' : 'text-slate-300'}`}>
                  {activeBroadcast ? 'Live' : 'Idle'}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Parents</div>
                <div className="text-sm font-bold text-slate-300">
                  {users.filter((u) => u.role === 'parent').length}
                </div>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3 min-w-0">
                <div className="flex items-center gap-1 text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                  Location
                </div>
                <div className="text-xs font-bold text-slate-200 truncate" title={self?.location}>
                  {self?.location ?? (inMotion ? 'I-88 heading north' : 'Corner of 3rd & 8th St')}
                </div>
              </div>
            </div>
          </div>

          {/* Transcripts */}
          <TranscriptFeed />

          {/* Requests */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <UsersIcon className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                Requests
              </h2>
              <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
                {incoming.length}
              </span>
            </div>
            {incoming.length === 0 && (
              <p className="text-xs text-slate-600">No pending requests.</p>
            )}
            <div className="space-y-2">
              {incoming.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 text-xs bg-white/[0.03] rounded-xl p-2.5 border border-white/5"
                >
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{r.parentName}</div>
                    <div className="text-slate-500 text-[10px] capitalize">
                      {r.reason.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => accept(r)}
                      className="min-h-11 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decline(r)}
                      className="min-h-11 px-4 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-bold shadow-lg shadow-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Users */}
          <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-4 h-4 text-slate-400" />
              <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
                In Room
              </h2>
            </div>
            <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>Reply target</span>
              <span className="text-[9px] uppercase tracking-wider">Hold mobile · double-click web</span>
            </div>
            <button
              type="button"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture?.(event.pointerId);
                beginTargetHold(null);
              }}
              onPointerUp={cancelTargetHold}
              onPointerCancel={cancelTargetHold}
              onDoubleClick={() => selectReplyTarget(null)}
              onContextMenu={(event) => event.preventDefault()}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                replyTargetId === null ? 'bg-violet-500/15 ring-1 ring-violet-400/40' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span className="font-semibold text-slate-200">Everyone</span>
              {replyTargetId === null && <span className="ml-auto text-[9px] text-violet-300">selected</span>}
            </button>
            {users.length === 0 && (
              <p className="text-xs text-slate-600">Nobody else has joined yet.</p>
            )}
            <div className="space-y-1 overflow-y-auto">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onPointerDown={(event) => {
                    if (u.role === 'driver') return;
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    beginTargetHold(u.id);
                  }}
                  onPointerUp={cancelTargetHold}
                  onPointerCancel={cancelTargetHold}
                  onDoubleClick={() => u.role !== 'driver' && selectReplyTarget(u.id)}
                  onContextMenu={(event) => event.preventDefault()}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                    replyTargetId === u.id ? 'bg-emerald-500/15 ring-1 ring-emerald-400/40' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    u.role === 'driver' ? 'bg-emerald-400' :
                    u.role === 'parent' ? 'bg-amber-400' : 'bg-sky-400'
                  }`} />
                  <span className="font-medium text-slate-300 truncate flex-1">
                    {u.name || u.id}
                  </span>
                  <span className="text-[10px] text-slate-500 capitalize bg-white/5 px-2 py-0.5 rounded-full">
                    {u.role}
                  </span>
                  {u.id === activeParentSpeakerId && (
                    <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-red-300">
                      <span className="h-2 w-2 rounded-full bg-red-400 animate-ping" />
                      <span className="relative -ml-3 h-2 w-2 rounded-full bg-red-400" />
                      <span className="ml-1">Speaking</span>
                    </span>
                  )}
                  {replyTargetId === u.id && <span className="text-[9px] text-emerald-300">selected</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <BusSensorsBar sendMessage={sendMessage} />

    </div>
  );
}

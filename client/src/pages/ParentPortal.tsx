import { useStore } from '../store/useStore';
import ConnectionBar from '../components/ConnectionBar';
import AudioVisualizer from '../components/AudioVisualizer';
import RequestModal from '../components/RequestModal';

import { useAudioPlayback } from '../hooks/useAudioPlayback';
import { useVoiceMessageCapture } from '../hooks/useVoiceMessageCapture';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { playPttPressTone, playRogerBeep, preloadPttPressTone } from '../lib/audioFeedback';
import { isNative } from '../lib/platform';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Radio,
  Bus,
  Shield,
  Users as UsersIcon,
  Signal,
  Activity,
  MapPin,
  Mic,
  MicOff,
} from 'lucide-react';
import type { ClientMessage, PendingRequest, UserRole } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

const ROLE_DOT: Record<UserRole, string> = {
  driver: 'bg-emerald-400',
  parent: 'bg-amber-400',
  operations: 'bg-sky-400',
};

export default function ParentPortal({ sendMessage }: Props) {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const activeBroadcast = useStore((s) => s.activeBroadcast);
  const pendingRequests = useStore((s) => s.pendingRequests);
  const callActive = useStore((s) => s.callActive);
  const requestModalOpen = useStore((s) => s.requestModalOpen);
  const setRequestModalOpen = useStore((s) => s.setRequestModalOpen);
  const auditEvents = useStore((s) => s.auditEvents);


  const driver = users.find((u) => u.role === 'driver') ?? null;
  const dispatch = users.find((u) => u.role === 'operations') ?? null;
  const canRequestSpeak = Boolean(driver || dispatch);

  const myRequests: PendingRequest[] = currentUserId
    ? pendingRequests.filter((r) => r.parentId === currentUserId)
    : pendingRequests;

  const hasAcceptedRequest = myRequests.some((r) => r.status === 'accepted');
  const hasPendingRequest = myRequests.some((r) => r.status === 'pending');

  const statusIcon = (s: PendingRequest['status']) => {
    if (s === 'pending') return <AlertCircle className="w-4 h-4 text-amber-400" />;
    if (s === 'accepted') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    if (s === 'declined') return <XCircle className="w-4 h-4 text-red-400" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
  };

  // Keep the receive path mounted so Driver audio is not missed while call state changes.
  useAudioPlayback(true);

  useEffect(() => {
    preloadPttPressTone();
  }, []);


  // Show latest emergency message banner
  const lastEmergency = auditEvents
    .filter((e) => e.type === 'emergency-message')
    .pop();

  // Parent speak (after request accepted)
  const [parentSpeaking, setParentSpeaking] = useState(false);
  const { start, stop, cancel } = useVoiceMessageCapture();
  const { startRecognition, stopRecognition, getTranscript, isAvailable } = useSpeechRecognition();
  const pressedRef = useRef(false);
  const startPromiseRef = useRef<Promise<boolean> | null>(null);

  const beginSpeak = useCallback(() => {
    if (!hasAcceptedRequest || pressedRef.current) return;
    pressedRef.current = true;
    setParentSpeaking(true);
    sendMessage({ type: 'parent-transmit-start' });
    startPromiseRef.current = start();
    playPttPressTone();
    if (isAvailable) startRecognition();
  }, [hasAcceptedRequest, start, isAvailable, startRecognition]);

  const finishSpeak = useCallback(async () => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    await startPromiseRef.current;
    if (isAvailable) stopRecognition();
    // Allow STT onresult callbacks to flush
    await new Promise((resolve) => setTimeout(resolve, 100));
    const message = await stop();
    if (message?.hasSpeech) {
      sendMessage({
        type: 'audio-chunk',
        chunk: message.base64,
        mimeType: message.mimeType,
        transcript: getTranscript() || undefined,
      });
      if (message.durationMs >= 3000) sendMessage({ type: 'end-speak' });
    }
    sendMessage({ type: 'parent-transmit-end' });
    setParentSpeaking(false);
    startPromiseRef.current = null;
    playRogerBeep();
  }, [sendMessage, stop, isAvailable, stopRecognition, getTranscript]);

  useEffect(() => {
    if (!hasAcceptedRequest && parentSpeaking) {
      pressedRef.current = false;
      if (isAvailable) stopRecognition();
      cancel();
      sendMessage({ type: 'parent-transmit-end' });
      setParentSpeaking(false);
    }
  }, [cancel, hasAcceptedRequest, parentSpeaking, isAvailable, stopRecognition]);

  return (
    <div className="min-h-full flex flex-col bg-[#0a0f1c]">
      <ConnectionBar />

      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {/* Emergency broadcast banner */}
        {lastEmergency && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-3 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400 animate-pulse" />
            <div className="text-xs font-bold text-red-300">
              {(lastEmergency.payload as Record<string, string>).message}
            </div>
          </div>
        )}

        {/* Active broadcast banner */}
        {activeBroadcast && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 text-red-400 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-red-300">Driver broadcasting</div>
              <div className="text-xs text-red-400/70">Listen-only while on air</div>
            </div>
          </div>
        )}

        {/* Status cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#111827] rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Driver</div>
            <div className="text-sm font-bold text-slate-200 truncate">
              {driver ? driver.name || driver.id : 'Waiting…'}
            </div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Motion</div>
            <div className={`text-sm font-bold ${driver?.inMotion ? 'text-emerald-400' : 'text-slate-400'}`}>
              {driver?.inMotion ? 'Moving' : 'Stopped'}
            </div>
          </div>
          <div className="bg-[#111827] rounded-2xl p-3 border border-white/5 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Location</div>
            </div>
            <div className="text-sm font-bold text-slate-200">
              {driver?.location ?? (driver?.inMotion ? 'I-88 heading north' : 'Corner of 3rd & 8th St')}
            </div>
          </div>
        </div>

        {/* Audio visualizer */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Signal className={`w-4 h-4 ${callActive ? 'text-red-400' : 'text-slate-500'}`} />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {callActive ? 'Receiving Broadcast' : 'No Broadcast'}
            </h2>
          </div>
          <AudioVisualizer active={callActive} />
        </div>

        {/* Speak button (shown only when request accepted) */}
        {hasAcceptedRequest && (
          <div className="space-y-2">
            <button
              onPointerDown={(event) => {
                event.preventDefault();
                beginSpeak();
                try {
                  event.currentTarget.setPointerCapture(event.pointerId);
                } catch {}
              }}
              onPointerUp={finishSpeak}
              onPointerCancel={() => {
                pressedRef.current = false;
                if (isAvailable) stopRecognition();
                cancel();
                sendMessage({ type: 'parent-transmit-end' });
                setParentSpeaking(false);
              }}
              onDoubleClick={() => {
                if (!isNative()) {
                  if (!parentSpeaking) {
                    beginSpeak();
                  } else {
                    finishSpeak();
                  }
                }
              }}
              onContextMenu={(event) => event.preventDefault()}
              style={{ touchAction: 'none' }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] ${
                parentSpeaking
                  ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 text-white'
              }`}
            >
              {parentSpeaking ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {parentSpeaking ? 'Release to send message' : isNative() ? 'Press and hold to speak' : 'Double-click to speak'}
            </button>
          </div>
        )}

        {/* Request button */}
        {!hasAcceptedRequest && (
          <button
            onClick={() => setRequestModalOpen(true)}
            disabled={!currentUserId || requestModalOpen || hasPendingRequest || !canRequestSpeak}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${
              hasPendingRequest
                ? 'bg-slate-700 text-slate-300 shadow-none'
                : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-amber-500/20'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            {hasPendingRequest
              ? 'Request Pending'
              : !canRequestSpeak
                ? 'PTT Not Ready'
                : 'Request to Speak'}
          </button>
        )}

        {/* My requests */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              My Requests
            </h2>
          </div>
          {myRequests.length === 0 && (
            <p className="text-xs text-slate-600">No requests yet.</p>
          )}
          <div className="space-y-2">
            {myRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 text-xs bg-white/[0.03] rounded-xl p-2.5 border border-white/5"
              >
                {statusIcon(r.status)}
                <div className="flex-1">
                  <div className="font-semibold text-slate-300 capitalize">
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
              </div>
            ))}
          </div>
        </div>

        {/* Users in room */}
        <div className="bg-[#111827] rounded-2xl p-4 border border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <UsersIcon className="w-4 h-4 text-slate-400" />
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              In Room
            </h2>
          </div>
          {users.length === 0 && (
            <p className="text-xs text-slate-600">Nobody else has joined yet.</p>
          )}
          <div className="space-y-1">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${ROLE_DOT[u.role]}`} />
                <span className="font-medium text-slate-300 truncate flex-1">
                  {u.name || u.id}
                </span>
                <span className="text-[10px] text-slate-500 capitalize bg-white/5 px-2 py-0.5 rounded-full">
                  {u.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <RequestModal sendMessage={sendMessage} />

    </div>
  );
}

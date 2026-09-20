import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { Mic, MicOff } from 'lucide-react';
import type { ClientMessage } from '../types';
import { useVoiceMessageCapture } from '../hooks/useVoiceMessageCapture';
import { playPttPressTone, playRogerBeep, preloadPttPressTone } from '../lib/audioFeedback';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
  targetUserId?: string | null;
}

export default function PTTButton({ sendMessage, targetUserId = null }: Props) {
  const activeBroadcast = useStore((s) => s.activeBroadcast);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const self = users.find((u) => u.id === currentUserId) ?? null;
  const inMotion = self?.inMotion ?? false;
  const { start, stop, cancel } = useVoiceMessageCapture();
  const [recording, setRecording] = useState(false);
  const pressedRef = useRef(false);
  const startPromiseRef = useRef<Promise<boolean> | null>(null);
  const finishingRef = useRef(false);

  const isLocked = Boolean(activeBroadcast && activeBroadcast.driverId === currentUserId);

  useEffect(() => {
    preloadPttPressTone();
  }, []);

  const beginRecording = () => {
    if (inMotion || pressedRef.current || finishingRef.current) return;
    pressedRef.current = true;
    setRecording(true);
    sendMessage({ type: 'broadcast-start' });
    startPromiseRef.current = start();
    playPttPressTone();
  };

  const finishRecording = async () => {
    if (!pressedRef.current || finishingRef.current) return;
    pressedRef.current = false;
    finishingRef.current = true;
    await startPromiseRef.current;
    const message = await stop();
    if (message?.hasSpeech) {
      sendMessage({ type: 'audio-chunk', chunk: message.base64, mimeType: message.mimeType, targetId: targetUserId ?? undefined });
    }
    sendMessage({ type: 'broadcast-end' });
    setRecording(false);
    startPromiseRef.current = null;
    finishingRef.current = false;
    playRogerBeep();
  };

  const cancelRecording = () => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    cancel();
    sendMessage({ type: 'broadcast-end' });
    setRecording(false);
    startPromiseRef.current = null;
  };

  const active = recording || isLocked;
  const activeClass = active
    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-red-500/40'
    : inMotion
    ? 'bg-slate-700 cursor-not-allowed'
    : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95';

  const label = active
    ? 'Release to send voice message'
    : inMotion
    ? 'Disabled while in motion'
    : 'Press and hold to speak';

  return (
    <button
      onPointerDown={(event) => {
        // Start first. Some mobile webviews reject pointer capture; that must
        // not prevent the PTT state from entering its pressed state.
        event.preventDefault();
        beginRecording();
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture is only a release-delivery aid, not a prerequisite.
        }
      }}
      onPointerUp={finishRecording}
      onPointerCancel={cancelRecording}
      onContextMenu={(event) => event.preventDefault()}
      disabled={inMotion}
      aria-label="Push to Talk"
      title={label}
      style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 select-none touch-none ${activeClass}`}
    >
      {active ? <MicOff className="w-12 h-12 text-white" /> : <Mic className="w-12 h-12 text-white" />}
    </button>
  );
}

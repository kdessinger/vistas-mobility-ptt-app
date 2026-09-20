import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { PhoneOff } from 'lucide-react';
import type { ClientMessage } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

export default function CallOverlay({ sendMessage }: Props) {
  const callActive = useStore((s) => s.callActive);
  const callStartTime = useStore((s) => s.callStartTime);
  const callPartner = useStore((s) => s.callPartner);
  const role = useStore((s) => s.role);
  const setCallActive = useStore((s) => s.setCallActive);

  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!callActive || !callStartTime) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.floor((Date.now() - callStartTime) / 1000));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [callActive, callStartTime]);

  if (!callActive) return null;

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const end = () => {
    if (role === 'driver' || role === 'parent') {
      sendMessage({ type: 'call-end' });
    } else {
      sendMessage({ type: 'leave' });
    }
    setCallActive(false, null);
  };

  const isDriver = role === 'driver';

  return (
    <div className={isDriver
      ? 'fixed top-4 right-4 z-40 pointer-events-none'
      : 'fixed inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-4'}>
      <div className={`bg-[#111827] rounded-3xl flex flex-col items-center gap-5 shadow-2xl border border-white/10 ${
        isDriver ? 'pointer-events-auto p-4 w-64' : 'p-8 max-w-sm w-full'
      }`}>
        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          Active Call
        </div>
        <div className="text-2xl font-bold text-white">
          {callPartner?.name ?? 'Unknown'}
        </div>
        <div className="text-sm text-slate-400 capitalize">
          {callPartner?.role ?? ''}
        </div>
        <div className="text-3xl font-mono text-slate-300 tabular-nums">
          {mm}:{ss}
        </div>
        <button
          onClick={end}
          aria-label="End call"
          className="mt-2 flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-full font-bold shadow-lg shadow-red-500/20 transition-transform active:scale-95"
        >
          <PhoneOff className="w-5 h-5" />
          End Call
        </button>
      </div>
    </div>
  );
}

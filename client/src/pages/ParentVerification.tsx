import { useState, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { Fingerprint, Shield, UserCheck } from 'lucide-react';

interface Props {
  onVerified: () => void;
}

export default function ParentVerification({ onVerified }: Props) {
  const parentName = useStore((s) => s.name) ?? sessionStorage.getItem('ptt_name') ?? 'Guardian';
  const studentName = sessionStorage.getItem('ptt_student') ?? 'Emma Garcia';
  const grade = sessionStorage.getItem('ptt_grade') ?? 'Grade 3';
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [verified, setVerified] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

  }, []);

  const startPress = useCallback(() => {
    if (verified) return;
    setPressing(true);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 8;
      setProgress(p);
      if (p >= 100) {
        clearTimers();
        setVerified(true);
        setPressing(false);
        setProgress(100);
        onVerified();
      }
    }, 80);
  }, [verified, onVerified, clearTimers]);

  const endPress = useCallback(() => {
    if (verified) return;
    clearTimers();
    setPressing(false);
    setProgress(0);
  }, [clearTimers]);

  return (
    <div className="min-h-full flex flex-col items-center justify-center bg-[#0a0f1c] p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/20">
          <Shield className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Identity Verification</h1>
        <p className="text-slate-500 text-sm mt-1">Secure guardian access</p>
      </div>

      {/* Fingerprint scanner */}
      <div className="relative flex flex-col items-center gap-6">
        <button
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={(e) => {
            e.preventDefault();
            startPress();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endPress();
          }}
          className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-200 select-none active:scale-95 ${
            verified
              ? 'bg-emerald-500/10 ring-4 ring-emerald-500/40'
              : pressing
              ? 'bg-amber-500/10 ring-8 ring-amber-500/30 scale-95'
              : 'bg-white/[0.03] ring-2 ring-white/10 hover:ring-amber-500/30 hover:scale-[1.02]'
          }`}
        >
          <Fingerprint
            className={`w-20 h-20 transition-colors duration-200 ${
              verified
                ? 'text-emerald-400'
                : pressing
                ? 'text-amber-400'
                : 'text-slate-600'
            }`}
          />

          {pressing && !verified && (
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="46" fill="none" stroke="currentColor"
                strokeWidth="3" className="text-amber-500"
                strokeDasharray={`${progress * 2.89} 289`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.05s linear' }}
              />
            </svg>
          )}

          {verified && (
            <div className="absolute inset-0 flex items-center justify-center">
              <UserCheck className="w-10 h-10 text-emerald-400" />
            </div>
          )}
        </button>

        <div className="text-center">
          {verified ? (
            <p className="text-emerald-400 font-semibold text-sm">Identity verified</p>
          ) : pressing ? (
            <p className="text-amber-400 font-medium text-sm animate-pulse">Scanning...</p>
          ) : (
            <p className="text-slate-500 text-sm">Press and hold to verify</p>
          )}
        </div>

        <div className="bg-white/[0.03] rounded-xl px-5 py-3 border border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Authorized Guardian</p>
          <p className="text-sm font-semibold text-slate-200">{parentName}</p>
          <p className="text-xs text-slate-500">Student: {studentName} ({grade})</p>
        </div>
      </div>
    </div>
  );
}

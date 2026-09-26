import { useStore } from '../store/useStore';
import { MessageSquare, X, FileText } from 'lucide-react';
import { useState } from 'react';

export default function TranscriptFeed() {
  const transcripts = useStore((s) => s.incomingTranscripts);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (transcripts.length === 0) return null;

  const visible = transcripts
    .slice(-5)
    .filter((t) => !dismissed.has(`${t.senderId}-${t.timestamp}`));

  if (visible.length === 0) return null;

  const dismissAll = () => {
    setDismissed((prev) => {
      const next = new Set(prev);
      visible.forEach((t) => next.add(`${t.senderId}-${t.timestamp}`));
      return next;
    });
  };

  return (
    <div className="bg-[#111827] rounded-2xl p-4 border border-white/5 flex-shrink-0">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-violet-400" />
        <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
          Transcripts
        </h2>
        <span className="ml-auto text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">
          {visible.length}
        </span>
        {visible.length > 0 && (
          <button
            onClick={dismissAll}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            clear
          </button>
        )}
      </div>
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {visible.map((t) => (
          <div
            key={`${t.senderId}-${t.timestamp}`}
            className="flex items-start gap-2 bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2"
          >
            <MessageSquare className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="text-[10px] text-violet-300 font-bold">{t.senderName}</div>
                <div className="text-[10px] text-slate-500">
                  {new Date(t.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div className="text-xs text-white/90 mt-0.5">{t.text}</div>
            </div>
            <button
              onClick={() => {
                setDismissed((prev) => new Set([...prev, `${t.senderId}-${t.timestamp}`]));
              }}
              className="text-slate-500 hover:text-slate-300 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

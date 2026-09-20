import { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Send } from 'lucide-react';
import type { ClientMessage } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'absence', label: 'Absence' },
  { value: 'early_pickup', label: 'Early Pickup' },
  { value: 'late_dropoff', label: 'Late Drop-off' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
];

export default function RequestModal({ sendMessage }: Props) {
  const open = useStore((s) => s.requestModalOpen);
  const setOpen = useStore((s) => s.setRequestModalOpen);
  const currentUserId = useStore((s) => s.currentUserId);

  const [reason, setReason] = useState<string>('absence');
  const [details, setDetails] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!open) return null;

  const submit = () => {
    if (!currentUserId || submitting) return;
    setSubmitting(true);
    const text = details.trim()
      ? `${REASONS.find((r) => r.value === reason)?.label ?? reason}: ${details.trim()}`
      : REASONS.find((r) => r.value === reason)?.label ?? reason;
    sendMessage({ type: 'request-speak', reason: text, parentId: currentUserId });
    setOpen(false);
    setReason('absence');
    setDetails('');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md bg-[#111827] rounded-2xl shadow-2xl p-6 space-y-4 border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Request to Speak</h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">Reason</label>
          <div className="grid grid-cols-2 gap-2">
            {REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                className={`px-3 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  reason === r.value
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-white/[0.03] border-white/5 text-slate-400 hover:bg-white/[0.06]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">
            Details <span className="text-slate-600 font-normal">(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white/[0.03] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 text-sm text-slate-200 placeholder:text-slate-600"
            placeholder="Add any relevant details..."
          />
        </div>

        <button
          onClick={submit}
          disabled={!currentUserId || submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
          Send Request
        </button>
      </div>
    </div>
  );
}

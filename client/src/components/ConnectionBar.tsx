import { useStore } from '../store/useStore';
import { Radio, LogOut } from 'lucide-react';
import type { UserRole } from '../types';

const ROLE_BADGE: Record<UserRole, string> = {
  driver: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  parent: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  operations: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

export default function ConnectionBar() {
  const role = useStore((s) => s.role);
  const name = useStore((s) => s.name);
  const connectionStatus = useStore((s) => s.connectionStatus);
  const reset = useStore((s) => s.reset);

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Guest';
  const roleColor = role ? ROLE_BADGE[role] : 'bg-slate-500/20 text-slate-400 border-slate-500/30';

  const dotColor =
    connectionStatus === 'connected'
      ? 'bg-emerald-400 shadow-emerald-400/50'
      : connectionStatus === 'connecting'
      ? 'bg-amber-400 shadow-amber-400/50'
      : 'bg-red-400 shadow-red-400/50';

  const handleLogout = () => {
    sessionStorage.removeItem('ptt_role');
    sessionStorage.removeItem('ptt_name');
    reset();
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#0f172a]/80 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-3">
        <span
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider border ${roleColor}`}
        >
          {roleLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full shadow-[0_0_6px] ${dotColor}`} />
          <Radio className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-400 font-medium">{name ?? ''}</span>
        <button
          onClick={handleLogout}
          aria-label="Log out"
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          title="Log out"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

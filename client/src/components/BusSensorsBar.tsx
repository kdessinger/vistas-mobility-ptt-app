import { useStore } from '../store/useStore';
import { Bus, Lightbulb, AlertTriangle, DoorOpen } from 'lucide-react';
import type { ClientMessage } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

export default function BusSensorsBar({ sendMessage }: Props) {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);

  const self = users.find((u) => u.id === currentUserId) ?? null;
  const inMotion = self?.inMotion ?? false;
  const yellowLights = self?.yellowLights ?? false;
  const redLights = self?.redLights ?? false;
  const doorOpen = self?.doorOpen ?? false;

  const toggleMotion = () => {
    sendMessage({ type: 'motion-state', inMotion: !inMotion });
  };

  const toggleYellow = () => {
    const next = !yellowLights;
    sendMessage({ type: 'bus-sensors', yellowLights: next, redLights: next ? false : redLights });
  };

  const toggleRed = () => {
    const next = !redLights;
    sendMessage({ type: 'bus-sensors', redLights: next, yellowLights: next ? false : yellowLights });
  };

  const toggleDoor = () => {
    sendMessage({ type: 'bus-sensors', doorOpen: !doorOpen });
  };

  const btn = (
    active: boolean,
    activeClass: string,
    inactiveClass: string,
    label: string,
    onClick: () => void
  ) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
        active
          ? `${activeClass} shadow-lg`
          : `${inactiveClass} hover:bg-white/10`
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0f172a] border-t border-white/5">
      {btn(
        inMotion,
        'bg-emerald-500 text-white shadow-emerald-500/30',
        'bg-white/5 text-slate-400',
        'Moving',
        toggleMotion
      )}
      {btn(
        yellowLights,
        'bg-amber-400 text-black shadow-amber-400/30',
        'bg-white/5 text-slate-400',
        'Yellow',
        toggleYellow
      )}
      {btn(
        redLights,
        'bg-red-500 text-white shadow-red-500/30',
        'bg-white/5 text-slate-400',
        'Red',
        toggleRed
      )}
      {btn(
        doorOpen,
        'bg-sky-500 text-white shadow-sky-500/30',
        'bg-white/5 text-slate-400',
        'Door',
        toggleDoor
      )}
    </div>
  );
}

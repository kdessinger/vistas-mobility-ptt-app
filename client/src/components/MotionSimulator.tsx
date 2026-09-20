import { useStore } from '../store/useStore';
import { Bus, Zap } from 'lucide-react';
import type { ClientMessage } from '../types';

interface Props {
  sendMessage: (msg: ClientMessage) => boolean;
}

export default function MotionSimulator({ sendMessage }: Props) {
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUserId);

  const self = users.find((u) => u.id === currentUserId) ?? null;
  const active = self?.inMotion ?? false;

  const toggle = () => {
    sendMessage({ type: 'motion-state', inMotion: !active });
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-800 text-white">
      <div className="flex items-center gap-2">
        <Bus
          className={`w-5 h-5 ${active ? 'text-green-400' : 'text-gray-400'}`}
        />
        <span className="text-sm font-medium">
          {active ? 'Bus in motion' : 'Bus stopped'}
        </span>
      </div>
      <button
        onClick={toggle}
        aria-label={active ? 'Stop bus' : 'Start bus'}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
          active
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-green-600 hover:bg-green-700 text-white'
        }`}
      >
        <Zap className="w-4 h-4" />
        {active ? 'Stop' : 'Start'}
      </button>
    </div>
  );
}
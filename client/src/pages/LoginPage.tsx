import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { Users, Bus, Shield, ChevronRight, UserRound, X } from 'lucide-react';
import type { UserRole } from '../types';

const ROLE_IDS: Record<UserRole, string> = {
  parent: 'p1',
  driver: 'd1',
  operations: 'o1',
};

const ROLE_NAMES: Record<UserRole, string> = {
  parent: 'Maria Garcia',
  driver: 'Driver Smith',
  operations: 'Dispatch',
};

const PARENTS = [
  { id: 'p1', name: 'Maria Garcia', student: 'Emma Garcia', grade: 'Grade 3' },
  { id: 'p2', name: 'James Wilson', student: 'Noah Wilson', grade: 'Grade 5' },
  { id: 'p3', name: 'Priya Patel', student: 'Aarav Patel', grade: 'Grade 2' },
  { id: 'p4', name: 'Robert Thompson', student: 'Sofia Thompson', grade: 'Grade 4' },
  { id: 'p5', name: 'Linda Chen', student: 'Mia Chen', grade: 'Grade 1' },
];

const ROLES: Array<{
  key: UserRole;
  label: string;
  subtitle: string;
  icon: typeof Users;
  color: string;
  gradient: string;
  shadow: string;
}> = [
  {
    key: 'parent',
    label: 'Parent',
    subtitle: 'Choose a guardian profile',
    icon: Users,
    color: 'from-amber-500 to-orange-600',
    gradient: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20',
    shadow: 'shadow-amber-500/20',
  },
  {
    key: 'driver',
    label: 'Driver',
    subtitle: 'Bus Operator',
    icon: Bus,
    color: 'from-emerald-500 to-teal-600',
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20',
    shadow: 'shadow-emerald-500/20',
  },
  {
    key: 'operations',
    label: 'Operations',
    subtitle: 'Dispatch Center',
    icon: Shield,
    color: 'from-sky-500 to-blue-600',
    gradient: 'bg-gradient-to-br from-sky-500/20 to-blue-600/20',
    shadow: 'shadow-sky-500/20',
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const setRole = useStore((s) => s.setRole);
  const setName = useStore((s) => s.setName);
  const [parentPickerOpen, setParentPickerOpen] = useState(false);

  const select = (key: UserRole) => {
    if (key === 'parent') {
      setParentPickerOpen(true);
      return;
    }
    const id = ROLE_IDS[key];
    const name = ROLE_NAMES[key];
    setRole(key);
    setName(name);
    sessionStorage.setItem('ptt_role', key);
    sessionStorage.setItem('ptt_name', name);
    sessionStorage.setItem('ptt_user_id', id);
    navigate(`/${key === 'operations' ? 'ops' : key}`);
  };

  const selectParent = (parent: (typeof PARENTS)[number]) => {
    setRole('parent');
    setName(parent.name);
    sessionStorage.setItem('ptt_role', 'parent');
    sessionStorage.setItem('ptt_name', parent.name);
    sessionStorage.setItem('ptt_user_id', parent.id);
    sessionStorage.setItem('ptt_student', parent.student);
    sessionStorage.setItem('ptt_grade', parent.grade);
    setParentPickerOpen(false);
    navigate('/parent-verify');
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1c] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-lg shadow-blue-500/25">
            <span className="relative block w-12 h-12 overflow-hidden" aria-hidden="true">
              <img src="/vistas-mobility-logo.png" alt="" className="absolute left-0 top-0 h-12 w-auto max-w-none" />
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Push-to-Talk</h1>
          <p className="text-slate-400 text-sm">Secure school bus communication</p>
        </div>

        <div className="space-y-3">
          {ROLES.map(({ key, label, subtitle, icon: Icon, color, gradient, shadow }) => (
            <button
              key={key}
              onClick={() => select(key)}
              className={`group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/5 ${gradient} backdrop-blur-sm hover:border-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ${shadow} hover:shadow-lg`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-semibold text-base">{label}</div>
                <div className="text-slate-400 text-xs">{subtitle}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        <div className="mt-10 text-center space-y-0.5">
          <p className="text-slate-500 text-xs">Demo Build</p>
          <p className="text-slate-600 text-[11px]">by Vistas Mobility Solutions</p>
          <p className="text-slate-700 text-[10px]">Copyright 2026</p>
        </div>
      </div>

      {parentPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617]/80 backdrop-blur-md p-5">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50 p-5">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Choose a parent profile</h2>
                <p className="text-xs text-slate-400 mt-1">Select a different guardian for each test device.</p>
              </div>
              <button onClick={() => setParentPickerOpen(false)} aria-label="Close parent profiles" className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {PARENTS.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => selectParent(parent)}
                  className="group w-full flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-3 text-left hover:border-amber-400/40 hover:bg-amber-500/10 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                    <UserRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100">{parent.name}</div>
                    <div className="text-xs text-slate-500">Student: {parent.student} · {parent.grade}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

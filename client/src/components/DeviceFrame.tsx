import { ReactNode } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

type DeviceType = 'iphone' | 'ipad' | 'samsung-tablet';

interface DeviceFrameProps {
  device: DeviceType;
  children: ReactNode;
}

/* ─── iPhone 16 Pro Max (desktop only) ─── */
function IphoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Outer titanium frame */}
      <div className="relative w-full max-w-[390px] h-[844px] bg-[#1a1a1a] rounded-[55px] shadow-2xl shadow-black/60 border-[12px] border-[#1a1a1a] overflow-hidden">
        {/* Titanium side sheen */}
        <div className="absolute inset-0 rounded-[43px] ring-1 ring-white/10" />

        {/* Power button */}
        <div className="absolute right-[-14px] top-[140px] w-[4px] h-[70px] bg-[#2a2a2a] rounded-r-md shadow-sm" />
        {/* Volume up */}
        <div className="absolute left-[-14px] top-[120px] w-[4px] h-[35px] bg-[#2a2a2a] rounded-l-md shadow-sm" />
        {/* Volume down */}
        <div className="absolute left-[-14px] top-[170px] w-[4px] h-[55px] bg-[#2a2a2a] rounded-l-md shadow-sm" />
        {/* Action button */}
        <div className="absolute left-[-14px] top-[240px] w-[4px] h-[35px] bg-[#2a2a2a] rounded-l-md shadow-sm" />

        <div className="w-full h-full bg-black rounded-[43px] overflow-hidden relative flex flex-col transform">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50">
            <div className="w-[120px] h-[35px] bg-black rounded-b-[18px] flex items-center justify-center gap-2">
              {/* Camera lens */}
              <div className="w-[10px] h-[10px] rounded-full bg-[#0d0d0d] ring-1 ring-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-700/40 to-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] rounded-full bg-[#1a1a2e]" />
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="h-[54px] bg-white flex items-end justify-between px-9 pb-2 text-[13px] font-semibold text-slate-900 select-none">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-700">T-Mobile</span>
              {/* Signal bars */}
              <svg className="w-[18px] h-[12px]" viewBox="0 0 18 12" fill="currentColor">
                <rect x="0" y="4" width="3" height="5" rx="0.5" />
                <rect x="4.5" y="2" width="3" height="7" rx="0.5" />
                <rect x="9" y="0" width="3" height="9" rx="0.5" />
                <rect x="13.5" y="1" width="3" height="8" rx="0.5" />
              </svg>
              {/* WiFi */}
              <svg className="w-[16px] h-[12px]" viewBox="0 0 16 12" fill="currentColor">
                <path d="M8 0C5.5 0 3.2 1.3 2 3.2c.4-.1.8-.2 1.2-.2 2.5 0 4.5 2 4.5 4.5 0 .4-.1.8-.2 1.2C9.6 7.8 12 5.8 12 3c0-.4-.1.8-.2-1.2C10.8.8 9.5 0 8 0z" />
                <path d="M3 5C1.3 5 0 6.3 0 8s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" opacity="0.5" />
              </svg>
              {/* Battery */}
              <div className="flex items-center gap-[2px]">
                <span className="text-[11px] font-medium">100</span>
                <div className="w-[25px] h-[12px] border border-slate-900 rounded-[3px] p-[1px] flex items-center">
                  <div className="w-[21px] h-full bg-slate-900 rounded-[1px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">{children}</div>

          {/* Home Indicator */}
          <div className="h-[34px] bg-white flex items-start justify-center pt-2">
            <div className="w-[134px] h-[5px] bg-slate-900/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Apple iPad A16 (landscape, desktop only) ─── */
function IpadFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      {/* iPad aluminum body */}
      <div className="relative w-full max-w-[1100px] h-[760px] bg-[#d4d4d8] rounded-[32px] shadow-2xl shadow-black/50 border-[14px] border-[#d4d4d8] overflow-hidden">
        {/* Aluminum sheen */}
        <div className="absolute inset-0 rounded-[18px] ring-1 ring-white/40" />
        <div className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/20 via-transparent to-black/5" />

        {/* Antenna lines */}
        <div className="absolute top-0 left-[40%] w-[20%] h-[2px] bg-[#b0b0b5]" />
        <div className="absolute bottom-0 left-[40%] w-[20%] h-[2px] bg-[#b0b0b5]" />

        {/* Top button (sleep/wake) */}
        <div className="absolute right-[-16px] top-[100px] w-[5px] h-[50px] bg-[#b0b0b5] rounded-r-sm shadow-sm" />
        {/* Volume buttons */}
        <div className="absolute left-[-16px] top-[120px] w-[5px] h-[40px] bg-[#b0b0b5] rounded-l-sm shadow-sm" />
        <div className="absolute left-[-16px] top-[175px] w-[5px] h-[40px] bg-[#b0b0b5] rounded-l-sm shadow-sm" />

        {/* Screen bezel area */}
        <div className="w-full h-full bg-black rounded-[18px] overflow-hidden relative flex flex-col transform">
          {/* Tablet status bar */}
          <div className="h-[36px] bg-black flex items-center justify-between px-5 text-white select-none">
            <span className="text-[12px] font-semibold tracking-wide">9:41</span>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-sky-300">T-Mobile</span>
              <span className="flex items-end gap-[2px] h-3" aria-label="Cellular signal strong">
                <i className="w-[3px] h-[4px] bg-white rounded-sm" /><i className="w-[3px] h-[7px] bg-white rounded-sm" /><i className="w-[3px] h-[10px] bg-white rounded-sm" /><i className="w-[3px] h-[12px] bg-white rounded-sm" />
              </span>
              <span className="text-[10px]">5G</span>
              <span className="flex items-center gap-1"><span>100%</span><span className="w-[20px] h-[10px] border border-white rounded-[3px] p-[1px]"><span className="block h-full w-full bg-emerald-400 rounded-[1px]" /></span></span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">{children}</div>

          {/* Bottom bezel with home indicator */}
          <div className="h-[36px] bg-black flex items-center justify-center">
            <div className="w-[120px] h-[5px] bg-white/50 rounded-full" />
          </div>
        </div>

        {/* iPad branding */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] text-[#999] font-light tracking-widest opacity-60 select-none">
          iPad
        </div>
      </div>
    </div>
  );
}

/* ─── Samsung Galaxy Tab S11 (landscape, desktop only) ─── */
function SamsungTabletFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      {/* Samsung dark metal frame */}
      <div className="relative w-full max-w-[1120px] h-[740px] bg-[#1f1f1f] rounded-[28px] shadow-2xl shadow-black/60 border-[12px] border-[#1f1f1f] overflow-hidden">
        {/* Metal sheen */}
        <div className="absolute inset-0 rounded-[16px] ring-1 ring-white/5" />
        <div className="absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/5 via-transparent to-black/10" />

        {/* Antenna lines */}
        <div className="absolute top-0 left-[35%] w-[30%] h-[1px] bg-[#3a3a3a]" />
        <div className="absolute bottom-0 left-[35%] w-[30%] h-[1px] bg-[#3a3a3a]" />

        {/* Power button */}
        <div className="absolute right-[-14px] top-[160px] w-[4px] h-[55px] bg-[#333] rounded-r-sm shadow-sm" />
        {/* Volume buttons */}
        <div className="absolute left-[-14px] top-[140px] w-[4px] h-[35px] bg-[#333] rounded-l-sm shadow-sm" />
        <div className="absolute left-[-14px] top-[190px] w-[4px] h-[35px] bg-[#333] rounded-l-sm shadow-sm" />

        {/* Screen bezel area */}
        <div className="w-full h-full bg-black rounded-[16px] overflow-hidden relative flex flex-col transform">
          {/* Tablet status bar */}
          <div className="h-[32px] bg-black flex items-center justify-between px-5 text-white select-none">
            <span className="text-[12px] font-semibold tracking-wide">9:41</span>
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span>Verizon</span>
              <span className="flex items-end gap-[2px] h-3" aria-label="Cellular signal strong">
                <i className="w-[3px] h-[4px] bg-white rounded-sm" /><i className="w-[3px] h-[7px] bg-white rounded-sm" /><i className="w-[3px] h-[10px] bg-white rounded-sm" /><i className="w-[3px] h-[12px] bg-white rounded-sm" />
              </span>
              <span>5G</span>
              <span className="flex items-center gap-1"><span>100%</span><span className="w-[20px] h-[10px] border border-white rounded-[3px] p-[1px]"><span className="block h-full w-full bg-emerald-400 rounded-[1px]" /></span></span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">{children}</div>

          {/* Bottom bezel */}
          <div className="h-[32px] bg-black flex items-center justify-center">
            <div className="w-[100px] h-[4px] bg-white/30 rounded-full" />
          </div>
        </div>

        {/* Samsung branding */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[7px] text-[#666] font-medium tracking-[0.2em] opacity-50 select-none">
          SAMSUNG
        </div>
      </div>
    </div>
  );
}

export default function DeviceFrame({ device, children }: DeviceFrameProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // On real mobile devices, render the app directly without any mock hardware frame
    return (
      <div className="min-h-screen w-full bg-[#0a0f1c]">
        {children}
      </div>
    );
  }

  if (device === 'iphone') return <IphoneFrame>{children}</IphoneFrame>;
  if (device === 'ipad') return <IpadFrame>{children}</IpadFrame>;
  return <SamsungTabletFrame>{children}</SamsungTabletFrame>;
}

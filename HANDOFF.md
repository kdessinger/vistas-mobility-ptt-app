# Vistas Mobility PTT Demo — Session Handoff

> **Purpose:** Give a new Hermes session everything it needs to keep working on this project without re-discovering the moving pieces. Read this first, then `AGENTS.md` and `CONTEXT.md` in the project root.

---

## TL;DR

A role-based push-to-talk web demo for school transportation. Three portals (Parent, Driver, Operations), message-based voice over WebSocket, raw PCM audio so Safari/iOS works. Live at **https://ptt-demo.kdessinger.com/**, source on **GitHub at `kdessinger/vistas-mobility-ptt-app`**, Capacitor scaffold ready for native builds.

The session you inherit from built the demo end-to-end, fixed Safari/iOS audio, added synthesized Roger-beep / press-tone / request-alert audio, made the WebSocket auto-reconnect on background, scaffolded the iOS/Android wrapper, published to GitHub, and started a transcript-relay prototype (uncommitted, on disk).

---

## Project layout

```
/root/Kenn/projects/parent-bus-driver-push-to-talk/
├── AGENTS.md                # project safety boundaries — read first
├── CONTEXT.md               # source synthesis, stakeholders, open decisions
├── BUILD_PROMPT.md          # original demo brief (some sections stale; cross-ref PRODUCTION_BUILD_PROMPTS.md)
├── PRODUCTION_BUILD_PROMPTS.md  # current production target architecture
└── ptt-demo/                # actual implementation, git repo, GitHub remote
    ├── README.md
    ├── MOBILE_BUILD.md      # Capacitor / iOS / Android instructions
    ├── capacitor.config.ts  # native shell config (com.vistasmobility.ptt)
    ├── package.json         # Capacitor 6 + native plugins
    ├── client/              # React + Vite + Tailwind + Zustand
    │   └── src/
    │       ├── pages/         # LoginPage, ParentPortal, ParentVerification, DriverPortal, OperationsPortal
    │       ├── components/    # PTTButton, ConnectionBar, AudioVisualizer, Speedometer, BusSensorsBar, DeviceFrame, TranscriptFeed (new)
    │       ├── hooks/         # useWebSocket, useVoiceMessageCapture, useAudioPlayback, useAudioCapture, useSpeechRecognition (new), useWebRTC, useWebRTCAudio
    │       ├── lib/           # audioFeedback (synth tones), audioFallback (PCM→WAV), signaling, platform, native, webrtc
    │       ├── store/         # Zustand store (now includes transcripts[])
    │       └── types/         # speech-recognition.d.ts (new)
    └── server/              # Node + Express + ws, in-memory room
```

---

## Runtime state (verify before changing anything)

| What | Where | Status |
|---|---|---|
| Live demo URL | https://ptt-demo.kdessinger.com/ | `200 OK` (HTTP), `wss://` for signaling |
| Live signaling server | Hermes host, `localhost:3001` | `{"status":"ok"}`, running in background |
| Public tunnel | Mars LXC 111 → Hermes :3001 | working, see `/root/ai-shared/vault/` for tunnel notes |
| Local source | `/root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo` | git clean on `main` |
| GitHub remote | `origin` → `https://github.com/kdessinger/vistas-mobility-ptt-app.git` | committed, up to date |
| Repo visibility | public | name: `vistas-mobility-ptt-app` (renamed from `vistas-mobility-ptt-demo`) |
| Cloudflare Access app | bypass policy installed on the tunnel subdomain | confirmed working |

**Health check command:**
```bash
curl -fsS http://localhost:3001/health && echo OK
curl -fsSL -o /dev/null -w '%{http_code}\n' https://ptt-demo.kdessinger.com/
```

---

## What's working

- **Three portals with realistic device frames:** iPhone for Parent, Samsung tablet for Driver, iPad for Operations. Frames auto-hide when `isNative()` is true (so the real phone fills the screen).
- **Message-based PTT:** press-and-hold to record raw mono PCM via Web Audio API (`ScriptProcessorNode`), release to send as base64 with MIME type `audio/pcm;rate=<sampleRate>;channels=1`. Cross-browser including Safari and iOS.
- **Three synthesized audio cues:**
  - PTT press: descending 880→440 Hz chirp
  - Roger beep: classic two-chirp 1200→800 Hz end-of-transmission
  - Request alert: rising C5→E5→G5 three-note chime (Driver + Operations only)
- **Targeted Driver replies:** press-and-hold a parent on mobile, double-click on desktop. *Everyone* has a purple-dot row. Auto-resets to *Everyone* after **30 seconds** of no reply.
- **Driver motion safety:** motion state disables PTT, queues parent requests silently.
- **Bus sensors:** Yellow lights, Red lights, Door open/closed — synced across portals.
- **Speedometer + location:** canvas gauge with real reference geometry; location cycles every 5 seconds while in motion.
- **Fingerprint verification:** parent login has a hold-to-verify animation before portal entry.
- **Emergency broadcast:** Operations can send a text emergency message to all users.
- **Background recovery:** `visibilitychange` + `pageshow` listeners reconnect the WebSocket and resume the AudioContext when returning from a locked/minimized state on mobile.
- **WAV fallback:** if AudioContext stays suspended, `audioFallback.ts` converts PCM to WAV on the fly and plays through `<audio>` (works even when the context is locked).
- **Capacitor scaffold:** iOS/Android-ready. Web bundle still builds and runs as the demo.

## What's been started but is NOT on `main`

The last session started a **transcript relay prototype** — recording what the driver says via the browser's `SpeechRecognition` API and relaying the text to other roles. It's on disk but **not committed**.

- New files: `client/src/components/TranscriptFeed.tsx`, `client/src/hooks/useSpeechRecognition.ts`, `client/src/types/speech-recognition.d.ts`
- Modified files: `PTTButton.tsx`, `DriverPortal.tsx`, `OperationsPortal.tsx`, `ParentPortal.tsx`, `useStore.ts`, `types.ts`, `useWebSocket.ts`, server `room.ts` / `signaling.ts` / `types.ts`
- Commit message was drafted: `feat: relay prototype PTT transcripts` (commit `9b8ec92` on a working branch; `main` itself ends at `47aee9e` — the Capacitor commit).
- The web build passes; the relay has only been tested with Chrome's SpeechRecognition, not Safari.
- **Decision still open:** whether to ship this in the demo, drop it, or wait for a real transcription backend (Whisper, Deepgram, etc.).

Before continuing, decide:
- land it on `main` (probably as a hidden toggle behind `?transcripts=1`)
- keep iterating
- scrap it

## What is intentionally NOT done

- Real authentication / authorization / tenancy.
- Database persistence (state is in-memory; server restart wipes the room).
- GPS or real motion detection (simulated toggle).
- Native audio session (the PCM-in-browser path doesn't survive a locked iPhone screen).
- App icons, splash screens, code signing, App Store / Play Store submission.
- Push-notification credentials (APNs `.p8` for iOS, FCM service account for Android) — Capacitor config has placeholders only.
- Tests. There are no automated tests in the repo yet.

---

## Architectural decisions worth respecting

1. **PCM, not WebM/Opus.** WebM is the natural Chrome choice but Safari cannot decode it. The wire format is `audio/pcm;rate=<sampleRate>;channels=1` base64. **Do not reintroduce WebM** anywhere — `BUILD_PROMPT.md` and `PRODUCTION_BUILD_PROMPTS.md` both document this. If you need a browser-native fallback, use WAV (built in `audioFallback.ts`).
2. **Message-based PTT, no live call state.** The original brief assumed WebRTC; that was deliberately abandoned. There is no `call-started`/`call-ended` UI in the demo. Do not reintroduce it without an explicit ask.
3. **Press-and-hold = mobile, double-click = desktop.** Single click on a parent row does nothing (prevents accidental tap from changing the reply target).
4. **Device frames on web, fullscreen on native.** `App.tsx` checks `isNative()` and skips the chrome. Don't add another check elsewhere.
5. **Server-authoritative routing.** Driver-targeted replies are validated server-side (`signaling.ts` rejects targets that aren't the parent the Driver was replying to, plus Operations). The client hint is convenience; the server is the security boundary.
6. **No mock data paths in production-shaped code.** The room id is still hardcoded `route-42`. That's demo-only. If you start adding tenants, do it from `PRODUCTION_BUILD_PROMPTS.md` Prompt 1, not by sprinkling config through the React tree.

## Open decisions (per `CONTEXT.md`, still unresolved)

1. District/contractor product vs. parent-facing service vs. platform feature?
2. What counts as a permissible private interaction, and when must everything go through dispatch?
3. Live VoIP vs. async voice messages vs. dispatch callbacks? (Demo chose async messages.)
4. Acceptable in-vehicle hardware and mounting.
5. Parent-to-student-to-route authorization data sources and how custody/access changes propagate.
6. Retention / transcription policy.
7. Special-needs workflows as separate workstream or later integration?
8. First validation market (which district / operator / jurisdiction).

---

## How to keep working

### Local development

```bash
cd /root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo
npm install
npm run dev        # runs client (5173) and server (3001) concurrently
```

### Deploy a code change to the live demo

```bash
cd /root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo
cd client && npm run build && cd ..
cd server && npm run build && cd ..

# Restart the server (the live process is NOT supervised)
old=$(pgrep -f '^node dist/index.js$')
[ -n "$old" ] && kill "$old" && sleep 1
nohup node dist/index.js > server.log 2>&1 &
disown

# Verify
curl -fsS http://localhost:3001/health
curl -fsSL -o /dev/null -w '%{http_code}\n' https://ptt-demo.kdessinger.com/
```

> **Watch out:** Hermes host runs `zellij`. `terminal(background=true)` may print `ENOTTY` but the process still works. For demos that need to stay up across sessions, prefer a systemd unit; for quick iteration, `nohup … & disown` is fine.

### Push to GitHub

```bash
cd /root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo
git add -A
git commit -m "..."
git push
```

The remote is already wired. Token is in `/root/.hermes/.env` as `GITHUB_API_KEY=…`.

### Build a native app

See `MOBILE_BUILD.md`. iOS needs macOS + Xcode + CocoaPods; Android needs Android Studio + SDK + JDK 17. The web build is what gets bundled.

---

## Things to remember that aren't in the repo

- Kenn works **Vistas Mobility** (this project) on the side, and his day job is **Educational Vistas**. Keep the two contexts separate. The auto-injected memory has explicit guidance: *"Kenn's Vistas Mobility work is his second job and should be kept distinct from Educational Vistas materials unless he explicitly asks."*
- Kenn prefers **iterative UI refinement, narrow scope, preserve what he likes**. Do not redesign a screen he already approved unless he asks.
- Naming: **generic UI components by function, not by product**. `Admin Panel`, not `VistasM Admin Panel`. The product itself can be called Vistas Mobility PTT.
- Kenn cares about **demoable progress over architecture-only planning**. If a change can be shown in the live demo, show it.
- His active hours are roughly 7 PM – 2/3 AM ET. Maintenance and backups should run while he sleeps.
- He has granted standing permission for low-risk internal maintenance on the Hermes host, but irreversible / external / public-network / financial / physical actions still need confirmation.
- The Memento project (`/root/Kenn/projects/memento`) and EVI Agent OS (`/root/Kenn/projects/evi-agent-os`) are unrelated to this one. Don't import context between them.

---

## Quick links

- Live demo: https://ptt-demo.kdessinger.com/
- GitHub repo: https://github.com/kdessinger/vistas-mobility-ptt-app
- Project safety/rules: `/root/Kenn/projects/parent-bus-driver-push-to-talk/AGENTS.md`
- Project context: `/root/Kenn/projects/parent-bus-driver-push-to-talk/CONTEXT.md`
- Mobile build instructions: `/root/Kenn/projects/parent-bus-driver-push-to-talk/ptt-demo/MOBILE_BUILD.md`
- Production target architecture: `/root/Kenn/projects/parent-bus-driver-push-to-talk/PRODUCTION_BUILD_PROMPTS.md`
- Homelab topology (for tunnel / DNS questions): see `/root/AGENTS.md` + `/root/CONTEXT.md`

---

**Last updated:** end of session that built Capacitor scaffold, published to GitHub, and started transcript relay prototype. Server live, repo clean on `main`, uncommitted transcript work in working tree.

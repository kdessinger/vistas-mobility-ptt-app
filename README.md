# Vistas Mobility Push-to-Talk Demo

A role-based push-to-talk web application for school transportation. Three distinct portals — **Parent**, **Driver**, and **Operations** — communicate over WebSocket with synthesized audio feedback, real-time state sync, and a safety-first design.

**Live demo:** https://ptt-demo.kdessinger.com/

**Mobile app:** Capacitor scaffold included — see [MOBILE_BUILD.md](MOBILE_BUILD.md) for the iOS/Android build instructions.

---

## Quick Start

```bash
cd ptt-demo
npm install          # installs root + client + server dependencies
npm run build        # builds client (dist/) and server (dist/)
npm start            # starts the server on port 3001
```

Then open `https://localhost:3001/` in your browser and choose a role.

For local development with hot reload:
```bash
cd client && npm run dev   # Vite dev server on :5173
cd server && npm run dev   # ts-node-dev on :3001
```

---

## What It Demonstrates

| Feature | Description |
|---------|-------------|
| **Message-based PTT** | Press and hold to record a voice message; release to send. No live call state, no active-call timer. |
| **Role-based portals** | Parent (phone), Driver (tablet), Operations (tablet) — each with a purpose-built UI. |
| **Parent authorization** | Parents request to speak; Driver or Operations must approve before the parent can transmit. |
| **Fingerprint verification** | Parent login includes a hold-to-verify fingerprint animation for demo realism. |
| **Targeted replies** | Driver replies default to the last parent who spoke. Press-and-hold (mobile) or double-click (desktop) a parent/Dispatch row to target. Broadcast to Everyone with the purple-dot row. |
| **Auto-reset to Everyone** | If the driver doesn't reply within 30 seconds, the target resets to Everyone. |
| **Driver motion safety** | Motion state disables PTT and queues incoming parent requests silently. |
| **Bus sensors** | Driver can toggle Yellow lights, Red lights, and Door open/closed — synced to all portals. |
| **Speedometer & location** | Animated canvas speedometer and live route location, synced to Parent portal. |
| **Roger beep** | Classic end-of-transmission chirp on every PTT release. |
| **Request alert** | Rising three-note chime in Driver and Operations portals when a new speak request arrives. |
| **Emergency broadcast** | Operations can send a text emergency message to all connected users. |
| **Cross-browser audio** | Raw PCM capture via Web Audio API — works on Chrome, Firefox, Edge, Safari, and iOS. |
| **Background recovery** | WebSocket reconnects and AudioContext resumes automatically when returning from a locked/minimized state on mobile. |
| **Prototype transcript relay** | Where the browser exposes Web Speech Recognition, a sender can see a live transcript while holding PTT and recipients can receive the completed text with the audio. Availability and accuracy are browser-dependent; it is not production transcription. |
| **Device frames** | Realistic phone/tablet skins for demo presentation (iPhone, Samsung tablet, iPad). |

---

## Architecture

```
├── client/              # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── pages/         # LoginPage, ParentPortal, ParentVerification, DriverPortal, OperationsPortal
│   │   ├── components/    # PTTButton, ConnectionBar, AudioVisualizer, Speedometer, BusSensorsBar, DeviceFrame
│   │   ├── hooks/         # useWebSocket, useVoiceMessageCapture, useAudioPlayback, useAudioCapture
│   │   ├── lib/           # audioFeedback.ts (synthesized tones), audioFallback.ts (PCM→WAV), signaling.ts
│   │   ├── store/         # Zustand store for room state, requests, audit events
│   │   └── types.ts       # Shared TypeScript interfaces
│   └── index.html
└── server/              # Node.js + Express + ws (WebSocket)
    ├── src/
    │   ├── index.ts       # HTTP server + static file serving
    │   ├── signaling.ts   # WebSocket message handlers
    │   ├── room.ts        # In-memory room state
    │   └── types.ts       # Server-side types
    └── package.json
```

**Voice transport:** Web Audio API `ScriptProcessorNode` captures raw mono PCM (`Int16Array`), sends it as base64 over WebSocket with MIME type `audio/pcm;rate=<sampleRate>;channels=1`, and receivers reconstruct it directly into an `AudioBuffer`. This avoids WebM/Opus compatibility issues on Safari and iOS.

---

## Demo Walkthrough

1. Open https://ptt-demo.kdessinger.com/ in three browser windows:
   - **Driver** — Samsung tablet in landscape
   - **Parent** — iPhone in portrait
   - **Operations** — iPad in landscape

2. **Parent** taps *Request to Speak*, picks a reason, and submits.

3. **Driver** (and **Operations**) hears the request alert chime. The request appears in the queue.

4. **Driver** taps *Approve*. The **Parent** is now authorized to speak.

5. **Parent** presses and holds the speak button, talks, and releases. The **Driver** hears the voice message and the **Parent** hears the Roger beep.

6. **Driver** can reply by pressing the big PTT button — the reply targets that parent automatically (plus Operations). After 30 seconds of no reply, the target resets to *Everyone*.

7. **Operations** can send an emergency broadcast text message to all users at any time, or use the Operations PTT button to voice-broadcast to everyone.

8. Toggle **Motion** on the Driver portal — PTT disables, requests queue silently, and the speedometer animates. Toggle it off to resume normal operation.

---

## Deployment

The public demo runs behind a Cloudflare Tunnel on the Mars server (`10.20.30.4`). The server serves the built client (`client/dist/`) as static files and handles WebSocket connections on the same port.

To deploy your own instance:
1. Build the client: `cd client && npm run build`
2. Build the server: `cd server && npm run build`
3. Start the server: `cd server && npm start`
4. Expose port 3001 via your preferred tunnel or reverse proxy.

---

## Safety & Privacy Notes

- This is a **functional prototype**, not a production system.
- No real authentication, no database persistence, no GPS tracking.
- All state is in-memory; a server restart clears everything.
- Voice data is transient — PCM chunks are relayed and immediately discarded. The prototype may also relay browser-generated transcript text to connected Driver/Operations views; neither audio nor transcript is persisted by this demo server.
- Browser speech recognition availability, processing location, and accuracy vary by browser and platform. It must not be treated as a production transcription, retention, accessibility, or privacy implementation.
- Do not use this for actual student transportation without legal, privacy, and operational review.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Icons | Lucide React |
| Server | Node.js + Express + `ws` |
| Audio | Web Audio API (raw PCM) |
| Visualization | HTML5 Canvas (speedometer) |

---

## Project Context

Built for a Jason Wang consulting demo. See `AGENTS.md` and `CONTEXT.md` in the parent directory for product scope, safety boundaries, and open decisions.

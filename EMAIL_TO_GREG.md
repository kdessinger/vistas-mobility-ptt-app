**To:** Greg Thums
**Subject:** DNS + Port Forward Request — PTT Demo App
**From:** Kenn Dessinger

---

Hey Greg,

Quick request for a temporary demo setup — not production, just for a Sunday night demo with Jason Wang.

**What I need:**
One public subdomain pointing to a single port on the Hermes server (10.20.30.21). The app handles role selection internally (driver vs parent vs ops), so we only need **one URL**, not separate ones per role.

**Suggested setup:**
- **DNS:** `ptt-demo.vistasmobile.com` → reverse proxy → `10.20.30.21:3001`
- **Protocol:** HTTPS preferred (the app needs `getUserMedia` which browsers block on insecure origins except localhost)
- **Duration:** Temporary — can be torn down after Sunday if needed

**What runs on port 3001:**
A Node.js Express server that serves:
1. Static React client files (the web UI)
2. WebSocket endpoint for real-time signaling

Both come from the same port, so the client and server talk to each other automatically — no CORS issues, no separate ports needed.

**Why HTTPS matters:**
Browsers require HTTPS for microphone access (WebRTC voice). If we can only do HTTP, I can work around it by running everything locally and sharing my screen via Teams — but HTTPS would let Jason actually join the demo from his own machine.

**Alternative if full HTTPS subdomain is a hassle:**
Just skip the public DNS for now. I'll run it locally and screen-share via Teams. This is Plan B and honestly fine for the Sunday demo.

Let me know what you can do. If it’s more than 10 minutes of your time, we’ll just go with local + screen share.

Thanks,
Kenn

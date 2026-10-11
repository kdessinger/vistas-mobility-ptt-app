# Vistas Mobility PTT — Android build

## Current download: **[Vistas Mobility PTT 0.1.7](vistas-ptt-0.1.7.apk)**

- versionCode **8**, versionName **0.1.7**; title derives from the package version.
- Package `com.vistasmobility.ptt.preview` · Android 14+ · debug-signed for testing.
- Size **2,818,398 bytes**.
- SHA-256 `8751de52b4fb265e7c8afcb02a99920d56bbc464ffe3a04dcd065e039c6c7f1e`.

## Changes in 0.1.7

- **Inbound audio no longer replays retained history as if it were new.** The handset
  reset its inbox cursor to 0 on every sign-in, so the district's retained backlog was
  re-fetched and voiced on arrival. A new pure `Baseline` classifier captures the
  authenticated context's `inboxCursor` **once** at sign-in (canonical decimal string,
  compared as `BigInteger`, never a float) and treats a clip as live only when its cursor
  is **strictly past** that boundary; a message at or below the boundary is neither
  downloaded, queued nor allowed to chirp. A missing or malformed baseline is
  conservative — nothing autoplays until the inbox confirms a boundary — and the user is
  told honestly rather than having old audio replayed.
- **The inbox is never read before the history boundary.** A new pure `InboxGate` keeps
  the whole first page unread until the authenticated context yields a valid
  `inboxCursor`; the cursor does not advance, nothing is marked seen, the cycle retries
  `/context` (401 still ends the session) and shows an explicit connecting status. This
  closes the case where a page's own `nextCursor` was taken as the boundary, moving it
  past live arrivals that were then never seen again.
- **The recording/transcription notice is now always visible and server-authored.** The
  old expandable details claimed *"Audio stays in memory only and is never written to a
  file"*, which was false after durable retention (the district's own audio window,
  default 30 days). The notice is now authored from the authenticated context
  (`audio.retentionSeconds` and `transcription.{enabled,notice}`) via the pure,
  JVM-tested `Disclosure` mapping. A field the server did not send renders as **UNKNOWN**,
  never as "no recordings", and a transcription opt-out is never rendered as on.
- **The push-to-talk mic is centred.** The mic was a TOP compound drawable on an
  empty-text `Button`, so the 48 dp glyph sat at the top of the 144 dp circle. It is now a
  single `ImageButton` (`ScaleType.CENTER`) drawing one centred mic; alpha/recording/
  blocked states and hold semantics are unchanged.
- Retains 0.1.6: the guardian's **Send a request to dispatch** control (closed kind set,
  optional note up to 280 characters, idempotent client-generated request id), the
  driver's **availability status** (Available / Busy / Standby / Offline) and **Share
  current location** controls, the PTT button attachment, contextual Cancel, the
  tablet-confirmed session-cookie fix, and the foreground/focus safeguards.

Verification: fourteen JVM programs pass under `apps/android-ptt/test-jvm.sh`, including
the new `BaselineTest` (30 assertions) and `InboxGateTest` (37 assertions) that drive the
real classifiers and the poll live-selection gate for equal/older/new cursors, values
beyond 2^53, and malformed/missing baselines; `DisclosureTest` for the notice mapping;
and `MainActivityWiringTest`/`ClientCallbacksTest` (37 assertions) pinning the sign-in
baseline capture, the poll gate, the session reset, the PTT attachment, the `ImageButton`
mic centring and the idle Cancel wiring. The APK builds (versionCode 8 / 0.1.7) and
`aapt dump badging` confirms the package/version. These tests are not device-rendering
proof; the handset still needs tablet confirmation.

## Installation and sign-in

Install over the existing app and confirm **Vistas Mobility PTT · 0.1.7**.
Server origin: `https://ptt.kdessinger.com` (pre-filled).
A valid login does not grant a channel: the account must have an active assignment.
An expired channel is excluded; this build does not renew or bypass its access window.
Recording/playback remain foreground-only and stop on focus loss.

This is a development build, not evidence of production readiness or safety certification.
Older artifacts may remain in history; use the current version-labelled link above.

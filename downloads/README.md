# Vistas Mobility PTT — Android build

## Current download: **[Vistas Mobility PTT 0.1.11](https://raw.githubusercontent.com/kdessinger/vistas-mobility-ptt-app/main/downloads/vistas-ptt-0.1.11.apk)**

### Current build — 0.1.11

- versionCode **12**, versionName **0.1.11**; Android **14+**, debug-signed testing build; package `com.vistasmobility.ptt.preview`.
- Size **2,957,077 bytes**; SHA-256 `2c4e60b4931ed1ec62c5f36c03c2e02ff7d226595c149ade06ba9086ee77c250`.
- Same signing-certificate SHA-256 as the exact public 0.1.10 APK: `5a68b1bc38dd832fbade54b396dc843095a1035669f22b5df36dd94a84f3fa85`. Package, signer and increased versionCode meet update prerequisites; actual installation remains unverified.
- Simpler navigation: centered sign-in → assigned bus list → selected bus Talk screen with a dominant microphone and Messages. Avatar and overflow Options open the same list/detail settings. Only authorized current assignments are listed; an empty list can mean an expired assignment, not a broken APK.
- Original silent 3D radio entrance after sign-in: turn, zoom, then native bus list. Native Skip, reduced-motion bypass, a six-second fallback and lifecycle/renderer cleanup. Permission dialogs or focus loss may skip it; it is not a guaranteed animation on every login. The entrance preview invents no bus rows.
- Functional per-account/device Appearance (System/Light/Dark, bounded text size), PTT buttons (HOLD default or opt-in tap-to-toggle), message cues, automatic voice playback, Silence and one receiving window. Recording has an explicit countdown/Cancel and the same 30-second cap. Cues and automatic playback are independent; quiet settings never delete shared messages or replay a queued backlog on resume. Foreground automatic playback retains its existing ON default.
- Audio capture/format and transport are unchanged. Recording and playback remain foreground-only, with existing session, focus and driver-policy checks. Background receiving, boot recovery, Bluetooth/accessory-button operation and VOX are **not implemented or promised**; Audio and Behavior pages state their limits.
- Profile screen-name editing requires the server `/v1/profile` feature and migration; this release does **not** deploy that backend. An unavailable server reports failure rather than claiming a local save. Login username and authority remain unchanged.
- Preserves current-sign-in message history, manual Listen/Re-listen, personal dismissal, authorized inline transcripts and approximate assigned-bus location. Audio/transcript retention and location consent remain server-governed.
- Verification: parent and independent spec/quality review, **25 Java harness programs plus 4 extracted-callback programs**, all exit 0; real Chromium radio-asset scenarios A–J pass; offline APK assembly, embedded version/resources, signature and bounded embedded-secret/private-address scans pass. These checks do **not** establish actual Android WebView rendering, physical audio, installation, or production/Play Store readiness.

**Device check:** update over the existing app (do not uninstall first), confirm **0.1.11**, sign in, check assigned buses and the large Talk control; test HOLD and TOGGLE/Cancel, no old-message autoplay, repeated manual replay, and one audible message each way with dispatch. Check Silence/cues separately. Background/locked-screen delivery is not part of this build. No service deployment or assignment renewal is included.

### Historical build — 0.1.10

- versionCode **11**, versionName **0.1.10**; Android **14+**, debug-signed testing build; package unchanged.
- Size **2,855,917 bytes**; SHA-256 `d7ed4da7af3b2cde0d5a9d8229bbf66614bb14a7ab87583c6bab0cff6d22363d`.
- Parents and drivers now see only messages arriving after the current sign-in baseline. Older retained recordings are not displayed, downloaded, or transcribed by that session. Restore cannot reveal older sessions. Dispatch retains its authorized history. No shared recordings or transcripts are deleted.
- Clearer dispatch text-request composer: labeled request type, visible optional 280-character note, selected-channel destination, and local sending/received-pending-review/refused/uncertain feedback. Duplicate taps are blocked while submitting; failed drafts are preserved and channel changes cannot misattribute a result.
- Includes 0.1.9 approximate parent bus-location pill. Native audio settings remain unchanged. This is not the larger Zello-inspired layout redesign.
- JVM suite and APK assembly passed; spec and independent quality review approved. Signer matches preceding published builds and versionCode increased. Actual installation and device rendering remain unverified for 0.1.10.

Update in place and confirm **0.1.10**. Check that a new parent/driver sign-in has no old message pills, then receive and replay a new message. Submit a short text request and verify its pending status with dispatch. No production/Play Store readiness claim.

### Historical build — 0.1.9

- versionCode **10**, versionName **0.1.9**, package `com.vistasmobility.ptt.preview`; Android **14+**, debug-signed testing build.
- Size **2,851,705 bytes**; SHA-256 `1c3afb0ad9c8f3c3da12cce2b6c74d0b5de9f27ba53afb4f1b1b0504b50bc397`.
- Signing certificate matches public 0.1.8 and 0.1.7; increased versionCode establishes upgrade compatibility, not successful device installation.
- Includes the reviewed dark/teal UI and 0.1.8 message-history controls below.
- Adds the parent-only approximate assigned-bus location pill for the selected authorized channel. Honest current/unknown/unavailable/off states; no street names, child-on-board claims, precise fleet tracking, or location history.
- Freshness uses server age plus monotonic elapsed time, including during network failures. Missing timing or accuracy metadata fails closed; stale/non-current views clear coordinates. Display is limited to at most two decimal places.
- Location remains independent of PTT. Native audio capture/playback settings are unchanged.
- Verification: JVM suite exit 0, including BusLocationTest 66 assertions; spec PASS and independent quality APPROVED; APK assembly/version/signature verified. No connected Android device was available for installation or rendering. No production/Play Store readiness claim.

After updating in place: confirm **Vistas Mobility PTT · 0.1.9**; verify old messages stay silent at login, Listen/Re-listen works, dismissal survives re-login, the parent location pill has honest state, and audible messages work in both directions with dispatch. Do not uninstall as the first troubleshooting step.

### Historical build — 0.1.8

- versionCode **9**, versionName **0.1.8**, package `com.vistasmobility.ptt.preview`; Android **14+**, debug-signed testing build.
- Size **2,992,985 bytes**; SHA-256 `cab8fdf2454ded2ff23537424b3d7694dea99f889ce29944dadb8ea8d33f3f09`.
- Signing certificate matches public 0.1.7; install over the existing app and confirm **Vistas Mobility PTT · 0.1.8**. Actual installation remains a device-verification gate; do not uninstall as the first troubleshooting step.
- Reviewed dark/teal role UI, compact visible privacy notice with expandable details, centered microphone in a 176dp control.
- New newest-first message-history pills: sender role/time/duration, manual Listen/Re-listen, inline authorized transcripts, personal Dismiss/Clear played/Restore persisted per account and tenant. Dismissal never deletes shared audio or transcripts.
- Retained history does not automatically play at sign-in. Transcript retries distinguish actual absence from temporary transport errors and preserve separate retention windows.
- Native capture settings, cookies/CSRF, biometric and foreground/focus/driver-policy safeguards preserved.
- Verification: 17 JVM harness programs passed (HistoryTest 69 assertions), APK assembly and signature/version checks passed, spec and independent quality review approved. These do not establish physical rendering, installation, or audible rehearsal.
- **Not yet included:** parent approximate assigned-bus location pill. No production/Play Store readiness claim.

After install: confirm 0.1.8, no old-message autoplay at login, repeated manual replay, a dismissal survives sign-out/sign-in, and audible communication both ways with dispatch.

## Historical 0.1.7 build notes (superseded download/version below)

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

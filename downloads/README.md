# Vistas Mobility PTT — Android build

## Current download: **[Vistas Mobility PTT 0.1.16](https://raw.githubusercontent.com/kdessinger/vistas-mobility-ptt-app/main/downloads/vistas-ptt-0.1.16.apk)**

### Current build — 0.1.16: null-label and driver-banner repairs

- versionCode **17**, versionName **0.1.16**; Android **14+**; same package `com.vistasmobility.ptt.preview` and same debug signing identity as 0.1.15.
- Size **2,964,469 bytes**; SHA-256 `9c7366e71fca0dac3f1e22493eabd73bed750866bd598f8cb139abbfd90e7657`.
- **Literal "null" channel labels fixed.** Android's `org.json` is not the reference json.org library: `JSONObject.NULL.toString()` returns the string `"null"`, so a server-sent `"name":null` labelled an unnamed room the literal text `null` (and the tenant-fallback made two unnamed rooms identical). Optional name/id are now read only when the key is present, non-null and an actual String; a non-string is treated as absent and a legitimately supplied literal `"null"` is preserved. The hub refresh signature now includes display labels so a same-id rename actually refreshes.
- **Driver `409 driver_state_unknown` is a policy block, not a lost connection.** A driver whose stationary grant lapsed got a repeated false "Connection lost" banner every poll. It is now classified narrowly (status exactly 409 AND server errorCode exactly `driver_state_unknown`, and only when the same poll already confirmed a fresh context) and routed to a handler that preserves the fresh context, stays fail-closed (playback admission cleared, capture cancelled, queue dropped), leaves the inbox cursor unchanged, never replays, and shows the stable **"Connected · driver action blocked"** state. A generic 409, a context-request failure, a real I/O error or a 503 still reads as a lost connection; 401 still ends the session.
- **Client release only. No audio, network, authentication, 120-second-cap, radio-entrance or history change.** Owner has already confirmed audible send/receive over all his tested devices on 0.1.14; that human acceptance is unchanged and the accepted audio transport is protected by this pass.
- **The driver path still requires a separate synthetic stationary admission.** This repair only classifies a server policy block honestly; it does **not** make a driver usable and **no claim is made that the driver path works**. A driver whose stationary grant has lapsed stays blocked.
- **This is a client release only. It does NOT change the backend or any account.** No migration, service restart, channel assignment, membership, stationary grant or credential change is part of this build; installing it will not make an expired channel reappear. The rehearsal backend is separately migrated to 027/028/029, but the **assigned room remains expired / authorization-blocked** — there is **no usable connected channel right now**, and this APK cannot repair an expired assignment.
- Source: `7fdd385` (fix literal "null" channel labels, faithful Android JSON) + `512870d` (driver inbox 409 `driver_state_unknown` as a policy block, not a lost connection); SPEC PASS and independent QUALITY APPROVED for each. No feature code was changed by this packaging commit.
- Verification for this package: canonical Android JVM harness **exit 0** (includes `ChannelLabelAndroidJsonTest` — 16 assertions on the real channel-label/render wiring against a faithful Android `org.json` double, and the real poller driving a driver inbox 409 block vs generic 409 / context failure / real network loss); offline `assembleDebug` exit 0 with `compileDebugJavaWithJavac` compiling the actual `MainActivity.java`; embedded version/package/sdk/signer and a bounded dex secret/credential/private-address scan verified. **No connected device/emulator:** installation, native layout/WebView behaviour, and audible PTT on real hardware remain unverified. These checks do not prove device behaviour.
- **No STT speed fix, no new navigation, no People/Echo/AI, no GPS, no background delivery.** The theme is **unchanged**. Known pre-existing: the name hub may still show a cached label until the next sign-in. Residuals not addressed: a slow ~20 s HTTP deadline and a 30 s STT timeout remain; first-load Android transcript fan-out may delay polling.

### Historical build — 0.1.15: recorded-PTT surface polish (compact bus notice, landscape sizing, truthful channel labels) (superseded by 0.1.16; stable fallback)

- versionCode **16**, versionName **0.1.15**; Android **14+**; same package `com.vistasmobility.ptt.preview` and same debug signing identity as 0.1.14.
- Size **2,963,545 bytes**; SHA-256 `2893752f00ae2285d7461c950e7a22231719310c2112404a326855e5a78ec526`.
- **Truthful channel labels:** the server sends the real room `name` (null when unnamed) plus a `label` that falls back to the shared TENANT name; rendering that label printed the same text for two unnamed rooms. Every surface (TALK header, hub list, request destination) now uses one `Surface.channelLabel` helper that shows an explicit **"Unnamed channel · <short id>"** per channel. No bus name is invented and nothing is written back. With **no group selected** the label is honestly **empty** — the TALK header never invents a name and the request destination reads "choose your assigned channel above".
- **Live in-place rename:** a name change with unchanged membership ids updates the group spinner **in place** (no `setAdapter`/re-selection), so an ordinary poll never resets selection and cancels a recording mid-capture; a same-id re-selection is a no-op. A genuine new-id switch still cancels capture and clears the bus notice.
- **Compact bus notice:** the always-visible line is the new pure `BusLocation.summary`; the full policy paragraph is one tap away (`toggleBusDetails`). The former standalone full-width 48 dp Details button is replaced by ONE inline ≥48 dp title+Details row that is itself the accessible tap target. `clearBusLocation()` now also collapses an expanded policy, so a channel change and every reset path clear it.
- **Landscape talk sizing:** `Layout.pttCircleDp` uses a landscape chrome budget (`CHROME_DP_LANDSCAPE=320`) so the mic circle is sized from the real available height instead of becoming a fixed-minimum circle that clips the notice in short landscape (the 943×556 case); portrait keeps the dominant width-bound circle. Both budgets are **estimates**, confirmed only by a device screenshot.
- **Presentation only. No audio, network, authentication, 120-second-cap, radio-entrance or history change.** Owner has already confirmed audible send/receive over all his tested devices on 0.1.14; that human acceptance is unchanged and the accepted audio transport is protected by this pass.
- **This is a client release only. It does NOT change the backend or any account.** No migration, service restart, channel assignment, membership, stationary grant or credential change is part of this build; installing it will not make an expired channel reappear. The rehearsal backend is separately migrated to 027/028/029, but the **assigned room remains expired / authorization-blocked** — there is **no usable connected channel right now**, and this APK cannot repair an expired assignment.
- Source: `00b301e` (compact bus location + landscape talk sizing + truthful channel labels) + `f3ce06d` (repair polish spec gaps + behavioural caller regressions); SPEC PASS and independent QUALITY APPROVED for each. No feature code was changed by this packaging commit.
- Verification for this package: canonical Android JVM harness **36 programs** exit 0 (includes the new `SelectionCallbacksTest` — 29 assertions on the real render/selection/channel-label/clear wiring); communications-web **108** tests pass; operations-web **33** tests pass; offline `assembleDebug` exit 0; embedded version/package/sdk/signer and a bounded dex secret/credential/private-address scan verified. **No connected device/emulator:** installation, native layout/WebView behaviour, and the landscape sizing on real hardware remain unverified. These checks do not prove device behaviour.
- **No STT speed fix, no new navigation, no People/Echo/AI, no GPS, no background delivery.** The theme is **unchanged**. Known pre-existing: the name hub may still show a cached label until the next sign-in. Residuals not addressed: a slow ~20 s HTTP deadline and a 30 s STT timeout remain; first-load Android transcript fan-out may delay polling.

### Historical build — 0.1.14: 120-second recording cap, count-up timer, sign-in status cleanup (superseded by 0.1.15; stable fallback)

- versionCode **15**, versionName **0.1.14**; Android **14+**; same package `com.vistasmobility.ptt.preview` and same debug signing identity as 0.1.13.
- Size **2,960,865 bytes**; SHA-256 `98f0070f2ef1ae83b66cb9cb7320e4ac16aa8362a1df701c921405a1cb63acf0`.
- **The recording cap is a fixed 120-second maximum** (replacing the 30-second cap), coordinated with the server/schema/web widening in `1bc1f64`. This is a fixed maximum, **not** a user-facing configuration setting.
- **Visible count-up recording timer**: an `mm:ss` elapsed clock that starts from the actual successful capture (the press/permission/policy delay is not counted), is monotonic and non-negative, and stops on release/send, Cancel, cap, focus loss, and sign-out. The superseded "Ns left of 30" countdown wording is gone.
- **Sign-in status cleanup**: the repeated signed-in microphone tutorial line is removed and stale pre-login status is cleared on a successful login. Permission-denial/action-needed messages and the honest connection caveat are preserved.
- **This is a client release only. It does NOT change the backend or any account.** No migration, service restart, channel assignment, membership, stationary grant or credential change is part of this build; installing it will not make an expired channel reappear. The rehearsal backend has separately been migrated to 027/028/029 and reloaded, but the **assigned room remains expired / authorization-blocked** — there is **no usable connected channel right now**, and this APK cannot repair an expired assignment.
- **Asymmetric compatibility:** old APKs (0.1.13 and earlier) cannot decode an incoming clip longer than 30 s. Participants must upgrade to 0.1.14 before long clips are exchanged; short clips remain mutually accepted.
- Source: `1bc1f64` (coordinated 120 s cap, Android bounds), `92f8d03` (count-up timer), `5326dc6` (sign-in status cleanup); SPEC PASS and independent QUALITY APPROVED for each. No feature code was changed by that packaging commit.
- Verification for that package: canonical Android JVM harness **35 programs** exit 0 (includes `DurationCapBoundsTest` and `RecordingTimerTest`); communications-web **96** tests pass; operations-web **27** tests pass; offline `assembleDebug` exit 0; embedded version/package/sdk/signer and a bounded dex secret/credential/private-address scan verified. **No connected device/emulator:** installation, native layout/WebView behaviour, audible PTT, and the 120 s cap on real hardware remain unverified. These checks do not prove device behaviour.
- No new configuration setting, new navigation, People/Echo/AI, GPS, or background delivery was implemented. The theme is **unchanged**. Residuals not addressed: a slow ~20 s HTTP deadline and a 30 s STT timeout remain; first-load Android transcript fan-out may delay polling.

### Historical build — 0.1.13: client-side persistent-channel and retained-history compatibility (superseded by 0.1.14)

- versionCode **14**, versionName **0.1.13**; Android **14+**; same package `com.vistasmobility.ptt.preview` and same debug signing identity as 0.1.12.
- Size **2,959,401 bytes**; SHA-256 `a3b0124bea7307c5f61da7bb9baf6cc0bb8979c6ca3edeb5b7b8722b6ae07839`.
- **This is a client-compatibility release only. It does NOT activate anything on the server.** The platform API is **not migrated or restarted**, and **no connected channels are usable right now** as a result of this build. Existing synthetic rooms remain **expired** until an explicit, supported admin update is performed; this APK does not renew assignments or stationary grants, and installing it will not make an expired channel reappear.
- Client understands an explicitly **persistent** channel: an explicit JSON `null` channel `effectiveUntil` now means "no scheduled end" instead of being treated as expired. Missing or malformed expiry still **fails closed** in every client, so an absent or malformed value is never read as persistent.
- Retained, server-authorized history is now shown **across sign-ins** for parent and driver, consistent with a persistent chat room, while the immutable authenticated **LIVE** cursor boundary is preserved: retained rows never autoplay, cue, or download at login, reconnect, or Restore. Per-account + tenant dismissals and current membership/recipient authorization still govern what is shown.
- Persistent channel lifetime is **not** permanent driver stationary admission or temporary dispatch coverage permission. A long-lived channel does not mean a driver remains admitted; the driver safe-state/stationary grant is separate and still expires.
- Source: increments `ceb664d` (explicit persistent channel lifetime) + `6283f33` (explicit null `effectiveUntil` is persistent) and `2c51248` (retained history across sign-ins, no backlog autoplay); SPEC PASS and independent QUALITY APPROVED for both increments. No feature code was changed by this packaging commit.
- Verification for this package: canonical Android JVM harness **32 programs** exit 0 (includes the new `PersistentLifetimeTest` and `HistoryPollCallbacksTest` against the real extracted render/drain/poll wiring); communications-web **95** tests pass; operations-web **27** tests pass; offline `assembleDebug` exit 0; embedded version/package/sdk/signer and a bounded dex secret/credential/private-address scan verified. **No connected device/emulator:** installation, native layout/WebView behavior, and audible PTT remain unverified. These checks do not prove device behaviour.
- Recording cap remains **30 seconds** in this release; the approved **120-second default** is a separate pending coordinated client/server change. The theme is **unchanged** (light-mode contrast repair is separate pending work). **No background delivery is implemented.**
- Known quality residuals (not addressed here; do not mistake for fixed): on first load the Android transcript fan-out may delay polling; pre-existing web caches may still hold retained audio; manual-only "download on demand" is **not** true for the web client. Feature code was not touched to solve these.

### Historical build — 0.1.12: launch-crash repair (superseded by 0.1.13)

- versionCode **13**, versionName **0.1.12**; Android **14+**, same package and debug signing identity as 0.1.11.
- Size **2,957,005 bytes**; SHA-256 `3d8309efd485ff77a9c8a15411453143c1448fa3c4c6739fd7e792d446455099`.
- Fixes a reproduced startup exception: settings buttons were attached twice to their parent. The same duplicate-attachment defect was removed from category detail buttons and bus-list rows. Buttons and their action handlers remain attached once.
- Parent spec PASS and independent quality APPROVED for `bec7d76`. The new regression executes actual settings builders against single-parent-enforcing doubles; old source fails and repaired source passes. Independent review also reproduced/fixed the bus-list path in a scratch probe. Full JVM harness and offline APK build exit 0; embedded version/package/signature verified against the exact downloaded 0.1.11 baseline.
- **No device launch or logcat verification is available.** This fixes the reproduced source defect but is not proof that every device startup failure is resolved. First acceptance check: install this APK and confirm the sign-in screen opens. Do not uninstall again as a troubleshooting step.
- Recording cap remains **30 seconds** in this crash-only release. The approved **120-second default** is a separate pending coordinated client/server change. No backend deployment, assignment renewal, or new feature was mixed into this repair.
- Retains the reviewed radio/settings features documented below; foreground-only communications, debug-build and production-readiness limits still apply.

### Failed device build — 0.1.11 (superseded; do not use)

Kenn reported an immediate launch crash, including after clean reinstall. Its published bytes remain preserved as the regression baseline; prior JVM/build review did not catch the Android view-parent violation. The historical feature notes below do not imply a working on-device release.

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

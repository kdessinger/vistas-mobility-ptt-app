# Building Native Mobile Apps

The client is a standard Vite/React/TypeScript SPA, so it can be wrapped in a native shell using [Capacitor](https://capacitorjs.com) without rewriting any UI code. The web build at `client/dist/` is what gets bundled into the iOS and Android apps.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 20+ | Already installed for the web build |
| Xcode | 15+ | Required for iOS builds (macOS only) |
| Android Studio | Hedgehog (2023.1) or newer | Required for Android builds |
| CocoaPods | latest | Installed via `sudo gem install cocoapods` |
| Java JDK | 17 | Required by Capacitor's Android tooling |

## First-time setup

```bash
cd ptt-demo
npm install
npm run build           # builds the web bundle that Capacitor will wrap
```

### Add the iOS project (macOS only)

```bash
npm run add:ios
cd ios && pod install && cd ..
npm run sync            # copies the latest web build into the iOS project
npm run ios:open        # opens Xcode
```

In Xcode:
1. Select the `App` target → **Signing & Capabilities**
2. Choose your Apple Developer team
3. Set a unique **Bundle Identifier** (e.g. `com.vistasmobility.ptt`)
4. Plug in an iPhone and press Run

### Add the Android project

```bash
npm run add:android
npm run sync
npm run android:open    # opens Android Studio
```

In Android Studio:
1. Open **File → Project Structure → SDK Location** and point it at your Android SDK
2. Plug in a phone with USB debugging enabled
3. Press Run

## How it works

The native shell is just a thin wrapper:

- `capacitor.config.ts` declares the app id, display name, and which built web assets to bundle.
- `client/src/lib/platform.ts` exposes `isNative()` and `platform()` so the React app can detect when it's running inside the shell (no Capacitor import is required on the web — it's a runtime check against `window.Capacitor`).
- `client/src/lib/native.ts` wraps every Capacitor plugin call behind a web fallback so the same code path runs in both environments.
- `client/src/App.tsx` skips the device-frame chrome when `isNative()` is true (real phones don't need fake iPhone shells).
- `client/src/hooks/useWebSocket.ts` points at `wss://ptt-demo.kdessinger.com` when running natively — the device loads the app from `https://localhost` via Capacitor's scheme and cannot reach the local signaling server.

## What's already wired up

- **Status bar** — dark theme, `#0a0f1c` background (matches the app shell)
- **Push notifications** — request permission flow, subscribe helper, listener
- **Haptics** — `hapticImpact()` helper for PTT press/release
- **WebSocket URL** — auto-routes to the live demo when inside the native shell

## What still needs work for production

These are intentionally left out of the scaffold so the demo stays web-first. Add them before shipping to the stores:

1. **App icons and splash screens.** Capacitor expects 1024×1024 master icons; use `@capacitor/assets` to generate the per-platform variants.
2. **iOS Info.plist permissions.** Add `NSMicrophoneUsageDescription` (the prompt users see when the app first records audio) and a background audio mode if drivers need audio to continue while the screen is locked.
3. **Android manifest permissions.** Add `RECORD_AUDIO`, `INTERNET`, and `POST_NOTIFICATIONS` (Android 13+). Configure the `POST_NOTIFICATIONS` runtime permission flow.
4. **Native audio session.** Browsers can't reliably record or play audio in background on iOS. If the demo needs to survive a locked screen, replace the Web Audio capture with a native plugin (e.g. `@capacitor-community/native-audio` or a custom AVAudioRecorder bridge).
5. **App Store / Play Store metadata.** Screenshots, descriptions, privacy policy, support URL.
6. **Code signing.** Apple Developer account for iOS, Google Play upload key for Android.
7. **Push credentials.** APNs auth key (.p8) for iOS, FCM service account JSON for Android. The Capacitor Push Notifications plugin needs both wired in `capacitor.config.ts`.
8. **Telemetry.** Decide what to log, where, and how to keep it tenant-scoped. The demo currently logs nothing — that's appropriate for a demo and not appropriate for a production app.

## Local development loop

When iterating on the web app:

```bash
cd client && npm run dev   # hot-reload dev server on http://localhost:5173
```

After any change, rebuild and re-sync to the native projects:

```bash
npm run build && npm run sync
```

Then reload the app on the connected device (Cmd+R in Xcode, R R in Android Studio).

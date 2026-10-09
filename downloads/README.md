# Vistas Mobility PTT — Android build

`vistas-ptt-3bd1d1dd.apk` — **current** build (versionCode 2, versionName 0.1.1).

- Package: `com.vistasmobility.ptt.preview`
- Requires Android 14+ (minSdk 34)
- Debug build signed with a debug key: for testing on real phones, not a store release
- Size 2796222 bytes
- SHA-256 `3bd1d1dd471ca4e2004722bd5a21d83b9534af50ba1c8f1327e66f7ea1511e15`

## What this build adds

- A refused sign-in now names the **exact step that failed** and the real cause.
  A 403 `csrf_mismatch` is reported as a session/token problem, not as a wrong
  password. The status line ends with `[failed at: csrf|login|session|context]`.

## Signing in

- **Server origin** must be a bare HTTPS origin with no path: `https://ptt.kdessinger.com`
  (pre-filled; a pasted console URL is normalised).
- The device must be able to **resolve that hostname through the system resolver**.
  A browser succeeding does not prove this: browsers usually use DNS-over-HTTPS on
  443 while a native app uses the Android system resolver. If you see
  "Unable to resolve host", change Private DNS, set a manual DNS, or use cellular.
- IP addresses are deliberately not accepted as an origin.

Verify after download: `sha256sum vistas-ptt-3bd1d1dd.apk`

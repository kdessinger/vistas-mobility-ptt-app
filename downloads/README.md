# Vistas Mobility PTT — Android build

**`vistas-ptt-c35c346a.apk` is the only build here.** Older files are deleted rather than
left beside it, so the newest is never ambiguous.

- versionCode 3, versionName 0.1.2 (the on-screen title reads the package version directly)
- Package `com.vistasmobility.ptt.preview` · Android 14+ · debug-signed, for testing only
- Size 2796774 bytes · SHA-256 `c35c346a128d704fd32c2ab924976cd9675f86d032b2ce07efe9ca2d8e6d28cd`

## What 0.1.2 adds

- The header version can no longer drift from the installed package: it is read from
  BuildConfig.VERSION_NAME, not hardcoded.
- A refused sign-in names **which call failed** and the real cause:
  `[failed at: csrf|login|session|context]`, with the HTTP status and the server's
  error code. A 403 `csrf_mismatch` is reported as a token problem, not a password one.

## Signing in

- Origin must be a bare HTTPS origin, no path: `https://ptt.kdessinger.com` (pre-filled).
- The device must resolve that hostname **through the Android system resolver**. A
  browser succeeding does not prove it: browsers use DNS-over-HTTPS on 443, a native app
  does not. "Unable to resolve host" means the network, not the app.
- IP addresses are deliberately not accepted as an origin.

Verify after download: `sha256sum vistas-ptt-c35c346a.apk`

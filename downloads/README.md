# Vistas Mobility PTT — Android build

`vistas-ptt-01c2c9a2.apk` — **current** driver and parent client.

- Package: `com.vistasmobility.ptt.preview`
- Requires Android 14+ (minSdk 34)
- Debug build signed with a debug key: for testing on real phones, not a store release
- Size 2795346 bytes
- SHA-256 `01c2c9a258254abaff37e93d46e301ddd13072c081913e452fcc3c000870997d`

## Signing in on the phone

- **Server origin** must be a bare HTTPS origin with no path: `https://ptt.kdessinger.com`
  (pre-filled). A pasted console URL is normalised automatically now.
- **The phone's network must resolve that hostname.** If the app reports
  "Unable to resolve host", the network is the problem, not the app: try cellular data,
  or a network without DNS filtering.
- IP addresses are deliberately NOT accepted as an origin.

Verify after download: `sha256sum vistas-ptt-01c2c9a2.apk`

Install: allow "install from unknown sources", then open the APK.

This is a test artifact, not a deployed service or a safety-certified product. It is not
a replacement for 911, radio, dispatch, or district procedures.

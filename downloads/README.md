# Vistas Mobility PTT — Android build

## Current download: **[Vistas Mobility PTT 0.1.3](vistas-ptt-0.1.3.apk)**

Use `vistas-ptt-0.1.3.apk`, not the older hash-named diagnostic build.

- versionCode **4**, versionName **0.1.3**; the on-screen title reads the package version.
- Package `com.vistasmobility.ptt.preview` · Android 14+ · debug-signed, for testing.
- Size **2,797,202 bytes**.
- SHA-256 `caf3a0707b9d0047adc5a8398a1fa5c92cc9ae22bb86b09cae86653b44a3551a`.

## Login fix in 0.1.3

The server accepted the password but the next session request returned 401.
The Java cookie manager interpreted the session cookie's `Max-Age` as a legacy
version-1 cookie and sent a quoted session value with `$Version`/`$Path` metadata.
The server did not accept that session representation.

The client now uses version-0 `name=value` serialization while preserving the
private cookie store, expiry, Secure flag, and domain/path scope. No server
security rules or password checks were loosened.

Evidence: the transport regression test fails without the fix; all nine JVM
suites pass with it; the app's actual Java transport against the public server
passes login → CSRF refresh → session → communications context after the fix,
and failed at session with HTTP 401 before it.

Errors after a successful login no longer tell you to check the password.

## Installation and sign-in

Install over the existing app; no uninstall is needed if Android accepts the update.
Open it and confirm the title says **Vistas Mobility PTT · 0.1.3**.
Server origin: `https://ptt.kdessinger.com` (pre-filled).
A browser can use a different DNS resolver from the native app; an "Unable to
resolve host" error needs resolver/network investigation, not a password reset.

This is a development build, not evidence of production readiness or safety certification.

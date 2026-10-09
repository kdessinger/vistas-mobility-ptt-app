# Vistas Mobility PTT — Android build

## Current download: **[Vistas Mobility PTT 0.1.4](vistas-ptt-0.1.4.apk)**

- versionCode **5**, versionName **0.1.4**; title derives from the package version.
- Package `com.vistasmobility.ptt.preview` · Android 14+ · debug-signed for testing.
- Size **2,797,374 bytes**.
- SHA-256 `49412ee667a2235f59c87ffc4619f671096f4a6a56d4a638e4c6dbdcf6242f2f`.

## Changes in 0.1.4

- Restores the microphone button: it was created but never attached to its layout.
- Cancel recording appears only during an active hold or recording, not while idle.
- Retains the session-cookie fix confirmed on Kenn's tablet in 0.1.3.
- Foreground/focus safeguards, biometric unlock and server authorization unchanged.

Verification: ten JVM output suites pass, including 37 callback assertions and a
source-level attachment regression. Spec and independent quality reviews passed.
These tests are not device-rendering proof; the restored button needs tablet confirmation.

## Installation and sign-in

Install over the existing app and confirm **Vistas Mobility PTT · 0.1.4**.
Server origin: `https://ptt.kdessinger.com` (pre-filled).
A valid login does not grant a channel: the account must have an active assignment.
An expired channel is excluded; this build does not renew or bypass its access window.
Recording/playback remain foreground-only and stop on focus loss.

This is a development build, not evidence of production readiness or safety certification.
Older artifacts may remain in history; use the current version-labelled link above.

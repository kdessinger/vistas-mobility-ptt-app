/**
 * Native bridge helpers for the Capacitor build.
 *
 * On the web (or when the native runtime is not present) every helper falls
 * back to a sensible no-op so the React app keeps working. This means the
 * same codebase runs both as the PWA demo and inside the native shell.
 */

import { isNative, safeImport } from './platform';

/** Request microphone + notification permission on Android 13+ / iOS. */
export async function requestPushPermissions(): Promise<boolean> {
  if (!isNative()) return false;
  const PushNotifications = (await safeImport('@capacitor/push-notifications')) as {
    requestPermissions: () => Promise<{ receive: string }>;
  } | null;
  if (!PushNotifications) return false;
  try {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  } catch {
    return false;
  }
}

/** Subscribe to incoming push notifications. Returns an unsubscribe fn. */
export async function onPushReceived(handler: (notification: { title?: string; body?: string; data?: unknown }) => void): Promise<() => void> {
  if (!isNative()) return () => undefined;
  const PushNotifications = (await safeImport('@capacitor/push-notifications')) as {
    addListener: (event: string, cb: (arg: unknown) => void) => Promise<unknown>;
    removeAllListeners: (event: string) => Promise<void>;
  } | null;
  if (!PushNotifications) return () => undefined;
  await PushNotifications.addListener('pushNotificationReceived', (n) => {
    handler(n as { title?: string; body?: string; data?: unknown });
  });
  return async () => {
    try {
      await PushNotifications.removeAllListeners('pushNotificationReceived');
    } catch {
      // ignore
    }
  };
}

/** Light haptic on PTT press / release. Falls back silently on web. */
export async function hapticImpact(): Promise<void> {
  if (!isNative()) return;
  const Haptics = (await safeImport('@capacitor/haptics')) as {
    impact: (opts: { style: string }) => Promise<void>;
  } | null;
  if (!Haptics) return;
  try {
    await Haptics.impact({ style: 'MEDIUM' });
  } catch {
    // ignore
  }
}

/** Match the dark theme background color so the WebView blends into the chrome. */
export async function applyDarkStatusBar(): Promise<void> {
  if (!isNative()) return;
  const StatusBar = (await safeImport('@capacitor/status-bar')) as {
    setStyle: (opts: { style: string }) => Promise<void>;
    setBackgroundColor: (opts: { color: string }) => Promise<void>;
  } | null;
  if (!StatusBar) return;
  try {
    await StatusBar.setStyle({ style: 'DARK' });
    await StatusBar.setBackgroundColor({ color: '#0a0f1c' });
  } catch {
    // ignore
  }
}

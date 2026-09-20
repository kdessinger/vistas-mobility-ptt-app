/**
 * Capacitor platform detection and native bridge helpers.
 *
 * Use these instead of calling Capacitor plugins directly so the web build
 * stays runnable in a plain browser without the native runtime present.
 */

// Capacitor is only present when this app is running inside the native shell.
// On the web we stub out the helpers so the app continues to work.
export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() ?? false;
};

export const platform = (): string => {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as unknown as { Capacitor?: { getPlatform: () => string } }).Capacitor;
  return cap?.getPlatform?.() ?? 'web';
};

/**
 * Dynamically import a Capacitor plugin so the web bundle does not crash when
 * the native runtime is unavailable. Returns null on the web or if import fails.
 */
export async function safeImport(pluginName: string): Promise<unknown | null> {
  try {
    const mod = await import(/* @vite-ignore */ pluginName);
    return mod[pluginName] ?? mod.default ?? null;
  } catch {
    return null;
  }
}

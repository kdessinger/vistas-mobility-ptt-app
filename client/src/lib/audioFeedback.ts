import { createPttPressFeedback } from './pttPressFeedback.js';

/**
 * Audio feedback for the PTT demo.
 */

const pttPressFeedback = createPttPressFeedback(
  () => new Audio('/sounds/nextel-chirp.mp3'),
);

function getAudioContext(): AudioContext | null {
  const AudioContextCtor = window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  const ctx = new AudioContextCtor();
  return ctx;
}

function resumeIfNeeded(ctx: AudioContext) {
  if (ctx.state === 'suspended') void ctx.resume();
}

/**
 * Start fetching the short cue before the first press.  `play()` is still
 * called directly by the press gesture, satisfying mobile autoplay rules.
 */
export function preloadPttPressTone(): void {
  pttPressFeedback.preload();
}

/** The supplied Nextel Direct Connect chirp for a PTT key-down gesture. */
export function playPttPressTone(): void {
  pttPressFeedback.play();
}

/**
 * The Nextel chirp is the ready-to-talk acknowledgement, so do not stack a
 * synthetic roger tone on release. The completed voice message still sends normally.
 */
export function playRogerBeep(): void {
  // Intentionally silent.
}

/** Alert tone for a new incoming request (driver portal). */
export function playRequestAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  resumeIfNeeded(ctx);
  const t = ctx.currentTime;

  // Three rising tones: pleasant but attention-getting
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    gain.gain.setValueAtTime(0, t + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.15, t + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.2);
  });

  setTimeout(() => ctx.close(), 600);
}

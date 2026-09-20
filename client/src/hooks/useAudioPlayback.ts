import { useEffect, useRef } from 'react';
import { playBase64Audio } from '../lib/audioFallback';

export function useAudioPlayback(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nextTimeRef = useRef(0);
  const queueRef = useRef<Array<{ base64: string; mimeType: string }>>([]);
  const processingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      queueRef.current = [];
      return;
    }

    const getContext = () => {
      const AudioContextCtor = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) throw new Error('Web Audio is unavailable in this browser');
      if (!ctxRef.current) ctxRef.current = new AudioContextCtor();
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
      const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
      if (debug) debug.contextState = ctxRef.current.state;
      if (nextTimeRef.current === 0) nextTimeRef.current = ctxRef.current.currentTime;
      return ctxRef.current;
    };

    // Browsers require an interaction before allowing Web Audio output.
    // WebKit is still picky here, so listen to pointer, touch, mouse, and key.
    const unlock = () => {
      const ctx = getContext();
      void ctx.resume();
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('mousedown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });

    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        // Foreground return: resume AudioContext immediately.
        const ctx = getContext();
        void ctx.resume();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    const decodeAndPlay = async () => {
      if (processingRef.current) return;
      processingRef.current = true;
      while (queueRef.current.length > 0) {
        const item = queueRef.current.shift();
        if (!item) continue;
        try {
          const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
          if (debug) debug.receivedChunks = Number(debug.receivedChunks ?? 0) + 1;
          const binary = atob(item.base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
          const ctx = getContext();
          let buffer: AudioBuffer;
          if (item.mimeType.startsWith('audio/pcm')) {
            const sampleRate = Number(item.mimeType.match(/rate=(\d+)/)?.[1] ?? 48000);
            const samples = new Int16Array(bytes.buffer);
            buffer = ctx.createBuffer(1, samples.length, sampleRate);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < samples.length; i += 1) channel[i] = samples[i] / 0x8000;
          } else {
            buffer = await ctx.decodeAudioData(bytes.buffer);
          }
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          const start = Math.max(ctx.currentTime, nextTimeRef.current);
          source.start(start);
          nextTimeRef.current = start + buffer.duration;
          if (debug) debug.playedChunks = Number(debug.playedChunks ?? 0) + 1;
        } catch (error) {
          console.warn('[ptt] received audio could not be decoded:', error);
          const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
          if (debug) debug.lastError = String(error);
          // Keep a browser-native fallback for codecs AudioContext cannot decode.
          playBase64Audio(item.base64, item.mimeType);
        }
      }
      processingRef.current = false;
    };

    const onChunk = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || detail.type !== 'audio-chunk' || typeof detail.chunk !== 'string') return;
      queueRef.current.push({
        base64: detail.chunk,
        mimeType: typeof detail.mimeType === 'string' ? detail.mimeType : 'audio/pcm;rate=48000;channels=1',
      });
      void decodeAndPlay();
    };

    window.addEventListener('ptt-message', onChunk);
    (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug ??= {
      captureChunks: 0,
      receivedChunks: 0,
      playedChunks: 0,
      contextState: 'not-created',
    };
    return () => {
      window.removeEventListener('ptt-message', onChunk);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('mousedown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', visibilityHandler);
      queueRef.current = [];
    };
  }, [enabled]);

  useEffect(() => () => {
    if (ctxRef.current) void ctxRef.current.close();
  }, []);
}

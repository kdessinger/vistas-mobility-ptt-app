import { useCallback, useRef } from 'react';

export interface RecordedVoiceMessage {
  base64: string;
  mimeType: string;
  durationMs: number;
  hasSpeech: boolean;
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function getAudioContextConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

/**
 * Records one complete PTT utterance and returns it only after release.
 *
 * The first version used MediaRecorder/WebM or MP4. That worked in Chrome but
 * broke the demo on Apple devices because Safari/WebKit cannot decode WebM, and
 * Chrome/Firefox do not consistently record the same container Safari prefers.
 * For this demo we record raw mono PCM from Web Audio instead. Every receiving
 * browser already knows how to play the `audio/pcm;rate=...;channels=1` payload,
 * so iPhone Safari, Mac Safari, Chrome, and Edge all share one wire format.
 */
export function useVoiceMessageCapture() {
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Int16Array[]>([]);
  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const voicedMsRef = useRef(0);
  const sampleRateRef = useRef(48000);
  const lastProcessAtRef = useRef(0);

  const stopGraph = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sinkRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    sinkRef.current = null;
    if (audioContextRef.current) void audioContextRef.current.close();
    audioContextRef.current = null;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (recordingRef.current) return true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is unavailable in this browser');
      }
      const AudioContextCtor = getAudioContextConstructor();
      if (!AudioContextCtor) throw new Error('Web Audio is unavailable in this browser');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContextCtor();
      await context.resume();

      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const sink = context.createGain();
      // Keep the ScriptProcessor graph alive on mobile WebKit without letting
      // the sender hear themselves. A literal zero-gain output can be optimized
      // away by some mobile browsers.
      sink.gain.value = 0.0001;

      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);

      streamRef.current = stream;
      audioContextRef.current = context;
      sourceRef.current = source;
      processorRef.current = processor;
      sinkRef.current = sink;
      pcmChunksRef.current = [];
      sampleRateRef.current = context.sampleRate;
      startedAtRef.current = Date.now();
      lastProcessAtRef.current = startedAtRef.current;
      voicedMsRef.current = 0;
      recordingRef.current = true;

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        let energy = 0;
        for (let i = 0; i < input.length; i += 1) {
          const sample = Math.max(-1, Math.min(1, input[i]));
          energy += sample * sample;
          pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        pcmChunksRef.current.push(pcm);

        const rms = Math.sqrt(energy / input.length);
        const now = Date.now();
        if (rms > 0.025) voicedMsRef.current += Math.max(0, now - lastProcessAtRef.current);
        lastProcessAtRef.current = now;

        const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
        if (debug) {
          debug.captureChunks = Number(debug.captureChunks ?? 0) + 1;
          debug.captureMimeType = `audio/pcm;rate=${context.sampleRate};channels=1`;
          debug.captureContextState = context.state;
        }
      };

      return true;
    } catch (error) {
      console.error('[ptt] voice message recording failed to start:', error);
      stopStream(streamRef.current);
      streamRef.current = null;
      stopGraph();
      recordingRef.current = false;
      return false;
    }
  }, [stopGraph]);

  const stop = useCallback(async (): Promise<RecordedVoiceMessage | null> => {
    if (!recordingRef.current) return null;
    recordingRef.current = false;
    const durationMs = Math.max(0, Date.now() - startedAtRef.current);

    const chunks = pcmChunksRef.current;
    const totalSamples = chunks.reduce((total, chunk) => total + chunk.length, 0);
    const bytes = new Uint8Array(totalSamples * 2);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(new Uint8Array(chunk.buffer), offset);
      offset += chunk.byteLength;
    }

    stopGraph();
    stopStream(streamRef.current);
    streamRef.current = null;
    pcmChunksRef.current = [];

    if (bytes.length === 0) return null;
    return {
      base64: base64FromBytes(bytes),
      mimeType: `audio/pcm;rate=${sampleRateRef.current};channels=1`,
      durationMs,
      hasSpeech: voicedMsRef.current >= 500,
    };
  }, [stopGraph]);

  const cancel = useCallback(() => {
    recordingRef.current = false;
    stopGraph();
    stopStream(streamRef.current);
    streamRef.current = null;
    pcmChunksRef.current = [];
  }, [stopGraph]);

  return { start, stop, cancel, recordingRef };
}

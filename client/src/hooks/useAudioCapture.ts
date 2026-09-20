import { useRef, useCallback } from 'react';

export function useAudioCapture() {
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sinkRef = useRef<GainNode | null>(null);
  const recordingRef = useRef(false);
  const segmentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      return stream;
    } catch (error) {
      console.error('[ptt] microphone permission/capture failed:', error);
      return null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    recordingRef.current = false;
    if (segmentTimerRef.current) {
      clearTimeout(segmentTimerRef.current);
      segmentTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    sinkRef.current?.disconnect();
    processorRef.current = null;
    sourceRef.current = null;
    sinkRef.current = null;
    if (audioContextRef.current) {
      void audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const stopCapture = useCallback(() => {
    stopRecording();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [stopRecording]);

  const startRecording = useCallback(
    async (onChunk: (base64: string, mimeType: string) => void) => {
      const stream = streamRef.current || (await startCapture());
      if (!stream) return false;
      recordingRef.current = true;

      // Send raw mono PCM instead of MediaRecorder/WebM fragments. A timesliced
      // WebM event is not guaranteed to contain a complete decodable file.
      const AudioContextCtor = window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return false;
      const context = new AudioContextCtor();
      await context.resume();
      const source = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(4096, 1, 1);
      const sink = context.createGain();
      // Keep the processor connected to a live output graph. Some mobile
      // browsers optimize a zero-gain graph away, which prevents
      // ScriptProcessorNode from receiving microphone callbacks.
      sink.gain.value = 0.0001;
      source.connect(processor);
      processor.connect(sink);
      sink.connect(context.destination);
      audioContextRef.current = context;
      sourceRef.current = source;
      processorRef.current = processor;
      sinkRef.current = sink;

      processor.onaudioprocess = (event) => {
        if (!recordingRef.current) return;
        const input = event.inputBuffer.getChannelData(0);
        const pcm = new Int16Array(input.length);
        for (let i = 0; i < input.length; i += 1) {
          const sample = Math.max(-1, Math.min(1, input[i]));
          pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        }
        const bytes = new Uint8Array(pcm.buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
        if (debug) debug.captureChunks = Number(debug.captureChunks ?? 0) + 1;
        onChunk(btoa(binary), `audio/pcm;rate=${context.sampleRate};channels=1`);
      };

      const debug = (window as typeof window & { __pttAudioDebug?: Record<string, unknown> }).__pttAudioDebug;
      if (debug) {
        debug.captureContextState = context.state;
        debug.captureSampleRate = context.sampleRate;
        debug.captureGraphReady = true;
      }

      return true;
    },
    [startCapture]
  );

  const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine') => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), duration * 1000 + 100);
    } catch {
      // Audio feedback is optional.
    }
  }, []);

  return {
    streamRef,
    startCapture,
    stopCapture,
    startRecording,
    stopRecording,
    playTone,
  };
}

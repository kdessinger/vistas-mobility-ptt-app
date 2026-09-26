import { useRef, useCallback, useState } from 'react';

interface UseSpeechRecognitionReturn {
  startRecognition: () => void;
  stopRecognition: () => void;
  getTranscript: () => string;
  transcript: string;
  isAvailable: boolean;
  hasError: boolean;
  errorMessage: string;
}

function getSpeechRecognitionCtor(): (new () => unknown) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => unknown) | undefined;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const recognitionRef = useRef<unknown>(null);
  const transcriptRef = useRef('');
  const [transcript, setTranscript] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const isAvailable = Boolean(getSpeechRecognitionCtor());

  const startRecognition = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    transcriptRef.current = '';
    setTranscript('');
    setHasError(false);
    setErrorMessage('');

    const recognition = new Ctor() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: ((event: unknown) => void) | null;
      onerror: ((event: unknown) => void) | null;
      onend: (() => void) | null;
      start(): void;
      stop(): void;
    };

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: unknown) => {
      const ev = event as {
        resultIndex: number;
        results: Array<{
          isFinal: boolean;
          0: { transcript: string };
        }>;
      };

      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const result = ev.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const combined = finalTranscript || interimTranscript;
      if (combined) {
        const base = transcriptRef.current.replace(/\.\.\.$/, '');
        const next = base ? `${base} ${combined}`.trim() : combined.trim();
        transcriptRef.current = next;
        setTranscript(next);
        console.log('[STT] transcript update:', next);
      }
    };

    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string; message?: string };
      console.warn('[STT] error:', e.error, e.message);
      setHasError(true);
      setErrorMessage(e.error || e.message || 'STT failed');
    };

    recognition.onend = () => {
      console.log('[STT] ended, final transcript:', transcriptRef.current);
    };

    try {
      recognition.start();
      console.log('[STT] started');
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('[STT] start() threw:', e);
      setHasError(true);
      setErrorMessage(String(e));
    }
  }, []);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        (recognitionRef.current as { stop(): void }).stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    // Give the final onresult a tick to flush
    setTimeout(() => {
      const final = transcriptRef.current;
      if (final) setTranscript(final);
    }, 50);
  }, []);

  // PTT release can happen before React renders the final recognition event.
  // The ref is the authoritative outbound value, avoiding a stale closure.
  const getTranscript = useCallback(() => transcriptRef.current.trim(), []);

  return {
    startRecognition,
    stopRecognition,
    getTranscript,
    transcript,
    isAvailable,
    hasError,
    errorMessage,
  };
}

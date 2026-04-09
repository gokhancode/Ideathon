import { useState, useRef, useCallback } from "react";

export interface NoiseMeterState {
  isListening: boolean;
  currentDb: number;
  error: string | null;
  start: () => Promise<void>;
  stop: () => void;
}

/**
 * Real microphone noise measurement using Web Audio API.
 * Converts RMS amplitude to approximate dB SPL.
 *
 * Security notes:
 * - Requires explicit user permission (browser mic prompt)
 * - Only reads amplitude — no audio is recorded or transmitted
 * - Stream is destroyed on stop
 */
export function useNoiseMeter(): NoiseMeterState {
  const [isListening, setIsListening] = useState(false);
  const [currentDb, setCurrentDb] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(dataArray);

    // Calculate RMS (root mean square) amplitude
    let sumSquares = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sumSquares += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sumSquares / dataArray.length);

    // Convert to approximate dB SPL
    // Reference: RMS of 1.0 in Web Audio ≈ 94 dB SPL (phone mic approximation)
    // Clamp to reasonable range
    const dbRaw = rms > 0 ? 20 * Math.log10(rms) + 94 : 0;
    const db = Math.round(Math.max(20, Math.min(120, dbRaw)));

    setCurrentDb(db);
    rafRef.current = requestAnimationFrame(measure);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      // Request mic access — browser will prompt user
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false, // Don't filter — we want raw ambient sound
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      // Don't connect to destination — we only analyse, never play back

      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      streamRef.current = stream;

      setIsListening(true);
      rafRef.current = requestAnimationFrame(measure);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Microphone access denied. Please allow mic access to measure noise.");
      } else {
        setError("Could not access microphone. Make sure your device has a mic.");
      }
    }
  }, [measure]);

  const stop = useCallback(() => {
    // Clean up all audio resources
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    rafRef.current = null;
    setIsListening(false);
  }, []);

  return { isListening, currentDb, error, start, stop };
}

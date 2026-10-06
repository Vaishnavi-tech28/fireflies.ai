"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// A simulated media player that advances playback time while "playing".
// It exposes the same controls a real <audio> element would:
//  - currentTime, isPlaying, play, pause, toggle, seek, setRate.
// The interactive transcript + topics panel drive off `currentTime`.
export function usePlayback(durationSec: number) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      stop();
      return;
    }
    let last = performance.now();
    intervalRef.current = setInterval(() => {
      const now = performance.now();
      const delta = ((now - last) / 1000) * rate;
      last = now;
      setCurrentTime((t) => {
        const next = t + delta;
        if (next >= durationSec) {
          setIsPlaying(false);
          return durationSec;
        }
        return next;
      });
    }, 100);
    return stop;
  }, [isPlaying, rate, durationSec, stop]);

  const seek = useCallback(
    (t: number) => {
      setCurrentTime(Math.max(0, Math.min(durationSec, t)));
    },
    [durationSec],
  );

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const toggle = useCallback(
    () => setIsPlaying((v) => !v),
    [],
  );

  const skip = useCallback(
    (delta: number) => {
      setCurrentTime((t) => Math.max(0, Math.min(durationSec, t + delta)));
    },
    [durationSec],
  );

  return {
    currentTime,
    isPlaying,
    rate,
    duration: durationSec,
    play,
    pause,
    toggle,
    seek,
    skip,
    setRate,
  };
}

export type Playback = ReturnType<typeof usePlayback>;

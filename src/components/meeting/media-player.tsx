"use client";

import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatTimestamp } from "@/lib/fireflies/format";
import type { Playback } from "@/components/meeting/use-playback";
import { useEffect, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function MediaPlayer({
  playback,
  title,
  meetingType,
}: {
  playback: Playback;
  title: string;
  meetingType: string;
}) {
  const { currentTime, duration, isPlaying, toggle, seek, skip, rate, setRate } =
    playback;
  const [pct] = useState(0);
  useEffect(() => {}, [pct]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      {/* "Video" placeholder */}
      <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-secondary to-secondary/60">
        <div className="absolute inset-0 opacity-30">
          <Waveform progress={currentTime / Math.max(1, duration)} />
        </div>
        <div className="relative flex flex-col items-center gap-2 text-muted-foreground">
          <Mic className="h-8 w-8 text-primary/70" />
          <p className="text-xs font-medium uppercase tracking-wide">
            {meetingType}
          </p>
          <p className="max-w-md truncate text-sm">{title}</p>
          <p className="text-[11px]">
            Sample media — interactive transcript is fully synced below
          </p>
        </div>
        <button
          onClick={toggle}
          className="absolute inset-0 flex items-center justify-center"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition hover:scale-105 hover:bg-primary">
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 translate-x-0.5" />
            )}
          </span>
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <span className="w-12 text-right font-mono text-[11px] text-muted-foreground">
          {formatTimestamp(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={1}
          onValueChange={(v) => seek(v[0])}
          className="flex-1"
          aria-label="Seek"
        />
        <span className="w-12 font-mono text-[11px] text-muted-foreground">
          {formatTimestamp(duration)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => skip(-10)}
            aria-label="Back 10s"
            title="Back 10s"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => skip(10)}
            aria-label="Forward 10s"
            title="Forward 10s"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 text-muted-foreground sm:flex">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={[80]}
              max={100}
              step={1}
              className="w-20"
              aria-label="Volume"
            />
          </div>
          <Select
            value={String(rate)}
            onValueChange={(v) => setRate(Number(v))}
          >
            <SelectTrigger className="h-8 w-[72px] gap-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SPEEDS.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}×
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Simple decorative waveform
function Waveform({ progress }: { progress: number }) {
  const bars = Array.from({ length: 80 });
  return (
    <div className="flex h-full items-center justify-center gap-[2px]">
      {bars.map((_, i) => {
        const h = 20 + Math.abs(Math.sin(i * 0.7)) * 60 + Math.cos(i) * 10;
        const active = i / bars.length <= progress;
        return (
          <div
            key={i}
            className={`w-[3px] rounded-full ${active ? "bg-primary/70" : "bg-foreground/15"}`}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

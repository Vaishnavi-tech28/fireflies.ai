"use client";

import { Bookmark, Clock } from "lucide-react";
import type { Topic } from "@/lib/fireflies/types";
import type { Playback } from "@/components/meeting/use-playback";
import { formatTimestamp } from "@/lib/fireflies/format";
import { cn } from "@/lib/utils";

export function TopicsPanel({
  topics,
  playback,
}: {
  topics: Topic[];
  playback: Playback;
}) {
  if (topics.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        No topics or chapters were detected for this meeting.
      </div>
    );
  }

  const activeIdx = (() => {
    const t = playback.currentTime;
    let idx = -1;
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const end = topic.endTime ?? (topics[i + 1]?.startTime ?? Infinity);
      if (t >= topic.startTime && t < end) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      // last topic whose start <= t
      const last = topics
        .map((t2, i) => ({ t2, i }))
        .filter((x) => x.t2.startTime <= t)
        .pop();
      idx = last ? last.i : -1;
    }
    return idx;
  })();

  return (
    <div className="space-y-2">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Bookmark className="h-3.5 w-3.5" />
        Chapters &amp; Topics
      </h3>
      {topics.map((topic, i) => {
        const isActive = i === activeIdx;
        return (
          <button
            key={topic.id}
            onClick={() => {
              playback.seek(topic.startTime);
              if (!playback.isPlaying) playback.play();
            }}
            className={cn(
              "group flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left transition hover:border-primary/40 hover:shadow-sm",
              isActive && "border-primary/60 bg-primary/5",
            )}
          >
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isActive && "text-primary",
                  )}
                >
                  {topic.name}
                </p>
                <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {formatTimestamp(topic.startTime)}
                </span>
              </div>
              {topic.summary && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {topic.summary}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

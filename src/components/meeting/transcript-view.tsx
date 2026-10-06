"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  MessageSquarePlus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/fireflies/user-avatar";
import { formatTimestamp } from "@/lib/fireflies/format";
import type { Playback } from "@/components/meeting/use-playback";
import type { TranscriptSegment } from "@/lib/fireflies/types";
import { cn } from "@/lib/utils";

type Match = { segmentId: string; index: number };

export function TranscriptView({
  segments,
  playback,
  onAddComment,
}: {
  segments: TranscriptSegment[];
  playback: Playback;
  onAddComment: (
    seg: TranscriptSegment,
    type: "comment" | "highlight",
  ) => void;
}) {
  const [query, setQuery] = useState("");
  const [matchIdx, setMatchIdx] = useState(0);
  const segRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // find active segment based on currentTime
  const activeId = useMemo(() => {
    const t = playback.currentTime;
    let found: string | null = null;
    for (const seg of segments) {
      if (t >= seg.startTime && t < seg.endTime + 0.5) {
        found = seg.id;
        break;
      }
      if (t < seg.startTime) break;
    }
    if (!found && segments.length > 0) {
      // find the last segment whose start <= t
      const last = [...segments].reverse().find((s) => s.startTime <= t);
      found = last ? last.id : segments[0].id;
    }
    return found;
  }, [playback.currentTime, segments]);

  // compute matches
  const matches = useMemo<Match[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Match[] = [];
    for (const seg of segments) {
      const lower = seg.text.toLowerCase();
      let i = lower.indexOf(q);
      while (i >= 0) {
        out.push({ segmentId: seg.id, index: i });
        i = lower.indexOf(q, i + q.length);
      }
    }
    return out;
  }, [query, segments]);

  // when matches change, reset active match
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatchIdx(0);
  }, [query]);

  // scroll active match into view when navigating
  const activeMatch = matches[matchIdx];
  useEffect(() => {
    if (!query.trim() && activeId) {
      const el = segRefs.current[activeId];
      // only auto-scroll during playback, not on every render
      el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeId]);

  // when user navigates matches, scroll to that segment
  useEffect(() => {
    if (!activeMatch) return;
    const seg = segments.find((s) => s.id === activeMatch.segmentId);
    if (seg) {
      playback.seek(seg.startTime);
      const el = segRefs.current[seg.id];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [matchIdx]);

  // jump to a segment by clicking it
  function handleSegmentClick(seg: TranscriptSegment) {
    playback.seek(seg.startTime);
    if (!playback.isPlaying) playback.play();
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Search bar */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search in transcript…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 rounded-md pl-8 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setMatchIdx((i) => (i - 1 + matches.length) % matches.length)
              }
              aria-label="Previous match"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center tabular-nums">
              {matchIdx + 1} / {matches.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() =>
                setMatchIdx((i) => (i + 1) % matches.length)
              }
              aria-label="Next match"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Segments */}
      <div
        ref={containerRef}
        className="max-h-[60vh] flex-1 overflow-y-auto p-3 scrollbar-thin"
      >
        {segments.map((seg) => {
          const isActive = seg.id === activeId;
          const segMatches = matches.filter((m) => m.segmentId === seg.id);
          const hasActiveMatch = segMatches.some(
            (m) => matches.indexOf(m) === matchIdx,
          );
          return (
            <div
              key={seg.id}
              ref={(el) => {
                segRefs.current[seg.id] = el;
              }}
              className={cn(
                "group flex gap-3 rounded-lg border-l-2 border-transparent px-2 py-2 transition hover:bg-accent/40",
                isActive && "transcript-active bg-primary/5",
              )}
            >
              {/* Speaker avatar + time */}
              <button
                onClick={() => handleSegmentClick(seg)}
                className="flex w-12 shrink-0 flex-col items-center gap-1 pt-0.5"
              >
                <UserAvatar
                  name={seg.speaker.name}
                  color={seg.speaker.avatarColor}
                  size="sm"
                />
                <span className="font-mono text-[10px] text-muted-foreground">
                  {formatTimestamp(seg.startTime)}
                </span>
              </button>

              {/* Text + speaker name */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">
                    {seg.speaker.name}
                  </span>
                  {seg.speaker.title && (
                    <span className="text-[10px] text-muted-foreground">
                      {seg.speaker.title}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleSegmentClick(seg)}
                  className="mt-0.5 block text-left text-sm leading-relaxed text-foreground/90"
                >
                  {renderText(
                    seg.text,
                    query.trim(),
                    segMatches.map((m) => m.index),
                    hasActiveMatch ? matchIdx : -1,
                    matches,
                  )}
                </button>

                {/* Existing comments on this segment */}
                {seg.comments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {seg.comments.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-1.5 rounded-md bg-accent/60 px-2 py-1 text-[11px]"
                      >
                        <Highlighter className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                        <span className="text-foreground/80">{c.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hover actions */}
                <div className="mt-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => onAddComment(seg, "comment")}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <MessageSquarePlus className="h-3 w-3" />
                    Comment
                  </button>
                  <button
                    onClick={() => onAddComment(seg, "highlight")}
                    className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <Highlighter className="h-3 w-3" />
                    Highlight
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Render text with highlighted search matches
function renderText(
  text: string,
  query: string,
  matchIndices: number[],
  activeMatchGlobalIdx: number,
  allMatches: Match[],
): React.ReactNode {
  if (!query) return text;
  if (matchIndices.length === 0) return text;
  const qlen = query.length;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  matchIndices.forEach((start, localIdx) => {
    if (start > cursor) parts.push(text.slice(cursor, start));
    // determine if THIS match is the active global match
    // find the global index of this match
    const segStart = allMatches.findIndex(
      (m) => m.index === start,
    );
    const isActive = segStart === activeMatchGlobalIdx;
    parts.push(
      <mark
        key={start}
        className={isActive ? "transcript-match-active" : "transcript-match"}
      >
        {text.slice(start, start + qlen)}
      </mark>,
    );
    cursor = start + qlen;
  });
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

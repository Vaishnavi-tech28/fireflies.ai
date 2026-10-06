"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, FileText, Hash, CornerDownLeft } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/store/app-store";
import { formatTimestamp } from "@/lib/fireflies/format";
import type { MeetingSummary, TranscriptHit } from "@/lib/fireflies/types";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const openMeeting = useAppStore((s) => s.openMeeting);

  // open on cmd+k / ctrl+k
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data } = useQuery({
    queryKey: ["global-search", q],
    queryFn: async () => {
      if (!q.trim()) return { meetings: [] as MeetingSummary[], transcriptHits: [] as TranscriptHit[] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return { meetings: [], transcriptHits: [] };
      return res.json();
    },
    enabled: q.trim().length > 0,
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition hover:bg-muted"
      >
        <Search className="h-4 w-4" />
        <span>Search meetings &amp; transcripts…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search by title, participant, or what was said…"
          value={q}
          onValueChange={setQ}
        />
        <CommandList className="max-h-[60vh]">
          <CommandEmpty>
            {q.trim() ? "No matches found." : "Start typing to search…"}
          </CommandEmpty>

          {data?.meetings && data.meetings.length > 0 && (
            <CommandGroup heading="Meetings">
              {data.meetings.slice(0, 6).map((m) => (
                <CommandItem
                  key={m.id}
                  value={`meeting-${m.id}`}
                  onSelect={() => {
                    openMeeting(m.id);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium">{m.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {m.participants.map((p) => p.person.name).join(", ")}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {data?.transcriptHits && data.transcriptHits.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="In transcript">
                {data.transcriptHits.slice(0, 8).map((h) => (
                  <CommandItem
                    key={h.id}
                    value={`seg-${h.id}`}
                    onSelect={() => {
                      openMeeting(h.meetingId);
                      // store desired seek time
                      try {
                        sessionStorage.setItem(
                          `ff:seek:${h.meetingId}`,
                          String(h.startTime),
                        );
                      } catch {}
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Hash className="h-4 w-4 text-primary" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm">
                        {highlight(h.text, q)}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {h.meeting.title} · {formatTimestamp(h.startTime)} ·{" "}
                        {h.speaker.name}
                      </span>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/30 px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

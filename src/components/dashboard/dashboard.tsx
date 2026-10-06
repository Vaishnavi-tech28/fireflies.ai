"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronDown,
  Clock,
  Filter,
  ListChecks,
  Mic,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/store/app-store";
import { MeetingCard } from "@/components/dashboard/meeting-card";
import { CreateMeetingDialog } from "@/components/dashboard/create-meeting-dialog";
import { StatsRow } from "@/components/dashboard/stats-row";
import {
  formatDate,
  formatDuration,
  relativeTime,
} from "@/lib/fireflies/format";
import type { MeetingSummary, Stats, Tag } from "@/lib/fireflies/types";

export type SortKey =
  | "recent"
  | "oldest"
  | "longest"
  | "shortest"
  | "az";

export function Dashboard() {
  const openMeeting = useAppStore((s) => s.openMeeting);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [participant, setParticipant] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  // open create dialog via sidebar/topbar custom event
  useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("ff:create-meeting", handler);
    return () => window.removeEventListener("ff:create-meeting", handler);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["meetings", q, sort, typeFilter, tagFilter, participant],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      params.set("sort", sort);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (tagFilter !== "all") params.set("tag", tagFilter);
      if (participant) params.set("participant", participant);
      const res = await fetch(`/api/meetings?${params}`);
      if (!res.ok) throw new Error("failed");
      const json = await res.json();
      return json.meetings as MeetingSummary[];
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) return { tags: [] };
      return (await res.json()) as { tags: Tag[] };
    },
  });

  const { data: stats } = useQuery<Stats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("failed");
      return (await res.json()) as Stats;
    },
  });

  const meetingTypes = useMemo(() => {
    const set = new Set<string>();
    data?.forEach((m) => set.add(m.meetingType));
    return Array.from(set).sort();
  }, [data]);

  const meetings = data ?? [];

  // Group meetings into "Today", "Yesterday", "This Week", "Earlier"
  const groups = useMemo(() => groupByRecency(meetings), [meetings]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Meeting Library
        </h1>
        <p className="text-sm text-muted-foreground">
          All your transcripts, summaries, and action items in one place.
        </p>
      </div>

      {stats && <StatsRow stats={stats} />}

      {/* Toolbar */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or participant…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterSelect
            label="Sort"
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            options={[
              { value: "recent", label: "Most recent" },
              { value: "oldest", label: "Oldest first" },
              { value: "longest", label: "Longest" },
              { value: "shortest", label: "Shortest" },
              { value: "az", label: "A → Z" },
            ]}
          />
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[
              { value: "all", label: "All types" },
              ...meetingTypes.map((t) => ({ value: t, label: t })),
            ]}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
                {tagFilter !== "all" && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Filter by tag</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTagFilter("all")}>
                All tags
              </DropdownMenuItem>
              {tagsData?.tags.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => setTagFilter(t.name)}
                  className="gap-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            className="h-10 gap-2 bg-primary text-primary-foreground hover:opacity-90"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Meeting</span>
          </Button>
        </div>
      </div>

      {/* Active filter chips */}
      {(participant ||
        typeFilter !== "all" ||
        tagFilter !== "all" ||
        q) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Active filters:</span>
          {q && <Chip label={`"${q}"`} onClear={() => setQ("")} />}
          {participant && (
            <Chip label={`speaker: ${participant}`} onClear={() => setParticipant("")} />
          )}
          {typeFilter !== "all" && (
            <Chip label={typeFilter} onClear={() => setTypeFilter("all")} />
          )}
          {tagFilter !== "all" && (
            <Chip label={tagFilter} onClear={() => setTagFilter("all")} />
          )}
        </div>
      )}

      {/* Meetings list */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-xl border border-border bg-card"
              />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} />
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.label}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    {g.label}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    ({g.items.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((m) => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      onOpen={() => openMeeting(m.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateMeetingDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-[140px] gap-2 rounded-lg">
        <span className="text-xs text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
      {label}
      <button
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground"
      >
        ×
      </button>
    </span>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Mic className="h-7 w-7 text-primary" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">No meetings found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try adjusting your filters, or create a new meeting by uploading a
        transcript.
      </p>
      <Button
        onClick={onCreate}
        className="mt-4 gap-2 bg-primary text-primary-foreground hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Create a meeting
      </Button>
    </div>
  );
}

function groupByRecency(meetings: MeetingSummary[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfWeek = new Date(startOfToday.getTime() - 6 * 86400000);

  const groups: { label: string; items: MeetingSummary[] }[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "This Week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const m of meetings) {
    const d = new Date(m.date);
    if (d >= startOfToday) groups[0].items.push(m);
    else if (d >= startOfYesterday) groups[1].items.push(m);
    else if (d >= startOfWeek) groups[2].items.push(m);
    else groups[3].items.push(m);
  }
  return groups.filter((g) => g.items.length > 0);
}

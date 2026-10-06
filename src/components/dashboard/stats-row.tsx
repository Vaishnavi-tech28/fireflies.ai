"use client";

import { Calendar, ListChecks, Mic2, Users } from "lucide-react";
import type { Stats } from "@/lib/fireflies/types";
import { formatDuration } from "@/lib/fireflies/format";

export function StatsRow({ stats }: { stats: Stats }) {
  const items = [
    {
      icon: Mic2,
      label: "Meetings",
      value: String(stats.meetings),
      hint: "transcribed",
    },
    {
      icon: Calendar,
      label: "Total talk time",
      value: formatDuration(stats.totalMinutes * 60),
      hint: "across all meetings",
    },
    {
      icon: ListChecks,
      label: "Action items",
      value: String(stats.actionItems),
      hint: `${stats.completedActionItems} completed`,
    },
    {
      icon: Users,
      label: "People",
      value: String(stats.people),
      hint: "in your library",
    },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <it.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold leading-tight">{it.value}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {it.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

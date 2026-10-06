"use client";

import { Calendar, Clock, MessageSquare, ListChecks } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/fireflies/user-avatar";
import {
  formatDate,
  formatDuration,
  relativeTime,
} from "@/lib/fireflies/format";
import type { MeetingSummary } from "@/lib/fireflies/types";

export function MeetingCard({
  meeting,
  onOpen,
}: {
  meeting: MeetingSummary;
  onOpen: () => void;
}) {
  const participants = meeting.participants.slice(0, 4);
  const extraCount = meeting.participants.length - participants.length;
  const pending = meeting._count.actionItems; // approx; detailed view has completed flag

  return (
    <button
      onClick={onOpen}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {/* Top row: type + date */}
      <div className="flex items-center justify-between gap-2">
        <Badge
          variant="secondary"
          className="bg-primary/10 text-primary hover:bg-primary/10"
        >
          {meeting.meetingType}
        </Badge>
        <span className="text-[11px] text-muted-foreground">
          {relativeTime(meeting.date)}
        </span>
      </div>

      {/* Title */}
      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug group-hover:text-primary">
        {meeting.title}
      </h3>

      {/* Date + duration */}
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(meeting.date)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(meeting.durationSec)}
        </span>
      </div>

      {/* Participants */}
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-2">
          {participants.map((p, i) => (
            <UserAvatar
              key={p.person.id}
              name={p.person.name}
              color={p.person.avatarColor}
              size="sm"
              className="ring-2 ring-card"
            />
          ))}
          {extraCount > 0 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-secondary-foreground ring-2 ring-card">
              +{extraCount}
            </div>
          )}
        </div>
        <span className="truncate text-[11px] text-muted-foreground">
          {meeting.participants
            .slice(0, 2)
            .map((p) => p.person.name)
            .join(", ")}
          {meeting.participants.length > 2
            ? ` +${meeting.participants.length - 2}`
            : ""}
        </span>
      </div>

      {/* Tags */}
      {meeting.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meeting.tags.slice(0, 3).map((t) => (
            <span
              key={t.tag.id}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${t.tag.color}1a`,
                color: t.tag.color,
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.tag.color }}
              />
              {t.tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer counts */}
      <div className="mt-3 flex items-center gap-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          {meeting._count.segments} lines
        </span>
        {meeting._count.actionItems > 0 && (
          <span className="flex items-center gap-1">
            <ListChecks className="h-3 w-3" />
            {meeting._count.actionItems} tasks
          </span>
        )}
      </div>
    </button>
  );
}

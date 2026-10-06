// Shared Prisma select fragments so list + detail shapes stay consistent.
import type { Prisma } from "@prisma/client";

// Lightweight meeting card shape (used by /api/meetings list).
export const meetingSummarySelect = {
  id: true,
  title: true,
  date: true,
  durationSec: true,
  meetingType: true,
  source: true,
  status: true,
  notes: true,
  createdAt: true,
  organizer: { select: { id: true, name: true } },
  participants: {
    select: {
      role: true,
      person: {
        select: { id: true, name: true, email: true, avatarColor: true, title: true },
      },
    },
  },
  tags: { select: { tag: { select: { id: true, name: true, color: true } } } },
  _count: { select: { segments: true, actionItems: true, comments: true } },
} satisfies Prisma.MeetingSelect;

// Full detail shape (used by /api/meetings/[id]).
export const meetingDetailSelect = {
  ...meetingSummarySelect,
  segments: {
    orderBy: { startTime: "asc" as const },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      text: true,
      confidence: true,
      speaker: {
        select: {
          id: true,
          name: true,
          avatarColor: true,
          title: true,
        },
      },
      comments: {
        select: {
          id: true,
          text: true,
          type: true,
          startTime: true,
          endTime: true,
          createdAt: true,
        },
      },
    },
  },
  actionItems: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      text: true,
      assignee: true,
      assigneeId: true,
      dueDate: true,
      completed: true,
      completedAt: true,
      priority: true,
      createdAt: true,
    },
  },
  summary: {
    select: {
      id: true,
      overview: true,
      keyPoints: true,
      decisions: true,
    },
  },
  topics: {
    orderBy: { startTime: "asc" as const },
    select: { id: true, name: true, startTime: true, endTime: true, summary: true },
  },
  comments: {
    orderBy: { createdAt: "asc" as const },
    select: {
      id: true,
      text: true,
      type: true,
      startTime: true,
      endTime: true,
      segmentId: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.MeetingSelect;

// Shared types mirroring the API responses.

export type Person = {
  id: string;
  name: string;
  email?: string | null;
  avatarColor: string;
  title?: string | null;
};

export type MeetingParticipant = {
  role: string | null;
  person: Person;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type MeetingTag = { tag: Tag };

export type MeetingSummary = {
  id: string;
  title: string;
  date: string;
  durationSec: number;
  meetingType: string;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
  organizer: { id: string; name: string } | null;
  participants: MeetingParticipant[];
  tags: MeetingTag[];
  _count: { segments: number; actionItems: number; comments: number };
};

export type TranscriptSegment = {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker: {
    id: string;
    name: string;
    avatarColor: string;
    title: string | null;
  };
  comments: {
    id: string;
    text: string;
    type: string;
    startTime: number | null;
    endTime: number | null;
    createdAt: string;
  }[];
};

export type ActionItem = {
  id: string;
  text: string;
  assignee: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  priority: string;
  createdAt: string;
};

export type Topic = {
  id: string;
  name: string;
  startTime: number;
  endTime: number | null;
  summary: string | null;
};

export type Comment = {
  id: string;
  text: string;
  type: string;
  startTime: number | null;
  endTime: number | null;
  segmentId: string | null;
  createdAt: string;
  user: { id: string; name: string } | null;
};

export type Summary = {
  id: string;
  overview: string;
  keyPoints: string[];
  decisions: string[];
};

export type MeetingDetail = {
  id: string;
  title: string;
  date: string;
  durationSec: number;
  meetingType: string;
  source: string;
  status: string;
  notes: string | null;
  createdAt: string;
  organizer: { id: string; name: string } | null;
  participants: MeetingParticipant[];
  tags: MeetingTag[];
  _count: { segments: number; actionItems: number; comments: number };
  segments: TranscriptSegment[];
  actionItems: ActionItem[];
  summary: Summary | null;
  topics: Topic[];
  comments: Comment[];
};

export type Stats = {
  meetings: number;
  totalMinutes: number;
  actionItems: number;
  completedActionItems: number;
  people: number;
};

export type TranscriptHit = {
  id: string;
  meetingId: string;
  startTime: number;
  endTime: number;
  text: string;
  speaker: { name: string; avatarColor: string };
  meeting: { id: string; title: string; date: string; durationSec: number };
};

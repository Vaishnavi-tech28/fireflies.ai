import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetingSummarySelect } from "@/lib/fireflies/queries";

// GET /api/search?q=...
// Searches meeting titles, participants, AND transcript text.
// Returns matching meetings + per-meeting transcript hits.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) {
    return NextResponse.json({ meetings: [], transcriptHits: [] });
  }

  // 1. meetings matching title / participant / organizer
  const allMeetings = await db.meeting.findMany({
    select: meetingSummarySelect,
    orderBy: { date: "desc" },
  });
  const titleOrParticipantMatches = allMeetings.filter(
    (m) =>
      m.title.toLowerCase().includes(q) ||
      m.participants.some((p) =>
        p.person.name.toLowerCase().includes(q),
      ) ||
      (m.organizer?.name || "").toLowerCase().includes(q),
  );

  // 2. transcript text matches (raw SQL contains is case-insensitive in sqlite via LIKE)
  const segs = await db.transcriptSegment.findMany({
    where: { text: { contains: q } },
    select: {
      id: true,
      meetingId: true,
      startTime: true,
      endTime: true,
      text: true,
      speaker: { select: { name: true, avatarColor: true } },
      meeting: {
        select: { id: true, title: true, date: true, durationSec: true },
      },
    },
    take: 50,
  });

  return NextResponse.json({
    meetings: titleOrParticipantMatches,
    transcriptHits: segs,
  });
}

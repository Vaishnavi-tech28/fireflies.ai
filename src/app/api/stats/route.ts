import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats — dashboard header numbers
export async function GET() {
  const [
    meetingCount,
    totalDurationAgg,
    actionItemsAgg,
    completedActionAgg,
    participantsAgg,
  ] = await Promise.all([
    db.meeting.count(),
    db.meeting.aggregate({ _sum: { durationSec: true } }),
    db.actionItem.count(),
    db.actionItem.count({ where: { completed: true } }),
    db.person.count(),
  ]);

  const totalDurationSec = totalDurationAgg._sum.durationSec || 0;

  return NextResponse.json({
    meetings: meetingCount,
    totalMinutes: Math.round(totalDurationSec / 60),
    actionItems: actionItemsAgg,
    completedActionItems: completedActionAgg,
    people: participantsAgg,
  });
}

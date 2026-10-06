import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { meetingDetailSelect } from "@/lib/fireflies/queries";

interface Ctx {
  params: Promise<{ id: string }>;
}

// GET /api/meetings/[id] — full meeting detail
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const meeting = await db.meeting.findUnique({
    where: { id },
    select: meetingDetailSelect,
  });
  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  // parse JSON string fields for the client
  const parsed = {
    ...meeting,
    summary: meeting.summary
      ? {
          ...meeting.summary,
          keyPoints: safeJsonParse(meeting.summary.keyPoints, []),
          decisions: safeJsonParse(meeting.summary.decisions, []),
        }
      : null,
  };
  return NextResponse.json({ meeting: parsed });
}

// PATCH /api/meetings/[id] — update meeting metadata (+ optional participants)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (body.date) data.date = new Date(body.date);
  if (typeof body.meetingType === "string") data.meetingType = body.meetingType;
  if (typeof body.notes === "string") data.notes = body.notes;
  if (typeof body.durationSec === "number") data.durationSec = body.durationSec;

  if (Array.isArray(body.participants)) {
    const existing = await db.meetingParticipant.findMany({
      where: { meetingId: id },
      select: { personId: true },
    });
    const existingIds = new Set(existing.map((e) => e.personId));
    const incomingNames: string[] = body.participants.filter(Boolean);
    const incomingPeople = await Promise.all(
      incomingNames.map(async (name: string) => {
        const trimmed = name.trim();
        const email = `${trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, ".")}@imported.local`;
        return db.person.upsert({
          where: { email },
          update: { name: trimmed },
          create: { name: trimmed, email },
        });
      }),
    );
    const incomingIds = new Set(incomingPeople.map((p) => p.id));
    // remove participants no longer in list
    const toRemove = [...existingIds].filter((x) => !incomingIds.has(x));
    if (toRemove.length > 0) {
      await db.meetingParticipant.deleteMany({
        where: { meetingId: id, personId: { in: toRemove } },
      });
    }
    // add new participants
    const toAdd = incomingPeople.filter((p) => !existingIds.has(p.id));
    if (toAdd.length > 0) {
      await db.meetingParticipant.createMany({
        data: toAdd.map((p, i) => ({
          meetingId: id,
          personId: p.id,
          role: i === 0 && existing.size === 0 ? "host" : null,
        })),
        skipDuplicates: true,
      });
    }
  }

  const updated = await db.meeting.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/meetings/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.meeting.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

function safeJsonParse(s: string | null | undefined, fallback: any) {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

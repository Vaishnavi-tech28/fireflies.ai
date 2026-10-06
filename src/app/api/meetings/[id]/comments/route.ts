import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// POST /api/meetings/[id]/comments — add a comment / highlight / soundbite
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: meetingId } = await params;
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").toString().trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const type = (body.type || "comment").toString();
  const comment = await db.comment.create({
    data: {
      meetingId,
      text,
      type,
      segmentId: body.segmentId || null,
      startTime:
        typeof body.startTime === "number" ? body.startTime : null,
      endTime: typeof body.endTime === "number" ? body.endTime : null,
      userId: body.userId || null,
    },
  });
  return NextResponse.json({ id: comment.id }, { status: 201 });
}

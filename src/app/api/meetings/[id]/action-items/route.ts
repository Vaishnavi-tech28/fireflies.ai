import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// POST /api/meetings/[id]/action-items — add an action item
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: meetingId } = await params;
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").toString().trim();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }
  const item = await db.actionItem.create({
    data: {
      meetingId,
      text,
      assignee: body.assignee || null,
      priority: body.priority || "medium",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completed: false,
    },
  });
  return NextResponse.json({ id: item.id }, { status: 201 });
}

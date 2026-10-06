import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// PATCH /api/action-items/[id] — update (complete, edit, reprioritize)
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.text === "string") data.text = body.text;
  if (typeof body.assignee === "string") data.assignee = body.assignee || null;
  if (body.priority) data.priority = body.priority;
  if (body.dueDate) data.dueDate = new Date(body.dueDate);
  if (typeof body.completed === "boolean") {
    data.completed = body.completed;
    data.completedAt = body.completed ? new Date() : null;
  }
  const updated = await db.actionItem.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/action-items/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.actionItem.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

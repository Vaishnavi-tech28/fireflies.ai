import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Ctx {
  params: Promise<{ id: string }>;
}

// PATCH /api/comments/[id]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: any = {};
  if (typeof body.text === "string") data.text = body.text;
  if (body.type) data.type = body.type;
  if (typeof body.startTime === "number") data.startTime = body.startTime;
  if (typeof body.endTime === "number") data.endTime = body.endTime;
  const updated = await db.comment.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id });
}

// DELETE /api/comments/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  await db.comment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/tags
export async function GET() {
  const tags = await db.tag.findMany({
    select: {
      id: true,
      name: true,
      color: true,
      _count: { select: { meetings: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ tags });
}

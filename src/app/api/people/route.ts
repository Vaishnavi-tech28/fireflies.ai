import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/people — for participant pickers
export async function GET() {
  const people = await db.person.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      avatarColor: true,
      title: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ people });
}

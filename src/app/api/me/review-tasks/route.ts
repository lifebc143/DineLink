import { and, eq, inArray, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, eventReviews, users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const mine = await db.select({ event: diningEvents, attendance: eventAttendances })
    .from(eventAttendances)
    .innerJoin(diningEvents, eq(eventAttendances.eventId, diningEvents.id))
    .where(and(eq(eventAttendances.userId, user.id), eq(diningEvents.status, "completed"), inArray(eventAttendances.status, ["attended", "late"])));
  const eventIds = mine.map((row) => row.event.id);
  if (eventIds.length === 0) return NextResponse.json({ tasks: [] });

  const [submitted, peers] = await Promise.all([
    db.select().from(eventReviews).where(and(eq(eventReviews.reviewerId, user.id), inArray(eventReviews.eventId, eventIds))),
    db.select({ event: diningEvents, attendance: eventAttendances, peer: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
      .from(eventAttendances)
      .innerJoin(diningEvents, eq(eventAttendances.eventId, diningEvents.id))
      .innerJoin(users, eq(eventAttendances.userId, users.id))
      .where(and(inArray(eventAttendances.eventId, eventIds), ne(eventAttendances.userId, user.id), inArray(eventAttendances.status, ["attended", "late"]))),
  ]);
  const submittedKeys = new Set(submitted.map((review) => `${review.eventId}:${review.revieweeId}`));
  const tasks = peers.filter((row) => !submittedKeys.has(`${row.event.id}:${row.peer.id}`)).map((row) => ({ event: row.event, peer: row.peer }));
  return NextResponse.json({ tasks });
}

import { NextResponse } from "next/server";
import { and, eq, inArray, ne } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { pendingReviewTasks } from "@/lib/review-tasks";
import { diningEvents, eventAttendances, eventReviews, users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const [attendedRows, hostedEvents] = await Promise.all([
    db.select({ event: diningEvents, host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
      .from(eventAttendances)
      .innerJoin(diningEvents, eq(eventAttendances.eventId, diningEvents.id))
      .innerJoin(users, eq(diningEvents.hostId, users.id))
      .where(and(eq(eventAttendances.userId, user.id), eq(diningEvents.status, "completed"), inArray(eventAttendances.status, ["attended", "late"]))),
    db.select().from(diningEvents).where(and(eq(diningEvents.hostId, user.id), eq(diningEvents.status, "completed"))),
  ]);
  const eventMap = new Map<string, typeof diningEvents.$inferSelect>();
  for (const row of attendedRows) eventMap.set(row.event.id, row.event);
  for (const event of hostedEvents) eventMap.set(event.id, event);
  const eventIds = [...eventMap.keys()];
  if (eventIds.length === 0) return NextResponse.json({ tasks: [] });

  const [submitted, attendancePeers] = await Promise.all([
    db.select().from(eventReviews).where(and(eq(eventReviews.reviewerId, user.id), inArray(eventReviews.eventId, eventIds))),
    db.select({ event: diningEvents, attendance: eventAttendances, peer: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
      .from(eventAttendances)
      .innerJoin(diningEvents, eq(eventAttendances.eventId, diningEvents.id))
      .innerJoin(users, eq(eventAttendances.userId, users.id))
      .where(and(inArray(eventAttendances.eventId, eventIds), ne(eventAttendances.userId, user.id), inArray(eventAttendances.status, ["attended", "late"]))),
  ]);
  const submittedKeys = new Set(submitted.map((review) => `${review.eventId}:${review.revieweeId}`));
  const hostCandidates = attendedRows.map((row) => ({ event: row.event, peer: row.host }));
  const tasks = pendingReviewTasks({ userId: user.id, submittedKeys, candidates: [...attendancePeers.map((row) => ({ event: row.event, peer: row.peer })), ...hostCandidates] });
  return NextResponse.json({ tasks });
}

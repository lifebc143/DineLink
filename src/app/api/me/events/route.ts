import { and, asc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventApplications, eventAttendances, users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const hostedEvents = await db.select().from(diningEvents).where(eq(diningEvents.hostId, user.id)).orderBy(asc(diningEvents.eventStartAt));
  const hostedEventIds = hostedEvents.map((event) => event.id);
  const [pendingRows, attendanceRows] = hostedEventIds.length === 0
    ? [[], []]
    : await Promise.all([
      db.select({ application: eventApplications, applicant: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
        .from(eventApplications)
        .innerJoin(users, eq(eventApplications.applicantId, users.id))
        .where(and(inArray(eventApplications.eventId, hostedEventIds), eq(eventApplications.status, "pending"))),
      db.select({ attendance: eventAttendances, member: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
        .from(eventAttendances)
        .innerJoin(users, eq(eventAttendances.userId, users.id))
        .where(inArray(eventAttendances.eventId, hostedEventIds)),
    ]);

  const appliedRows = await db.select({ application: eventApplications, event: diningEvents, host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
    .from(eventApplications)
    .innerJoin(diningEvents, eq(eventApplications.eventId, diningEvents.id))
    .innerJoin(users, eq(diningEvents.hostId, users.id))
    .where(eq(eventApplications.applicantId, user.id))
    .orderBy(asc(diningEvents.eventStartAt));

  return NextResponse.json({
    hosted: hostedEvents.map((event) => ({
      event,
      pendingApplications: pendingRows.filter((row) => row.application.eventId === event.id),
      attendances: attendanceRows.filter((row) => row.attendance.eventId === event.id),
    })),
    applied: appliedRows,
  });
}

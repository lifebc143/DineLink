import { count, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { eventApplications, eventAttendances, diningEvents, users } from "../../../../../drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (currentUser.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const [registered, verified, pendingVerification, restrictedMembers, eventsTotal, publishedEvents, applicationsTotal, pendingApplications, attendancesTotal, noShows, recentMembers] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(users).where(eq(users.verificationStatus, "verified")),
    db.select({ value: count() }).from(users).where(eq(users.verificationStatus, "pending")),
    db.select({ value: count() }).from(users).where(inArray(users.accountStatus, ["suspended", "deactivated"])),
    db.select({ value: count() }).from(diningEvents),
    db.select({ value: count() }).from(diningEvents).where(eq(diningEvents.status, "published")),
    db.select({ value: count() }).from(eventApplications),
    db.select({ value: count() }).from(eventApplications).where(eq(eventApplications.status, "pending")),
    db.select({ value: count() }).from(eventAttendances),
    db.select({ value: count() }).from(eventAttendances).where(inArray(eventAttendances.status, ["no_show"])),
    db.select({ id: users.id, displayName: users.displayName, role: users.role, verificationStatus: users.verificationStatus, accountStatus: users.accountStatus, suspensionReason: users.suspensionReason, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(50),
  ]);

  return NextResponse.json({
    metrics: {
      registeredMembers: registered[0]?.value ?? 0,
      verifiedMembers: verified[0]?.value ?? 0,
      pendingVerification: pendingVerification[0]?.value ?? 0,
      restrictedMembers: restrictedMembers[0]?.value ?? 0,
      totalEvents: eventsTotal[0]?.value ?? 0,
      publishedEvents: publishedEvents[0]?.value ?? 0,
      totalApplications: applicationsTotal[0]?.value ?? 0,
      pendingApplications: pendingApplications[0]?.value ?? 0,
      totalAttendances: attendancesTotal[0]?.value ?? 0,
      noShowCount: noShows[0]?.value ?? 0,
    },
    recentMembers,
  });
}

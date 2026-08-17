import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, eventReviews, users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const [profile] = await db.select({ creditScore: users.creditScore, completedEventCount: users.completedEventCount, noShowCount: users.noShowCount }).from(users).where(eq(users.id, user.id)).limit(1);
  if (!profile) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  const attendanceRows = await db.select({ status: eventAttendances.status }).from(eventAttendances).where(eq(eventAttendances.userId, user.id));
  const settled = attendanceRows.filter((row) => row.status !== "confirmed");
  const positive = settled.filter((row) => row.status === "attended" || row.status === "late").length;
  const attendanceRate = settled.length ? Math.round((positive / settled.length) * 100) : null;

  const reviews = await db.select({ eventId: eventReviews.eventId, punctualityScore: eventReviews.punctualityScore, politenessScore: eventReviews.politenessScore, funScore: eventReviews.funScore, submittedAt: eventReviews.submittedAt }).from(eventReviews).where(eq(eventReviews.revieweeId, user.id)).orderBy(asc(eventReviews.submittedAt));
  const hostedCompletedEvents = await db.select({ id: diningEvents.id }).from(diningEvents).where(and(eq(diningEvents.hostId, user.id), eq(diningEvents.status, "completed")));
  const completedEventIds = new Set<string>([
    ...hostedCompletedEvents.map((event) => event.id),
    ...reviews.map((review) => review.eventId),
  ]);
  const completedEventCount = Math.max(profile.completedEventCount, completedEventIds.size);
  let runningTotal = 0;
  const trend = reviews.map((review, index) => {
    runningTotal += (review.punctualityScore + review.politenessScore + review.funScore) / 3;
    return { label: review.submittedAt.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" }), score: Math.round((runningTotal / (index + 1)) * 20) };
  });
  const dimensionAverage = (field: "punctualityScore" | "politenessScore" | "funScore") => reviews.length ? Number((reviews.reduce((sum, review) => sum + review[field], 0) / reviews.length).toFixed(1)) : null;

  return NextResponse.json({ creditScore: profile.creditScore, completedEventCount, noShowCount: profile.noShowCount, attendanceRate, attendanceTotal: settled.length, trend, dimensions: { punctuality: dimensionAverage("punctualityScore"), politeness: dimensionAverage("politenessScore"), interaction: dimensionAverage("funScore") } });
}

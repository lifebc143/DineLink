import { NextRequest, NextResponse } from "next/server";
import { and, avg, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, eventReviews, users } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";
const reviewInput = z.object({ revieweeId: z.string().uuid(), punctualityScore: z.number().int().min(1).max(5), politenessScore: z.number().int().min(1).max(5), funScore: z.number().int().min(1).max(5), attendanceNote: z.string().trim().max(500).optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const reviewer = await getCurrentUser();
  if (!reviewer) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  const input = reviewInput.safeParse(await request.json());
  if (!input.success || input.data.revieweeId === reviewer.id) return NextResponse.json({ error: "INVALID_REVIEW" }, { status: 400 });
  try {
    const review = await db.transaction(async (tx) => {
      const [event] = await tx.select().from(diningEvents).where(and(eq(diningEvents.id, eventId), eq(diningEvents.status, "completed"))).limit(1);
      if (!event) throw new Error("EVENT_NOT_COMPLETED");
      const attendance = await tx.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, eventId), inArray(eventAttendances.userId, [reviewer.id, input.data.revieweeId]), inArray(eventAttendances.status, ["attended", "late"])));
      const reviewerEligible = reviewer.id === event.hostId || attendance.some((entry) => entry.userId === reviewer.id);
      const revieweeEligible = input.data.revieweeId === event.hostId || attendance.some((entry) => entry.userId === input.data.revieweeId);
      if (!reviewerEligible || !revieweeEligible) throw new Error("REVIEW_ATTENDANCE_REQUIRED");
      const [created] = await tx.insert(eventReviews).values({ eventId, reviewerId: reviewer.id, revieweeId: input.data.revieweeId, punctualityScore: input.data.punctualityScore, politenessScore: input.data.politenessScore, funScore: input.data.funScore, privateNote: input.data.attendanceNote }).returning();
      const [summary] = await tx.select({ punctuality: avg(eventReviews.punctualityScore), politeness: avg(eventReviews.politenessScore), fun: avg(eventReviews.funScore) }).from(eventReviews).where(eq(eventReviews.revieweeId, input.data.revieweeId));
      const total = Number(summary?.punctuality ?? 0) + Number(summary?.politeness ?? 0) + Number(summary?.fun ?? 0);
      const creditScore = Math.min(100, Math.max(0, Math.round(50 + total / 3 * 10)));
      await tx.update(users).set({ creditScore, updatedAt: new Date() }).where(eq(users.id, input.data.revieweeId));
      return created;
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "REVIEW_FAILED" }, { status: 409 }); }
}

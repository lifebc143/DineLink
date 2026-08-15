import { and, count, eq, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventApplications, eventAttendances, notifications } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";
const reviewInput = z.object({ decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(280).optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ applicationId: string }> }) {
  const host = await getCurrentUser();
  if (!host) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const parsed = reviewInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_REVIEW" }, { status: 400 });
  const { applicationId } = await params;
  try {
    const result = await db.transaction(async (tx) => {
      const [application] = await tx.select().from(eventApplications).where(eq(eventApplications.id, applicationId)).limit(1);
      if (!application || application.status !== "pending") throw new Error("APPLICATION_NOT_PENDING");
      const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, application.eventId)).limit(1);
      if (!event || event.hostId !== host.id) throw new Error("NOT_EVENT_HOST");
      if (parsed.data.decision === "rejected") {
        await tx.update(eventApplications).set({ status: "rejected", reviewedBy: host.id, reviewNote: parsed.data.note, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(eventApplications.id, application.id));
        await tx.insert(notifications).values({ recipientId: application.applicantId, eventId: event.id, applicationId: application.id, type: "application_rejected", title: "飯局申請未被接受", body: "主辦人未核准這次申請，你可以繼續探索其他飯局。" });
        return { status: "rejected" as const };
      }
      const [approvedCount] = await tx.select({ total: count() }).from(eventAttendances).where(and(eq(eventAttendances.eventId, event.id), inArray(eventAttendances.status, ["confirmed", "attended", "late"])));
      if (Number(approvedCount?.total ?? 0) >= event.capacity) throw new Error("EVENT_CAPACITY_REACHED");
      await tx.update(eventApplications).set({ status: "approved", reviewedBy: host.id, reviewNote: parsed.data.note, reviewedAt: new Date(), updatedAt: new Date() }).where(eq(eventApplications.id, application.id));
      await tx.insert(eventAttendances).values({ eventId: event.id, userId: application.applicantId, applicationId: application.id, status: "confirmed" });
      const isFull = Number(approvedCount?.total ?? 0) + 1 >= event.capacity;
      if (isFull) await tx.update(diningEvents).set({ status: "full", updatedAt: new Date() }).where(eq(diningEvents.id, event.id));
      await tx.insert(notifications).values({ recipientId: application.applicantId, eventId: event.id, applicationId: application.id, type: "application_approved", title: "飯局申請已核准", body: "你已加入確認成員，可進入群組聊天室。" });
      return { status: "approved" as const, isFull };
    });
    return NextResponse.json(result);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "REVIEW_FAILED" }, { status: 409 }); }
}

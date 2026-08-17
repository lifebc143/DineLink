import { and, eq, inArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, eventDeposits, notifications, pointTransactions, users } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const host = await getCurrentUser();
  if (!host) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  try {
    const result = await db.transaction(async (tx) => {
      const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
      if (!event || event.hostId !== host.id) throw new Error("NOT_EVENT_HOST");
      if (event.status === "completed" || event.status === "cancelled") throw new Error("EVENT_ALREADY_FINALIZED");
      const attendances = await tx.select().from(eventAttendances).where(eq(eventAttendances.eventId, eventId));
      let releasedCount = 0;
      let forfeitedCount = 0;
      for (const attendance of attendances) {
        const [deposit] = await tx.select().from(eventDeposits).where(and(eq(eventDeposits.eventId, eventId), eq(eventDeposits.userId, attendance.userId), eq(eventDeposits.status, "held"))).limit(1);
        if (!deposit) continue;
        if (["attended", "late"].includes(attendance.status)) {
          const [member] = await tx.select().from(users).where(eq(users.id, attendance.userId)).limit(1);
          const balanceAfter = (member?.pointBalance ?? 0) + deposit.points;
          await tx.update(eventDeposits).set({ status: "released", releasedAt: new Date() }).where(eq(eventDeposits.id, deposit.id));
          await tx.update(users).set({ pointBalance: balanceAfter, completedEventCount: sql`${users.completedEventCount} + 1`, updatedAt: new Date() }).where(eq(users.id, attendance.userId));
          await tx.insert(pointTransactions).values({ userId: attendance.userId, eventId, depositId: deposit.id, type: "deposit_release", delta: deposit.points, balanceAfter, note: "完成飯局，退回保證點數" });
          releasedCount += 1;
        } else if (attendance.status === "no_show") {
          await tx.update(eventDeposits).set({ status: "forfeited", forfeitedAt: new Date() }).where(eq(eventDeposits.id, deposit.id));
          await tx.update(users).set({ noShowCount: sql`${users.noShowCount} + 1`, creditScore: sql`GREATEST(0, ${users.creditScore} - 15)`, updatedAt: new Date() }).where(eq(users.id, attendance.userId));
          const [member] = await tx.select().from(users).where(eq(users.id, attendance.userId)).limit(1);
          await tx.insert(pointTransactions).values({ userId: attendance.userId, eventId, depositId: deposit.id, type: "deposit_forfeit", delta: 0, balanceAfter: member?.pointBalance ?? 0, note: "爽約，保證點數已沒收" });
          forfeitedCount += 1;
        }
      }
      const completedAt = new Date();
      const reviewDueAt = new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000);
      await tx.update(diningEvents).set({ status: "completed", completedAt, reviewDueAt, reviewReminderSentAt: null, updatedAt: completedAt }).where(eq(diningEvents.id, eventId));
      await tx.update(users).set({ completedEventCount: sql`${users.completedEventCount} + 1`, updatedAt: completedAt }).where(eq(users.id, event.hostId));
      const attendees = attendances.filter((entry) => ["attended", "late"].includes(entry.status));
      if (attendees.length) {
        const reviewRecipientIds = [...new Set([...attendees.map((entry) => entry.userId), event.hostId])];
        await tx.insert(notifications).values(reviewRecipientIds.map((recipientId) => ({ recipientId, eventId, type: "review_request" as const, title: "飯局已完成，邀請你留下互評", body: "請針對同場成員評估準時、禮貌與趣味，幫助社群建立信任。" })));
      }
      return { status: "completed" as const, releasedCount, forfeitedCount };
    });
    return NextResponse.json(result);
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "COMPLETE_EVENT_FAILED" }, { status: 409 }); }
}

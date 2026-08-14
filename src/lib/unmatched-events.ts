import { and, eq, inArray, lte, notExists, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { diningEvents, eventApplications, eventAttendances, notifications } from "../../drizzle/schema";

export const UNMATCHED_EVENT_STATUS = "unmatched" as const;

/** Closes only past published events with no approved attendance; safe to rerun after retries. */
export async function settleExpiredUnmatchedEvents(now = new Date()) {
  return db.transaction(async (tx) => {
    const candidates = await tx.select({ id: diningEvents.id, hostId: diningEvents.hostId, title: diningEvents.title })
      .from(diningEvents)
      .where(and(
        eq(diningEvents.status, "published"),
        lte(diningEvents.eventStartAt, now),
        notExists(tx.select({ one: sql<number>`1` }).from(eventAttendances).where(eq(eventAttendances.eventId, diningEvents.id))),
      ));
    if (candidates.length === 0) return { settled: 0, eventIds: [] as string[] };
    const eventIds = candidates.map((event) => event.id);
    await tx.update(diningEvents).set({ status: UNMATCHED_EVENT_STATUS, unmatchedAt: now, updatedAt: now }).where(inArray(diningEvents.id, eventIds));
    await tx.update(eventApplications).set({ status: "cancelled", reviewedAt: now, reviewNote: "飯局逾時未成局，系統已自動結束。", updatedAt: now }).where(and(inArray(eventApplications.eventId, eventIds), eq(eventApplications.status, "pending")));
    await tx.insert(notifications).values(candidates.map((event) => ({ recipientId: event.hostId, eventId: event.id, type: "event_unmatched" as const, title: "飯局未成局，已自動結束", body: `「${event.title}」在開始前未有已確認成員，已停止報名並移入歷史紀錄。`, payload: { eventId: event.id, outcome: "unmatched" } })));
    return { settled: eventIds.length, eventIds };
  });
}

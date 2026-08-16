import { and, eq, inArray, isNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, eventReviews, notifications } from "../../drizzle/schema";
import { pendingReviewRecipients } from "@/lib/review-progress";

const REVIEWABLE_ATTENDANCE = ["attended", "late"] as const;

/** Sends one overdue-review reminder per completed event, using the event marker for idempotency. */
export async function sendOverdueReviewReminders(now = new Date()) {
  const events = await db.select().from(diningEvents).where(and(
    eq(diningEvents.status, "completed"),
    lte(diningEvents.reviewDueAt, now),
    isNull(diningEvents.reviewReminderSentAt),
  ));
  let remindedEvents = 0;
  let notifiedMembers = 0;

  for (const event of events) {
    await db.transaction(async (tx) => {
      const [claimed] = await tx.update(diningEvents)
        .set({ reviewReminderSentAt: now, updatedAt: now })
        .where(and(eq(diningEvents.id, event.id), isNull(diningEvents.reviewReminderSentAt)))
        .returning({ id: diningEvents.id });
      if (!claimed) return;

      const attendees = await tx.select().from(eventAttendances).where(and(
        eq(eventAttendances.eventId, event.id),
        inArray(eventAttendances.status, REVIEWABLE_ATTENDANCE),
      ));
      const participantIds = [...new Set([event.hostId, ...attendees.map((attendance) => attendance.userId)])];
      if (participantIds.length < 2) return;

      const reviews = await tx.select({ reviewerId: eventReviews.reviewerId, revieweeId: eventReviews.revieweeId })
        .from(eventReviews).where(eq(eventReviews.eventId, event.id));
      const recipients = pendingReviewRecipients(participantIds, reviews);
      if (!recipients.length) return;

      await tx.insert(notifications).values(recipients.map((recipientId) => ({
        recipientId,
        eventId: event.id,
        type: "review_request" as const,
        title: "互評提醒：評價期限已到",
        body: `請完成「${event.title}」的飯後評價，協助更新彼此的信用摘要。`,
        payload: { reminder: "overdue_review", reviewDueAt: event.reviewDueAt?.toISOString() ?? null },
      })));
      remindedEvents += 1;
      notifiedMembers += recipients.length;
    });
  }
  return { scannedEvents: events.length, remindedEvents, notifiedMembers };
}

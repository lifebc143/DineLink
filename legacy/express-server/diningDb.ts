import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import {
  chatMessages,
  diningEvents,
  eventApplications,
  eventAttendances,
  eventDeposits,
  eventReviews,
  notifications,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";

function requireDb<T>(db: T | null): T {
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  return db;
}

async function requireEvent(eventId: number) {
  const db = requireDb(await getDb());
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
  if (!event) throw new Error("EVENT_NOT_FOUND");
  return event;
}

export async function listPublishedEvents() {
  const db = requireDb(await getDb());
  return db.select({ event: diningEvents, host: { id: users.id, name: users.name, avatarUrl: users.openId } })
    .from(diningEvents)
    .innerJoin(users, eq(diningEvents.hostId, users.id))
    .where(inArray(diningEvents.status, ["published", "full", "locked"]))
    .orderBy(diningEvents.eventStartAt);
}

export async function createDiningEvent(input: {
  hostId: number; title: string; description?: string; eventStartAt: Date; venueAddress: string;
  restaurantName?: string; placeId?: string; latitude?: string; longitude?: string; capacity: number;
  paymentMode: "host_treats" | "split_bill" | "men_treat_women"; budgetMin?: number; budgetMax?: number; depositPoints: number;
}) {
  const db = requireDb(await getDb());
  const inserted = await db.insert(diningEvents).values({ ...input, status: "published" }).$returningId();
  return inserted[0]?.id;
}

export async function saveEventReminderTask(eventId: number, taskUid: string) {
  const db = requireDb(await getDb());
  await db.update(diningEvents).set({ reminderTaskUid: taskUid }).where(eq(diningEvents.id, eventId));
}

export async function createEventReminderNotifications(taskUid: string) {
  const db = requireDb(await getDb());
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.reminderTaskUid, taskUid)).limit(1);
  if (!event || !["published", "full", "locked"].includes(event.status)) return { skipped: true, count: 0 };
  const members = await db.select({ userId: eventAttendances.userId }).from(eventAttendances)
    .where(and(eq(eventAttendances.eventId, event.id), eq(eventAttendances.status, "confirmed")));
  let count = 0;
  for (const member of members) {
    const dedupeKey = `event-reminder:${event.id}:${member.userId}`;
    const [existing] = await db.select({ id: notifications.id }).from(notifications).where(eq(notifications.dedupeKey, dedupeKey)).limit(1);
    if (existing) continue;
    await db.insert(notifications).values({ recipientId: member.userId, eventId: event.id, type: "event_reminder", title: "飯局將在兩小時後開始", body: `${event.title} 即將開始，請確認路線與出發時間。`, payload: { eventId: event.id }, dedupeKey });
    count += 1;
  }
  return { skipped: false, count };
}

export async function applyToDiningEvent(input: { eventId: number; applicantId: number; introduction?: string }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, input.eventId)).limit(1);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (event.hostId === input.applicantId) throw new Error("HOST_CANNOT_APPLY");
    if (event.status !== "published") throw new Error("EVENT_NOT_OPEN");
    const [existing] = await tx.select({ id: eventApplications.id }).from(eventApplications)
      .where(and(eq(eventApplications.eventId, input.eventId), eq(eventApplications.applicantId, input.applicantId))).limit(1);
    if (existing) throw new Error("APPLICATION_EXISTS");
    const [applicant] = await tx.select().from(users).where(eq(users.id, input.applicantId)).limit(1);
    if (!applicant || applicant.pointBalance < event.depositPoints) throw new Error("INSUFFICIENT_POINTS");

    const inserted = await tx.insert(eventApplications).values({ eventId: input.eventId, applicantId: input.applicantId, introduction: input.introduction }).$returningId();
    const applicationId = inserted[0]?.id;
    if (!applicationId) throw new Error("APPLICATION_CREATE_FAILED");
    await tx.insert(eventDeposits).values({ eventId: input.eventId, applicationId, userId: input.applicantId, points: event.depositPoints, status: "held" });
    await tx.update(users).set({ pointBalance: applicant.pointBalance - event.depositPoints }).where(eq(users.id, input.applicantId));
    await tx.insert(notifications).values({ recipientId: event.hostId, eventId: input.eventId, applicationId, type: "application_submitted", title: "收到新的飯局申請", body: "有新成員正在等待你的審核。", payload: { applicationId } });
    return { applicationId, status: "pending" as const, depositPoints: event.depositPoints };
  });
}

export async function reviewDiningApplication(input: { eventId: number; applicationId: number; hostId: number; approve: boolean; reviewNote?: string }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, input.eventId)).limit(1);
    if (!event) throw new Error("EVENT_NOT_FOUND");
    if (event.hostId !== input.hostId) throw new Error("NOT_EVENT_HOST");
    const [application] = await tx.select().from(eventApplications).where(and(eq(eventApplications.id, input.applicationId), eq(eventApplications.eventId, input.eventId))).limit(1);
    if (!application) throw new Error("APPLICATION_NOT_FOUND");
    if (application.status !== "pending") throw new Error("APPLICATION_NOT_PENDING");
    const [deposit] = await tx.select().from(eventDeposits).where(eq(eventDeposits.applicationId, application.id)).limit(1);
    if (!deposit) throw new Error("DEPOSIT_NOT_FOUND");

    if (!input.approve) {
      await tx.update(eventApplications).set({ status: "rejected", reviewedBy: input.hostId, reviewNote: input.reviewNote, reviewedAt: new Date() }).where(eq(eventApplications.id, application.id));
      await tx.update(eventDeposits).set({ status: "released" }).where(eq(eventDeposits.id, deposit.id));
      await tx.update(users).set({ pointBalance: sql`${users.pointBalance} + ${deposit.points}` }).where(eq(users.id, application.applicantId));
      await tx.insert(notifications).values({ recipientId: application.applicantId, eventId: input.eventId, applicationId: application.id, type: "application_rejected", title: "飯局申請未被接受", body: "保證點數已退回你的帳戶。", payload: { applicationId: application.id } });
      return { status: "rejected" as const };
    }

    const [approved] = await tx.select({ total: count() }).from(eventApplications).where(and(eq(eventApplications.eventId, input.eventId), eq(eventApplications.status, "approved")));
    if ((approved?.total ?? 0) >= event.capacity) throw new Error("EVENT_CAPACITY_REACHED");
    await tx.update(eventApplications).set({ status: "approved", reviewedBy: input.hostId, reviewNote: input.reviewNote, reviewedAt: new Date() }).where(eq(eventApplications.id, application.id));
    await tx.insert(eventAttendances).values({ eventId: input.eventId, userId: application.applicantId, applicationId: application.id, status: "confirmed" });
    const isFull = (approved?.total ?? 0) + 1 === event.capacity;
    if (isFull) await tx.update(diningEvents).set({ status: "full" }).where(eq(diningEvents.id, input.eventId));
    await tx.insert(notifications).values({ recipientId: application.applicantId, eventId: input.eventId, applicationId: application.id, type: "application_approved", title: "飯局申請已核准", body: "你已加入確認成員，可進入群組聊天室。", payload: { applicationId: application.id } });
    return { status: "approved" as const, isFull };
  });
}

export async function listEventMessages(input: { eventId: number; userId: number }) {
  const event = await requireEvent(input.eventId);
  const db = requireDb(await getDb());
  if (event.hostId !== input.userId) {
    const [attendance] = await db.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), eq(eventAttendances.userId, input.userId))).limit(1);
    if (!attendance || !["confirmed", "attended", "late"].includes(attendance.status)) throw new Error("CHAT_ACCESS_DENIED");
  }
  return db.select({ message: chatMessages, author: { id: users.id, name: users.name } }).from(chatMessages)
    .innerJoin(users, eq(chatMessages.authorId, users.id)).where(eq(chatMessages.eventId, input.eventId)).orderBy(chatMessages.createdAt);
}

export async function sendEventMessage(input: { eventId: number; authorId: number; content: string }) {
  await listEventMessages({ eventId: input.eventId, userId: input.authorId });
  const db = requireDb(await getDb());
  const inserted = await db.insert(chatMessages).values(input).$returningId();
  return inserted[0]?.id;
}

export async function submitEventReview(input: { eventId: number; reviewerId: number; revieweeId: number; punctualityScore: number; politenessScore: number; funScore: number }) {
  if (input.reviewerId === input.revieweeId) throw new Error("SELF_REVIEW_FORBIDDEN");
  const event = await requireEvent(input.eventId);
  if (event.status !== "completed") throw new Error("EVENT_NOT_COMPLETED");
  const db = requireDb(await getDb());
  const attendance = await db.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), inArray(eventAttendances.userId, [input.reviewerId, input.revieweeId])));
  if (attendance.length !== 2 || attendance.some((entry) => !["attended", "late"].includes(entry.status))) throw new Error("REVIEW_ATTENDANCE_REQUIRED");
  const inserted = await db.insert(eventReviews).values(input).$returningId();
  const [summary] = await db.select({
    total: sql<number>`COALESCE(SUM(${eventReviews.punctualityScore} + ${eventReviews.politenessScore} + ${eventReviews.funScore}), 0)`,
    reviewCount: count(),
  }).from(eventReviews).where(eq(eventReviews.revieweeId, input.revieweeId));
  const reviewCount = Number(summary?.reviewCount ?? 0);
  const averageDimensionScore = reviewCount > 0 ? Number(summary?.total ?? 0) / (reviewCount * 3) : 0;
  const creditScore = Math.min(100, Math.max(0, Math.round(50 + averageDimensionScore * 10)));
  await db.update(users).set({ creditScore }).where(eq(users.id, input.revieweeId));
  return inserted[0]?.id;
}

export async function markAttendance(input: { eventId: number; hostId: number; userId: number; status: "attended" | "late" }) {
  const db = requireDb(await getDb());
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.id, input.eventId)).limit(1);
  if (!event || event.hostId !== input.hostId) throw new Error("NOT_EVENT_HOST");
  const [attendance] = await db.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), eq(eventAttendances.userId, input.userId))).limit(1);
  if (!attendance || attendance.status === "no_show") throw new Error("INVALID_ATTENDANCE_STATE");
  await db.update(eventAttendances).set({ status: input.status }).where(eq(eventAttendances.id, attendance.id));
  return { status: input.status };
}

export async function completeDiningEvent(input: { eventId: number; hostId: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, input.eventId)).limit(1);
    if (!event || event.hostId !== input.hostId) throw new Error("NOT_EVENT_HOST");
    if (event.status === "completed" || event.status === "cancelled") throw new Error("EVENT_ALREADY_FINALIZED");
    const attendees = await tx.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), inArray(eventAttendances.status, ["attended", "late"])));
    for (const attendee of attendees) {
      const [deposit] = await tx.select().from(eventDeposits).where(and(eq(eventDeposits.eventId, input.eventId), eq(eventDeposits.userId, attendee.userId), eq(eventDeposits.status, "held"))).limit(1);
      if (!deposit) continue;
      await tx.update(eventDeposits).set({ status: "released" }).where(eq(eventDeposits.id, deposit.id));
      await tx.update(users).set({ pointBalance: sql`${users.pointBalance} + ${deposit.points}` }).where(eq(users.id, attendee.userId));
    }
    await tx.update(diningEvents).set({ status: "completed" }).where(eq(diningEvents.id, input.eventId));
    if (attendees.length) await tx.insert(notifications).values(attendees.map((attendee) => ({ recipientId: attendee.userId, eventId: input.eventId, type: "review_request" as const, title: "飯局已完成，邀請你留下互評", body: "請針對同場成員評估準時、禮貌與趣味，幫助社群建立信任。", payload: { eventId: input.eventId } })));
    return { status: "completed" as const, releasedDepositCount: attendees.length };
  });
}

export async function markEventNoShow(input: { eventId: number; hostId: number; userId: number }) {
  const db = requireDb(await getDb());
  return db.transaction(async (tx) => {
    const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, input.eventId)).limit(1);
    if (!event || event.hostId !== input.hostId) throw new Error("NOT_EVENT_HOST");
    const [attendance] = await tx.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), eq(eventAttendances.userId, input.userId))).limit(1);
    if (!attendance || attendance.status === "no_show") throw new Error("INVALID_ATTENDANCE_STATE");
    const [deposit] = await tx.select().from(eventDeposits).where(and(eq(eventDeposits.eventId, input.eventId), eq(eventDeposits.userId, input.userId), eq(eventDeposits.status, "held"))).limit(1);
    if (!deposit) throw new Error("HELD_DEPOSIT_NOT_FOUND");
    await tx.update(eventAttendances).set({ status: "no_show" }).where(eq(eventAttendances.id, attendance.id));
    await tx.update(eventDeposits).set({ status: "forfeited" }).where(eq(eventDeposits.id, deposit.id));
    await tx.update(users).set({ noShowCount: sql`${users.noShowCount} + 1`, creditScore: sql`GREATEST(0, ${users.creditScore} - 15)` }).where(eq(users.id, input.userId));
    const members = await tx.select({ userId: eventAttendances.userId }).from(eventAttendances).where(and(eq(eventAttendances.eventId, input.eventId), eq(eventAttendances.status, "confirmed")));
    if (members.length) await tx.insert(notifications).values(members.filter((member) => member.userId !== input.userId).map((member) => ({ recipientId: member.userId, eventId: input.eventId, type: "member_no_show" as const, title: "飯局出席狀態已更新", body: "有成員未依約出席，系統已依規則處理保證金。", payload: { userId: input.userId } })));
    return { attendanceStatus: "no_show" as const, depositStatus: "forfeited" as const };
  });
}

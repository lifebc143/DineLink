import { z } from "zod";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createHeartbeatJob } from "../_core/heartbeat";
import {
  applyToDiningEvent,
  saveEventReminderTask,
  createDiningEvent,
  completeDiningEvent,
  listEventMessages,
  listPublishedEvents,
  markEventNoShow,
  markAttendance,
  reviewDiningApplication,
  sendEventMessage,
  submitEventReview,
} from "../diningDb";

const eventIdInput = z.object({ eventId: z.number().int().positive() });

function reminderCron(eventStartAt: Date) {
  const reminderAt = new Date(eventStartAt.getTime() - 2 * 60 * 60 * 1000);
  return `0 ${reminderAt.getUTCMinutes()} ${reminderAt.getUTCHours()} ${reminderAt.getUTCDate()} ${reminderAt.getUTCMonth() + 1} *`;
}

export const diningRouter = router({
  list: publicProcedure.query(() => listPublishedEvents()),
  create: protectedProcedure.input(z.object({
    title: z.string().min(4).max(120), description: z.string().max(2_000).optional(), eventStartAt: z.date(),
    venueAddress: z.string().min(4).max(1_000), restaurantName: z.string().max(180).optional(), placeId: z.string().max(255).optional(),
    latitude: z.string().max(24).optional(), longitude: z.string().max(24).optional(), capacity: z.number().int().min(2).max(12),
    paymentMode: z.enum(["host_treats", "split_bill", "men_treat_women"]), budgetMin: z.number().int().nonnegative().optional(), budgetMax: z.number().int().positive().optional(), depositPoints: z.number().int().min(0).max(10_000),
  })).mutation(async ({ ctx, input }) => {
    const eventId = await createDiningEvent({ ...input, hostId: ctx.user.id });
    if (!eventId) throw new Error("EVENT_CREATE_FAILED");
    const sessionToken = parseCookie(ctx.req.headers.cookie ?? "")[COOKIE_NAME] ?? "";
    const job = await createHeartbeatJob({
      name: `event-reminder-${eventId}`,
      cron: reminderCron(input.eventStartAt),
      path: "/api/scheduled/event-reminder",
      payload: { eventId },
      description: `Two-hour reminder for DineLink event ${eventId}`,
    }, sessionToken);
    await saveEventReminderTask(eventId, job.taskUid);
    return { eventId, reminderTaskUid: job.taskUid };
  }),
  submitApplication: protectedProcedure.input(eventIdInput.extend({ introduction: z.string().max(280).optional() })).mutation(({ ctx, input }) => applyToDiningEvent({ ...input, applicantId: ctx.user.id })),
  reviewApplication: protectedProcedure.input(eventIdInput.extend({ applicationId: z.number().int().positive(), approve: z.boolean(), reviewNote: z.string().max(280).optional() })).mutation(({ ctx, input }) => reviewDiningApplication({ ...input, hostId: ctx.user.id })),
  messages: router({
    list: protectedProcedure.input(eventIdInput).query(({ ctx, input }) => listEventMessages({ ...input, userId: ctx.user.id })),
    send: protectedProcedure.input(eventIdInput.extend({ content: z.string().trim().min(1).max(2_000) })).mutation(({ ctx, input }) => sendEventMessage({ ...input, authorId: ctx.user.id })),
  }),
  review: protectedProcedure.input(eventIdInput.extend({ revieweeId: z.number().int().positive(), punctualityScore: z.number().int().min(1).max(5), politenessScore: z.number().int().min(1).max(5), funScore: z.number().int().min(1).max(5) })).mutation(({ ctx, input }) => submitEventReview({ ...input, reviewerId: ctx.user.id })),
  markAttendance: protectedProcedure.input(eventIdInput.extend({ userId: z.number().int().positive(), status: z.enum(["attended", "late"]) })).mutation(({ ctx, input }) => markAttendance({ ...input, hostId: ctx.user.id })),
  complete: protectedProcedure.input(eventIdInput).mutation(({ ctx, input }) => completeDiningEvent({ ...input, hostId: ctx.user.id })),
  markNoShow: protectedProcedure.input(eventIdInput.extend({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => markEventNoShow({ ...input, hostId: ctx.user.id })),
});

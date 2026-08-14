import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * DineLink production schema for Next.js App Router + PostgreSQL + Drizzle ORM.
 *
 * All timestamps are stored in UTC. Monetary fields use integer minor units;
 * point movements are immutable ledger rows, never destructive balance updates.
 */

export const userRoleEnum = pgEnum("user_role", ["member", "moderator", "admin"]);
export const accountStatusEnum = pgEnum("account_status", ["active", "suspended", "deactivated"]);
export const genderEnum = pgEnum("gender", ["woman", "man", "non_binary", "prefer_not_to_say"]);
export const verificationStatusEnum = pgEnum("verification_status", ["unverified", "pending", "verified", "rejected"]);
export const eventStatusEnum = pgEnum("event_status", ["draft", "published", "full", "locked", "in_progress", "completed", "cancelled", "unmatched"]);
export const paymentModeEnum = pgEnum("payment_mode", ["host_treats", "split_bill", "men_treat_women"]);
export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected", "withdrawn", "cancelled"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["confirmed", "attended", "late", "no_show", "excused"]);
export const depositStatusEnum = pgEnum("deposit_status", ["held", "released", "forfeited", "refunded"]);
export const pointTransactionTypeEnum = pgEnum("point_transaction_type", ["top_up", "deposit_hold", "deposit_release", "deposit_forfeit", "reward", "adjustment"]);
export const notificationTypeEnum = pgEnum("notification_type", ["application_submitted", "application_approved", "application_rejected", "application_cancelled", "attendance_updated", "event_reminder", "event_cancelled", "event_unmatched", "member_no_show", "new_message", "review_request", "safety_alert"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "succeeded", "failed", "refunded", "cancelled"]);
export const paymentPurposeEnum = pgEnum("payment_purpose", ["point_top_up", "membership", "restaurant_campaign"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Stable user id from the chosen authentication provider, e.g. Clerk or Auth.js subject. */
  authSubject: varchar("auth_subject", { length: 191 }).notNull(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  email: varchar("email", { length: 320 }),
  avatarUrl: text("avatar_url"),
  gender: genderEnum("gender").notNull().default("prefer_not_to_say"),
  bio: varchar("bio", { length: 280 }),
  role: userRoleEnum("role").notNull().default("member"),
  accountStatus: accountStatusEnum("account_status").notNull().default("active"),
  suspensionReason: varchar("suspension_reason", { length: 280 }),
  suspendedAt: timestamp("suspended_at", { withTimezone: true }),
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  verificationStatus: verificationStatusEnum("verification_status").notNull().default("unverified"),
  pointBalance: integer("point_balance").notNull().default(0),
  creditScore: integer("credit_score").notNull().default(70),
  completedEventCount: integer("completed_event_count").notNull().default(0),
  noShowCount: integer("no_show_count").notNull().default(0),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_auth_subject_unique").on(table.authSubject),
  uniqueIndex("users_email_unique").on(table.email),
  index("users_credit_score_idx").on(table.creditScore),
]);

export const diningEvents = pgTable("dining_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  hostId: uuid("host_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
  cuisineTags: jsonb("cuisine_tags").$type<string[]>().notNull().default([]),
  eventStartAt: timestamp("event_start_at", { withTimezone: true }).notNull(),
  eventEndAt: timestamp("event_end_at", { withTimezone: true }),
  applicationDeadlineAt: timestamp("application_deadline_at", { withTimezone: true }),
  restaurantName: varchar("restaurant_name", { length: 180 }),
  venueAddress: text("venue_address").notNull(),
  placeId: varchar("place_id", { length: 255 }),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  neighborhood: varchar("neighborhood", { length: 80 }),
  capacity: integer("capacity").notNull(),
  minCapacity: integer("min_capacity").notNull().default(2),
  paymentMode: paymentModeEnum("payment_mode").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("TWD"),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  depositPoints: integer("deposit_points").notNull().default(100),
  status: eventStatusEnum("status").notNull().default("draft"),
  reminderTaskUid: varchar("reminder_task_uid", { length: 65 }),
  reminderScheduledFor: timestamp("reminder_scheduled_for", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  unmatchedAt: timestamp("unmatched_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("dining_events_explore_idx").on(table.status, table.eventStartAt),
  index("dining_events_host_idx").on(table.hostId, table.eventStartAt),
  index("dining_events_geo_idx").on(table.latitude, table.longitude),
  uniqueIndex("dining_events_reminder_task_unique").on(table.reminderTaskUid),
]);

/** Project-level recurring jobs. Callback handlers trust only task UIDs persisted here. */
export const automationJobs = pgTable("automation_jobs", {
  jobKey: varchar("job_key", { length: 80 }).primaryKey(),
  cronTaskUid: varchar("cron_task_uid", { length: 65 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("automation_jobs_task_uid_unique").on(table.cronTaskUid)]);

export const eventApplications = pgTable("event_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => diningEvents.id, { onDelete: "cascade" }),
  applicantId: uuid("applicant_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  introduction: varchar("introduction", { length: 280 }),
  status: applicationStatusEnum("status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewNote: varchar("review_note", { length: 280 }),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  withdrawnAt: timestamp("withdrawn_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("event_applications_event_applicant_unique").on(table.eventId, table.applicantId),
  index("event_applications_host_queue_idx").on(table.eventId, table.status, table.requestedAt),
  index("event_applications_applicant_idx").on(table.applicantId, table.status),
]);

/** Attendance is created once an application is approved; it gates group-chat membership. */
export const eventAttendances = pgTable("event_attendances", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => diningEvents.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => eventApplications.id, { onDelete: "set null" }),
  status: attendanceStatusEnum("status").notNull().default("confirmed"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  statusUpdatedAt: timestamp("status_updated_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("event_attendances_event_user_unique").on(table.eventId, table.userId),
  uniqueIndex("event_attendances_application_unique").on(table.applicationId),
  index("event_attendances_event_status_idx").on(table.eventId, table.status),
]);

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => diningEvents.id, { onDelete: "cascade" }),
  authorId: uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: varchar("content", { length: 2_000 }).notNull(),
  editedAt: timestamp("edited_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chat_messages_event_timeline_idx").on(table.eventId, table.createdAt),
  index("chat_messages_author_idx").on(table.authorId, table.createdAt),
]);

export const eventReviews = pgTable("event_reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => diningEvents.id, { onDelete: "cascade" }),
  reviewerId: uuid("reviewer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  revieweeId: uuid("reviewee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  punctualityScore: integer("punctuality_score").notNull(),
  politenessScore: integer("politeness_score").notNull(),
  funScore: integer("fun_score").notNull(),
  privateNote: varchar("private_note", { length: 500 }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("event_reviews_reviewer_reviewee_unique").on(table.eventId, table.reviewerId, table.revieweeId),
  index("event_reviews_reviewee_idx").on(table.revieweeId, table.submittedAt),
]);

/** Holds the required participation points from submission until release or forfeiture. */
export const eventDeposits = pgTable("event_deposits", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => diningEvents.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").notNull().references(() => eventApplications.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  status: depositStatusEnum("status").notNull().default("held"),
  reason: varchar("reason", { length: 280 }),
  releasedAt: timestamp("released_at", { withTimezone: true }),
  forfeitedAt: timestamp("forfeited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("event_deposits_application_unique").on(table.applicationId),
  index("event_deposits_user_status_idx").on(table.userId, table.status),
  index("event_deposits_event_idx").on(table.eventId),
]);

/** Immutable ledger: a transaction service updates users.pointBalance in the same DB transaction. */
export const pointTransactions = pgTable("point_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  eventId: uuid("event_id").references(() => diningEvents.id, { onDelete: "set null" }),
  depositId: uuid("deposit_id").references(() => eventDeposits.id, { onDelete: "set null" }),
  type: pointTransactionTypeEnum("type").notNull(),
  delta: integer("delta").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  note: varchar("note", { length: 280 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("point_transactions_user_timeline_idx").on(table.userId, table.createdAt),
  index("point_transactions_event_idx").on(table.eventId),
]);

/** External-money record. Point crediting occurs only after a succeeded provider transaction. */
export const paymentTransactions = pgTable("payment_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  provider: varchar("provider", { length: 48 }).notNull(),
  providerPaymentId: varchar("provider_payment_id", { length: 191 }).notNull(),
  purpose: paymentPurposeEnum("purpose").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  currency: varchar("currency", { length: 3 }).notNull().default("TWD"),
  amount: integer("amount").notNull(),
  pointCredit: integer("point_credit").notNull().default(0),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  succeededAt: timestamp("succeeded_at", { withTimezone: true }),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("payment_transactions_provider_payment_unique").on(table.provider, table.providerPaymentId),
  index("payment_transactions_user_idx").on(table.userId, table.createdAt),
  index("payment_transactions_status_idx").on(table.status, table.createdAt),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => diningEvents.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => eventApplications.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  body: varchar("body", { length: 500 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("notifications_inbox_idx").on(table.recipientId, table.readAt, table.createdAt),
]);

export const userRelations = relations(users, ({ many }) => ({
  hostedEvents: many(diningEvents, { relationName: "event_host" }),
  applications: many(eventApplications, { relationName: "application_applicant" }),
  attendances: many(eventAttendances),
  messages: many(chatMessages),
  reviewsWritten: many(eventReviews, { relationName: "reviewer" }),
  reviewsReceived: many(eventReviews, { relationName: "reviewee" }),
  reviewedApplications: many(eventApplications, { relationName: "application_reviewer" }),
  deposits: many(eventDeposits),
  pointTransactions: many(pointTransactions),
  paymentTransactions: many(paymentTransactions),
  notifications: many(notifications),
}));

export const diningEventRelations = relations(diningEvents, ({ one, many }) => ({
  host: one(users, { fields: [diningEvents.hostId], references: [users.id], relationName: "event_host" }),
  applications: many(eventApplications),
  attendances: many(eventAttendances),
  messages: many(chatMessages),
  reviews: many(eventReviews),
  deposits: many(eventDeposits),
  pointTransactions: many(pointTransactions),
  notifications: many(notifications),
}));

export const eventApplicationRelations = relations(eventApplications, ({ one }) => ({
  event: one(diningEvents, { fields: [eventApplications.eventId], references: [diningEvents.id] }),
  applicant: one(users, { fields: [eventApplications.applicantId], references: [users.id], relationName: "application_applicant" }),
  reviewer: one(users, { fields: [eventApplications.reviewedBy], references: [users.id], relationName: "application_reviewer" }),
  attendance: one(eventAttendances),
  deposit: one(eventDeposits),
}));

export const eventAttendanceRelations = relations(eventAttendances, ({ one }) => ({
  event: one(diningEvents, { fields: [eventAttendances.eventId], references: [diningEvents.id] }),
  user: one(users, { fields: [eventAttendances.userId], references: [users.id] }),
  application: one(eventApplications, { fields: [eventAttendances.applicationId], references: [eventApplications.id] }),
}));

export const chatMessageRelations = relations(chatMessages, ({ one }) => ({
  event: one(diningEvents, { fields: [chatMessages.eventId], references: [diningEvents.id] }),
  author: one(users, { fields: [chatMessages.authorId], references: [users.id] }),
}));

export const eventReviewRelations = relations(eventReviews, ({ one }) => ({
  event: one(diningEvents, { fields: [eventReviews.eventId], references: [diningEvents.id] }),
  reviewer: one(users, { fields: [eventReviews.reviewerId], references: [users.id], relationName: "reviewer" }),
  reviewee: one(users, { fields: [eventReviews.revieweeId], references: [users.id], relationName: "reviewee" }),
}));

export const paymentTransactionRelations = relations(paymentTransactions, ({ one }) => ({
  user: one(users, { fields: [paymentTransactions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type DiningEvent = typeof diningEvents.$inferSelect;
export type EventApplication = typeof eventApplications.$inferSelect;
export type EventAttendance = typeof eventAttendances.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type EventReview = typeof eventReviews.$inferSelect;
export type EventDeposit = typeof eventDeposits.$inferSelect;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

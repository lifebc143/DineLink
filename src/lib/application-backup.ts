import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { storagePut } from "@/lib/storage";
import { automationJobs, backupSettings, backupSnapshots, chatMessages, diningEvents, eventApplications, eventAttendances, eventReviews, notifications, paymentTransactions, pointTransactions, users } from "../../drizzle/schema";

export const BACKUP_SETTINGS_ID = "monthly_application_data";
const TAIPEI = "Asia/Taipei";

export async function getBackupSettings() {
  const [existing] = await db.select().from(backupSettings).where(eq(backupSettings.id, BACKUP_SETTINGS_ID)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(backupSettings).values({ id: BACKUP_SETTINGS_ID }).returning();
  return created;
}

export function taipeiSchedule(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TAIPEI, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value || 0);
  return { year: part("year"), month: part("month"), day: part("day"), hour: part("hour") };
}

export async function createApplicationBackup({ initiatedBy, now = new Date(), scheduledOnly = false }: { initiatedBy?: string; now?: Date; scheduledOnly?: boolean } = {}) {
  const settings = await getBackupSettings();
  const local = taipeiSchedule(now);
  if (scheduledOnly && (!settings.enabled || local.day !== settings.dayOfMonth || local.hour !== settings.hourTaipei)) return { skipped: true as const, reason: "not_due" };
  const scheduleKey = `${local.year}-${String(local.month).padStart(2, "0")}`;
  const [already] = await db.select({ id: backupSnapshots.id }).from(backupSnapshots).where(eq(backupSnapshots.scheduleKey, scheduleKey)).limit(1);
  if (already) return { skipped: true as const, reason: "already_created", snapshotId: already.id };
  const [snapshot] = await db.insert(backupSnapshots).values({ scheduleKey, initiatedBy, status: "running" }).returning();
  try {
    const [memberRows, eventRows, applicationRows, attendanceRows, messageRows, reviewRows, notificationRows, pointRows, paymentRows, automationRows] = await Promise.all([
      db.select().from(users), db.select().from(diningEvents), db.select().from(eventApplications), db.select().from(eventAttendances), db.select().from(chatMessages), db.select().from(eventReviews), db.select().from(notifications), db.select().from(pointTransactions), db.select().from(paymentTransactions), db.select().from(automationJobs),
    ]);
    const tables = { users: memberRows, dining_events: eventRows, event_applications: applicationRows, event_attendances: attendanceRows, chat_messages: messageRows, event_reviews: reviewRows, notifications: notificationRows, point_transactions: pointRows, payment_transactions: paymentRows, automation_jobs: automationRows };
    const tableCounts = Object.fromEntries(Object.entries(tables).map(([key, rows]) => [key, rows.length]));
    const payload = JSON.stringify({ format: "dinelink-application-data/v1", generatedAt: now.toISOString(), timezone: TAIPEI, tableCounts, tables });
    const checksum = createHash("sha256").update(payload).digest("hex");
    const stored = await storagePut(`backups/dinelink/${scheduleKey}/application-data.json`, payload);
    const [completed] = await db.update(backupSnapshots).set({ status: "succeeded", storageKey: stored.key, checksumSha256: checksum, byteSize: Buffer.byteLength(payload), tableCounts, completedAt: new Date() }).where(eq(backupSnapshots.id, snapshot.id)).returning();
    const retained = await db.select({ id: backupSnapshots.id }).from(backupSnapshots).where(eq(backupSnapshots.status, "succeeded")).orderBy(desc(backupSnapshots.createdAt));
    const staleIds = retained.slice(settings.retentionCount).map((row) => row.id);
    if (staleIds.length) await db.execute(sql`UPDATE backup_snapshots SET status = 'expired' WHERE id IN (${sql.join(staleIds.map((id) => sql`${id}`), sql`, `)})`);
    return { skipped: false as const, snapshot: completed };
  } catch (error) {
    await db.update(backupSnapshots).set({ status: "failed", failureMessage: error instanceof Error ? error.message.slice(0, 500) : "Unknown backup error", completedAt: new Date() }).where(eq(backupSnapshots.id, snapshot.id));
    throw error;
  }
}

export async function listBackupSnapshots() {
  return db.select().from(backupSnapshots).where(and(eq(backupSnapshots.status, "succeeded"))).orderBy(desc(backupSnapshots.createdAt));
}

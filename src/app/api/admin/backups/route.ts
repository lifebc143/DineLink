import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { BACKUP_SETTINGS_ID, getBackupSettings, listBackupSnapshots } from "@/lib/application-backup";
import { backupRestoreRequests, backupSettings } from "../../../../../drizzle/schema";

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const [settings, snapshots, restoreRequests] = await Promise.all([getBackupSettings(), listBackupSnapshots(), db.select().from(backupRestoreRequests).orderBy(desc(backupRestoreRequests.createdAt)).limit(8)]);
  return NextResponse.json({ settings, snapshots: snapshots.map(({ storageKey, ...snapshot }) => ({ ...snapshot, storage: storageKey ? { provider: "Private S3", objectKey: storageKey, downloadAvailable: true } : { provider: "Private S3", objectKey: null, downloadAvailable: false } })), restoreRequests, coverage: { included: ["會員、飯局、申請、出席、聊天室、評價、通知、點數與付款紀錄"], excluded: ["網站程式碼、Secrets、網域與平台整合；請使用官方完整網站備份"], timezone: "Asia/Taipei" } });
}

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => null) as { dayOfMonth?: number; hourTaipei?: number; retentionCount?: number; enabled?: boolean } | null;
  if (!body || !Number.isInteger(body.dayOfMonth) || body.dayOfMonth! < 1 || body.dayOfMonth! > 28 || !Number.isInteger(body.hourTaipei) || body.hourTaipei! < 0 || body.hourTaipei! > 23 || !Number.isInteger(body.retentionCount) || body.retentionCount! < 1 || body.retentionCount! > 12 || typeof body.enabled !== "boolean") return NextResponse.json({ error: "INVALID_BACKUP_SETTINGS" }, { status: 400 });
  const [settings] = await db.insert(backupSettings).values({ id: BACKUP_SETTINGS_ID, dayOfMonth: body.dayOfMonth!, hourTaipei: body.hourTaipei!, retentionCount: body.retentionCount!, enabled: body.enabled, updatedBy: admin.id, updatedAt: new Date() }).onConflictDoUpdate({ target: backupSettings.id, set: { dayOfMonth: body.dayOfMonth!, hourTaipei: body.hourTaipei!, retentionCount: body.retentionCount!, enabled: body.enabled, updatedBy: admin.id, updatedAt: new Date() } }).returning();
  return NextResponse.json({ settings });
}

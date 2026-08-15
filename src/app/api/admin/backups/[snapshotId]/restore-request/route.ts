import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { backupRestoreRequests, backupSnapshots, notifications, users } from "../../../../../../../drizzle/schema";

export async function POST(request: Request, context: { params: Promise<{ snapshotId: string }> }) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { snapshotId } = await context.params;
  const body = await request.json().catch(() => null) as { confirmation?: string; reason?: string } | null;
  const reason = body?.reason?.trim();
  if (body?.confirmation !== "REQUEST_RESTORE" || !reason || reason.length < 10) return NextResponse.json({ error: "RESTORE_CONFIRMATION_AND_REASON_REQUIRED" }, { status: 400 });
  const [snapshot] = await db.select({ id: backupSnapshots.id }).from(backupSnapshots).where(eq(backupSnapshots.id, snapshotId)).limit(1);
  if (!snapshot) return NextResponse.json({ error: "BACKUP_NOT_FOUND" }, { status: 404 });
  const [restoreRequest] = await db.insert(backupRestoreRequests).values({ snapshotId, requestedBy: admin.id, reason }).returning();
  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  if (admins.length) await db.insert(notifications).values(admins.map((recipient) => ({ recipientId: recipient.id, type: "backup_restore_requested" as const, title: "收到資料還原申請", body: "還原申請僅供人工審閱，不會自動覆寫目前資料。", payload: { restoreRequestId: restoreRequest.id, snapshotId } })));
  return NextResponse.json({ restoreRequest }, { status: 201 });
}

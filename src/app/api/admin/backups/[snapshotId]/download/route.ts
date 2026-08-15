import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storageGetSignedUrl } from "@/lib/storage";
import { backupSnapshots } from "../../../../../../../drizzle/schema";

export async function GET(_: Request, context: { params: Promise<{ snapshotId: string }> }) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { snapshotId } = await context.params;
  const [snapshot] = await db.select().from(backupSnapshots).where(eq(backupSnapshots.id, snapshotId)).limit(1);
  if (!snapshot || snapshot.status !== "succeeded" || !snapshot.storageKey) return NextResponse.json({ error: "BACKUP_NOT_AVAILABLE" }, { status: 404 });
  return NextResponse.redirect(await storageGetSignedUrl(snapshot.storageKey));
}

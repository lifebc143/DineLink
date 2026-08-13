import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function PATCH(_: Request, { params }: { params: Promise<{ notificationId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { notificationId } = await params;
  const [notification] = await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, notificationId), eq(notifications.recipientId, user.id))).returning();
  return notification ? NextResponse.json({ notification }) : NextResponse.json({ error: "NOTIFICATION_NOT_FOUND" }, { status: 404 });
}

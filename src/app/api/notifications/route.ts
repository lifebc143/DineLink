import { and, asc, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "../../../../drizzle/schema";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
  const inbox = await db.select().from(notifications).where(unreadOnly ? and(eq(notifications.recipientId, user.id), isNull(notifications.readAt)) : eq(notifications.recipientId, user.id)).orderBy(asc(notifications.createdAt));
  return NextResponse.json({ notifications: inbox });
}

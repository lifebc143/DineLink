import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventAttendances, notifications } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";
const attendanceInput = z.object({ userId: z.string().uuid(), status: z.enum(["attended", "late", "no_show", "excused"]) });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const host = await getCurrentUser();
  if (!host) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  const input = attendanceInput.safeParse(await request.json());
  if (!input.success) return NextResponse.json({ error: "INVALID_ATTENDANCE" }, { status: 400 });
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
  if (!event || event.hostId !== host.id) return NextResponse.json({ error: "NOT_EVENT_HOST" }, { status: 403 });
  const [attendance] = await db.transaction(async (tx) => {
    const [updated] = await tx.update(eventAttendances).set({ status: input.data.status, checkedInAt: ["attended", "late"].includes(input.data.status) ? new Date() : null, statusUpdatedAt: new Date() }).where(and(eq(eventAttendances.eventId, eventId), eq(eventAttendances.userId, input.data.userId))).returning();
    if (updated) await tx.insert(notifications).values({ recipientId: updated.userId, eventId, type: "attendance_updated", title: "出席紀錄已更新", body: `主辦人已將你在「${event.title}」的出席狀態更新為：${input.data.status}。`, payload: { attendanceStatus: input.data.status } });
    return [updated];
  });
  return attendance ? NextResponse.json({ attendance }) : NextResponse.json({ error: "ATTENDANCE_NOT_FOUND" }, { status: 404 });
}

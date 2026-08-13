import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventApplications, eventAttendances, notifications } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ applicationId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { applicationId } = await params;
  const [application] = await db.select().from(eventApplications).where(eq(eventApplications.id, applicationId)).limit(1);
  if (!application || application.applicantId !== user.id) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
  if (application.status !== "pending" && application.status !== "approved") return NextResponse.json({ error: "APPLICATION_NOT_CANCELLABLE" }, { status: 409 });
  const nextStatus = application.status === "pending" ? "cancelled" : "withdrawn";
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.id, application.eventId)).limit(1);
  await db.transaction(async (tx) => {
    await tx.update(eventApplications).set({ status: nextStatus, withdrawnAt: new Date(), updatedAt: new Date() }).where(eq(eventApplications.id, application.id));
    if (application.status === "approved") await tx.delete(eventAttendances).where(and(eq(eventAttendances.eventId, application.eventId), eq(eventAttendances.applicationId, application.id)));
    if (event && event.hostId !== user.id) await tx.insert(notifications).values({ recipientId: event.hostId, eventId: event.id, applicationId: application.id, type: "application_cancelled", title: "成員已取消參與", body: `有成員已取消「${event.title}」的${application.status === "approved" ? "已確認參與" : "申請"}。`, payload: { applicationId: application.id, previousStatus: application.status } });
  });
  return NextResponse.json({ status: nextStatus });
}

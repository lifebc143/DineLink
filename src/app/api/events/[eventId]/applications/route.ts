import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, eventApplications, eventDeposits, notifications, pointTransactions, users } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";
const inputSchema = z.object({ introduction: z.string().trim().max(280).optional() });

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  const parsed = inputSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_APPLICATION" }, { status: 400 });
  try {
    const response = await db.transaction(async (tx) => {
      const [event] = await tx.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
      if (!event || event.status !== "published") throw new Error("EVENT_NOT_OPEN");
      if (event.hostId === user.id) throw new Error("HOST_CANNOT_APPLY");
      if (user.pointBalance < event.depositPoints) throw new Error("INSUFFICIENT_POINTS");
      const [application] = await tx.insert(eventApplications).values({ eventId, applicantId: user.id, introduction: parsed.data.introduction }).returning();
      if (!application) throw new Error("APPLICATION_FAILED");
      const [deposit] = await tx.insert(eventDeposits).values({ eventId, applicationId: application.id, userId: user.id, points: event.depositPoints }).returning();
      const newBalance = user.pointBalance - event.depositPoints;
      await tx.update(users).set({ pointBalance: newBalance, updatedAt: new Date() }).where(eq(users.id, user.id));
      await tx.insert(pointTransactions).values({ userId: user.id, eventId, depositId: deposit?.id, type: "deposit_hold", delta: -event.depositPoints, balanceAfter: newBalance, note: "飯局報名保證金" });
      await tx.insert(notifications).values({ recipientId: event.hostId, eventId, applicationId: application.id, type: "application_submitted", title: "收到新的飯局申請", body: "有新成員正在等待你的審核。" });
      return application;
    });
    return NextResponse.json({ application: response }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "APPLICATION_FAILED";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

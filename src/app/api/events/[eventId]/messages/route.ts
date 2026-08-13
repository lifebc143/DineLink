import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessages, diningEvents, eventAttendances, notifications, users } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";
const messageInput = z.object({ content: z.string().trim().min(1).max(2_000) });

async function canAccessChat(eventId: string, userId: string) {
  const [event] = await db.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
  if (!event) return false;
  if (event.hostId === userId) return true;
  const [attendance] = await db.select().from(eventAttendances).where(and(eq(eventAttendances.eventId, eventId), eq(eventAttendances.userId, userId), inArray(eventAttendances.status, ["confirmed", "attended", "late"]))).limit(1);
  return Boolean(attendance);
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  if (!await canAccessChat(eventId, user.id)) return NextResponse.json({ error: "CHAT_ACCESS_DENIED" }, { status: 403 });
  const messages = await db.select({ message: chatMessages, author: { id: users.id, displayName: users.displayName } }).from(chatMessages).innerJoin(users, eq(chatMessages.authorId, users.id)).where(eq(chatMessages.eventId, eventId)).orderBy(asc(chatMessages.createdAt));
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  const parsed = messageInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_MESSAGE" }, { status: 400 });
  if (!await canAccessChat(eventId, user.id)) return NextResponse.json({ error: "CHAT_ACCESS_DENIED" }, { status: 403 });
  const [message] = await db.insert(chatMessages).values({ eventId, authorId: user.id, content: parsed.data.content }).returning();
  const recipients = await db.select({ userId: eventAttendances.userId }).from(eventAttendances).where(and(eq(eventAttendances.eventId, eventId), ne(eventAttendances.userId, user.id), inArray(eventAttendances.status, ["confirmed", "attended", "late"])));
  if (recipients.length && message) await db.insert(notifications).values(recipients.map((recipient) => ({ recipientId: recipient.userId, eventId, type: "new_message" as const, title: "飯局聊天室有新訊息", body: `${user.displayName} 傳送了一則新訊息。`, payload: { messageId: message.id } })));
  return NextResponse.json({ message }, { status: 201 });
}

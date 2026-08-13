import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, users } from "../../../../drizzle/schema";

export const runtime = "nodejs";

const createEventInput = z.object({ title: z.string().trim().min(4).max(120), description: z.string().trim().max(2000).optional(), eventStartAt: z.string().datetime(), venueAddress: z.string().trim().min(4), restaurantName: z.string().trim().max(180).optional(), capacity: z.number().int().min(2).max(12), paymentMode: z.enum(["host_treats", "split_bill", "men_treat_women"]), budgetMin: z.number().int().nonnegative().optional(), budgetMax: z.number().int().nonnegative().optional(), depositPoints: z.number().int().min(0).max(10_000).default(100) });

export async function GET() {
  const rows = await db.select({ event: diningEvents, host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } }).from(diningEvents).innerJoin(users, eq(diningEvents.hostId, users.id)).where(inArray(diningEvents.status, ["published", "full", "locked"])).orderBy(asc(diningEvents.eventStartAt));
  return NextResponse.json({ events: rows });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const parsed = createEventInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "INVALID_EVENT", details: parsed.error.flatten() }, { status: 400 });
  const [event] = await db.insert(diningEvents).values({ ...parsed.data, eventStartAt: new Date(parsed.data.eventStartAt), hostId: user.id, status: "published" }).returning();
  return NextResponse.json({ event }, { status: 201 });
}

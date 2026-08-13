import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents, users } from "../../../../drizzle/schema";

export const runtime = "nodejs";

const createEventInput = z.object({ title: z.string().trim().min(4).max(120), description: z.string().trim().max(2000).optional(), eventStartAt: z.string().datetime(), venueAddress: z.string().trim().min(4), restaurantName: z.string().trim().max(180).optional(), placeId: z.string().trim().max(255).optional(), latitude: z.string().regex(/^-?\d{1,3}(\.\d{1,7})?$/).optional(), longitude: z.string().regex(/^-?\d{1,3}(\.\d{1,7})?$/).optional(), capacity: z.number().int().min(2).max(12), paymentMode: z.enum(["host_treats", "split_bill", "men_treat_women"]), budgetMin: z.number().int().nonnegative().optional(), budgetMax: z.number().int().nonnegative().optional(), depositPoints: z.number().int().min(0).max(10_000).default(100) });

export async function GET() {
  const rows = await db.select({ event: diningEvents, host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } }).from(diningEvents).innerJoin(users, eq(diningEvents.hostId, users.id)).where(inArray(diningEvents.status, ["published", "full", "locked"])).orderBy(asc(diningEvents.eventStartAt));
  return NextResponse.json({ events: rows });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 });
  }
  const parsed = createEventInput.safeParse(requestBody);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_EVENT", details: parsed.error.flatten() }, { status: 400 });
  try {
    const [event] = await db.insert(diningEvents).values({ ...parsed.data, eventStartAt: new Date(parsed.data.eventStartAt), hostId: user.id, status: "published" }).returning();
    return NextResponse.json({ event }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "EVENT_CREATE_FAILED" }, { status: 500 });
  }
}

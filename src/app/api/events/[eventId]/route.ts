import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { diningEvents } from "../../../../../drizzle/schema";

export const runtime = "nodejs";

const updateEventInput = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().max(2_000).optional(),
  eventStartAt: z.string().datetime(),
  restaurantName: z.string().trim().max(180).optional(),
  venueAddress: z.string().trim().min(4).max(500),
  placeId: z.string().trim().max(255).optional(),
  latitude: z.string().regex(/^-?\d{1,3}(\.\d{1,7})?$/).optional(),
  longitude: z.string().regex(/^-?\d{1,3}(\.\d{1,7})?$/).optional(),
  capacity: z.number().int().min(2).max(12),
  paymentMode: z.enum(["host_treats", "split_bill", "men_treat_women"]),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
});

export async function PUT(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "INVALID_EVENT" }, { status: 400 }); }
  const parsed = updateEventInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID_EVENT", details: parsed.error.flatten() }, { status: 400 });
  const [existing] = await db.select().from(diningEvents).where(eq(diningEvents.id, eventId)).limit(1);
  if (!existing) return NextResponse.json({ error: "EVENT_NOT_FOUND" }, { status: 404 });
  if (existing.hostId !== user.id) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (["completed", "cancelled"].includes(existing.status)) return NextResponse.json({ error: "EVENT_NOT_EDITABLE" }, { status: 409 });
  try {
    const [event] = await db.update(diningEvents).set({ ...parsed.data, eventStartAt: new Date(parsed.data.eventStartAt), updatedAt: new Date() }).where(eq(diningEvents.id, eventId)).returning();
    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "EVENT_UPDATE_FAILED" }, { status: 500 });
  }
}

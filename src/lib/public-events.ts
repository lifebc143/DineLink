import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { diningEvents, users } from "../../drizzle/schema";

const publicStatuses = ["published", "full", "locked"] as const;

export type PublicEvent = {
  event: typeof diningEvents.$inferSelect;
  host: Pick<typeof users.$inferSelect, "id" | "displayName" | "avatarUrl">;
};

export async function getPublicEvent(eventId: string): Promise<PublicEvent | null> {
  const [result] = await db
    .select({
      event: diningEvents,
      host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl },
    })
    .from(diningEvents)
    .innerJoin(users, eq(diningEvents.hostId, users.id))
    .where(and(eq(diningEvents.id, eventId), inArray(diningEvents.status, publicStatuses)))
    .limit(1);
  return result ?? null;
}

export async function listIndexableEvents() {
  return db
    .select({ id: diningEvents.id, updatedAt: diningEvents.updatedAt, eventStartAt: diningEvents.eventStartAt })
    .from(diningEvents)
    .where(and(inArray(diningEvents.status, publicStatuses), gte(diningEvents.eventStartAt, new Date())))
    .orderBy(asc(diningEvents.eventStartAt));
}

import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { diningEvents, users } from "../../drizzle/schema";

const visibleStatuses = ["published", "full", "locked", "cancelled"] as const;
const indexableStatuses = ["published", "full", "locked"] as const;

export type PublicEvent = {
  event: typeof diningEvents.$inferSelect;
  host: Pick<typeof users.$inferSelect, "id" | "displayName" | "avatarUrl">;
};

export const cityFacets = [
  { slug: "taipei", label: "台北市", aliases: ["台北市", "臺北市", "台北"] },
  { slug: "new-taipei", label: "新北市", aliases: ["新北市", "新北"] },
  { slug: "taichung", label: "台中市", aliases: ["台中市", "臺中市", "台中"] },
  { slug: "taoyuan", label: "桃園市", aliases: ["桃園市", "桃園"] },
  { slug: "tainan", label: "台南市", aliases: ["台南市", "臺南市", "台南"] },
  { slug: "kaohsiung", label: "高雄市", aliases: ["高雄市", "高雄"] },
] as const;

export type CityFacet = (typeof cityFacets)[number];

export async function getPublicEvent(eventId: string): Promise<PublicEvent | null> {
  const [result] = await db
    .select({
      event: diningEvents,
      host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl },
    })
    .from(diningEvents)
    .innerJoin(users, eq(diningEvents.hostId, users.id))
    .where(and(eq(diningEvents.id, eventId), inArray(diningEvents.status, visibleStatuses)))
    .limit(1);
  return result ?? null;
}

export async function listIndexableEvents() {
  return db
    .select({ id: diningEvents.id, updatedAt: diningEvents.updatedAt, eventStartAt: diningEvents.eventStartAt })
    .from(diningEvents)
    .where(and(inArray(diningEvents.status, indexableStatuses), gte(diningEvents.eventStartAt, new Date())))
    .orderBy(asc(diningEvents.eventStartAt));
}

export async function listPublicExploreEvents(): Promise<PublicEvent[]> {
  return db
    .select({ event: diningEvents, host: { id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl } })
    .from(diningEvents)
    .innerJoin(users, eq(diningEvents.hostId, users.id))
    .where(and(inArray(diningEvents.status, indexableStatuses), gte(diningEvents.eventStartAt, new Date())))
    .orderBy(asc(diningEvents.eventStartAt));
}

function eventMatchesCity(publicEvent: PublicEvent, city: CityFacet) {
  const haystack = `${publicEvent.event.venueAddress} ${publicEvent.event.neighborhood || ""}`;
  return city.aliases.some(alias => haystack.includes(alias));
}

export async function getPublicCityEvents(citySlug: string) {
  const city = cityFacets.find(item => item.slug === citySlug) ?? null;
  if (!city) return { city: null, events: [] as PublicEvent[] };
  const events = (await listPublicExploreEvents()).filter(event => eventMatchesCity(event, city));
  return { city, events };
}

export async function getPublicTopicEvents(topic: string) {
  const normalizedTopic = topic.trim();
  const events = (await listPublicExploreEvents()).filter(({ event }) => event.cuisineTags.includes(normalizedTopic));
  return { topic: normalizedTopic, events };
}

export async function listPublicExploreFacets() {
  const events = await listPublicExploreEvents();
  const cities = cityFacets.filter(city => events.some(event => eventMatchesCity(event, city)));
  const topics = [...new Set(events.flatMap(({ event }) => event.cuisineTags).filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-TW"));
  return { cities, topics };
}

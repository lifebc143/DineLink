import type { MetadataRoute } from "next";
import { listIndexableEvents, listPublicExploreFacets } from "@/lib/public-events";
import { absoluteUrl } from "@/lib/site";
import { publicEventPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listIndexableEvents();
  const { cities, topics } = await listPublicExploreFacets();
  return [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...events.map((event) => ({ url: absoluteUrl(publicEventPath(event.id)), lastModified: event.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...cities.map(city => ({ url: absoluteUrl(`/explore/city/${city.slug}`), lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.6 })),
    ...topics.map(topic => ({ url: absoluteUrl(`/explore/topic/${encodeURIComponent(topic)}`), lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}

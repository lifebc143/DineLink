import type { MetadataRoute } from "next";
import { listIndexableEvents } from "@/lib/public-events";
import { absoluteUrl } from "@/lib/site";
import { publicEventPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await listIndexableEvents();
  return [
    { url: absoluteUrl("/"), lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...events.map((event) => ({ url: absoluteUrl(publicEventPath(event.id)), lastModified: event.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}

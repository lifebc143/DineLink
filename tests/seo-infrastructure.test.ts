import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getPublicEvent: vi.fn(), listIndexableEvents: vi.fn() }));

vi.mock("@/lib/public-events", () => ({ getPublicEvent: mocks.getPublicEvent, listIndexableEvents: mocks.listIndexableEvents }));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";
import { generateMetadata } from "@/app/events/[eventId]/page";
import { eventJsonLd } from "@/lib/seo";
import type { PublicEvent } from "@/lib/public-events";

const publicEvent: PublicEvent = {
  event: {
    id: "5d9a61b5-399f-4d2c-a973-a2d695f6cf83",
    title: "台北午間義式飯局",
    description: "一起認識新朋友。",
    eventStartAt: new Date("2026-09-01T04:30:00.000Z"),
    eventEndAt: null,
    restaurantName: "測試義式餐館",
    venueAddress: "台北市信義區松壽路 20 號 2 樓",
    latitude: "25.0339",
    longitude: "121.5645",
    capacity: 4,
  },
  host: { id: "6e9a61b5-399f-4d2c-a973-a2d695f6cf83", displayName: "Ammolite", avatarUrl: null },
} as PublicEvent;

describe("公開 SEO 基礎設施", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getPublicEvent.mockResolvedValue(publicEvent);
    mocks.listIndexableEvents.mockResolvedValue([{ id: publicEvent.event.id, updatedAt: new Date("2026-08-15T00:00:00.000Z"), eventStartAt: publicEvent.event.eventStartAt }]);
  });

  it("公開飯局產生 canonical、OG 與 Twitter Card Metadata", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ eventId: publicEvent.event.id }) });
    expect(metadata.title).toBe(publicEvent.event.title);
    expect(metadata.alternates?.canonical).toBe(`/events/${publicEvent.event.id}`);
    expect(metadata.openGraph).toMatchObject({ title: `${publicEvent.event.title}｜DineLink 約飯`, url: `/events/${publicEvent.event.id}` });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
  });

  it("公開飯局 JSON-LD 提供活動時間、餐廳地址、主辦人與公開網址", () => {
    const jsonLd = eventJsonLd(publicEvent);
    expect(jsonLd).toMatchObject({ "@type": "Event", name: publicEvent.event.title, organizer: { name: "Ammolite" }, location: { name: "測試義式餐館", address: { streetAddress: publicEvent.event.venueAddress } } });
    expect(jsonLd.url).toContain(`/events/${publicEvent.event.id}`);
  });

  it("sitemap 僅列出首頁與可索引的公開飯局", async () => {
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual(expect.arrayContaining(["https://dinelink-ok6woqkb.manus.space/", `https://dinelink-ok6woqkb.manus.space/events/${publicEvent.event.id}`]));
  });

  it("robots 允許公開內容、封鎖管理與 API，並揭露 sitemap", () => {
    const config = robots();
    expect(config.sitemap).toBe("https://dinelink-ok6woqkb.manus.space/sitemap.xml");
    expect(config.rules).toEqual(expect.arrayContaining([expect.objectContaining({ allow: "/", disallow: expect.arrayContaining(["/api/", "/admin", "/dashboard"]) })]));
  });
});

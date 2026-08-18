import { describe, expect, it } from "vitest";
import { HOME_SEO } from "@/lib/home-seo";

const characterCount = (value: string) => Array.from(value).length;

describe("首頁 SEO metadata 限制", () => {
  it("提供 3 至 8 個聚焦 keywords", () => {
    expect(HOME_SEO.keywords.length).toBeGreaterThanOrEqual(3);
    expect(HOME_SEO.keywords.length).toBeLessThanOrEqual(8);
  });

  it("將 title 控制在 30 至 60 個字元", () => {
    expect(characterCount(HOME_SEO.title)).toBeGreaterThanOrEqual(30);
    expect(characterCount(HOME_SEO.title)).toBeLessThanOrEqual(60);
  });

  it("將 description 控制在 50 至 160 個字元", () => {
    expect(characterCount(HOME_SEO.description)).toBeGreaterThanOrEqual(50);
    expect(characterCount(HOME_SEO.description)).toBeLessThanOrEqual(160);
  });
});

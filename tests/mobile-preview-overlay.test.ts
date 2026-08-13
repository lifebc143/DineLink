import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("手機飯局預覽操作列", () => {
  it("預覽彈窗會覆蓋底部導覽並保留確認建立操作列的安全區", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain('div:has(> section[aria-label="飯局預覽確認"]) { z-index: 70 !important; }');
    expect(css).toContain("height: calc(100dvh - 0.5rem) !important;");
    expect(css).toContain('section[aria-label="飯局預覽確認"] > div:last-child');
    expect(css).toContain("margin-top: auto !important;");
  });
});

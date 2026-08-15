import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("首頁手機頂部安全區", () => {
  it("以系統 Safe Area 與最小留白保護頂部帳號和選單控制項", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
    const page = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    expect(css).toContain(".app-top-safe");
    expect(css).toContain("env(safe-area-inset-top)");
    expect(page).toContain("app-top-safe px-4 pb-28");
  });
});

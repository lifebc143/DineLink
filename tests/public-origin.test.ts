import { describe, expect, it } from "vitest";
import { getPublicOrigin } from "@/lib/public-origin";

describe("getPublicOrigin", () => {
  it("prefers the HTTPS public reverse-proxy host over an internal localhost origin", () => {
    const headers = new Headers({ "x-forwarded-host": "dine-link.manus.space", "x-forwarded-proto": "https" });
    expect(getPublicOrigin(headers, "http://localhost:3000")).toBe("https://dine-link.manus.space");
  });

  it("retains localhost only when no forwarded public host exists", () => {
    expect(getPublicOrigin(new Headers({ host: "localhost:3000" }), "http://localhost:3000")).toBe("http://localhost:3000");
  });
});

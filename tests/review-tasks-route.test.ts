import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: {} }));

import { GET } from "@/app/api/me/review-tasks/route";

describe("GET /api/me/review-tasks", () => {
  beforeEach(() => vi.clearAllMocks());
  it("未登入時回傳 401，保護飯後評價待辦資料", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });
});

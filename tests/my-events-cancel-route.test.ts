import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: {} }));

import { POST } from "@/app/api/applications/[applicationId]/cancel/route";

describe("POST /api/applications/[applicationId]/cancel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未登入時回傳 401", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await POST(new Request("http://localhost") as never, { params: Promise.resolve({ applicationId: "22222222-2222-4222-8222-222222222222" }) });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));

import { GET } from "@/app/api/me/insights/route";

describe("GET /api/me/insights", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未登入時拒絕讀取個人信用洞察", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });

  it("彙整出席率、互評維度與累積 Rating 趨勢", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1" });
    mocks.select
      .mockReturnValueOnce({ from: () => ({ where: () => ({ limit: async () => [{ creditScore: 84, completedEventCount: 3, noShowCount: 0 }] }) }) })
      .mockReturnValueOnce({ from: () => ({ where: async () => [{ status: "attended" }, { status: "late" }, { status: "no_show" }, { status: "confirmed" }] }) })
      .mockReturnValueOnce({ from: () => ({ where: () => ({ orderBy: async () => [{ punctualityScore: 5, politenessScore: 4, funScore: 5, submittedAt: new Date("2026-08-01T00:00:00.000Z") }, { punctualityScore: 4, politenessScore: 5, funScore: 4, submittedAt: new Date("2026-08-02T00:00:00.000Z") }] }) }) });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ creditScore: 84, completedEventCount: 3, attendanceRate: 67, attendanceTotal: 3, dimensions: { punctuality: 4.5, politeness: 4.5, interaction: 4.5 }, trend: [{ score: 93 }, { score: 90 }] });
  });
});

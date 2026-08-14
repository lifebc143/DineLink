import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));

import { GET } from "@/app/api/admin/overview/route";

function query(result: unknown[]) {
  return { from: () => ({ then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(result).then(resolve), where: () => Promise.resolve(result), orderBy: () => ({ limit: () => Promise.resolve(result) }) }) };
}

describe("GET /api/admin/overview", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("未登入時拒絕存取", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });

  it("一般會員不可讀取營運統計", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "member-1", role: "member" });
    const response = await GET();
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
  });

  it("管理員可讀取真實會員與營運摘要，不回傳 email 等非必要資料", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "admin-1", role: "admin" });
    const values = [[{ value: 42 }], [{ value: 18 }], [{ value: 4 }], [{ value: 1 }], [{ value: 12 }], [{ value: 8 }], [{ value: 25 }], [{ value: 3 }], [{ value: 20 }], [{ value: 2 }], [{ id: "member-1", displayName: "新會員", role: "member", verificationStatus: "verified", accountStatus: "active", suspensionReason: null, createdAt: new Date("2026-08-14T00:00:00.000Z") }]];
    let cursor = 0;
    mocks.select.mockImplementation(() => query(values[cursor++]));
    const response = await GET();
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.metrics).toEqual({ registeredMembers: 42, verifiedMembers: 18, pendingVerification: 4, restrictedMembers: 1, totalEvents: 12, publishedEvents: 8, totalApplications: 25, pendingApplications: 3, totalAttendances: 20, noShowCount: 2 });
    expect(payload.recentMembers[0]).toEqual(expect.objectContaining({ displayName: "新會員", verificationStatus: "verified" }));
    expect(payload.recentMembers[0].email).toBeUndefined();
  });
});

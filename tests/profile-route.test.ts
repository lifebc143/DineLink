import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { update: mocks.update } }));

import { GET, PATCH } from "@/app/api/me/profile/route";

const member = { id: "18da3a2c-6052-49ec-a2de-7d7fa7b57ef0", authSubject: "oauth-member", displayName: "小安", avatarUrl: "/manus-storage/avatar.jpg", bio: "喜歡探索新餐廳，也願意認識不同生活背景的朋友。", gender: "woman" as const, ageRange: "25-34", interestTags: ["咖啡"], preferredArea: "台北信義", verificationStatus: "verified" as const };

describe("會員信任資料 API", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue(member); });

  it("回傳目前會員的資料完成度與驗證訊號", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ profile: { ageRange: "25-34", interestTags: ["咖啡"], trust: { completionPercent: 100, canApply: true, verificationLabel: "已驗證" } } });
  });

  it("拒絕過短自我介紹並安全儲存有效的信任資料", async () => {
    const invalid = await PATCH(new Request("http://localhost/api/me/profile", { method: "PATCH", body: JSON.stringify({ bio: "太短" }) }) as never);
    expect(invalid.status).toBe(400);
    const returning = vi.fn().mockResolvedValue([{ ...member, ageRange: "35-44", interestTags: ["旅行", "電影"], preferredArea: "台北大安" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValue({ set });
    const response = await PATCH(new Request("http://localhost/api/me/profile", { method: "PATCH", body: JSON.stringify({ bio: member.bio, gender: "woman", ageRange: "35-44", interestTags: ["旅行", "電影"], preferredArea: "台北大安" }) }) as never);
    expect(response.status).toBe(200);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ ageRange: "35-44", interestTags: ["旅行", "電影"], preferredArea: "台北大安" }));
  });
});

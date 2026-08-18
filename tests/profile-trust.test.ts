import { describe, expect, it } from "vitest";
import { calculateProfileTrust } from "@/lib/profile-trust";

describe("profile trust completion", () => {
  it("requires avatar, bio, age range and interests for a standard member application", () => {
    const trust = calculateProfileTrust({ authSubject: "oauth-user", verificationStatus: "unverified" });
    expect(trust.canApply).toBe(false);
    expect(trust.requiredMissing).toEqual(expect.arrayContaining(["公開頭像", "自我介紹", "年齡區間", "興趣標籤"]));
  });

  it("allows a complete profile to apply while showing verification as a separate trust signal", () => {
    const trust = calculateProfileTrust({ avatarUrl: "/avatar.jpg", bio: "喜歡探索新餐廳，也願意認識不同生活背景的朋友。", gender: "woman", ageRange: "25-34", interestTags: ["咖啡", "旅行"], preferredArea: "台北信義", verificationStatus: "pending" });
    expect(trust.canApply).toBe(true);
    expect(trust.completionPercent).toBe(100);
    expect(trust.verificationLabel).toBe("驗證審核中");
  });

  it("allows the explicitly isolated mock login account to test post-login flows", () => {
    const trust = calculateProfileTrust({ authSubject: "mock-email-otp:example" });
    expect(trust.isMockAccount).toBe(true);
    expect(trust.canApply).toBe(true);
  });
});

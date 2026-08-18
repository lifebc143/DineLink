import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import ProfileTrustEditor from "./ProfileTrustEditor";

const incompleteProfile = {
  bio: null, gender: "prefer_not_to_say", ageRange: null, interestTags: [], preferredArea: null,
  trust: { completionPercent: 0, completedCount: 0, totalCount: 6, missingFields: ["公開頭像", "自我介紹"], requiredMissing: ["公開頭像", "自我介紹", "年齡區間", "興趣標籤"], verificationLabel: "尚未驗證", canApply: false, isMockAccount: false },
};

describe("會員信任資料編輯器", () => {
  afterEach(() => cleanup());
  beforeEach(() => { vi.restoreAllMocks(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ profile: incompleteProfile }) })); });

  it("顯示申請前完成度與待補齊欄位", async () => {
    render(<ProfileTrustEditor />);
    expect(await screen.findByText("0% 完成")).not.toBeNull();
    expect(screen.getByText(/申請前請補齊：公開頭像、自我介紹、年齡區間、興趣標籤/)).not.toBeNull();
  });

  it("開啟表單並拒絕不足的必要資料", async () => {
    render(<ProfileTrustEditor />);
    await screen.findByText("補齊我的信任資料");
    fireEvent.click(screen.getByText("補齊我的信任資料"));
    fireEvent.click(screen.getByText("儲存信任資料"));
    expect(screen.getByText("請補齊至少 12 字自我介紹、年齡區間、至少一個興趣與常用活動區域。")).not.toBeNull();
  });
});

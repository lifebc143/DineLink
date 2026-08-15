import { describe, expect, it, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), storagePut: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("@/lib/db", () => ({ db: { update: mocks.update } }));

import { POST } from "@/app/api/me/avatar/route";

const member = { id: "18da3a2c-6052-49ec-a2de-7d7fa7b57ef0", displayName: "小安" };
const requestWith = (file: File) => {
  const form = new FormData();
  form.append("avatar", file);
  return new Request("http://localhost/api/me/avatar", { method: "POST", body: form });
};

describe("會員頭像上傳 API", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue(member); });

  it("拒絕未登入、非支援格式與超過 5MB 的檔案", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);
    expect((await POST(requestWith(new File(["image"], "avatar.png", { type: "image/png" })))).status).toBe(401);
    expect((await POST(requestWith(new File(["image"], "avatar.gif", { type: "image/gif" })))).status).toBe(415);
    const tooLarge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "avatar.png", { type: "image/png" });
    expect((await POST(requestWith(tooLarge))).status).toBe(413);
  });

  it("儲存合格圖片並將 S3 URL 寫回目前登入會員", async () => {
    mocks.storagePut.mockResolvedValue({ key: "avatars/member/profile.png", url: "/manus-storage/avatars/member/profile.png" });
    const returning = vi.fn().mockResolvedValue([{ id: member.id, displayName: member.displayName, avatarUrl: "/manus-storage/avatars/member/profile.png" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValue({ set });

    const response = await POST(requestWith(new File(["avatar-bytes"], "avatar.png", { type: "image/png" })));

    expect(response.status).toBe(200);
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringContaining(`avatars/${member.id}/profile.png`), expect.any(Uint8Array), "image/png");
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: "/manus-storage/avatars/member/profile.png" }));
    expect(await response.json()).toEqual({ user: { id: member.id, displayName: member.displayName, avatarUrl: "/manus-storage/avatars/member/profile.png" } });
  });
});

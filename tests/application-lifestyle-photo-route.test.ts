import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), storagePut: vi.fn(), select: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/storage", () => ({ storagePut: mocks.storagePut }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));

import { POST } from "@/app/api/events/[eventId]/application-photo/route";

const member = { id: "18da3a2c-6052-49ec-a2de-7d7fa7b57ef0", displayName: "小安" };
const eventId = "123e4567-e89b-12d3-a456-426614174000";
const requestWith = (file: File) => { const form = new FormData(); form.append("photo", file); return new Request(`http://localhost/api/events/${eventId}/application-photo`, { method: "POST", body: form }); };
const params = { params: Promise.resolve({ eventId }) };

describe("飯局申請生活照上傳 API", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue(member);
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ id: eventId, hostId: "host-id", status: "published" }] }) }) });
  });

  it("拒絕未登入、不支援格式與超過 5MB 的生活照", async () => {
    mocks.getCurrentUser.mockResolvedValueOnce(null);
    expect((await POST(requestWith(new File(["image"], "life.png", { type: "image/png" })) as never, params)).status).toBe(401);
    expect((await POST(requestWith(new File(["image"], "life.gif", { type: "image/gif" })) as never, params)).status).toBe(415);
    const tooLarge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "life.png", { type: "image/png" });
    expect((await POST(requestWith(tooLarge) as never, params)).status).toBe(413);
  });

  it("將合格生活照儲存於目前會員與目前飯局隔離的路徑", async () => {
    mocks.storagePut.mockResolvedValue({ key: "application-lifestyle/member/event/photo.jpg", url: `/manus-storage/application-lifestyle/${member.id}/${eventId}/photo.jpg` });
    const response = await POST(requestWith(new File(["photo-bytes"], "life.jpg", { type: "image/jpeg" })) as never, params);
    expect(response.status).toBe(200);
    expect(mocks.storagePut).toHaveBeenCalledWith(expect.stringContaining(`application-lifestyle/${member.id}/${eventId}/`), expect.any(Uint8Array), "image/jpeg");
    expect(await response.json()).toMatchObject({ photoUrl: expect.stringContaining(`application-lifestyle/${member.id}/${eventId}/`) });
  });
});

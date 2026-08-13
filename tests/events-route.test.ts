import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { insert: mocks.insert } }));

import { POST } from "@/app/api/events/route";

const validEvent = {
  title: "週末義式晚餐",
  eventStartAt: "2026-08-20T11:30:00.000Z",
  venueAddress: "台北市信義區松壽路",
  restaurantName: "PASTA & CO.",
  placeId: "ChIJd8BlQ2BZwokRAFUEcm_qrcA",
  latitude: "25.033964",
  longitude: "121.564472",
  capacity: 4,
  paymentMode: "split_bill",
  budgetMin: 800,
  budgetMax: 800,
  depositPoints: 100,
};

function request(body: unknown) {
  return new Request("http://localhost/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) as never;
}

describe("POST /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue({ id: "9d6ff613-4c18-4ea3-92ca-b8c4b6753430" });
  });

  it("未登入時回傳 401 且不寫入資料庫", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await POST(request(validEvent));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("資料不合法時回傳 400 INVALID_EVENT", async () => {
    const response = await POST(request({ ...validEvent, title: "短" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("INVALID_EVENT");
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("成功建立時回傳 201 與飯局必要欄位", async () => {
    const event = { id: "d52da889-7dce-4f49-9304-a58faf956d4c", title: validEvent.title, status: "published", eventStartAt: new Date(validEvent.eventStartAt) };
    const returning = vi.fn().mockResolvedValue([event]);
    const values = vi.fn().mockReturnValue({ returning });
    mocks.insert.mockReturnValue({ values });

    const response = await POST(request(validEvent));
    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(payload.event).toMatchObject({ id: event.id, title: validEvent.title, status: "published" });
    expect(payload.event.eventStartAt).toBe(new Date(validEvent.eventStartAt).toJSON());
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ hostId: "9d6ff613-4c18-4ea3-92ca-b8c4b6753430", status: "published", placeId: validEvent.placeId, latitude: validEvent.latitude, longitude: validEvent.longitude }));
  });

  it("資料庫例外時回傳 500 EVENT_CREATE_FAILED", async () => {
    mocks.insert.mockImplementation(() => { throw new Error("database offline"); });
    const response = await POST(request(validEvent));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "EVENT_CREATE_FAILED" });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select, update: mocks.update } }));

import { PUT } from "@/app/api/events/[eventId]/route";

const hostId = "9d6ff613-4c18-4ea3-92ca-b8c4b6753430";
const eventId = "d52da889-7dce-4f49-9304-a58faf956d4c";
const body = { title: "更新後的義式晚餐", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "新的 PASTA & CO.", venueAddress: "台北市信義區松壽路 20 號 2 樓", placeId: "place-1", latitude: "25.033964", longitude: "121.564472", capacity: 6, paymentMode: "split_bill", budgetMin: 900, budgetMax: 900 };
const request = (value: unknown) => new Request(`http://localhost/api/events/${eventId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) }) as never;
const context = { params: Promise.resolve({ eventId }) };

describe("PUT /api/events/[eventId]", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.getCurrentUser.mockResolvedValue({ id: hostId }); mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ id: eventId, hostId, status: "published", eventStartAt: new Date("2026-08-20T10:30:00.000Z") }] }) }) }); });

  it("未登入時拒絕更新", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await PUT(request(body), context);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });

  it("非主辦人不可更新飯局", async () => {
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ id: eventId, hostId: "another-host", status: "published" }] }) }) });
    const response = await PUT(request(body), context);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "FORBIDDEN" });
  });

  it("主辦人可更新店名、完整地址與飯局內容", async () => {
    const returning = vi.fn().mockResolvedValue([{ id: eventId, ...body, status: "published" }]);
    const where = vi.fn().mockReturnValue({ returning });
    const set = vi.fn().mockReturnValue({ where });
    mocks.update.mockReturnValue({ set });
    const response = await PUT(request(body), context);
    expect(response.status).toBe(200);
    expect((await response.json()).event).toMatchObject({ title: body.title, restaurantName: body.restaurantName, venueAddress: body.venueAddress });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ title: body.title, restaurantName: body.restaurantName, venueAddress: body.venueAddress, capacity: 6 }));
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ previousStartAt: new Date("2026-08-20T10:30:00.000Z") }));
  });
});

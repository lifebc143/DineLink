import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn(), insert: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select, insert: mocks.insert } }));

import { GET, POST } from "@/app/api/events/[eventId]/messages/route";

const chain = (result: unknown, methods: Array<"innerJoin" | "limit" | "orderBy"> = []) => {
  const value: Record<string, ReturnType<typeof vi.fn>> = { from: vi.fn(), where: vi.fn() };
  for (const method of methods) value[method] = vi.fn();
  value.from.mockReturnValue(value); value.where.mockReturnValue(value);
  for (const method of methods) value[method].mockReturnValue(method === "limit" || method === "orderBy" ? undefined : value);
  if (methods.includes("limit")) value.limit.mockResolvedValue(result);
  else if (methods.includes("orderBy")) value.orderBy.mockResolvedValue(result);
  else value.where.mockResolvedValue(result);
  return value;
};

describe("飯局聊天室 API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("主辦人可取得真實的飯局歷史訊息與作者資料", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "host-id", displayName: "主辦人" });
    const eventQuery = chain([{ id: "event-id", hostId: "host-id" }], ["limit"]);
    const messageQuery = chain([{ message: { id: "message-id", content: "我已經出發了" }, author: { id: "member-id", displayName: "小安" } }], ["innerJoin", "orderBy"]);
    messageQuery.innerJoin.mockReturnValue(messageQuery);
    mocks.select.mockReturnValueOnce(eventQuery).mockReturnValueOnce(messageQuery);

    const response = await GET(new Request("https://dine.link/api/events/event-id/messages") as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ messages: [{ message: { content: "我已經出發了" }, author: { displayName: "小安" } }] });
  });

  it("已確認的主辦人可送出訊息，並回傳建立結果", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "host-id", displayName: "主辦人" });
    const eventQuery = chain([{ id: "event-id", hostId: "host-id" }], ["limit"]);
    const recipientQuery = chain([], []);
    const insertValues = vi.fn().mockReturnValue({ returning: vi.fn().mockResolvedValue([{ id: "message-id", content: "餐廳見" }]) });
    mocks.select.mockReturnValueOnce(eventQuery).mockReturnValueOnce(recipientQuery);
    mocks.insert.mockReturnValue({ values: insertValues });

    const response = await POST(new Request("https://dine.link/api/events/event-id/messages", { method: "POST", body: JSON.stringify({ content: "餐廳見" }) }) as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ message: { id: "message-id", content: "餐廳見" } });
  });

  it("非主辦人且未確認的會員不可讀取聊天室", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "outsider-id", displayName: "路人" });
    const eventQuery = chain([{ id: "event-id", hostId: "host-id" }], ["limit"]);
    const attendanceQuery = chain([], ["limit"]);
    mocks.select.mockReturnValueOnce(eventQuery).mockReturnValueOnce(attendanceQuery);

    const response = await GET(new Request("https://dine.link/api/events/event-id/messages") as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "CHAT_ACCESS_DENIED" });
  });
});

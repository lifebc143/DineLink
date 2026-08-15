import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn() }));

vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));

import { GET } from "@/app/api/me/events/route";

describe("GET /api/me/events", () => {
  beforeEach(() => vi.clearAllMocks());

  it("未登入時回傳 401，避免個人飯局資料被讀取", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    const response = await GET();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "UNAUTHENTICATED" });
  });

  it("登入後回傳主辦飯局、待審核成員、確認成員與我已申請的飯局", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "11111111-1111-4111-8111-111111111111" });
    const hostedEvent = { id: "22222222-2222-4222-8222-222222222222", title: "我發起的飯局", eventStartAt: new Date("2026-08-20T11:30:00.000Z"), capacity: 4 };
    const pending = { application: { id: "33333333-3333-4333-8333-333333333333", eventId: hostedEvent.id, status: "pending" }, applicant: { id: "44444444-4444-4444-8444-444444444444", displayName: "小安", avatarUrl: null } };
    const attendance = { attendance: { id: "55555555-5555-4555-8555-555555555555", eventId: hostedEvent.id, userId: "66666666-6666-4666-8666-666666666666", status: "confirmed" }, member: { id: "66666666-6666-4666-8666-666666666666", displayName: "小晴", avatarUrl: null, creditScore: 88, completedEventCount: 4, noShowCount: 1 } };
    const latestMessage = { eventId: hostedEvent.id, authorId: attendance.member.id, content: "我已經在路上了", createdAt: new Date("2026-08-20T10:30:00.000Z") };
    const applied = { application: { id: "77777777-7777-4777-8777-777777777777", status: "approved" }, event: { id: "88888888-8888-4888-8888-888888888888", title: "我申請的飯局" }, host: { id: "99999999-9999-4999-8999-999999999999", displayName: "Mia", avatarUrl: null } };
    const hostedQuery = { from: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
    hostedQuery.from.mockReturnValue(hostedQuery); hostedQuery.where.mockReturnValue(hostedQuery); hostedQuery.orderBy.mockResolvedValue([hostedEvent]);
    const pendingQuery = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn() };
    pendingQuery.from.mockReturnValue(pendingQuery); pendingQuery.innerJoin.mockReturnValue(pendingQuery); pendingQuery.where.mockResolvedValue([pending]);
    const attendanceQuery = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn() };
    attendanceQuery.from.mockReturnValue(attendanceQuery); attendanceQuery.innerJoin.mockReturnValue(attendanceQuery); attendanceQuery.where.mockResolvedValue([attendance]);
    const messagesQuery = { from: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
    messagesQuery.from.mockReturnValue(messagesQuery); messagesQuery.where.mockReturnValue(messagesQuery); messagesQuery.orderBy.mockResolvedValue([latestMessage]);
    const appliedQuery = { from: vi.fn(), innerJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
    appliedQuery.from.mockReturnValue(appliedQuery); appliedQuery.innerJoin.mockReturnValue(appliedQuery); appliedQuery.where.mockReturnValue(appliedQuery); appliedQuery.orderBy.mockResolvedValue([applied]);
    mocks.select.mockReturnValueOnce(hostedQuery).mockReturnValueOnce(pendingQuery).mockReturnValueOnce(attendanceQuery).mockReturnValueOnce(messagesQuery).mockReturnValueOnce(appliedQuery);

    const response = await GET();
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.hosted[0]).toMatchObject({ event: { id: hostedEvent.id, title: "我發起的飯局" }, pendingApplications: [{ applicant: { displayName: "小安" } }], attendances: [{ member: { displayName: "小晴", creditScore: 88, completedEventCount: 4, noShowCount: 1 }, lastContact: { content: "我已經在路上了" } }] });
    expect(payload.applied[0]).toMatchObject({ application: { status: "approved" }, event: { title: "我申請的飯局" }, host: { displayName: "Mia" } });
  });
});

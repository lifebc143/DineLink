import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import MyEventsManagement from "./MyEventsManagement";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("MyEventsManagement 進階飯局管理", () => {
  it("可在日曆、通知與評價中心間切換", async () => {
    const eventPayload = { hosted: [], applied: [] };
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/events" ? eventPayload : url === "/api/notifications" ? { notifications: [] } : { tasks: [] } })));
    render(<MyEventsManagement onBack={() => undefined} />);
    expect(await screen.findByText("尚未發起飯局")).not.toBeNull();

    fireEvent.click(screen.getByText("日曆"));
    expect(screen.getByText("本月沒有符合篩選的飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("通知"));
    expect(screen.getByText("目前沒有通知")).not.toBeNull();
    fireEvent.click(screen.getByText("評價"));
    expect(screen.getByText("目前沒有待評價飯局")).not.toBeNull();
  });

  it("可標示通知已讀並以三項分數與出席註記送出評價", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ hosted: [], applied: [] }) });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [{ id: "notice-1", title: "新的申請", body: "請查看", type: "application_submitted", readAt: null, createdAt: "2026-08-01T12:00:00.000Z" }] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [{ event: { id: "event-1", title: "測試飯局", eventStartAt: "2026-08-01T12:00:00.000Z", restaurantName: "餐廳", venueAddress: "地址", status: "completed", capacity: 4 }, peer: { id: "peer-1", displayName: "小安", avatarUrl: null } }] }) });
      if (url === "/api/notifications/notice-1/read" && options?.method === "PATCH") return Promise.resolve({ ok: true });
      if (url === "/api/events/event-1/reviews" && options?.method === "POST") return Promise.resolve({ ok: true });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MyEventsManagement onBack={() => undefined} />);
    await screen.findByText("尚未發起飯局");

    fireEvent.click(screen.getByText("通知 1"));
    fireEvent.click(await screen.findByText("新的申請"));
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/notice-1/read", { method: "PATCH" });

    fireEvent.click(screen.getByText("評價"));
    fireEvent.click(await screen.findByText("填寫出席評價"));
    fireEvent.change(screen.getByPlaceholderText("例如：準時抵達、互動愉快。"), { target: { value: "準時抵達" } });
    fireEvent.click(screen.getAllByText("3")[0]!);
    fireEvent.click(screen.getByText("送出評價"));
    expect(fetchMock).toHaveBeenCalledWith("/api/events/event-1/reviews", expect.objectContaining({ method: "POST", body: expect.stringContaining("attendanceNote") }));
  });

  it("可依主辦與參與分類飯局，並切換該飯局的提醒狀態", async () => {
    const now = new Date();
    const payload = { hosted: [{ event: { id: "hosted-event", title: "本月主辦飯局", eventStartAt: now.toISOString(), restaurantName: "餐廳", venueAddress: "地址", status: "published", capacity: 4 }, pendingApplications: [], attendances: [] }], applied: [] };
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/events" ? payload : url === "/api/notifications" ? { notifications: [] } : { tasks: [] } })));
    render(<MyEventsManagement onBack={() => undefined} />);
    await screen.findByText("本月主辦飯局");
    fireEvent.click(screen.getByText("日曆"));
    expect(await screen.findByText("本月主辦飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("參與"));
    expect(screen.getByText("本月沒有符合篩選的飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("主辦"));
    fireEvent.click(screen.getByText("標記提醒（本裝置）"));
    expect(screen.getByText("已標記提醒（本裝置）")).not.toBeNull();
  });

  it("點擊帶有 eventId 的通知會導向對應我的飯局深度連結", async () => {
    window.history.replaceState({}, "", "/");
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ hosted: [], applied: [] }) });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [{ id: "notice-link", title: "飯局提醒", body: "即將開始", type: "event_reminder", eventId: "event-focus", readAt: null, createdAt: "2026-08-01T12:00:00.000Z" }] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      if (url === "/api/notifications/notice-link/read" && options?.method === "PATCH") return Promise.resolve({ ok: true });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MyEventsManagement onBack={() => undefined} />);
    await screen.findByText("尚未發起飯局");
    fireEvent.click(screen.getByText("通知 1"));
    fireEvent.click(await screen.findByText("飯局提醒"));
    expect(window.location.search).toContain("tab=my-events");
    expect(window.location.search).toContain("eventId=event-focus");
    expect(fetchMock).toHaveBeenCalledWith("/api/notifications/notice-link/read", { method: "PATCH" });
  });

  it("主辦人可編輯飯局內容，並清楚查看店名與完整地址", async () => {
    const hosted = { id: "edit-event", title: "原始飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "原始店名", venueAddress: "台北市信義區松壽路 20 號 2 樓", paymentMode: "split_bill", budgetMin: 800, status: "published", capacity: 4 };
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ hosted: [{ event: hosted, pendingApplications: [], attendances: [] }], applied: [] }) });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      if (url === "/api/events/edit-event" && options?.method === "PUT") return Promise.resolve({ ok: true, status: 200, json: async () => ({ event: { ...hosted, title: "更新後飯局" } }) });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MyEventsManagement onBack={() => undefined} />);
    expect(await screen.findByText("店名：原始店名")).not.toBeNull();
    expect(screen.getByText("完整地址：台北市信義區松壽路 20 號 2 樓")).not.toBeNull();
    fireEvent.click(screen.getByText("編輯內容"));
    fireEvent.change(screen.getByDisplayValue("原始飯局"), { target: { value: "更新後飯局" } });
    fireEvent.click(screen.getByText("儲存飯局內容"));
    expect(fetchMock).toHaveBeenCalledWith("/api/events/edit-event", expect.objectContaining({ method: "PUT", body: expect.stringContaining("更新後飯局") }));
  });

  it("逾時未成局飯局會移至歷史分類，不再混入可管理飯局", async () => {
    const unmatched = { id: "unmatched-event", title: "未成局午餐", eventStartAt: "2026-08-01T04:00:00.000Z", restaurantName: "測試店", venueAddress: "台北市中山區", status: "unmatched", capacity: 4 };
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/events" ? { hosted: [{ event: unmatched, pendingApplications: [], attendances: [] }], applied: [] } : url === "/api/notifications" ? { notifications: [] } : { tasks: [] } })));
    render(<MyEventsManagement onBack={() => undefined} />);
    expect(await screen.findByText("尚未發起飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("未成局歷史"));
    expect(await screen.findByText("未成局午餐")).not.toBeNull();
    expect(screen.getByText("此飯局在開始前未有已確認成員，系統已自動停止報名並標示為未成局，不影響任何人的信用與出席紀錄。")).not.toBeNull();
    expect(screen.queryByText("編輯內容")).toBeNull();
  });

  it("出席狀態會高亮目前紀錄，爽約需二次確認，並可從成員卡片開啟飯局聊天室", async () => {
    const hosted = { id: "attendance-event", title: "出席管理測試飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "測試餐廳", venueAddress: "台北市", status: "published", capacity: 2 };
    const payload = { hosted: [{ event: hosted, pendingApplications: [], attendances: [{ attendance: { id: "attendance-1", userId: "member-1", status: "attended" }, member: { id: "member-1", displayName: "小安", avatarUrl: null, creditScore: 92, completedEventCount: 4, noShowCount: 0 }, lastContact: { content: "我已經在路上了", createdAt: "2026-08-20T10:30:00.000Z" } }] }], applied: [] };
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => payload });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      if (url === "/api/events/attendance-event/attendance" && options?.method === "PATCH") return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });
    const onOpenChat = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<MyEventsManagement onBack={() => undefined} onOpenChat={onOpenChat} />);

    expect(await screen.findByText("小安")).not.toBeNull();
    expect(screen.getByText("信用 92 · 出席 100%")).not.toBeNull();
    expect(screen.getByText("最後聯繫：我已經在路上了")).not.toBeNull();
    expect(screen.getByText("出席").className).toContain("bg-emerald-600");
    expect(screen.getByText("遲到").className).toContain("bg-slate-100");
    fireEvent.click(screen.getByText("傳送訊息"));
    expect(onOpenChat).toHaveBeenCalledWith({ eventId: "attendance-event", eventTitle: "出席管理測試飯局", memberName: "小安" });

    fireEvent.click(screen.getByText("爽約"));
    const noShowDialog = screen.getByRole("dialog", { name: "確認標記爽約？" });
    expect(noShowDialog).not.toBeNull();
    expect(within(noShowDialog).getByText(/飯局時間：/)).not.toBeNull();
    expect(within(noShowDialog).getByText(/我已經在路上了/)).not.toBeNull();
    expect(fetchMock).not.toHaveBeenCalledWith("/api/events/attendance-event/attendance", expect.anything());
    fireEvent.click(screen.getByText("返回"));
    expect(screen.queryByRole("dialog", { name: "確認標記爽約？" })).toBeNull();

    fireEvent.click(screen.getByText("爽約"));
    fireEvent.click(screen.getByText("確認標記爽約"));
    expect(fetchMock).toHaveBeenCalledWith("/api/events/attendance-event/attendance", expect.objectContaining({ method: "PATCH", body: JSON.stringify({ userId: "member-1", status: "no_show" }) }));
  });

  it("主辦人完成所有出席紀錄後，可直接完成飯局並前往評價分頁", async () => {
    const hosted = { id: "complete-event", title: "完成入口測試飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "測試餐廳", venueAddress: "台北市", status: "published", capacity: 2 };
    const payload = { hosted: [{ event: hosted, pendingApplications: [], attendances: [{ attendance: { id: "attendance-complete", userId: "member-1", status: "attended" }, member: { id: "member-1", displayName: "小安" }, lastContact: null }] }], applied: [] };
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => payload });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      if (url === "/api/events/complete-event/complete" && options?.method === "POST") return Promise.resolve({ ok: true, status: 200, json: async () => ({ status: "completed" }) });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<MyEventsManagement onBack={() => undefined} />);
    fireEvent.click(await screen.findByText("完成飯局並前往評價"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/events/complete-event/complete", { method: "POST" }));
    expect(await screen.findByText("目前沒有待評價飯局")).not.toBeNull();
  });

  it("已完成且已有出席紀錄的主辦飯局仍會顯示前往評價入口", async () => {
    const completed = { id: "completed-event", title: "已完成飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "測試餐廳", venueAddress: "台北市", status: "completed", capacity: 2 };
    const payload = { hosted: [{ event: completed, pendingApplications: [], attendances: [{ attendance: { id: "attendance-done", userId: "member-1", status: "attended" }, member: { id: "member-1", displayName: "小安" }, lastContact: null }] }], applied: [] };
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/events" ? payload : url === "/api/notifications" ? { notifications: [] } : { tasks: [] } })));
    render(<MyEventsManagement onBack={() => undefined} />);

    expect(await screen.findByText("此飯局已完成，現在可直接前往評價。")).not.toBeNull();
    fireEvent.click(screen.getByText("前往評價"));
    expect(await screen.findByText("目前沒有待評價飯局")).not.toBeNull();
  });

  it("已確認的參加者可從已申請飯局卡片進入正確群組聊天室，待審核者不會看到入口", async () => {
    const confirmedEvent = { id: "confirmed-event", title: "已確認晚餐", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "餐廳", venueAddress: "台北市", status: "published", capacity: 2 };
    const pendingEvent = { id: "pending-event", title: "待審核午餐", eventStartAt: "2026-08-21T11:30:00.000Z", restaurantName: "餐廳", venueAddress: "台北市", status: "published", capacity: 2 };
    const payload = { hosted: [], applied: [{ application: { id: "confirmed-application", status: "approved" }, event: confirmedEvent, host: { displayName: "Mia" } }, { application: { id: "pending-application", status: "pending" }, event: pendingEvent, host: { displayName: "Kevin" } }] };
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/events" ? payload : url === "/api/notifications" ? { notifications: [] } : { tasks: [] } })));
    const onOpenChat = vi.fn();
    render(<MyEventsManagement onBack={() => undefined} onOpenChat={onOpenChat} />);

    await screen.findByText("尚未發起飯局");
    fireEvent.click(screen.getByText("我已申請的飯局"));
    expect(await screen.findByText("已確認晚餐")).not.toBeNull();
    expect(screen.getAllByText("進入群組聊天室")).toHaveLength(1);
    fireEvent.click(screen.getByText("進入群組聊天室"));
    expect(onOpenChat).toHaveBeenCalledWith({ eventId: "confirmed-event", eventTitle: "已確認晚餐", memberName: "Mia" });
  });
});

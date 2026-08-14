import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
});

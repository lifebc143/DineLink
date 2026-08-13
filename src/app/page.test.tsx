import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/Map", () => ({
  MapView: ({ initialCenter }: { initialCenter: { lat: number; lng: number } }) => (
    <div data-testid="venue-map">{initialCenter.lat},{initialCenter.lng}</div>
  ),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("發起飯局表單", () => {
  it("可選擇日期並開啟餐廳地圖確認視圖", () => {
    render(<Home />);

    fireEvent.click(screen.getByText("發起飯局"));

    const dateInput = screen.getByLabelText("選擇日期") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-20" } });
    expect(dateInput.value).toBe("2026-08-20");

    const venueInput = screen.getByPlaceholderText("搜尋餐廳、地標或地址");
    fireEvent.focus(venueInput);
    fireEvent.click(screen.getByText("PASTA & CO."));

    expect(screen.queryByText("地圖確認位置")).not.toBeNull();
    expect(screen.getByTestId("venue-map").textContent).toContain("25.0339,121.5645");
  });

  it("可直接切換地圖確認視圖", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.click(screen.getByLabelText("在地圖確認餐廳位置"));

    expect(screen.queryByText("地圖確認位置")).not.toBeNull();
    expect(screen.queryByLabelText("關閉地圖")).not.toBeNull();
  });

  it("未填必填欄位時會顯示驗證提示", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.click(screen.getByText("預覽並發起飯局"));

    expect(screen.queryByRole("alert")?.textContent).toContain("請先填妥飯局主題、日期與餐廳／地點");
  });

  it("填妥表單後會呼叫建立飯局 API 並顯示成功狀態", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({ event: { id: "event-1" } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));

    expect(screen.queryByRole("dialog", { name: "飯局預覽確認" })).not.toBeNull();
    expect(screen.queryByText("週末義式晚餐")).not.toBeNull();
    fireEvent.click(screen.getByText("確認建立飯局"));

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("現在已顯示在探索清單中");
    expect(screen.queryByText("週末義式晚餐")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/events", expect.objectContaining({ method: "POST" }));
  });

  it("API 回傳未登入時會在預覽彈窗顯示登入提示", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "UNAUTHENTICATED" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(screen.getByText("確認建立飯局"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("請先登入後再建立飯局");
  });

  it("API 驗證失敗時會顯示可讀錯誤而不建立飯局", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "INVALID_EVENT" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(screen.getByText("確認建立飯局"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("飯局資料格式有誤");
    expect(screen.queryByRole("dialog", { name: "飯局預覽確認" })).not.toBeNull();
  });

  it("網路失敗時會結束建立中狀態並提示重試", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(screen.getByText("確認建立飯局"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("連線暫時中斷");
    expect(screen.queryByText("確認建立飯局")).not.toBeNull();
  });

  it("伺服器 500 時會保留預覽並允許再次確認建立", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "SERVER_ERROR" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(screen.getByText("確認建立飯局"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("目前無法建立飯局，請稍後再試");
    expect(screen.queryByRole("dialog", { name: "飯局預覽確認" })).not.toBeNull();
    expect(screen.queryByText("確認建立飯局")).not.toBeNull();
  });

  it("飯局預覽與詳情均使用取消規則與出席信用提示，不顯示保證金", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    expect(screen.getByRole("dialog", { name: "飯局預覽確認" }).textContent).toContain("取消規則、出席紀錄與信用 rating");
    expect(screen.queryByText("保證金")).toBeNull();

    cleanup();
    render(<Home />);
    fireEvent.click(screen.getAllByText("我要報名")[0]);
    expect(screen.queryByText("審核與出席提示：")).not.toBeNull();
    expect(screen.queryByText("保證金")).toBeNull();
  });

  it("產品規格頁呈現無保證金的審核、出席信用 Roadmap", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("產品規格與開發藍圖"));

    expect(screen.queryByText(/MVP：帳號與實名驗證、飯局探索、申請審核、文字聊天室與基礎出席評價/)).not.toBeNull();
    expect(screen.queryByText(/Beta：出席率／信用評分系統、飯局前推播通知、餐廳合作方案/)).not.toBeNull();
    expect(screen.queryByText(/PostgreSQL \+ Drizzle ORM，將飯局、申請、聊天與評價拆分為獨立 Entity/)).not.toBeNull();
    expect(screen.queryByText("保證金")).toBeNull();
  });

  it("個人頁可開啟我的飯局並讀取我發起與我申請的清單", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ hosted: [], applied: [] }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("我的飯局"));

    expect(await screen.findByText("尚未發起飯局")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/me/events", { cache: "no-store" });
  });

  it("未登入時我的飯局會顯示登入提示", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "UNAUTHENTICATED" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("我的飯局"));

    expect((await screen.findByText("請先登入，才能查看與管理你的飯局。")).textContent).toContain("請先登入");
  });

  it("我的飯局可切換主辦與申請視圖，並呼叫核准與取消操作", async () => {
    const payload = {
      hosted: [{ event: { id: "11111111-1111-4111-8111-111111111111", title: "主辦人飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "PASTA & CO.", venueAddress: "台北市信義區松壽路", status: "published", capacity: 4 }, pendingApplications: [{ application: { id: "22222222-2222-4222-8222-222222222222", introduction: "期待一起聊天" }, applicant: { displayName: "小安", avatarUrl: null } }], attendances: [{ attendance: { id: "33333333-3333-4333-8333-333333333333", userId: "44444444-4444-4444-8444-444444444444", status: "confirmed" }, member: { displayName: "小晴", avatarUrl: null } }] }],
      applied: [{ application: { id: "55555555-5555-4555-8555-555555555555", status: "approved", introduction: null }, event: { id: "66666666-6666-4666-8666-666666666666", title: "我申請的飯局", eventStartAt: "2026-08-21T11:30:00.000Z", restaurantName: "YAKI NIKU LAB", venueAddress: "台北市大安區光復南路", status: "published", capacity: 4 }, host: { displayName: "Mia" } }],
    };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("我的飯局"));

    expect(await screen.findByText("小安")).not.toBeNull();
    expect(screen.queryByText("小晴")).not.toBeNull();
    fireEvent.click(screen.getByText("查看取消規則明細"));
    expect(screen.queryByText(/申請者可在飯局開始前取消/)).not.toBeNull();
    fireEvent.click(screen.getByText("拒絕"));
    expect(fetchMock).toHaveBeenCalledWith("/api/applications/22222222-2222-4222-8222-222222222222/review", expect.objectContaining({ method: "POST", body: JSON.stringify({ decision: "rejected" }) }));

    fireEvent.click(screen.getByText("我已申請的飯局"));
    expect(await screen.findByText("我申請的飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("取消參與並退出聊天室"));
    expect(fetchMock).toHaveBeenCalledWith("/api/applications/55555555-5555-4555-8555-555555555555/cancel", { method: "POST" });
  });
});

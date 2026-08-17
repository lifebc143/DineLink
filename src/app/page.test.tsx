import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import { formatTaipeiTime } from "@/lib/time";

vi.mock("@/components/Map", () => ({
  MapView: ({ initialCenter }: { initialCenter: { lat: number; lng: number } }) => (
    <div data-testid="venue-map">{initialCenter.lat},{initialCenter.lng}</div>
  ),
  loadGoogleMaps: vi.fn(() => Promise.resolve()),
}));

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("發起飯局表單", () => {
  const getActiveConfirmButton = () => within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).getByRole("button", { name: "確認建立飯局" });
  it("可選擇日期並開啟 Google 地點搜尋入口", () => {
    render(<Home />);

    fireEvent.click(screen.getByText("發起飯局"));

    const dateInput = screen.getByLabelText("選擇日期") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-20" } });
    expect(dateInput.value).toBe("2026-08-20");

    const venueInput = screen.getByPlaceholderText("搜尋餐廳、地標或地址");
    fireEvent.focus(venueInput);
    expect(screen.queryByText("Google 地點建議")).not.toBeNull();
  });

  it("未輸入地點時會提示先輸入地址再定位", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.click(screen.getByLabelText("在地圖確認餐廳位置"));

    expect(screen.queryByRole("alert")?.textContent).toContain("請先輸入餐廳名稱或完整地址");
  });

  it("選取 Google Places 建議後會解析地址座標並可開關地圖確認視圖", async () => {
    vi.stubGlobal("google", { maps: { places: { PlacesServiceStatus: { OK: "OK", ZERO_RESULTS: "ZERO_RESULTS" }, AutocompleteService: class { getPlacePredictions(_: unknown, callback: (items: Array<{ place_id: string; description: string; structured_formatting: { main_text: string } }>, status: string) => void) { callback([{ place_id: "place-1", description: "台北市信義區測試路 1 號", structured_formatting: { main_text: "測試咖啡" } }], "OK"); } }, PlacesService: class { getDetails(_: unknown, callback: (place: { name: string; formatted_address: string; place_id: string; geometry: { location: { lat: () => number; lng: () => number } } }, status: string) => void) { callback({ name: "測試咖啡", formatted_address: "台北市信義區測試路 1 號", place_id: "place-1", geometry: { location: { lat: () => 25.0339, lng: () => 121.5645 } } }, "OK"); } } }, GeocoderStatus: { OK: "OK" } } });
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "測試咖啡" } });
    fireEvent.click(await screen.findByText("測試咖啡"));
    expect(await screen.findByText("地圖確認位置")).not.toBeNull();
    expect(screen.getByText("測試咖啡 · 台北市信義區測試路 1 號")).not.toBeNull();
    expect(screen.getByTestId("venue-map").textContent).toContain("25.0339,121.5645");
    fireEvent.click(screen.getByLabelText("關閉地圖"));
    fireEvent.click(screen.getByLabelText("在地圖確認餐廳位置"));
    expect(screen.getByText("地圖確認位置")).not.toBeNull();
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
    fireEvent.change(screen.getByLabelText("選擇時間"), { target: { value: "14:00" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));

    expect(screen.queryByRole("dialog", { name: "飯局預覽建立確認" })).not.toBeNull();
    expect(within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).queryByText("週末義式晚餐")).not.toBeNull();
    fireEvent.click(getActiveConfirmButton());

    const status = await screen.findByRole("status");
    expect(status.textContent).toContain("現在已顯示在探索清單中");
    expect(screen.queryByText("週末義式晚餐")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/events", expect.objectContaining({ method: "POST" }));
    const createCall = fetchMock.mock.calls.find((call) => call[0] === "/api/events" && call[1]?.method === "POST");
    expect(JSON.parse(String(createCall?.[1]?.body)).eventStartAt).toBe("2026-08-20T06:00:00.000Z");
  });

  it("API 回傳未登入時會在預覽彈窗顯示登入提示", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ error: "UNAUTHENTICATED" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(getActiveConfirmButton());

    const alert = await within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).findByRole("alert");
    expect(alert.textContent).toContain("請先登入後再建立飯局");
    expect(within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).getByText("立即登入後建立飯局").getAttribute("href")).toBe("/api/auth/login?returnTo=/?tab=create");
  });

  it("API 驗證失敗時會顯示可讀錯誤而不建立飯局", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "INVALID_EVENT" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(getActiveConfirmButton());

    const alert = await within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).findByRole("alert");
    expect(alert.textContent).toContain("飯局資料格式有誤");
    expect(screen.queryByRole("dialog", { name: "飯局預覽建立確認" })).not.toBeNull();
  });

  it("網路失敗時會結束建立中狀態並提示重試", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(getActiveConfirmButton());

    const alert = await within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).findByRole("alert");
    expect(alert.textContent).toContain("連線暫時中斷");
    expect(getActiveConfirmButton()).not.toBeNull();
  });

  it("伺服器 500 時會保留預覽並允許再次確認建立", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: "SERVER_ERROR" }) }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(getActiveConfirmButton());

    const alert = await within(screen.getByRole("dialog", { name: "飯局預覽建立確認" })).findByRole("alert");
    expect(alert.textContent).toContain("目前無法建立飯局，請稍後再試");
    expect(screen.queryByRole("dialog", { name: "飯局預覽建立確認" })).not.toBeNull();
    expect(getActiveConfirmButton()).not.toBeNull();
  });

  it("飯局預覽與詳情均使用取消規則與出席信用提示，不顯示保證金", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "週末義式晚餐" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    expect(screen.getByRole("dialog", { name: "飯局預覽建立確認" }).textContent).toContain("取消規則、出席紀錄與信用 rating");
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

  it("從飯局聊天室深度連結載入真實歷史訊息，並以 POST 發送新訊息", async () => {
    window.history.replaceState({}, "", "/?tab=messages&eventId=chat-event&eventTitle=%E6%B8%AC%E8%A9%A6%E9%A3%AF%E5%B1%80&member=%E5%B0%8F%E5%AE%89");
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/auth/session") return Promise.resolve({ ok: true, status: 200, json: async () => ({ user: { id: "current-user", displayName: "主辦人" } }) });
      if (url === "/api/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) });
      if (url === "/api/events/chat-event/messages" && !options?.method) return Promise.resolve({ ok: true, status: 200, json: async () => ({ messages: [{ message: { id: "message-1", content: "我已經出發了", createdAt: "2026-08-20T10:30:00.000Z" }, author: { id: "member-1", displayName: "小安", avatarUrl: "https://storage.example/xiao-an.jpg" } }] }) });
      if (url === "/api/events/chat-event/messages" && options?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ message: { id: "message-2" } }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);

    expect(await screen.findByText("我已經出發了")).not.toBeNull();
    const avatars = screen.getAllByAltText("小安 的會員頭像") as HTMLImageElement[];
    expect(avatars).toHaveLength(2);
    expect(avatars.every((avatar) => avatar.src === "https://storage.example/xiao-an.jpg")).toBe(true);
    avatars.forEach((avatar) => fireEvent.error(avatar));
    expect((await screen.findAllByLabelText("小安 的會員縮寫")).length).toBe(2);
    expect(screen.getByText("飯局群組聊天室 · 可傳訊給 小安")).not.toBeNull();
    fireEvent.change(screen.getByPlaceholderText("輸入訊息"), { target: { value: "收到，餐廳見！" } });
    fireEvent.click(screen.getByLabelText("發送訊息"));
    expect(fetchMock).toHaveBeenCalledWith("/api/events/chat-event/messages", expect.objectContaining({ method: "POST", body: JSON.stringify({ content: "收到，餐廳見！" }) }));
  });

  it("聊天室鈴鐺會顯示真實未讀數量並開啟通知中心", async () => {
    window.history.replaceState({}, "", "/?tab=messages&eventId=chat-event&eventTitle=%E6%B8%AC%E8%A9%A6%E9%A3%AF%E5%B1%80&member=%E5%B0%8F%E5%AE%89");
    const notification = { id: "notice-1", title: "飯局聊天室有新訊息", body: "小安傳送了一則新訊息。", type: "new_message", eventId: "chat-event", readAt: null, createdAt: "2026-08-20T10:30:00.000Z" };
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (url === "/api/auth/session") return Promise.resolve({ ok: true, status: 200, json: async () => ({ user: { id: "current-user", displayName: "主辦人" } }) });
      if (url === "/api/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) });
      if (url === "/api/events/chat-event/messages") return Promise.resolve({ ok: true, status: 200, json: async () => ({ messages: [] }) });
      if (url === "/api/notifications?unread=true") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [notification] }) });
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ hosted: [], applied: [] }) });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [notification] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    }));
    render(<Home />);

    const bell = await screen.findByRole("button", { name: "開啟通知中心，目前有 1 則未讀通知" });
    fireEvent.click(bell);
    expect(await screen.findByText("我的飯局")).not.toBeNull();
    expect(await screen.findByText("飯局聊天室有新訊息")).not.toBeNull();
  });

  it("個人頁會顯示信用 Rating 趨勢與歷史出席率洞察", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/me/insights" ? { creditScore: 88, completedEventCount: 4, attendanceRate: 75, attendanceTotal: 4, trend: [{ label: "8/1", score: 86 }, { label: "8/8", score: 88 }], dimensions: { punctuality: 4.5, politeness: 4.8, interaction: 4.2 } } : {} })));
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    expect((await screen.findAllByText("88 分")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("75%").length).toBeGreaterThan(0);
    expect(screen.getByText("信用 Rating 趨勢")).not.toBeNull();
    expect(screen.getByText("準時 · 4.5 / 5")).not.toBeNull();
    expect(screen.getByLabelText("個人摘要：信用分數 88 分，已完成飯局 4 場，出席率 75%")).not.toBeNull();
    expect(screen.getByRole("button", { name: "前往我的飯局管理與完成飯局" }).textContent).toContain("完成飯局並前往評價");
  });

  it("公開 API 的已發布飯局會載入探索清單，並保留行動版確認按鈕", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/events" ? { events: [{ event: { id: "db-event-1", title: "資料庫飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "資料庫餐廳", venueAddress: "台北市信義區", neighborhood: "信義區", capacity: 4, paymentMode: "split_bill", budgetMin: 600, budgetMax: 800, latitude: "25.0339", longitude: "121.5645", cuisineTags: ["義式料理"] }, host: { displayName: "資料庫主辦人" } }] } : {} })));
    render(<Home />);
    expect(await screen.findByText("資料庫飯局")).not.toBeNull();
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "確認按鈕測試飯局" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "PASTA & CO." } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    expect(screen.getByRole("dialog", { name: "飯局預覽建立確認" }).className).toContain("h-[100dvh]");
    expect(getActiveConfirmButton()).not.toBeNull();
  });

  it("公開飯局的 UTC 時間會固定以台灣時區顯示", () => {
    expect(formatTaipeiTime("2026-08-20T06:00:00.000Z")).toBe("14:00");
  });

  it("探索、飯局詳情與分享文案都會同時呈現店名及完整地址", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/events" ? { events: [{ event: { id: "address-event", title: "店名地址飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "測試餐館", venueAddress: "台北市信義區松壽路 20 號 2 樓", neighborhood: "信義區", capacity: 4, paymentMode: "split_bill", budgetMin: 600, budgetMax: 800, latitude: "25.0339", longitude: "121.5645", cuisineTags: ["義式料理"] }, host: { displayName: "主辦人" } }] } : {} })));
    render(<Home />);
    expect(await screen.findByText("測試餐館 · 台北市信義區松壽路 20 號 2 樓")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("查看 店名地址飯局 詳情"));
    expect(await screen.findByText("店名：測試餐館")).not.toBeNull();
    expect(screen.getByText("地址：台北市信義區松壽路 20 號 2 樓")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("分享飯局"));
    const intent = new URL(screen.getByText("分享到 Threads").closest("a")?.getAttribute("href") || "");
    const threadsText = intent.searchParams.get("text") || "";
    expect(threadsText).toContain("完整地址：台北市信義區松壽路 20 號 2 樓");
    expect(threadsText.indexOf("完整地址：")).toBeLessThan(threadsText.indexOf("店名地址飯局"));
  });

  it("建立成功後，我的飯局會從受保護查詢結果顯示新建立資料", async () => {
    const createdEvent = { id: "created-event", title: "寫入後可見飯局", eventStartAt: "2026-08-20T11:30:00.000Z", restaurantName: "測試餐廳", venueAddress: "台北市信義區", status: "published", capacity: 4 };
    vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/events" && options?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ event: createdEvent }) });
      if (url === "/api/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) });
      if (url === "/api/me/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ hosted: [{ event: createdEvent, pendingApplications: [], attendances: [] }], applied: [] }) });
      if (url === "/api/notifications") return Promise.resolve({ ok: true, status: 200, json: async () => ({ notifications: [] }) });
      if (url === "/api/me/review-tasks") return Promise.resolve({ ok: true, status: 200, json: async () => ({ tasks: [] }) });
      return Promise.resolve({ ok: false, status: 500, json: async () => ({}) });
    }));
    render(<Home />);
    fireEvent.click(screen.getByText("發起飯局"));
    fireEvent.change(screen.getByPlaceholderText("例如：下班後想聊聊旅行的義式晚餐"), { target: { value: "寫入後可見飯局" } });
    fireEvent.change(screen.getByLabelText("選擇日期"), { target: { value: "2026-08-20" } });
    fireEvent.change(screen.getByPlaceholderText("搜尋餐廳、地標或地址"), { target: { value: "測試餐廳" } });
    fireEvent.click(screen.getByText("預覽並發起飯局"));
    fireEvent.click(getActiveConfirmButton());
    await screen.findByRole("status");
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("我的飯局"));
    expect(await screen.findByText("寫入後可見飯局")).not.toBeNull();
  });

  it("飯局詳情提供公開分享連結與官方 Threads Post Intent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ events: [] }) }));
    render(<Home />);
    fireEvent.click(screen.getAllByText("我要報名")[0]);
    fireEvent.click(screen.getByLabelText("分享飯局"));

    expect(screen.getByRole("region", { name: "分享飯局" }).textContent).toContain("不會公開申請或成員資料");
    const threadsLink = screen.getByText("分享到 Threads").closest("a");
    expect(threadsLink).not.toBeNull();
    const intent = new URL(threadsLink?.getAttribute("href") || "");
    expect(intent.origin).toBe("https://www.threads.com");
    expect(intent.pathname).toBe("/intent/post");
    expect(intent.searchParams.get("text")).toContain("週五夜的微醺義式晚餐");
    expect(intent.searchParams.get("url")).toContain("/events/1");
  });

  it("飯局詳情只有在 POST 報名 API 回傳 201 後才顯示申請成功", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/events/1/applications" && options?.method === "POST") return Promise.resolve({ ok: true, status: 201, json: async () => ({ application: { id: "application-1" } }) });
      if (url === "/api/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) });
      if (url === "/api/auth/session") return Promise.resolve({ ok: true, status: 200, json: async () => ({ user: null }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);

    fireEvent.click(screen.getAllByText("我要報名")[0]);
    fireEvent.click(screen.getByText("送出報名申請"));

    expect(await screen.findByText("申請已送出，等待主辦人審核")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/events/1/applications", expect.objectContaining({ method: "POST" }));
  });

  it("飯局詳情的申請 API 失敗時顯示錯誤與登入入口，不得假稱申請已送出", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/events/1/applications" && options?.method === "POST") return Promise.resolve({ ok: false, status: 401, json: async () => ({ error: "UNAUTHENTICATED" }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [], user: null }) });
    }));
    render(<Home />);

    fireEvent.click(screen.getAllByText("我要報名")[0]);
    fireEvent.click(screen.getByText("送出報名申請"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("請先登入後再送出飯局申請");
    expect(within(alert).getByText("立即登入").getAttribute("href")).toBe("/api/auth/login");
    expect(screen.queryByText("申請已送出，等待主辦人審核")).toBeNull();
  });

  it("公開 event 深度連結會自動展開對應飯局詳情", async () => {
    window.history.replaceState({}, "", "/?event=2");
    render(<Home />);
    expect((await screen.findAllByText("日式燒肉，同桌認識新朋友")).length).toBeGreaterThan(1);
    expect(screen.getByLabelText("分享飯局")).not.toBeNull();
    window.history.replaceState({}, "", "/");
  });

  it("已登入時首頁頂部會顯示使用者名稱並可進入個人主頁", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/auth/session" ? { user: { displayName: "AmmoliteLife", avatarUrl: "https://storage.example/avatar.jpg" } } : { events: [] } })));
    render(<Home />);
    const accountButton = await screen.findByLabelText("開啟 AmmoliteLife 的個人主頁");
    expect(accountButton.textContent).toContain("AmmoliteLife");
    const avatar = screen.getByAltText("AmmoliteLife 的會員頭像") as HTMLImageElement;
    expect(avatar.src).toBe("https://storage.example/avatar.jpg");
    fireEvent.click(accountButton);
    expect(screen.getByText("產品規格與開發藍圖")).not.toBeNull();
  });

  it("首頁帳號頭像讀取失敗時會改顯示安全縮寫，不會留下破圖圖示", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/auth/session" ? { user: { displayName: "Life Onca", avatarUrl: "https://storage.example/missing.jpg" } } : { events: [] } })));
    render(<Home />);
    fireEvent.error(await screen.findByAltText("Life Onca 的會員頭像"));
    expect(screen.queryByAltText("Life Onca 的會員頭像")).toBeNull();
    expect(screen.getByLabelText("Life Onca 的會員縮寫").textContent).toBe("L");
  });

  it("個人主頁會同步登入名稱與頭像縮寫，更多選單可安全登出", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/auth/session" ? { user: { displayName: "Life Onca" } } : options?.method === "POST" ? { success: true } : { events: [] } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(await screen.findByLabelText("開啟 Life Onca 的個人主頁"));
    expect(screen.getByText("Life Onca")).not.toBeNull();
    expect(screen.getByText("L")).not.toBeNull();
    fireEvent.click(screen.getByLabelText("更多帳號設定"));
    expect(screen.getByRole("menu", { name: "帳號選單" }).textContent).toContain("目前登入：Life Onca");
    fireEvent.click(screen.getByRole("menuitem", { name: "登出此帳號" }));
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });

  it("admin 角色可從帳號選單進入營運後台並讀取會員統計", async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => {
      if (url === "/api/auth/session") return { user: { displayName: "Admin Life", role: "admin" } };
      if (url === "/api/admin/overview") return { metrics: { registeredMembers: 42, verifiedMembers: 18, pendingVerification: 0, restrictedMembers: 0, totalEvents: 12, publishedEvents: 8, totalApplications: 25, pendingApplications: 3, totalAttendances: 20, noShowCount: 2 }, recentMembers: [] };
      return { events: [] };
    } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(await screen.findByLabelText("開啟 Admin Life 的個人主頁"));
    fireEvent.click(screen.getByLabelText("更多帳號設定"));
    fireEvent.click(screen.getByRole("menuitem", { name: "開啟 Admin 後台" }));
    expect(await screen.findByText("營運後台")).not.toBeNull();
    expect(screen.getByText("已註冊會員")).not.toBeNull();
    expect(screen.getByText("42")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/overview", { cache: "no-store" });
  });

  it("未登入時首頁頂部保留 OAuth 登入入口", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/auth/session" ? { user: null } : { events: [] } })));
    render(<Home />);
    const loginLink = await screen.findByText("登入／台北市");
    expect(loginLink.closest("a")?.getAttribute("href")).toBe("/api/auth/login");
  });

  it("未驗證會員可從個人主頁送出簡易驗證申請", async () => {
    const fetchMock = vi.fn((url: string, options?: RequestInit) => {
      if (url === "/api/auth/session") return Promise.resolve({ ok: true, status: 200, json: async () => ({ user: { displayName: "Life Onca", role: "member", verificationStatus: "unverified" } }) });
      if (url === "/api/events") return Promise.resolve({ ok: true, status: 200, json: async () => ({ events: [] }) });
      if (url === "/api/me/insights") return Promise.resolve({ ok: false, status: 401, json: async () => ({}) });
      if (url === "/api/me/verification" && options?.method === "POST") return Promise.resolve({ ok: true, status: 200, json: async () => ({ user: { verificationStatus: "pending" } }) });
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<Home />);
    fireEvent.click(await screen.findByText("個人主頁"));
    fireEvent.click(await screen.findByText("申請驗證"));
    expect(await screen.findByText("申請已送出，管理員將進行簡易審核。")).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("/api/me/verification", { method: "POST" });
  });

  it("管理者個人主頁顯示已授權標示而不顯示會員驗證申請", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => Promise.resolve({ ok: true, status: 200, json: async () => url === "/api/auth/session" ? { user: { displayName: "Life Onca", role: "admin", verificationStatus: "unverified" } } : url === "/api/events" ? { events: [] } : { creditScore: 100, completedEventCount: 1, attendanceRate: 100, attendanceTotal: 1, trend: [], dimensions: { punctuality: null, politeness: null, interaction: null } } })));
    render(<Home />);
    fireEvent.click(await screen.findByText("個人主頁"));
    expect(await screen.findByText("管理者已授權")).not.toBeNull();
    expect(screen.getByTestId("admin-authorization-card").textContent).toContain("不需另行申請會員驗證");
    expect(screen.queryByRole("button", { name: "申請驗證" })).toBeNull();
  });
});

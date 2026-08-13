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

  it("產品規格頁呈現無保證金的審核、出席信用 Roadmap", () => {
    render(<Home />);
    fireEvent.click(screen.getByText("個人主頁"));
    fireEvent.click(screen.getByText("產品規格與開發藍圖"));

    expect(screen.queryByText(/MVP：帳號與實名驗證、飯局探索、申請審核、文字聊天室與基礎出席評價/)).not.toBeNull();
    expect(screen.queryByText(/Beta：出席率／信用評分系統、飯局前推播通知、餐廳合作方案/)).not.toBeNull();
    expect(screen.queryByText(/PostgreSQL \+ Drizzle ORM，將飯局、申請、聊天與評價拆分為獨立 Entity/)).not.toBeNull();
    expect(screen.queryByText("保證金")).toBeNull();
  });
});

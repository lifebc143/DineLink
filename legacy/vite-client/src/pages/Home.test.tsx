import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./Home";

vi.mock("@/components/Map", () => ({
  MapView: () => <div data-testid="dining-map">地圖載入完成</div>,
}));

afterEach(() => cleanup());

describe("DineLink 手機版核心互動", () => {
  it("可切換四個底部導覽分頁並從個人頁開啟 PRD", async () => {
    const user = userEvent.setup();
    render(<Home />);

    expect(screen.getByRole("heading", { name: /下一餐/ })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "發起飯局" }));
    expect(screen.getByRole("heading", { name: /發起一場/ })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "訊息" }));
    expect(screen.getByRole("heading", { name: "一起吃飯的人" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "個人主頁" }));
    expect(screen.getByText("互評信用檔案")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /產品規格與開發藍圖/ }));
    expect(screen.getByRole("heading", { name: "核心功能模組" })).toBeTruthy();
    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("支援列表與地圖切換，並可由飯局詳情送出報名", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "地圖" }));
    expect(screen.getByTestId("dining-map")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "列表" }));
    expect(screen.getByText("週五夜的微醺義式晚餐")).toBeTruthy();

    await user.click(screen.getAllByRole("button", { name: "我要報名" })[0]);
    expect(screen.getByText("保證金與點數提示：")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "送出報名申請" }));
    expect(screen.getByRole("button", { name: "申請已送出，等待主辦人審核" })).toBeTruthy();
  });

  it("已確認聊天室可送出文字訊息", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: "訊息" }));
    await user.type(screen.getByPlaceholderText("輸入訊息"), "週五見！");
    await user.click(screen.getByRole("button", { name: "發送訊息" }));
    expect(screen.getByText("週五見！")).toBeTruthy();
  });
});

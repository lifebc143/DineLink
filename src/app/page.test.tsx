import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "./page";

vi.mock("@/components/Map", () => ({
  MapView: ({ initialCenter }: { initialCenter: { lat: number; lng: number } }) => (
    <div data-testid="venue-map">{initialCenter.lat},{initialCenter.lng}</div>
  ),
}));

afterEach(() => cleanup());

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
});

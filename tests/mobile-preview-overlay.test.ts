// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PreviewConfirmSheet from "@/components/PreviewConfirmSheet";
import React from "react";

describe("手機飯局預覽操作列", () => {
  it("以獨立全螢幕彈窗呈現固定且可點擊的確認建立操作列", () => {
    const onConfirm = vi.fn();
    render(React.createElement(PreviewConfirmSheet, { title: "測試飯局", date: "2026-08-16", time: "18:30", venueName: "測試餐廳", venueAddress: "台北市", billMode: "各自付", budget: "600", capacity: "4", apiError: "", isSubmitting: false, onBack: vi.fn(), onConfirm }));
    const dialog = screen.getByRole("dialog", { name: "飯局預覽建立確認" });
    expect(dialog.className).toContain("h-[100dvh]");
    const confirm = screen.getByRole("button", { name: "確認建立飯局" });
    expect(confirm.parentElement?.parentElement?.className).toContain("shrink-0");
    confirm.click();
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

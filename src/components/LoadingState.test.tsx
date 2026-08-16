import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import LoadingState, { LoadingIndicator } from "./LoadingState";

describe("LoadingState", () => {
  it("announces the loading label with an accessible status region", () => {
    render(<LoadingState label="正在同步飯局資料…" description="請稍候" />);
    expect(screen.getByRole("status").textContent).toContain("正在同步飯局資料…");
    expect(screen.getByText("請稍候")).toBeTruthy();
  });

  it("renders a compact indicator for buttons and inline loading states", () => {
    const { container } = render(<LoadingIndicator size="sm" />);
    expect(container.querySelector(".dine-loading-indicator.h-4.w-4")).not.toBeNull();
  });
});

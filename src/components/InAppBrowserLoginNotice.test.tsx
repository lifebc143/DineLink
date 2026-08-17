import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InAppBrowserLoginNotice from "./InAppBrowserLoginNotice";

const setUserAgent = (value: string) => Object.defineProperty(window.navigator, "userAgent", { configurable: true, value });

describe("iOS 內建瀏覽器登入引導", () => {
  beforeEach(() => { vi.stubGlobal("navigator", window.navigator); });
  afterEach(() => cleanup());

  it("LINE iPhone 內建瀏覽器會提示改用 Safari 並提供複製連結操作", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Line/14.0.0");
    render(<InAppBrowserLoginNotice />);
    const notice = await screen.findByTestId("in-app-browser-login-notice");
    expect(notice.textContent).toContain("建議改用 Safari 登入");
    expect(screen.getByRole("button", { name: "複製目前連結" })).not.toBeNull();
  });

  it("一般 Safari 不顯示內建瀏覽器登入提示", async () => {
    setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Version/17.0 Mobile/15E148 Safari/604.1");
    render(<InAppBrowserLoginNotice />);
    await waitFor(() => expect(screen.queryByTestId("in-app-browser-login-notice")).toBeNull());
  });
});

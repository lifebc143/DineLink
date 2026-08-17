import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import EmailOtpLoginSheet from "./EmailOtpLoginSheet";

describe("Email OTP 行動登入介面", () => {
  afterEach(() => window.localStorage.clear());

  it("提供 Email 輸入與 iPhone 六位數 one-time-code 自動帶入欄位", () => {
    render(<EmailOtpLoginSheet onClose={() => undefined} />);
    const email = screen.getByRole("textbox", { name: "Email 地址" });
    fireEvent.change(email, { target: { value: "dine@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "寄送 6 位數驗證碼" }));

    const code = screen.getByRole("textbox", { name: "6 位數驗證碼" });
    expect(code.getAttribute("autocomplete")).toBe("one-time-code");
    expect(code.getAttribute("inputmode")).toBe("numeric");
    fireEvent.change(code, { target: { value: "12abc34567" } });
    expect((code as HTMLInputElement).value).toBe("123456");
    expect(screen.getByRole("status").textContent).toContain("驗證碼輸入完成");
  });
});

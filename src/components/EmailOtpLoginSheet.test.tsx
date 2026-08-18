import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import EmailOtpLoginSheet from "./EmailOtpLoginSheet";

describe("Email OTP 行動登入介面", () => {
  afterEach(() => window.localStorage.clear());

  it("明確說明不寄信測試模式，並提供 iPhone 六位數示範驗證碼流程", () => {
    render(<EmailOtpLoginSheet onClose={() => undefined} />);
    expect(screen.getByText("測試模式不會寄送真實郵件。", { exact: false })).not.toBeNull();
    const email = screen.getByRole("textbox", { name: "Email 地址" });
    fireEvent.change(email, { target: { value: "dine@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "繼續使用示範驗證碼" }));

    const code = screen.getByRole("textbox", { name: "6 位數驗證碼" });
    expect(code.getAttribute("autocomplete")).toBe("one-time-code");
    expect(code.getAttribute("inputmode")).toBe("numeric");
    fireEvent.change(code, { target: { value: "12abc34567" } });
    expect((code as HTMLInputElement).value).toBe("123456");
    expect(screen.getByRole("status").textContent).toContain("示範碼正確");
    fireEvent.click(screen.getByRole("button", { name: "完成示範驗證" }));
    const statuses = screen.getAllByRole("status");
    expect(statuses[statuses.length - 1].textContent).toContain("示範驗證成功");
  });
});

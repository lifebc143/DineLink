import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ completeMockEmailOtpLogin: vi.fn() }));
vi.mock("@/lib/auth", () => ({
  ...auth,
  SESSION_COOKIE: "dine_link_session",
  sessionCookieOptions: () => ({ httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 60 }),
}));
vi.mock("@/lib/public-origin", () => ({ getPublicOrigin: () => "https://dine-link.example" }));

import { POST } from "@/app/api/auth/mock-email-otp/route";

describe("測試 Email OTP 登入", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MOCK_EMAIL_OTP_LOGIN_ENABLED = "true";
    auth.completeMockEmailOtpLogin.mockResolvedValue({
      user: { id: "demo-user-1", displayName: "DineLink 測試會員", role: "member" },
      session: "mock-session-token",
    });
  });
  afterEach(() => { delete process.env.MOCK_EMAIL_OTP_LOGIN_ENABLED; });

  it("僅接受示範碼並寫入隔離測試帳號的 Session Cookie", async () => {
    const response = await POST(new NextRequest("https://dine-link.example/api/auth/mock-email-otp", {
      method: "POST",
      body: JSON.stringify({ email: "tester@example.com", code: "123456" }),
      headers: { "content-type": "application/json" },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("dine_link_session=mock-session-token");
    expect(await response.json()).toMatchObject({ mockMode: true, user: { displayName: "DineLink 測試會員" } });
    expect(auth.completeMockEmailOtpLogin).toHaveBeenCalledWith("tester@example.com");
  });

  it("在未開啟測試模式或示範碼不正確時拒絕登入", async () => {
    delete process.env.MOCK_EMAIL_OTP_LOGIN_ENABLED;
    const disabled = await POST(new NextRequest("https://dine-link.example/api/auth/mock-email-otp", { method: "POST", body: JSON.stringify({ email: "tester@example.com", code: "123456" }) }));
    expect(disabled.status).toBe(403);

    process.env.MOCK_EMAIL_OTP_LOGIN_ENABLED = "true";
    const invalid = await POST(new NextRequest("https://dine-link.example/api/auth/mock-email-otp", { method: "POST", body: JSON.stringify({ email: "tester@example.com", code: "000000" }) }));
    expect(invalid.status).toBe(401);
    expect(auth.completeMockEmailOtpLogin).not.toHaveBeenCalled();
  });
});

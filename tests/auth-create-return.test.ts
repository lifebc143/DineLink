import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const oauth = vi.hoisted(() => ({ beginOAuthLogin: vi.fn(), completeOAuthLogin: vi.fn() }));

vi.mock("@/lib/auth", () => ({ ...oauth, SESSION_COOKIE: "dine_link_session", sessionCookieOptions: () => ({ httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: 60 }) }));
vi.mock("@/lib/public-origin", () => ({ getPublicOrigin: () => "https://dine-link.example" }));

import { GET as beginLogin } from "@/app/api/auth/login/route";
import { GET as completeLogin } from "@/app/api/auth/callback/route";

describe("發起飯局登入返回", () => {
  beforeEach(() => { vi.clearAllMocks(); oauth.beginOAuthLogin.mockResolvedValue("https://manus.im/app-auth"); oauth.completeOAuthLogin.mockResolvedValue({ user: { id: "user-1" }, session: "signed-session-token" }); });

  it("只接受固定的發起頁返回路徑並設定短期 cookie", async () => {
    const response = await beginLogin(new NextRequest("https://dine-link.example/api/auth/login?returnTo=/?tab=create"));
    expect(response.headers.get("location")).toBe("https://manus.im/app-auth");
    expect(response.headers.get("set-cookie")).toContain("dine_link_post_login_path=%2F%3Ftab%3Dcreate");

    const rejected = await beginLogin(new NextRequest("https://dine-link.example/api/auth/login?returnTo=https://malicious.example"));
    expect(rejected.headers.get("set-cookie")).toBeNull();
  });

  it("OAuth callback 建立 Session 後返回發起頁並清除返回 cookie", async () => {
    const request = new NextRequest("https://dine-link.example/api/auth/callback?code=code&state=state", { headers: { cookie: "dine_link_post_login_path=/?tab=create" } });
    const response = await completeLogin(request);
    expect(response.headers.get("location")).toBe("https://dine-link.example/?tab=create");
    expect(response.headers.get("set-cookie")).toContain("dine_link_session=signed-session-token");
    expect(response.headers.get("set-cookie")).toContain("dine_link_post_login_path=;");
    expect(oauth.completeOAuthLogin).toHaveBeenCalledWith("code", "state", true);
  });
});

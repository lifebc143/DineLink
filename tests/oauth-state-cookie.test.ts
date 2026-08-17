import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ set: vi.fn(), get: vi.fn(), delete: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ set: mocks.set, get: mocks.get, delete: mocks.delete })),
}));

import { beginOAuthLogin } from "@/lib/auth";

describe("Apple OAuth state Cookie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.VITE_APP_ID = "dine-link-test";
    process.env.VITE_OAUTH_PORTAL_URL = "https://manus.im";
  });

  it("在 HTTPS 正式網域以 Secure、HttpOnly、SameSite=None 保存 state，支援跨站身份回呼", async () => {
    const loginUrl = await beginOAuthLogin("https://dinelink-ok6woqkb.manus.space");

    expect(loginUrl).toContain("redirectUri=https%3A%2F%2Fdinelink-ok6woqkb.manus.space%2Fapi%2Fauth%2Fcallback");
    expect(mocks.set).toHaveBeenCalledWith("dine_link_oauth_state", expect.any(String), expect.objectContaining({ httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 600 }));
  });

  it("在本機 HTTP 開發環境維持 Lax，避免建立瀏覽器會拒絕的不安全 SameSite=None Cookie", async () => {
    await beginOAuthLogin("http://localhost:3000");

    expect(mocks.set).toHaveBeenCalledWith("dine_link_oauth_state", expect.any(String), expect.objectContaining({ httpOnly: true, secure: false, sameSite: "lax", path: "/", maxAge: 600 }));
  });
});

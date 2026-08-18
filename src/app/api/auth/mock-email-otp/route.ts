import { NextRequest, NextResponse } from "next/server";
import { completeMockEmailOtpLogin, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

const DEMO_OTP_CODE = "123456";
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  if (process.env.MOCK_EMAIL_OTP_LOGIN_ENABLED !== "true") {
    return NextResponse.json({ error: "Mock email login is not enabled" }, { status: 403, headers: { "cache-control": "no-store" } });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; code?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const code = typeof body?.code === "string" ? body.code : "";
  if (!validEmail.test(email) || code !== DEMO_OTP_CODE) {
    return NextResponse.json({ error: "Invalid demo credentials" }, { status: 401, headers: { "cache-control": "no-store" } });
  }

  const { user, session } = await completeMockEmailOtpLogin(email);
  const publicOrigin = getPublicOrigin(request.headers, request.nextUrl.origin);
  const response = NextResponse.json({
    user: { id: user.id, displayName: user.displayName, role: user.role },
    mockMode: true,
  }, { headers: { "cache-control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions(publicOrigin.startsWith("https://")));
  return response;
}

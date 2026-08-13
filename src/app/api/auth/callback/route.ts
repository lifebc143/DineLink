import { NextRequest, NextResponse } from "next/server";
import { completeOAuthLogin } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "code and state are required" }, { status: 400 });
  try {
    const publicOrigin = getPublicOrigin(request.headers, request.nextUrl.origin);
    await completeOAuthLogin(code, state, publicOrigin.startsWith("https://"));
    return NextResponse.redirect(new URL("/", publicOrigin));
  }
  catch { return NextResponse.json({ error: "OAuth callback failed" }, { status: 401 }); }
}

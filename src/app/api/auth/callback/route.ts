import { NextRequest, NextResponse } from "next/server";
import { completeOAuthLogin } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) return NextResponse.json({ error: "code and state are required" }, { status: 400 });
  try { await completeOAuthLogin(code, state); return NextResponse.redirect(new URL("/", request.url)); }
  catch { return NextResponse.json({ error: "OAuth callback failed" }, { status: 401 }); }
}

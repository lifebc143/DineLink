import { NextRequest, NextResponse } from "next/server";
import { beginOAuthLogin } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try { return NextResponse.redirect(await beginOAuthLogin(getPublicOrigin(request.headers, request.nextUrl.origin))); }
  catch { return NextResponse.json({ error: "OAuth login is not available" }, { status: 503 }); }
}

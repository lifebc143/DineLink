import { NextRequest, NextResponse } from "next/server";
import { beginOAuthLogin } from "@/lib/auth";
import { getPublicOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const origin = getPublicOrigin(request.headers, request.nextUrl.origin);
    const response = NextResponse.redirect(await beginOAuthLogin(origin));
    if (request.nextUrl.searchParams.get("returnTo") === "/?tab=create") response.cookies.set("dine_link_post_login_path", "/?tab=create", { httpOnly: true, secure: origin.startsWith("https://"), sameSite: "lax", path: "/", maxAge: 600 });
    return response;
  }
  catch { return NextResponse.json({ error: "OAuth login is not available" }, { status: 503 }); }
}

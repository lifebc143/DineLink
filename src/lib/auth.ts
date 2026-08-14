import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { users } from "../../drizzle/schema";

export const SESSION_COOKIE = "dine_link_session";
const STATE_COOKIE = "dine_link_oauth_state";
const SESSION_AGE_SECONDS = 60 * 60 * 24 * 365;

type SessionPayload = { subject: string; displayName: string };
type OAuthUserInfo = { openId: string; name?: string; email?: string; platform?: string; loginMethod?: string };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required");
  return new TextEncoder().encode(value);
}

function cookieOptions(useSecureCookie = process.env.NODE_ENV === "production") {
  return { httpOnly: true, secure: useSecureCookie, sameSite: "lax" as const, path: "/" };
}

export function sessionCookieOptions(useSecureCookie = process.env.NODE_ENV === "production") {
  return { ...cookieOptions(useSecureCookie), maxAge: SESSION_AGE_SECONDS };
}

function encodeState(payload: { redirectUri: string; nonce: string }) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeState(state: string): { redirectUri: string; nonce: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
    return typeof parsed.redirectUri === "string" && typeof parsed.nonce === "string" ? parsed : null;
  } catch { return null; }
}

export async function beginOAuthLogin(origin: string) {
  const appId = process.env.VITE_APP_ID;
  const portalUrl = process.env.VITE_OAUTH_PORTAL_URL;
  if (!appId || !portalUrl) throw new Error("OAuth environment is not configured");
  const nonce = crypto.randomUUID();
  const redirectUri = `${origin}/api/auth/callback`;
  const url = new URL(`${portalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", encodeState({ redirectUri, nonce }));
  url.searchParams.set("type", "signIn");
  const store = await cookies();
  store.set(STATE_COOKIE, nonce, { ...cookieOptions(origin.startsWith("https://")), maxAge: 600 });
  return url.toString();
}

export async function completeOAuthLogin(code: string, state: string, useSecureCookie = process.env.NODE_ENV === "production") {
  const decoded = decodeState(state);
  const store = await cookies();
  const expectedNonce = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  if (!decoded || !expectedNonce || decoded.nonce !== expectedNonce) throw new Error("Invalid OAuth state");
  const baseUrl = process.env.OAUTH_SERVER_URL;
  const appId = process.env.VITE_APP_ID;
  if (!baseUrl || !appId) throw new Error("OAuth environment is not configured");
  const tokenResponse = await fetch(`${baseUrl}/webdev.v1.WebDevAuthPublicService/ExchangeToken`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ clientId: appId, grantType: "authorization_code", code, redirectUri: decoded.redirectUri }) });
  if (!tokenResponse.ok) throw new Error("OAuth token exchange failed");
  const token = await tokenResponse.json() as { accessToken?: string };
  if (!token.accessToken) throw new Error("OAuth access token missing");
  const userResponse = await fetch(`${baseUrl}/webdev.v1.WebDevAuthPublicService/GetUserInfo`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accessToken: token.accessToken }) });
  if (!userResponse.ok) throw new Error("OAuth user lookup failed");
  const oauthUser = await userResponse.json() as OAuthUserInfo;
  if (!oauthUser.openId) throw new Error("OAuth subject missing");
  const displayName = oauthUser.name?.trim() || "DineLink Member";
  const [user] = await db.insert(users).values({ authSubject: oauthUser.openId, displayName, email: oauthUser.email ?? null, lastActiveAt: new Date() }).onConflictDoUpdate({ target: users.authSubject, set: { displayName, email: oauthUser.email ?? null, lastActiveAt: new Date(), updatedAt: new Date() } }).returning();
  if (!user) throw new Error("User upsert failed");
  const session = await new SignJWT({ subject: user.id, displayName: user.displayName }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${SESSION_AGE_SECONDS}s`).sign(secret());
  return { user, session };
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.subject !== "string") return null;
    const [user] = await db.select().from(users).where(eq(users.id, payload.subject)).limit(1);
    if (!user || user.accountStatus !== "active") return null;
    return user;
  } catch { return null; }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

import { jwtVerify } from "jose";
import type { NextRequest } from "next/server";

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required");
  return new TextEncoder().encode(value);
}

/** Validates the Manus-issued app_session_id and returns a trusted Heartbeat task UID. */
export async function getHeartbeatTaskUid(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("app_session_id")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.openId !== "string" || !payload.openId.startsWith("cron_")) return null;
    const baseUrl = process.env.OAUTH_SERVER_URL;
    const projectId = process.env.VITE_APP_ID;
    if (!baseUrl || !projectId) return null;
    const response = await fetch(`${baseUrl}/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jwtToken: token, projectId }) });
    if (!response.ok) return null;
    const body = await response.json() as { taskUid?: string | null };
    return typeof body.taskUid === "string" && body.taskUid.length > 0 ? body.taskUid : null;
  } catch { return null; }
}

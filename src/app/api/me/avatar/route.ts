import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storagePut } from "@/lib/storage";
import { users } from "../../../../../drizzle/schema";

export const runtime = "nodejs";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) return NextResponse.json({ error: "INVALID_UPLOAD" }, { status: 400 });

  try {
    const formData = await request.formData();
    const avatar = formData.get("avatar");
    if (!(avatar instanceof File) || avatar.size === 0) return NextResponse.json({ error: "AVATAR_REQUIRED" }, { status: 400 });
    if (avatar.size > MAX_AVATAR_BYTES) return NextResponse.json({ error: "AVATAR_TOO_LARGE", maxBytes: MAX_AVATAR_BYTES }, { status: 413 });
    const extension = ALLOWED_IMAGE_TYPES.get(avatar.type);
    if (!extension) return NextResponse.json({ error: "UNSUPPORTED_IMAGE_TYPE" }, { status: 415 });

    const { url } = await storagePut(`avatars/${user.id}/profile.${extension}`, new Uint8Array(await avatar.arrayBuffer()), avatar.type);
    const [updated] = await db.update(users).set({ avatarUrl: url, updatedAt: new Date() }).where(eq(users.id, user.id)).returning({ id: users.id, displayName: users.displayName, avatarUrl: users.avatarUrl });
    if (!updated) return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Avatar upload failed", error);
    return NextResponse.json({ error: "AVATAR_UPLOAD_FAILED" }, { status: 500 });
  }
}

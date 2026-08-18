import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { storagePut } from "@/lib/storage";
import { diningEvents } from "../../../../../../drizzle/schema";

export const runtime = "nodejs";

const MAX_LIFESTYLE_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { eventId } = await params;
  const [event] = await db.select({ id: diningEvents.id, hostId: diningEvents.hostId, status: diningEvents.status }).from(diningEvents).where(and(eq(diningEvents.id, eventId), eq(diningEvents.status, "published"))).limit(1);
  if (!event || event.hostId === user.id) return NextResponse.json({ error: "EVENT_NOT_OPEN" }, { status: 409 });
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) return NextResponse.json({ error: "INVALID_UPLOAD" }, { status: 400 });
  try {
    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) return NextResponse.json({ error: "PHOTO_REQUIRED" }, { status: 400 });
    if (photo.size > MAX_LIFESTYLE_PHOTO_BYTES) return NextResponse.json({ error: "PHOTO_TOO_LARGE", maxBytes: MAX_LIFESTYLE_PHOTO_BYTES }, { status: 413 });
    const extension = ALLOWED_IMAGE_TYPES.get(photo.type);
    if (!extension) return NextResponse.json({ error: "UNSUPPORTED_IMAGE_TYPE" }, { status: 415 });
    const { url } = await storagePut(`application-lifestyle/${user.id}/${eventId}/${crypto.randomUUID()}.${extension}`, new Uint8Array(await photo.arrayBuffer()), photo.type);
    return NextResponse.json({ photoUrl: url });
  } catch (error) {
    console.error("Application lifestyle photo upload failed", error);
    return NextResponse.json({ error: "PHOTO_UPLOAD_FAILED" }, { status: 500 });
  }
}

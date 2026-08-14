import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "../../../../../drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (currentUser.verificationStatus === "verified") return NextResponse.json({ error: "ALREADY_VERIFIED" }, { status: 409 });
  const [user] = await db.update(users).set({ verificationStatus: "pending", updatedAt: new Date() }).where(eq(users.id, currentUser.id)).returning({ id: users.id, verificationStatus: users.verificationStatus });
  return NextResponse.json({ user });
}

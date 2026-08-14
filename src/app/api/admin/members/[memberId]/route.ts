import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "../../../../../../drizzle/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const allowedActions = ["verify", "reject_verification", "suspend", "restore", "deactivate"] as const;
type AdminAction = typeof allowedActions[number];

export async function PATCH(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  if (admin.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const { memberId } = await params;
  if (memberId === admin.id) return NextResponse.json({ error: "CANNOT_MODIFY_SELF" }, { status: 400 });
  const body = await request.json().catch(() => null) as { action?: AdminAction; reason?: string } | null;
  if (!body?.action || !allowedActions.includes(body.action)) return NextResponse.json({ error: "INVALID_ACTION" }, { status: 400 });
  const [member] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, memberId)).limit(1);
  if (!member) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (member.role === "admin") return NextResponse.json({ error: "CANNOT_MODIFY_ADMIN" }, { status: 400 });

  const now = new Date();
  const updates = body.action === "verify" ? { verificationStatus: "verified" as const, updatedAt: now } : body.action === "reject_verification" ? { verificationStatus: "rejected" as const, updatedAt: now } : body.action === "suspend" ? { accountStatus: "suspended" as const, suspensionReason: body.reason?.trim().slice(0, 280) || "違反平台使用規範", suspendedAt: now, updatedAt: now } : body.action === "restore" ? { accountStatus: "active" as const, suspensionReason: null, suspendedAt: null, deactivatedAt: null, updatedAt: now } : { accountStatus: "deactivated" as const, suspensionReason: body.reason?.trim().slice(0, 280) || "依平台使用規範取消資格", deactivatedAt: now, updatedAt: now };
  const [updated] = await db.update(users).set(updates).where(eq(users.id, memberId)).returning({ id: users.id, displayName: users.displayName, verificationStatus: users.verificationStatus, accountStatus: users.accountStatus, suspensionReason: users.suspensionReason });
  return NextResponse.json({ member: updated });
}

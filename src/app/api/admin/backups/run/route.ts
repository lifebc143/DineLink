import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createApplicationBackup } from "@/lib/application-backup";

export async function POST(request: Request) {
  const admin = await getCurrentUser();
  if (admin?.role !== "admin") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const body = await request.json().catch(() => null) as { confirmation?: string } | null;
  if (body?.confirmation !== "CREATE_SNAPSHOT") return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });
  try {
    const result = await createApplicationBackup({ initiatedBy: admin.id, manual: true });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "BACKUP_FAILED", message: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}

import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getHeartbeatTaskUid } from "@/lib/cron-auth";
import { createApplicationBackup } from "@/lib/application-backup";
import { db } from "@/lib/db";
import { automationJobs } from "../../../../../drizzle/schema";

const JOB_KEY = "monthly-application-backup";

export async function POST(request: NextRequest) {
  const taskUid = await getHeartbeatTaskUid(request);
  if (!taskUid) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const [job] = await db.select().from(automationJobs).where(eq(automationJobs.jobKey, JOB_KEY)).limit(1);
  if (!job || !job.enabled || job.cronTaskUid !== taskUid) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  try {
    const result = await createApplicationBackup({ scheduledOnly: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: "BACKUP_FAILED", message: error instanceof Error ? error.message : "Unknown backup failure" }, { status: 500 });
  }
}

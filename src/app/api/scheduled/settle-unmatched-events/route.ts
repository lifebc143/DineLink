import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { automationJobs } from "../../../../../drizzle/schema";
import { getHeartbeatTaskUid } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { settleExpiredUnmatchedEvents } from "@/lib/unmatched-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const taskUid = await getHeartbeatTaskUid(request);
    if (!taskUid) return NextResponse.json({ error: "CRON_ONLY" }, { status: 403 });
    const [job] = await db.select().from(automationJobs).where(eq(automationJobs.cronTaskUid, taskUid)).limit(1);
    if (!job || job.jobKey !== "settle-unmatched-events" || !job.enabled) return NextResponse.json({ ok: true, skipped: "orphan_or_disabled" });
    const result = await settleExpiredUnmatchedEvents();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "UNMATCHED_SETTLEMENT_FAILED", timestamp: new Date().toISOString() }, { status: 500 });
  }
}

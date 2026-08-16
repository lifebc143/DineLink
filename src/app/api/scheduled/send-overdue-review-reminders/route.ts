import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { automationJobs } from "@/../drizzle/schema";
import { getHeartbeatTaskUid } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { sendOverdueReviewReminders } from "@/lib/review-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const taskUid = await getHeartbeatTaskUid(request);
    if (!taskUid) return NextResponse.json({ error: "CRON_ONLY" }, { status: 403 });
    const [job] = await db.select().from(automationJobs).where(eq(automationJobs.cronTaskUid, taskUid)).limit(1);
    if (!job || job.jobKey !== "send-overdue-review-reminders" || !job.enabled) return NextResponse.json({ ok: true, skipped: "orphan_or_disabled" });
    return NextResponse.json({ ok: true, ...(await sendOverdueReviewReminders()) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "OVERDUE_REVIEW_REMINDER_FAILED", timestamp: new Date().toISOString() }, { status: 500 });
  }
}

import type { Request, Response } from "express";
import { createEventReminderNotifications } from "../diningDb";
import { sdk } from "../_core/sdk";

export async function handleEventReminder(req: Request, res: Response) {
  try {
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) return res.status(403).json({ error: "cron-only" });
    const result = await createEventReminderNotifications(user.taskUid);
    return res.json({ ok: true, ...result });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "event reminder failed",
      taskUid: "unavailable",
      timestamp: new Date().toISOString(),
    });
  }
}

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getHeartbeatTaskUid: vi.fn(), select: vi.fn(), backup: vi.fn() }));
vi.mock("@/lib/cron-auth", () => ({ getHeartbeatTaskUid: mocks.getHeartbeatTaskUid }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/lib/application-backup", () => ({ createApplicationBackup: mocks.backup }));

import { POST } from "@/app/api/scheduled/monthly-application-backup/route";

describe("POST /api/scheduled/monthly-application-backup", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("拒絕非平台排程請求", async () => {
    mocks.getHeartbeatTaskUid.mockResolvedValue(null);
    const response = await POST(new NextRequest("https://example.test/api/scheduled/monthly-application-backup", { method: "POST" }));
    expect(response.status).toBe(403);
  });
  it("僅以已登錄的排程 UID 建立可重複安全的月度快照", async () => {
    mocks.getHeartbeatTaskUid.mockResolvedValue("task-monthly-backup");
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ jobKey: "monthly-application-backup", cronTaskUid: "task-monthly-backup", enabled: true }] }) }) });
    mocks.backup.mockResolvedValue({ skipped: false, snapshot: { id: "snapshot-1", status: "succeeded" } });
    const response = await POST(new NextRequest("https://example.test/api/scheduled/monthly-application-backup", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, skipped: false, snapshot: { id: "snapshot-1", status: "succeeded" } });
    expect(mocks.backup).toHaveBeenCalledWith({ scheduledOnly: true });
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getHeartbeatTaskUid: vi.fn(), select: vi.fn(), settle: vi.fn() }));
vi.mock("@/lib/cron-auth", () => ({ getHeartbeatTaskUid: mocks.getHeartbeatTaskUid }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select } }));
vi.mock("@/lib/unmatched-events", () => ({ settleExpiredUnmatchedEvents: mocks.settle }));

import { POST } from "@/app/api/scheduled/settle-unmatched-events/route";

describe("POST /api/scheduled/settle-unmatched-events", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("拒絕非平台排程請求", async () => {
    mocks.getHeartbeatTaskUid.mockResolvedValue(null);
    const response = await POST(new NextRequest("https://example.test/api/scheduled/settle-unmatched-events", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "CRON_ONLY" });
  });
  it("僅對已登錄的排程 UID 執行可重複的未成局結算", async () => {
    mocks.getHeartbeatTaskUid.mockResolvedValue("task-unmatched");
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ jobKey: "settle-unmatched-events", cronTaskUid: "task-unmatched", enabled: true }] }) }) });
    mocks.settle.mockResolvedValue({ settled: 1, eventIds: ["event-1"] });
    const response = await POST(new NextRequest("https://example.test/api/scheduled/settle-unmatched-events", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, settled: 1, eventIds: ["event-1"] });
    expect(mocks.settle).toHaveBeenCalledOnce();
  });
});

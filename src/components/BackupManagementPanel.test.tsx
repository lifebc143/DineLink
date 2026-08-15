import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackupManagementPanel from "./BackupManagementPanel";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("BackupManagementPanel", () => {
  it("呈現每月 1 日 03:00、保留三份，並可儲存管理員設定", async () => {
    const fetchMock = vi.fn((_: string, init?: RequestInit) => Promise.resolve({ ok: true, json: async () => init?.method === "PUT" ? { settings: {} } : { settings: { dayOfMonth: 1, hourTaipei: 3, retentionCount: 3, enabled: true }, snapshots: [], restoreRequests: [], coverage: { included: [], excluded: [], timezone: "Asia/Taipei" } } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<BackupManagementPanel />);
    expect(await screen.findByText("每月應用資料備份")).not.toBeNull();
    expect((screen.getByLabelText("每月備份日期") as HTMLSelectElement).value).toBe("1");
    expect((screen.getByLabelText("每月備份時間") as HTMLSelectElement).value).toBe("3");
    expect((screen.getByLabelText("備份保留份數") as HTMLSelectElement).value).toBe("3");
    fireEvent.click(screen.getByText("儲存設定"));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/backups", expect.objectContaining({ method: "PUT", body: expect.stringContaining('"retentionCount":3') }));
  });

  it("管理員可確認立即快照並建立不會自動還原的人工申請", async () => {
    const snapshot = { id: "snapshot-1", scheduleKey: "2026-08-manual", status: "succeeded", trigger: "manual", checksumSha256: "abc123def456", byteSize: 1024, tableCounts: { users: 2, dining_events: 1 }, createdAt: "2026-08-15T00:00:00.000Z", completedAt: "2026-08-15T00:00:01.000Z" };
    const fetchMock = vi.fn((url: string, init?: RequestInit) => Promise.resolve({ ok: true, status: 201, json: async () => url.endsWith("/run") ? { skipped: false, snapshot } : { settings: { dayOfMonth: 1, hourTaipei: 3, retentionCount: 3, enabled: true }, snapshots: [snapshot], restoreRequests: [], coverage: { included: [], excluded: [], timezone: "Asia/Taipei" } } }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
    vi.stubGlobal("prompt", vi.fn(() => "需要回復誤刪除的設定資料"));
    render(<BackupManagementPanel />);
    expect(await screen.findByText("2026-08-manual 應用資料快照")).not.toBeNull();
    fireEvent.click(screen.getByText("立即快照"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/backups/run", expect.objectContaining({ method: "POST", body: expect.stringContaining("CREATE_SNAPSHOT") })));
    fireEvent.click(screen.getByText("申請手動還原"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/admin/backups/snapshot-1/restore-request", expect.objectContaining({ method: "POST", body: expect.stringContaining("REQUEST_RESTORE") })));
  });

  it("僅在管理員面板呈現私有 S3 識別碼，下載仍使用受保護 API 路徑", async () => {
    const snapshot = { id: "snapshot-private", scheduleKey: "2026-08", status: "succeeded", trigger: "scheduled", checksumSha256: "abc123", byteSize: 2048, tableCounts: { users: 2 }, createdAt: "2026-08-01T00:00:00.000Z", completedAt: "2026-08-01T00:00:01.000Z", storage: { provider: "Private S3", objectKey: "backups/dinelink/2026-08/application-data.json", downloadAvailable: true } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ settings: { dayOfMonth: 1, hourTaipei: 3, retentionCount: 3, enabled: true }, snapshots: [snapshot], restoreRequests: [], coverage: { included: [], excluded: [], timezone: "Asia/Taipei" } }) }));
    render(<BackupManagementPanel />);
    expect(await screen.findByText(/backups\/dinelink\/2026-08\/application-data.json/)).not.toBeNull();
    const download = screen.getByText("下載").closest("a");
    expect(download?.getAttribute("href")).toBe("/api/admin/backups/snapshot-private/download");
    expect(download?.getAttribute("href")).not.toMatch(/^https?:\/\//);
  });
});

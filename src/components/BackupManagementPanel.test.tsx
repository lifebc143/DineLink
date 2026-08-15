import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import BackupManagementPanel from "./BackupManagementPanel";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("BackupManagementPanel", () => {
  it("呈現每月 1 日 03:00、保留三份，並可儲存管理員設定", async () => {
    const fetchMock = vi.fn((_: string, init?: RequestInit) => Promise.resolve({ ok: true, json: async () => init?.method === "PUT" ? { settings: {} } : { settings: { dayOfMonth: 1, hourTaipei: 3, retentionCount: 3, enabled: true }, snapshots: [], coverage: { included: [], excluded: [], timezone: "Asia/Taipei" } } }));
    vi.stubGlobal("fetch", fetchMock);
    render(<BackupManagementPanel />);
    expect(await screen.findByText("每月應用資料備份")).not.toBeNull();
    expect((screen.getByLabelText("每月備份日期") as HTMLSelectElement).value).toBe("1");
    expect((screen.getByLabelText("每月備份時間") as HTMLSelectElement).value).toBe("3");
    expect((screen.getByLabelText("備份保留份數") as HTMLSelectElement).value).toBe("3");
    fireEvent.click(screen.getByText("儲存設定"));
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/backups", expect.objectContaining({ method: "PUT", body: expect.stringContaining('"retentionCount":3') }));
  });
});

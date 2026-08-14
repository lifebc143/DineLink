import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminDashboard from "./AdminDashboard";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("AdminDashboard 管理員授權狀態", () => {
  it("已驗證的管理員顯示管理員已授權，且待驗證統計可為零", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ metrics: { registeredMembers: 2, verifiedMembers: 2, pendingVerification: 0, restrictedMembers: 0, totalEvents: 1, publishedEvents: 1, totalApplications: 0, pendingApplications: 0, totalAttendances: 0, noShowCount: 0 }, recentMembers: [{ id: "life-onca", displayName: "Life Onca", role: "admin", verificationStatus: "verified", accountStatus: "active", suspensionReason: null, createdAt: "2026-08-13T00:00:00.000Z" }] }) }));
    render(<AdminDashboard onBack={() => undefined} />);
    expect(await screen.findByText("管理員已授權")).not.toBeNull();
    expect(screen.queryByText("待審核")).toBeNull();
    expect(document.body.textContent).toContain("目前有 0 位會員等待驗證審核");
  });
});

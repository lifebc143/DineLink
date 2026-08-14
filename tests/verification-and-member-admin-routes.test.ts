import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), select: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/lib/db", () => ({ db: { select: mocks.select, update: mocks.update } }));

import { POST as requestVerification } from "@/app/api/me/verification/route";
import { PATCH as manageMember } from "@/app/api/admin/members/[memberId]/route";

const memberId = "8a5b2e0d-bb2e-42d0-a439-9aa5b5cc17a1";
const adminId = "0e420db6-7f5e-4c1f-9baf-10b054cd7d19";
const context = { params: Promise.resolve({ memberId }) };
const request = (action: string, reason?: string) => new Request(`http://localhost/api/admin/members/${memberId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) });

describe("驗證申請與管理員會員處置", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("會員可送出簡易驗證申請，已驗證會員不會重複送審", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: memberId, verificationStatus: "unverified", accountStatus: "active" });
    const returning = vi.fn().mockResolvedValue([{ id: memberId, verificationStatus: "pending" }]);
    mocks.update.mockReturnValue({ set: () => ({ where: () => ({ returning }) }) });
    const response = await requestVerification();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: { id: memberId, verificationStatus: "pending" } });
    mocks.getCurrentUser.mockResolvedValue({ id: memberId, verificationStatus: "verified", accountStatus: "active" });
    expect((await requestVerification()).status).toBe(409);
  });

  it("未登入與非管理員不可處置會員", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);
    expect((await manageMember(request("suspend"), context)).status).toBe(401);
    mocks.getCurrentUser.mockResolvedValue({ id: adminId, role: "member" });
    expect((await manageMember(request("suspend"), context)).status).toBe(403);
  });

  it("管理員可核准驗證、停權或取消一般會員資格，但不可處置自己或其他 admin", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: adminId, role: "admin" });
    mocks.select.mockReturnValue({ from: () => ({ where: () => ({ limit: async () => [{ id: memberId, role: "member" }] }) }) });
    const returning = vi.fn().mockResolvedValue([{ id: memberId, displayName: "一般會員", verificationStatus: "verified", accountStatus: "active", suspensionReason: null }]);
    const set = vi.fn().mockReturnValue({ where: () => ({ returning }) });
    mocks.update.mockReturnValue({ set });
    const verify = await manageMember(request("verify"), context);
    expect(verify.status).toBe(200);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ verificationStatus: "verified" }));
    const suspend = await manageMember(request("suspend", "騷擾其他會員"), context);
    expect(suspend.status).toBe(200);
    expect(set).toHaveBeenLastCalledWith(expect.objectContaining({ accountStatus: "suspended", suspensionReason: "騷擾其他會員" }));
    const self = await manageMember(request("suspend"), { params: Promise.resolve({ memberId: adminId }) });
    expect(self.status).toBe(400);
  });
});

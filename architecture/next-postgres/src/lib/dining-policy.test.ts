import { describe, expect, it } from "vitest";
import { assertCanApply, canAccessEventChat, decideApplicationReview, decideAttendanceOutcome } from "./dining-policy";

describe("DineLink dining policy", () => {
  it("holds a deposit only for an open event with sufficient points", () => {
    expect(assertCanApply({ eventStatus: "published", isHost: false, now: new Date("2026-08-13T00:00:00Z"), availablePoints: 100, requiredDepositPoints: 100 })).toEqual({ depositAction: "hold" });
    expect(() => assertCanApply({ eventStatus: "published", isHost: false, now: new Date(), availablePoints: 99, requiredDepositPoints: 100 })).toThrow("INSUFFICIENT_POINTS");
  });

  it("approves one applicant without exceeding capacity and releases rejected deposits", () => {
    expect(decideApplicationReview({ decision: "approve", applicationStatus: "pending", approvedCount: 2, capacity: 3 })).toMatchObject({ applicationStatus: "approved", createsAttendance: true, eventStatus: "full" });
    expect(decideApplicationReview({ decision: "reject", applicationStatus: "pending", approvedCount: 2, capacity: 3 })).toMatchObject({ applicationStatus: "rejected", depositAction: "release" });
    expect(() => decideApplicationReview({ decision: "approve", applicationStatus: "pending", approvedCount: 3, capacity: 3 })).toThrow("EVENT_CAPACITY_REACHED");
  });

  it("restricts chat and avoids double point deduction for a no-show", () => {
    expect(canAccessEventChat({ isHost: false, attendanceStatus: "confirmed" })).toBe(true);
    expect(canAccessEventChat({ isHost: false, attendanceStatus: "no_show" })).toBe(false);
    expect(decideAttendanceOutcome({ attendanceStatus: "no_show", depositAlreadyHeld: true })).toMatchObject({ depositAction: "forfeit", pointLedgerDelta: 0, creditScoreDelta: -15 });
    expect(decideAttendanceOutcome({ attendanceStatus: "attended", depositAlreadyHeld: true })).toMatchObject({ depositAction: "release", pointLedgerDelta: 1, creditScoreDelta: 0 });
  });
});

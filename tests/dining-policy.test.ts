import { describe, expect, it } from "vitest";
import { calculateCreditScoreFromDimensions, resolveAttendanceSettlement } from "@/lib/dining-policy";

describe("DineLink trust policy", () => {
  it("turns three review dimensions into a bounded credit score", () => {
    expect(calculateCreditScoreFromDimensions(5, 5, 5)).toBe(100);
    expect(calculateCreditScoreFromDimensions(1, 1, 1)).toBe(60);
  });

  it("releases deposits for attendance and forfeits them for no-shows", () => {
    expect(resolveAttendanceSettlement("attended", 100)).toEqual({ depositAction: "release", pointBalanceDelta: 100, creditScoreDelta: 0 });
    expect(resolveAttendanceSettlement("late", 100)).toEqual({ depositAction: "release", pointBalanceDelta: 100, creditScoreDelta: 0 });
    expect(resolveAttendanceSettlement("no_show", 100)).toEqual({ depositAction: "forfeit", pointBalanceDelta: 0, creditScoreDelta: -15 });
  });
});

export type AttendanceSettlement = { depositAction: "release" | "forfeit" | "hold"; pointBalanceDelta: number; creditScoreDelta: number };

export function calculateCreditScoreFromDimensions(punctuality: number, politeness: number, fun: number) {
  const average = (punctuality + politeness + fun) / 3;
  return Math.min(100, Math.max(0, Math.round(50 + average * 10)));
}

export function resolveAttendanceSettlement(status: "confirmed" | "attended" | "late" | "no_show" | "excused", depositPoints: number): AttendanceSettlement {
  if (status === "attended" || status === "late") return { depositAction: "release", pointBalanceDelta: depositPoints, creditScoreDelta: 0 };
  if (status === "no_show") return { depositAction: "forfeit", pointBalanceDelta: 0, creditScoreDelta: -15 };
  return { depositAction: "hold", pointBalanceDelta: 0, creditScoreDelta: 0 };
}

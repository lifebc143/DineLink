export type EventLifecycleStatus = "draft" | "published" | "full" | "locked" | "in_progress" | "completed" | "cancelled";
export type ApplicationStatus = "pending" | "approved" | "rejected" | "withdrawn" | "cancelled";
export type AttendanceStatus = "confirmed" | "attended" | "late" | "no_show" | "excused";
export type DepositAction = "hold" | "release" | "forfeit" | "none";

export type ApplicationReview = {
  applicationStatus: ApplicationStatus;
  depositAction: DepositAction;
  createsAttendance: boolean;
  eventStatus?: "full";
};

export function assertCanApply(input: {
  eventStatus: EventLifecycleStatus;
  isHost: boolean;
  applicationDeadlineAt?: Date | null;
  now: Date;
  availablePoints: number;
  requiredDepositPoints: number;
}) {
  if (input.isHost) throw new Error("HOST_CANNOT_APPLY");
  if (input.eventStatus !== "published") throw new Error("EVENT_NOT_OPEN");
  if (input.applicationDeadlineAt && input.applicationDeadlineAt <= input.now) throw new Error("APPLICATION_DEADLINE_PASSED");
  if (input.availablePoints < input.requiredDepositPoints) throw new Error("INSUFFICIENT_POINTS");
  return { depositAction: "hold" as const };
}

export function decideApplicationReview(input: {
  decision: "approve" | "reject";
  applicationStatus: ApplicationStatus;
  approvedCount: number;
  capacity: number;
}): ApplicationReview {
  if (input.applicationStatus !== "pending") throw new Error("APPLICATION_NOT_PENDING");
  if (input.decision === "reject") {
    return { applicationStatus: "rejected", depositAction: "release", createsAttendance: false };
  }
  if (input.approvedCount >= input.capacity) throw new Error("EVENT_CAPACITY_REACHED");
  return {
    applicationStatus: "approved",
    depositAction: "none",
    createsAttendance: true,
    eventStatus: input.approvedCount + 1 === input.capacity ? "full" : undefined,
  };
}

export function canAccessEventChat(input: { isHost: boolean; attendanceStatus?: AttendanceStatus | null }) {
  if (input.isHost) return true;
  return input.attendanceStatus === "confirmed" || input.attendanceStatus === "attended" || input.attendanceStatus === "late";
}

export function decideAttendanceOutcome(input: { attendanceStatus: AttendanceStatus; depositAlreadyHeld: boolean }) {
  if (!input.depositAlreadyHeld) throw new Error("DEPOSIT_NOT_HELD");
  if (input.attendanceStatus === "no_show") {
    return { depositAction: "forfeit" as const, pointLedgerDelta: 0, creditScoreDelta: -15, notifyConfirmedMembers: true };
  }
  if (input.attendanceStatus === "attended" || input.attendanceStatus === "late") {
    return { depositAction: "release" as const, pointLedgerDelta: 1, creditScoreDelta: 0, notifyConfirmedMembers: false };
  }
  return { depositAction: "none" as const, pointLedgerDelta: 0, creditScoreDelta: 0, notifyConfirmedMembers: false };
}

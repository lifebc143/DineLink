import { describe, expect, it } from "vitest";
import { calculateReviewProgress, pendingReviewRecipients } from "@/lib/review-progress";

describe("review progress", () => {
  const dueAt = new Date("2026-08-20T00:00:00.000Z");
  const participants = ["host", "member"];

  it("calculates incomplete viewer progress and overdue status", () => {
    expect(calculateReviewProgress({ viewerId: "host", participantIds: participants, reviews: [{ reviewerId: "member", revieweeId: "host" }], reviewDueAt: dueAt, now: new Date("2026-08-21T00:00:00.000Z") })).toMatchObject({ completedReviewCount: 1, expectedReviewCount: 2, completedForCurrentUser: 0, totalForCurrentUser: 1, overdue: true });
  });

  it("marks all participants complete once mutual reviews exist", () => {
    const reviews = [{ reviewerId: "host", revieweeId: "member" }, { reviewerId: "member", revieweeId: "host" }];
    expect(calculateReviewProgress({ viewerId: "host", participantIds: participants, reviews, reviewDueAt: dueAt, now: new Date("2026-08-19T00:00:00.000Z") })).toMatchObject({ completedReviewCount: 2, expectedReviewCount: 2, completedForCurrentUser: 1, totalForCurrentUser: 1, overdue: false });
    expect(pendingReviewRecipients(participants, reviews)).toEqual([]);
  });

  it("reminds only reviewers who still owe at least one evaluation", () => {
    expect(pendingReviewRecipients(participants, [{ reviewerId: "host", revieweeId: "member" }])).toEqual(["member"]);
  });
});

import { describe, expect, it } from "vitest";
import { pendingReviewTasks } from "@/lib/review-tasks";

describe("pendingReviewTasks", () => {
  it("讓沒有個別出席列的主辦人仍可評價已出席成員", () => {
    const tasks = pendingReviewTasks({
      userId: "host-1",
      candidates: [{ event: { id: "event-1", hostId: "host-1" }, peer: { id: "member-1", displayName: "成員", avatarUrl: null } }],
      submittedKeys: new Set(),
    });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].peer.id).toBe("member-1");
  });

  it("讓已出席參加者可評價主辦人，並排除已送出的重複評價", () => {
    const candidates = [{ event: { id: "event-1", hostId: "host-1" }, peer: { id: "host-1", displayName: "主辦人", avatarUrl: null } }];
    expect(pendingReviewTasks({ userId: "member-1", candidates, submittedKeys: new Set() })).toHaveLength(1);
    expect(pendingReviewTasks({ userId: "member-1", candidates, submittedKeys: new Set(["event-1:host-1"]) })).toHaveLength(0);
  });
});

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ db: {} }));

import { POST as completeEvent } from "@/app/api/events/[eventId]/complete/route";
import { POST as submitReview } from "@/app/api/events/[eventId]/reviews/route";
import { POST as reviewApplication } from "@/app/api/applications/[applicationId]/review/route";
import { GET as listNotifications } from "@/app/api/notifications/route";

describe("Next.js Route Handler contracts", () => {
  it("rejects unauthenticated event completion before database work", async () => {
    const response = await completeEvent(new Request("http://localhost/api/events/event-1/complete"), { params: Promise.resolve({ eventId: "event-1" }) });
    expect(response.status).toBe(401);
  });

  it("rejects unauthenticated review and application moderation requests", async () => {
    const reviewResponse = await submitReview(new Request("http://localhost/api/events/event-1/reviews", { method: "POST", body: "{}" }) as never, { params: Promise.resolve({ eventId: "event-1" }) });
    const applicationResponse = await reviewApplication(new Request("http://localhost/api/applications/application-1/review", { method: "POST", body: "{}" }) as never, { params: Promise.resolve({ applicationId: "application-1" }) });
    expect(reviewResponse.status).toBe(401);
    expect(applicationResponse.status).toBe(401);
  });

  it("protects notification inboxes from unauthenticated access", async () => {
    const response = await listNotifications(new Request("http://localhost/api/notifications") as never);
    expect(response.status).toBe(401);
  });
});

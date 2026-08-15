import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ user: null as Record<string, unknown> | null, transaction: null as null | ((callback: (tx: any) => Promise<unknown>) => Promise<unknown>) }));

vi.mock("@/lib/auth", () => ({ getCurrentUser: vi.fn(() => Promise.resolve(state.user)) }));
vi.mock("@/lib/db", () => ({ db: { transaction: (callback: (tx: any) => Promise<unknown>) => state.transaction!(callback) } }));

import { POST as completeEvent } from "@/app/api/events/[eventId]/complete/route";
import { POST as submitReview } from "@/app/api/events/[eventId]/reviews/route";
import { POST as reviewApplication } from "@/app/api/applications/[applicationId]/review/route";
import { POST as createApplication } from "@/app/api/events/[eventId]/applications/route";

function transactionWith(selectResults: unknown[][]) {
  const inserts: unknown[] = [];
  const updates: unknown[] = [];
  let position = 0;
  const tx = {
    select: () => ({ from: () => ({ where: () => {
      const result = selectResults[position++] ?? [];
      const response = Promise.resolve(result) as Promise<unknown[]> & { limit: (amount: number) => Promise<unknown[]> };
      response.limit = async () => result as unknown[];
      return response;
    } }) }),
    update: () => ({ set: (values: unknown) => { updates.push(values); return { where: async () => undefined }; } }),
    insert: () => ({ values: (values: unknown) => {
      inserts.push(values);
      return { returning: async () => [{ id: "created-id" }] };
    } }),
  };
  return { tx, inserts, updates };
}

const host = { id: "host-id", displayName: "Host", pointBalance: 500 };
const applicant = { id: "11111111-1111-4111-8111-111111111111", displayName: "Member", pointBalance: 500 };

beforeEach(() => { state.user = host; state.transaction = null; });

describe("DineLink transaction Route Handlers", () => {
  it("建立申請資料與主辦人待審核通知，且不再以保證金或點數阻擋報名", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", hostId: host.id, status: "published" }],
      [],
    ]);
    state.user = { ...applicant, pointBalance: 0 };
    state.transaction = async (callback) => callback(fixture.tx);

    const response = await createApplication(new Request("http://localhost/api/events/event-id/applications", { method: "POST", body: JSON.stringify({ introduction: "期待認識新朋友" }) }) as never, { params: Promise.resolve({ eventId: "event-id" }) });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ application: { id: "created-id" } });
    expect(fixture.inserts).toHaveLength(2);
    expect(fixture.inserts[0]).toMatchObject({ eventId: "event-id", applicantId: applicant.id, introduction: "期待認識新朋友" });
    expect(fixture.inserts[1]).toMatchObject({ recipientId: host.id, eventId: "event-id", applicationId: "created-id", type: "application_submitted" });
  });

  it("拒絕同一會員對同一飯局重複建立申請，避免重複通知主辦人", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", hostId: host.id, status: "published" }],
      [{ id: "existing-application" }],
    ]);
    state.user = applicant;
    state.transaction = async (callback) => callback(fixture.tx);

    const response = await createApplication(new Request("http://localhost/api/events/event-id/applications", { method: "POST", body: JSON.stringify({}) }) as never, { params: Promise.resolve({ eventId: "event-id" }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "DUPLICATE_APPLICATION" });
    expect(fixture.inserts).toHaveLength(0);
  });

  it("releases held points and creates review notices when an attended member's event completes", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", hostId: host.id, status: "published" }],
      [{ id: "attendance-id", userId: applicant.id, status: "attended" }],
      [{ id: "deposit-id", points: 100 }],
      [applicant],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const response = await completeEvent(new Request("http://localhost/api/events/event-id/complete"), { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: "completed", releasedCount: 1, forfeitedCount: 0 });
    expect(fixture.inserts).toHaveLength(2);
    expect(fixture.inserts[1]).toEqual([expect.objectContaining({ recipientId: applicant.id, type: "review_request" })]);
  });

  it("releases the same deposit for a late member", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", hostId: host.id, status: "published" }],
      [{ id: "attendance-id", userId: applicant.id, status: "late" }],
      [{ id: "deposit-id", points: 100 }],
      [applicant],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const response = await completeEvent(new Request("http://localhost/api/events/event-id/complete"), { params: Promise.resolve({ eventId: "event-id" }) });
    expect(await response.json()).toMatchObject({ releasedCount: 1, forfeitedCount: 0 });
    expect(fixture.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "released" })]));
  });

  it("forfeits the deposit and applies a no-show penalty during completion", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", hostId: host.id, status: "published" }],
      [{ id: "attendance-id", userId: applicant.id, status: "no_show" }],
      [{ id: "deposit-id", points: 100 }],
      [applicant],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const response = await completeEvent(new Request("http://localhost/api/events/event-id/complete"), { params: Promise.resolve({ eventId: "event-id" }) });
    expect(await response.json()).toMatchObject({ forfeitedCount: 1 });
    expect(fixture.inserts).toHaveLength(1);
    expect(fixture.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "forfeited" }), expect.objectContaining({ noShowCount: expect.anything() })]));
  });

  it("accepts reviews only after a completed event and persists a review record", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", status: "completed" }],
      [{ userId: host.id, status: "attended" }, { userId: applicant.id, status: "late" }],
      [{ punctuality: "4.5", politeness: "4.5", fun: "4.0" }],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const request = new Request("http://localhost/api/events/event-id/reviews", { method: "POST", body: JSON.stringify({ revieweeId: applicant.id, punctualityScore: 5, politenessScore: 4, funScore: 4, attendanceNote: "準時抵達並積極互動" }) });
    const response = await submitReview(request as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(201);
    expect(fixture.inserts).toHaveLength(1);
    expect(fixture.inserts[0]).toMatchObject({ punctualityScore: 5, politenessScore: 4, funScore: 4, privateNote: "準時抵達並積極互動" });
    expect(fixture.updates).toEqual(expect.arrayContaining([expect.objectContaining({ creditScore: 93 })]));
  });

  it("rejects reviews for events that are not completed", async () => {
    const fixture = transactionWith([[]]);
    state.transaction = async (callback) => callback(fixture.tx);
    const request = new Request("http://localhost/api/events/event-id/reviews", { method: "POST", body: JSON.stringify({ revieweeId: applicant.id, punctualityScore: 5, politenessScore: 4, funScore: 4 }) });
    const response = await submitReview(request as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "EVENT_NOT_COMPLETED" });
  });

  it("rejects reviews when either member lacks attended or late status", async () => {
    const fixture = transactionWith([
      [{ id: "event-id", status: "completed" }],
      [{ userId: host.id, status: "attended" }],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const request = new Request("http://localhost/api/events/event-id/reviews", { method: "POST", body: JSON.stringify({ revieweeId: applicant.id, punctualityScore: 5, politenessScore: 4, funScore: 4 }) });
    const response = await submitReview(request as never, { params: Promise.resolve({ eventId: "event-id" }) });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: "REVIEW_ATTENDANCE_REQUIRED" });
  });

  it("rejects a pending application and writes a rejection notification without requiring a legacy deposit", async () => {
    const fixture = transactionWith([
      [{ id: "application-id", eventId: "event-id", applicantId: applicant.id, status: "pending" }],
      [{ id: "event-id", hostId: host.id, capacity: 4 }],
    ]);
    state.transaction = async (callback) => callback(fixture.tx);
    const request = new Request("http://localhost/api/applications/application-id/review", { method: "POST", body: JSON.stringify({ decision: "rejected" }) });
    const response = await reviewApplication(request as never, { params: Promise.resolve({ applicationId: "application-id" }) });
    expect(await response.json()).toMatchObject({ status: "rejected" });
    expect(fixture.inserts).toHaveLength(1);
    expect(fixture.inserts[0]).toMatchObject({ recipientId: applicant.id, type: "application_rejected" });
    expect(fixture.updates).toEqual(expect.arrayContaining([expect.objectContaining({ status: "rejected" })]));
  });

  it("approves applications while capacity exists and marks full capacity conflicts", async () => {
    const approvedFixture = transactionWith([
      [{ id: "application-id", eventId: "event-id", applicantId: applicant.id, status: "pending" }],
      [{ id: "event-id", hostId: host.id, capacity: 4 }],
      [{ total: 1 }],
    ]);
    state.transaction = async (callback) => callback(approvedFixture.tx);
    const approvedResponse = await reviewApplication(new Request("http://localhost/api/applications/application-id/review", { method: "POST", body: JSON.stringify({ decision: "approved" }) }) as never, { params: Promise.resolve({ applicationId: "application-id" }) });
    expect(await approvedResponse.json()).toMatchObject({ status: "approved", isFull: false });
    expect(approvedFixture.inserts).toEqual(expect.arrayContaining([expect.objectContaining({ eventId: "event-id", userId: applicant.id, status: "confirmed" })]));
    expect(approvedFixture.inserts).toEqual(expect.arrayContaining([expect.objectContaining({ recipientId: applicant.id, type: "application_approved" })]));

    const fullFixture = transactionWith([
      [{ id: "application-id", eventId: "event-id", applicantId: applicant.id, status: "pending" }],
      [{ id: "event-id", hostId: host.id, capacity: 4 }],
      [{ total: 4 }],
    ]);
    state.transaction = async (callback) => callback(fullFixture.tx);
    const fullResponse = await reviewApplication(new Request("http://localhost/api/applications/application-id/review", { method: "POST", body: JSON.stringify({ decision: "approved" }) }) as never, { params: Promise.resolve({ applicationId: "application-id" }) });
    expect(fullResponse.status).toBe(409);
    expect(await fullResponse.json()).toMatchObject({ error: "EVENT_CAPACITY_REACHED" });
  });
});

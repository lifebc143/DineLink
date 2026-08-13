import { describe, expect, it } from "vitest";
import {
  chatMessages,
  diningEvents,
  eventApplications,
  eventAttendances,
  eventDeposits,
  eventReviews,
  notifications,
  paymentTransactions,
  pointTransactions,
  users,
} from "../architecture/next-postgres/drizzle/schema";

describe("DineLink target PostgreSQL schema contract", () => {
  it("contains the aggregates required by the dining MVP", () => {
    expect(users).toHaveProperty("pointBalance");
    expect(users).toHaveProperty("creditScore");
    expect(diningEvents).toHaveProperty("paymentMode");
    expect(diningEvents).toHaveProperty("reminderTaskUid");
    expect(eventApplications).toHaveProperty("status");
    expect(eventAttendances).toHaveProperty("status");
    expect(chatMessages).toHaveProperty("content");
    expect(eventReviews).toHaveProperty("funScore");
    expect(eventDeposits).toHaveProperty("status");
    expect(pointTransactions).toHaveProperty("balanceAfter");
    expect(paymentTransactions).toHaveProperty("providerPaymentId");
    expect(notifications).toHaveProperty("type");
  });
});

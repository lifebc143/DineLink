import { describe, expect, it } from "vitest";
import {
  chatMessages,
  diningEvents,
  eventApplications,
  eventDeposits,
  eventReviews,
  eventAttendances,
  notifications,
  paymentTransactions,
  pointTransactions,
  users,
} from "./schema";

describe("DineLink PostgreSQL Drizzle schema", () => {
  it("exposes each required MVP aggregate", () => {
    expect(users).toHaveProperty("pointBalance");
    expect(users).toHaveProperty("creditScore");
    expect(diningEvents).toHaveProperty("paymentMode");
    expect(diningEvents).toHaveProperty("reminderTaskUid");
    expect(eventApplications).toHaveProperty("status");
    expect(eventAttendances).toHaveProperty("status");
    expect(chatMessages).toHaveProperty("content");
    expect(eventReviews).toHaveProperty("punctualityScore");
    expect(eventDeposits).toHaveProperty("status");
    expect(pointTransactions).toHaveProperty("balanceAfter");
    expect(paymentTransactions).toHaveProperty("providerPaymentId");
    expect(notifications).toHaveProperty("type");
  });
});

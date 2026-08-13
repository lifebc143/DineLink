import { afterAll, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";

const requiredTables = [
  "users",
  "dining_events",
  "event_applications",
  "event_attendances",
  "chat_messages",
  "event_reviews",
  "event_deposits",
  "point_transactions",
  "payment_transactions",
  "notifications",
];

afterAll(async () => {
  await pool.end();
});

describe("PostgreSQL DineLink schema", () => {
  it("contains all core tables after the initial Drizzle migration", async () => {
    const result = await pool.query<{ table_name: string }>("select table_name from information_schema.tables where table_schema = 'public'");
    const tableNames = result.rows.map((row) => row.table_name);
    expect(tableNames).toEqual(expect.arrayContaining(requiredTables));
  }, 15_000);
});

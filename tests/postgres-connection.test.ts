import { afterAll, describe, expect, it } from "vitest";
import { pool } from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("POSTGRES_URL", () => {
  it("connects to Supabase PostgreSQL with a lightweight health query", async () => {
    const result = await pool.query<{ ok: number }>("select 1 as ok");
    expect(result.rows[0]?.ok).toBe(1);
  }, 15_000);
});

import { Client } from "pg";
import { afterAll, describe, expect, it } from "vitest";

const connectionString = process.env.POSTGRES_URL;
const normalizedConnectionString = connectionString ? (() => {
  const url = new URL(connectionString);
  url.searchParams.delete("sslmode");
  return url.toString();
})() : undefined;
const client = normalizedConnectionString ? new Client({ connectionString: normalizedConnectionString, ssl: { rejectUnauthorized: false } }) : null;

afterAll(async () => {
  await client?.end().catch(() => undefined);
});

describe("POSTGRES_URL", () => {
  it("connects to PostgreSQL with a lightweight health query", async () => {
    expect(connectionString).toBeTruthy();
    if (!client) return;
    await client.connect();
    const result = await client.query<{ ok: number }>("select 1 as ok");
    expect(result.rows[0]?.ok).toBe(1);
  }, 15_000);
});

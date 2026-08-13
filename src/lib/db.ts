import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../drizzle/schema";

const rawConnectionString = process.env.POSTGRES_URL;
if (!rawConnectionString) throw new Error("POSTGRES_URL is required");

const url = new URL(rawConnectionString);
url.searchParams.delete("sslmode");

const globalForDb = globalThis as unknown as { pool?: Pool };
const pool = globalForDb.pool ?? new Pool({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle({ client: pool, schema });
export { pool };

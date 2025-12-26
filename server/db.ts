import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Mock DB for "In-Memory" mode if DATABASE_URL is missing,
// but we export the interface to keep types happy.
// In this specific task, we rely 100% on MemStorage in server/storage.ts
// so this file is mostly to satisfy strict template requirements.

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL || "postgres://mock:mock@localhost:5432/mock" 
});
export const db = drizzle(pool, { schema });

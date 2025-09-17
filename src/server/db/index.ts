// import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http"
// import postgres from "postgres";

import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();
// import { env } from "@/env";
import * as schema from "./schema";
import { neon } from "@neondatabase/serverless";

// /**
//  * Cache the database connection in development. This avoids creating a new connection on every HMR
//  * update.
//  */
// const globalForDb = globalThis as unknown as {
//   conn: postgres.Sql | undefined;
// };

// const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!);
// if (process.env.NODE_ENV !== "production") globalForDb.conn = conn;

// export const db = drizzle(conn, { schema });
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle({ client: sql, schema });

export type DBClient = NeonHttpDatabase<typeof schema>
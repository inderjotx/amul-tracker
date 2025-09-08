import { type Config } from "drizzle-kit";


import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();
import { env } from "@/env";

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  tablesFilter: ["amul-tracker_*"],
} satisfies Config;

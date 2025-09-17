import { type Config } from "drizzle-kit";


import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

export default {
  schema: "./src/server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ["amul-tracker_*"],
} satisfies Config;

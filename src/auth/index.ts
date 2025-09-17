import {
    betterAuth
} from 'better-auth';
import { db } from '@/server/db';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }
    },
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
});
import {
    betterAuth
} from 'better-auth';
import { db } from '@/server/db';
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from '@/env';

export const auth = betterAuth({
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET
        }
    },
    database: drizzleAdapter(db, {
        provider: "pg",
    }),
});
import {
    betterAuth
} from 'better-auth';
import { config as dotEnvConfig } from 'dotenv';
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from '@/lib/mongo-client';

dotEnvConfig();

export const auth = betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL!,
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
        }
    },
    user: {
        additionalFields: {
            pincode: {
                type: "string",
                required: true,
                input: false,
            },
            substoreId: {
                type: "string",
                required: true,
                input: false,
            },
            substoreName: {
                type: "string",
                required: true,
                input: false,
            }
        }
    },
    database: mongodbAdapter(mongoDb, {
        usePlural: true,
    }),
});
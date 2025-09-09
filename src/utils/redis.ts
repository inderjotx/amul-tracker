

import IORedis from "ioredis";
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();
import { env } from '@/env';
export const client = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
export type RedisClient = typeof client;
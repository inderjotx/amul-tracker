

import IORedis from "ioredis";
import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();
// import { env } from '@/env';

const REDIS_URL = process.env.REDIS_URL!;
export const client = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
export type RedisClient = typeof client;
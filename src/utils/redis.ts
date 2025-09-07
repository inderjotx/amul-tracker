

import IORedis from "ioredis";
// import { env } from '@/env';
// export const client = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const client = new IORedis("redis://:secret123@localhost:6379", { maxRetriesPerRequest: null });
export type RedisClient = typeof client;
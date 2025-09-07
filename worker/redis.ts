
import { Worker } from 'bullmq';
import IORedis from "ioredis";

export const client = new IORedis("redis://:secret123@localhost:6379", { maxRetriesPerRequest: null });
export type RedisClient = typeof client;

const worker = new Worker(
    'notification',
    async (job) => {
        console.log(`Processing job ${job.id} with name: ${job.name}`);
        console.log('Job data:', job.data);

        // Handle different job types
        switch (job.name) {
            case 'productRecentlyComeInStock':
                await handleProductInStock(job.data);
                break;
            default:
                console.log(`Unknown job type: ${job.name}`);
        }
    },
    {
        connection: client,
        concurrency: 5,
    }
);

async function handleProductInStock(data: unknown) {
    console.log('Handling product in stock notification:', data);
}

worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
    console.error('Worker error:', err);
});

console.log('Worker started and listening for jobs...');

process.on('SIGINT', () => {
    console.log('Shutting down worker...');
    void worker.close().then(() => {
        process.exit(0);
    });
});
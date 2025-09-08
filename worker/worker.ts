
import { Worker } from 'bullmq';
import IORedis from "ioredis";
import { emailTemplateEngine, type TrackingRequest } from './email-template-engine';
import { sendEmail } from './send-email';

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
                await handleProductInStock(job.data as { trackingRequests: TrackingRequest[] });
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

async function handleProductInStock(data: { trackingRequests: TrackingRequest[] }) {
    console.log('Handling product in stock notification:', data);

    try {
        if (!data.trackingRequests || data.trackingRequests.length === 0) {
            console.log('No tracking requests to process');
            return;
        }

        const emails = await emailTemplateEngine.processTrackingRequests(data.trackingRequests);

        console.log(`Generated ${emails.length} emails to send`);

        // Send emails
        for (const email of emails) {
            try {
                await sendEmail(email.user.email, email.subject, email.html, email.text);
                console.log(`Email sent successfully to ${email.user.email}`);
            } catch (error) {
                console.error(`Failed to send email to ${email.user.email}:`, error);
            }
        }

        console.log('All emails processed');
    } catch (error) {
        console.error('Error handling product in stock notification:', error);
        throw error;
    }
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

import { Queue } from 'bullmq';
import { client } from '@/utils/redis';





export class QueueService {

    private readonly queue: Queue;

    constructor() {
        this.queue = new Queue('notification', { connection: client });
    }

    async sendNotification(data: unknown) {
        await this.addJob("productRecentlyComeInStock", data)
    }

    async addJob(jobName: string, data: unknown) {
        await this.queue.add(jobName, data);
    }


}

export const queueService = new QueueService();
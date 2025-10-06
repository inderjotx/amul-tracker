
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { type CombinedTrackingRequest } from "./mongo";


interface NotificationMessage {
    trackingRequests: CombinedTrackingRequest;
}

export class NotificationService {

    private readonly snsClient: SNSClient;


    constructor() {
        this.snsClient = new SNSClient({});
    }

    async sendNotification(message: NotificationMessage) {
        const params = {
            TopicArn: process.env.AWS_SNS_TOPIC_ARN,
            Message: JSON.stringify(message),
        };

        try {
            const data = await this.snsClient.send(new PublishCommand(params));
            console.log("Message sent successfully!", data.MessageId);
        } catch (err) {
            console.error("Error sending message:", err);
        }
    }
};

export const notificationService = new NotificationService();
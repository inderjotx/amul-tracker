import { emailTemplateEngine, type TrackingRequest } from './email-template-engine';
import { sendEmail } from './send-email';

interface Event {
    Records: {
        body: string
    }[]
}


export const handler = async (event: Event) => {
    try {

        for (const record of event.Records) {
            const data = JSON.parse(record.body) as { trackingRequests: TrackingRequest[] };
            await handleProductInStock(data);
        }


        return { statusCode: 200, body: "Success" };
    } catch (error) {
        console.error("Error in cronjob", error);
        return { statusCode: 500, body: "Error in cronjob" };
    }
};




export async function handleProductInStock(data: { trackingRequests: TrackingRequest[] }) {
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
                await sendEmail(email.user.email, email.subject, email.html);
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

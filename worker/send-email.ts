import dotenv from 'dotenv'
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";


dotenv.config();


const sesClient = new SESClient();


export async function sendEmail(email: string, subject: string, html: string) {


    const params = {
        Source: process.env.RESEND_FROM_EMAIL ?? "tracker@inderjot.xyz", // verified sender
        Destination: {
            ToAddresses: [email], // in sandbox, must be verified
        },
        Message: {
            Subject: { Data: subject },
            Body: {
                Html: { Data: html }
            },
        },
        Headers: {
            'X-Mailer': 'Amul Tracker Notification System',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal',
            'X-Notification-Type': 'stock-alert',
            'X-Auto-Response-Suppress': 'All',
        }

    };

    try {
        const command = new SendEmailCommand(params);
        // @ts-ignore
        const response = await sesClient.send(command);
        // @ts-ignore
        console.log("Email sent! Message ID:", response.MessageId);
    }
    catch (error) {
        console.error("Error sending email:", error);
    }

}

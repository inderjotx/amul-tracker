import { Resend } from 'resend';
import dotenv from 'dotenv'

dotenv.config();

if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
}

if (!process.env.RESEND_FROM_EMAIL) {
    throw new Error('RESEND_FROM_EMAIL is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(email: string, subject: string, html: string, text?: string) {
    const emailData: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text?: string;
        headers?: Record<string, string>;
    } = {
        from: process.env.RESEND_FROM_EMAIL ?? "noreply@inderjot.xyz",
        to: [email],
        subject: subject,
        html: html,
        headers: {
            'X-Mailer': 'Amul Tracker Notification System',
            'X-Priority': '3',
            'X-MSMail-Priority': 'Normal',
            'Importance': 'Normal',
            'X-Notification-Type': 'stock-alert',
            'X-Auto-Response-Suppress': 'All',
        }
    };

    // Add text version if provided
    if (text) {
        emailData.text = text;
    }

    const { data, error } = await resend.emails.send(emailData);
    if (error) {
        console.error({ error });
    }
    console.log({ data });
}

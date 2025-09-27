import { emailTemplateEngine, type TrackingRequest } from './email-template-engine';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();
import { sendEmail } from './send-email';

// Test data
const mockTrackingRequests: TrackingRequest[] = [
    {
        _id: '1',
        userId: 'user1',
        productId: 'product1',
        substoreId: 'substore1',
        user: {
            _id: 'user1',
            name: 'John Doe',
            email: 'inderjotsingh141@gmail.com',
            pincode: '110001',
            substoreId: 'substore1',
            substoreName: 'Delhi Store',
            city: 'Delhi'
        },
        product: {
            _id: 'product1',
            alias: 'amul-kool-protein-milkshake-or-vanilla-180-ml-or-pack-of-30',
            external_product_id: 'ext123',
            sku: 'AMUL-PROT-1KG',
            name: 'Amul Protein Powder 1kg',
            description: 'High-quality protein powder for muscle building',
            image: 'https://shop.amul.com/images/protein-powder.jpg',
            usualPrice: 1299
        }
    },
];

async function testEmailTemplate() {
    try {
        console.log('Testing email template generation...');

        const emails = await emailTemplateEngine.processTrackingRequests(mockTrackingRequests);

        console.log(`Generated ${emails.length} emails`);

        for (const email of emails) {
            console.log(`\n--- Email for ${email.user.email} ---`);
            console.log(`Subject: ${email.subject}`);
            // await sendEmail(email.user.email, email.subject, email.html);
            console.log(`HTML length: ${email.html.length} characters`);
            fs.writeFileSync(`test-email-${email.user.email}.html`, email.html);
        }

        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testEmailTemplate().then(() => {
    console.log('Test completed successfully!');
}).catch((error) => {
    console.error('Test failed:', error);
});

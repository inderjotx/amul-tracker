import fs from 'fs';
import path from 'path';

export interface Product {
    _id: string;
    alias: string;
    external_product_id: string;
    sku: string;
    name: string;
    description?: string;
    image?: string;
    usualPrice: number;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    pincode?: string;
    substoreId?: string;
    substoreName?: string;
    city?: string;
}

export interface TrackingRequest {
    user: User;
    products: Product[];
}


export class EmailTemplateEngine {
    private templatePath: string;
    private template: string;

    constructor() {
        this.templatePath = path.join(process.cwd(), 'email-template', 'back-in-stock.html');
        this.template = '';
    }


    async renderTemplate(data: TrackingRequest): Promise<string> {
        try {
            if (this.template === '') {
                this.template = await fs.promises.readFile(this.templatePath, 'utf-8');
            }
            return this.processTemplate(this.template, data);
        } catch (error) {
            console.error('Error reading email template:', error);
            throw new Error('Failed to load email template');
        }
    }

    private processTemplate(template: string, data: TrackingRequest): string {
        let processedTemplate = template;

        // Replace simple variables
        processedTemplate = processedTemplate.replace(/\{\{userName\}\}/g, data.user.name);
        processedTemplate = processedTemplate.replace(/\{\{timestamp\}\}/g, new Date().toISOString());

        // Process products array
        if (data.products && data.products.length > 0) {
            const productsHtml = data.products.map(product => this.renderProductCard(product)).join('');
            processedTemplate = processedTemplate.replace(/\{\{#each products\}\}[\s\S]*?\{\{\/each\}\}/g, productsHtml);
        } else {
            // Show no products message
            processedTemplate = processedTemplate.replace(/\{\{#each products\}\}[\s\S]*?\{\{\/each\}\}/g,
                '<div class="no-products"><p>No products are currently back in stock.</p></div>');
        }

        // Remove conditional blocks for no products
        processedTemplate = processedTemplate.replace(/\{\{#unless products\.length\}\}[\s\S]*?\{\{\/unless\}\}/g, '');

        return processedTemplate;
    }

    /**
     * Renders a single product card
     */
    private renderProductCard(product: Product): string {
        //    /_next/image?url=%2Fproduct-images%2Famul-high-protein-blueberry-shake-200-ml-pack-of-8.png&w=640&q=75
        const imageHtml = product.image
            ? `<img src="${process.env.NEXT_PUBLIC_APP_URL}/_next/image?url=%2Fproduct-images%2F${product.alias}.png&w=640&q=75" alt="${product.name}" class="product-image" />`
            : `<div class="product-image" style="background-color: #e9ecef; display: flex; align-items: center; justify-content: center; color: #6c757d;">No Image Available</div>`;

        const descriptionHtml = product.description
            ? `<p class="product-description">${product.description}</p>`
            : '';

        return `
        <div class="product-card">
            ${imageHtml}
            <h2 class="product-name">${product.name}</h2>
            ${descriptionHtml}
            <div class="product-price">₹${product.usualPrice}</div>
            <p class="product-sku">SKU: ${product.sku}</p>
            <a href="https://shop.amul.com/en/product/${product.alias}" class="cta-button">
                View Product
            </a>
        </div>`;
    }

    async processTrackingRequests(trackingRequest: TrackingRequest): Promise<{ user: User, html: string, subject: string }> {

        const html = await this.renderTemplate(trackingRequest);

        // Generate a subject line that is clear and not spammy
        let subject: string;
        if (trackingRequest.products.length === 1) {
            subject = `Product Back in Stock: ${trackingRequest.products[0].name} is now available`;
        } else if (trackingRequest.products.length > 1) {
            subject = `Product Back in Stock: ${trackingRequest.products.length} products you track are now in stock`;
        } else {
            subject = `Product Back in Stock`;
        }


        return {
            user: trackingRequest.user,
            html,
            subject
        };



    }

}

export const emailTemplateEngine = new EmailTemplateEngine();

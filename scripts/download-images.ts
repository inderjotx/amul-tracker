import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { URL } from "url";
import data from "./data.json";
import { mongoService } from "@/services/mongo";
import { ObjectId } from "mongodb";

// Create the product-images directory if it doesn't exist
const productImagesDir = path.join(process.cwd(), "public", "product-images");
if (!fs.existsSync(productImagesDir)) {
    fs.mkdirSync(productImagesDir, { recursive: true });
}

// Function to download an image from URL
function downloadImage(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode} ${response.statusMessage}`));
                return;
            }

            const fileStream = fs.createWriteStream(filePath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve();
            });

            fileStream.on('error', (err) => {
                fs.unlink(filePath, () => { }); // Delete the file on error
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Function to get file extension from URL
function getFileExtension(url: string): string {
    try {
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const extension = path.extname(pathname);
        return extension || '.jpg'; // Default to .jpg if no extension found
    } catch {
        return '.jpg';
    }
}

async function downloadProductImages() {
    console.log("Starting to download product images...");

    const downloadedImages: Array<{
        productId: string;
        originalUrl: string;
        localPath: string;
        slug: string;
    }> = [];

    let successCount = 0;
    let errorCount = 0;

    for (const product of data.data) {
        try {
            // Skip if no images
            if (!product.images || product.images.length === 0) {
                console.log(`⚠️  No images found for product: ${product.name}`);
                continue;
            }

            const firstImage = product.images[0];
            if (!firstImage?.image) {
                console.log(`⚠️  No image URL found for product: ${product.name}`);
                continue;
            }

            // Create image URL
            const imageUrl = `${data.fileBaseUrl}${firstImage?.image}`;

            // Create slug from product name
            const slug = product.alias;

            // Get file extension
            const extension = getFileExtension(imageUrl);

            // Create local file path
            const fileName = `${slug}${extension}`;
            const localPath = path.join(productImagesDir, fileName);
            const publicPath = `/product-images/${fileName}`;

            console.log(`📥 Downloading image for: ${product.name}`);
            console.log(`   URL: ${imageUrl}`);
            console.log(`   Local path: ${publicPath}`);

            // Download the image
            await downloadImage(imageUrl, localPath);

            downloadedImages.push({
                productId: product._id,
                originalUrl: imageUrl,
                localPath: publicPath,
                slug: slug
            });

            successCount++;
            console.log(`✅ Downloaded: ${product.name}`);

        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to download image for ${product.name}:`, error);
        }
    }

    console.log(`\n📊 Download Summary:`);
    console.log(`   ✅ Successfully downloaded: ${successCount} images`);
    console.log(`   ❌ Failed downloads: ${errorCount} images`);
    console.log(`   📁 Images saved to: ${productImagesDir}`);

    return downloadedImages;
}

async function updateProductImageUrls(downloadedImages: Array<{
    productId: string;
    originalUrl: string;
    localPath: string;
    slug: string;
}>) {
    console.log("\n🔄 Updating product image URLs in database...");

    let updateCount = 0;
    let errorCount = 0;

    for (const imageData of downloadedImages) {
        try {
            // Update the product in MongoDB
            await mongoService.db.collection("products").updateOne(
                { _id: new ObjectId(imageData.productId) },
                { $set: { image: imageData.localPath } }
            );

            updateCount++;
            console.log(`✅ Updated image URL for product: ${imageData.slug}`);

        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to update product ${imageData.slug}:`, error);
        }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Successfully updated: ${updateCount} products`);
    console.log(`   ❌ Failed updates: ${errorCount} products`);
}

async function main() {
    try {
        // Download all product images
        const downloadedImages = await downloadProductImages();

        // Update database with new image URLs
        await updateProductImageUrls(downloadedImages);

        console.log("\n🎉 Image download and database update completed successfully!");

    } catch (error) {
        console.error("💥 Script failed:", error);
        process.exit(1);
    }
}

// Run the script
main()
    .then(() => {
        console.log("Script completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });

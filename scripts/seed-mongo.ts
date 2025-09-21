import dotenv from "dotenv";
dotenv.config();

import data from "./data.json";
import { mongoService } from "@/services/mongo";
import { ObjectId } from "mongodb";

async function seedProducts() {
    console.log("Starting to seed products...");

    try {
        // Clear existing products

        // Prepare products data
        const products = data.data.map((item) => ({
            alias: item.alias,
            _id: new ObjectId(item._id),
            sku: item.sku,
            name: item.name,
            description: item.metafields?.shot_description ?? item.metafields?.benefits ?? "",
            image: item.images?.[0]?.image ? `${data.fileBaseUrl}${item.images[0].image}` : "",
            usualPrice: item.price,
        }));

        await mongoService.seedProducts(products);


    } catch (error) {
        console.error("❌ Error seeding products:", error);
        process.exit(1);
    }
}

// Run the seed function
seedProducts()
    .then(() => {
        console.log("🎉 Seeding completed successfully!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Seeding failed:", error);
        process.exit(1);
    });

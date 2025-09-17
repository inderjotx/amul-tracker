import dotenv from "dotenv";
dotenv.config();

// import { drizzle } from "drizzle-orm/postgres-js";
import { drizzle } from "drizzle-orm/neon-http";
// import postgres from "postgres";
import * as schema from "@/server/db/schema";
import { product } from "@/server/db/schema";
import data from "./data.json";
import { neon } from "@neondatabase/serverless";
import { eq, isNotNull } from "drizzle-orm";

// Create database connection directly without env validation
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sql, schema: schema });


async function seedProducts() {
    console.log("Starting to seed products...");

    try {
        // Clear existing products
        console.log("Clearing existing products...");
        await db.delete(product).where(isNotNull(product.id));

        // Prepare products data
        const products = data.data.map((item) => ({
            alias: item.alias,
            id: item._id,
            sku: item.sku,
            name: item.name,
            description: item.metafields?.shot_description ?? item.metafields?.benefits ?? "",
            image: item.images?.[0]?.image ? `${data.fileBaseUrl}${item.images[0].image}` : null,
            usualPrice: item.price,
        }));

        console.log(`Inserting ${products.length} products...`);

        // Insert products in batches to avoid memory issues
        const batchSize = 100;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            await db.insert(product).values(batch);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}`);
        }

        console.log("✅ Successfully seeded all products!");

        // Verify the data
        const count = await db.select().from(product);
        console.log(`📊 Total products in database: ${count.length}`);

        // Close database connection

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

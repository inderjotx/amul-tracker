import "dotenv/config"
import { MongoClient, ServerApiVersion } from "mongodb";

export const client = new MongoClient(process.env.MONGODB_URL!, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

export const mongoDb = client.db(process.env.MONGODB_DB ?? "amul-tracker");
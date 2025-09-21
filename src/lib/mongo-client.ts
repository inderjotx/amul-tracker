import "dotenv/config"
import { MongoClient } from "mongodb";

export const client = new MongoClient(process.env.MONGODB_URI!);

export const mongoDb = client.db(process.env.MONGODB_DB ?? "amul-tracker");
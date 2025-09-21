import { mongoDb } from "../lib/mongo-client";
import { type Db, ObjectId } from "mongodb";
import { storeService, type StoreService } from "../services/store";

interface Product {
    _id: ObjectId;
    alias: string;
    sku: string;
    name: string;
    description: string;
    image: string;
    usualPrice: number;

}

interface Track {
    _id: ObjectId;
    userId: string;
    productId: string;
    substoreId: string;
}

interface User {
    _id: ObjectId;
    name: string;
    email: string;
    image: string | null;
    pincode: string | null;
    substoreId: string | null;
    substoreName: string | null;
    createdAt: Date;
    updatedAt: Date;
}




export class MongoService {

    private mongoDb: Db;
    private storeService: StoreService;
    constructor(db: Db, storeService: StoreService) {
        this.mongoDb = db;
        this.storeService = storeService;
        this.createIndexes().catch(console.error);
    }

    async createIndexes(): Promise<void> {
        await this.mongoDb.collection("tracks").createIndex({ "substoreId": 1, "productId": 1 });
    }

    async seedProducts(products: Product[]): Promise<void> {
        try {
            await this.mongoDb.collection("products").deleteMany({});
            await this.mongoDb.collection("products").insertMany(products);
        } catch (error) {
            console.error("Error seeding products:", error);
            throw new Error("Failed to seed products");
        }
    }


    async getProducts(limit: number, offset: number): Promise<Product[]> {
        try {
            const data = await this.mongoDb.collection("products").find({}).limit(limit).skip(offset).toArray();
            return data as Product[];
        } catch (error) {
            console.error("Error fetching products:", error);
            throw new Error("Failed to fetch products");
        }
    }

    async getTotalProducts(): Promise<number> {
        try {
            return await this.mongoDb.collection("products").countDocuments();
        } catch (error) {
            console.error("Error counting products:", error);
            throw new Error("Failed to count products");
        }
    }


    async getUserAllTrackedProducts(userId: string): Promise<Product[]> {
        try {
            const tracks = await this.mongoDb.collection("tracks").find({ userId }).toArray() as Track[];
            if (tracks.length === 0) {
                return [];
            }
            const productIds = tracks.map((track) => new ObjectId(track.productId));
            const products = await this.mongoDb.collection("products").find({ _id: { $in: productIds } }).toArray() as Product[];

            return products;
        } catch (error) {
            console.error("Error fetching tracked products:", error);
            throw new Error("Failed to fetch tracked products");
        }
    }



    async trackProduct(userId: string, productId: string, substoreId: string): Promise<string> {
        try {
            // Validate ObjectId format
            if (!ObjectId.isValid(productId)) {
                throw new Error("Invalid product ID format");
            }

            const existingTrack = await this.mongoDb.collection("tracks").findOne({
                userId: userId,
                productId: productId,
                substoreId: substoreId
            });

            if (existingTrack) {
                throw new Error("Product is already being tracked");
            }

            const track = await this.mongoDb.collection("tracks").insertOne({
                userId: userId,
                productId: productId,
                substoreId: substoreId
            })
            return track.insertedId.toString()
        } catch (error) {
            console.error("Error tracking product:", error);
            throw error;
        }
    }


    async untrackProduct(userId: string, productId: string): Promise<void> {
        try {
            // Validate ObjectId format
            if (!ObjectId.isValid(productId)) {
                throw new Error("Invalid product ID format");
            }

            const existingTrack = await this.mongoDb.collection("tracks").findOne({
                userId: userId,
                productId: productId
            });

            if (!existingTrack) {
                throw new Error("Track not found");
            }

            await this.mongoDb.collection("tracks").deleteOne({
                _id: existingTrack._id
            });
        } catch (error) {
            console.error("Error untracking product:", error);
            throw error;
        }
    }



    async setPincode(userId: string, pincode: string): Promise<void> {
        try {
            // Validate ObjectId format
            if (!ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID format");
            }


            const existingUser = await this.mongoDb.collection("users").findOne({ _id: new ObjectId(userId) });
            if (!existingUser) {
                throw new Error("User not found");
            }

            const storeResult = await this.storeService.getStoreId(pincode);
            if (!storeResult?.substoreId) {
                throw new Error("Unable to find stores for this pincode. Please try a different pincode.");
            }

            const { substoreId, substoreName } = storeResult;

            await this.mongoDb.collection("users").updateOne(
                { _id: new ObjectId(userId) },
                { $set: { pincode, substoreId, substoreName } }
            );
        } catch (error) {
            console.error("Error setting pincode:", error);
            throw error;
        }
    }


    async getTrackingRequests(substoreId: string, productId: string) {

        const trackingRequests = await this.mongoDb.collection("tracks").find({ substoreId, productId }).toArray() as Track[];

        const userIds = trackingRequests.map((track) => new ObjectId(track.userId));
        const productsIds = trackingRequests.map((track) => new ObjectId(track.productId));

        const [users, products] = await Promise.all([
            this.mongoDb.collection("users").find({ _id: { $in: userIds } }).toArray() as Promise<User[]>,
            this.mongoDb.collection("products").find({ _id: { $in: productsIds } }).toArray() as Promise<Product[]>
        ]);

        const trackingRequestsWithUsersAndProducts = trackingRequests.map((track) => ({
            ...track,
            user: users.find((user) => user._id.equals(track.userId)),
            product: products.find((product) => product._id.equals(track.productId))
        }));

        return trackingRequestsWithUsersAndProducts;
    }

    async getUserTrackingRequest(trackingRequestId: string) {

        const trackingRequest = await this.mongoDb.collection("tracks").findOne({ _id: new ObjectId(trackingRequestId) }) as Track
        if (!trackingRequest) {
            throw new Error("Tracking request not found");
        }

        const user = await this.mongoDb.collection("users").findOne({ _id: new ObjectId(trackingRequest.userId) })
        const product = await this.mongoDb.collection("products").findOne({ _id: new ObjectId(trackingRequest.productId) })

        return {
            ...trackingRequest,
            user,
            product
        }
    }
}

export const mongoService = new MongoService(mongoDb, storeService);
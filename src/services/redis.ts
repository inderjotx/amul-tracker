import { client, type RedisClient } from "@/utils/redis";
import type { ProductData } from "@/services/product";


export class RedisService {

    client: RedisClient
    constructor(client: RedisClient) {
        this.client = client
    }

    async getPrevProductData() {
        try {

            const data = await this.get("prev_product_data") ?? "{}"
            const parsedData = JSON.parse(data) as ProductData
            if (!parsedData) {
                return {}
            }
            return parsedData
        } catch (error) {
            console.error(error)
            return {}
        }
    }

    async setPrevProductData(data: ProductData) {
        await this.set("prev_product_data", JSON.stringify(data))
    }

    async set(key: string, value: string) {
        await this.client.set(key, value)
    }

    async get(key: string) {
        return await this.client.get(key)
    }
}

export const redisService = new RedisService(client)
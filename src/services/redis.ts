import { client, type RedisClient } from "../utils/redis";
import type { ProductData } from "./product";

type Pincode = string
type SubStoreName = string
type SubStoreId = string


type PincodeData = Record<Pincode, {
    subStoreName: SubStoreName
    subStoreId: SubStoreId
}>

type SubStoreData = Record<SubStoreName, SubStoreId>


export class RedisService {

    client: RedisClient
    prevDataKey = "prev_product_data"
    pincodeToSubStoreDataKey = "pincodeToSubStoreData"
    subStoreNameToSubStoreIdKey = "subStoreNameToSubStoreId"


    constructor(client: RedisClient) {
        this.client = client
    }

    async getPrevProductData() {
        try {

            const data = await this.get(this.prevDataKey) ?? "{}"
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


    async setPincodeData({ pincode, subStoreName, subStoreId }: { pincode: string, subStoreName: string, subStoreId: string }) {

        const data = await this.getPincodeData() ?? {}
        console.log("storing pincode data", data)

        data[pincode] = { subStoreName, subStoreId }
        await this.set(this.pincodeToSubStoreDataKey, JSON.stringify(data))

    }


    async setSubStoreData({ subStoreName, subStoreId }: { subStoreName: string, subStoreId: string }) {
        const data = await this.getSubStoreData() ?? {}
        console.log("storing sub store data", data)

        data[subStoreName] = subStoreId
        await this.set(this.subStoreNameToSubStoreIdKey, JSON.stringify(data))
    }



    async getPincodeData() {
        const data = await this.get(this.pincodeToSubStoreDataKey)
        if (!data) {
            return null
        }
        const parsedData = JSON.parse(data) as PincodeData
        return parsedData
    }


    async getSubStoreData() {
        const data = await this.get(this.subStoreNameToSubStoreIdKey)
        if (!data) {
            return null
        }
        const parsedData = JSON.parse(data) as SubStoreData
        return parsedData
    }


    async getPincodeToSubStoreData(pincode: string) {

        const data = await this.getPincodeData()
        if (!data) {
            return null
        }

        const subStoreData = data[pincode]
        if (!subStoreData) {
            return null
        }
        console.log("redis cache hit", subStoreData)
        return subStoreData
    }


    async getSubStoreToSubStoreId(name: string) {
        const data = await this.getSubStoreData()
        if (!data) {
            return null
        }
        const subStoreData = data[name]
        if (!subStoreData) {
            return null
        }
        console.log("redis cache hit", subStoreData)
        return subStoreData
    }





    async set(key: string, value: string) {
        await this.client.set(key, value)
    }

    async get(key: string) {
        return await this.client.get(key)
    }
}

export const redisService = new RedisService(client)
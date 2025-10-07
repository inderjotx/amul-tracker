import { client, type RedisClient } from "../utils/redis";
import type { ProductData } from "./product";

type Pincode = string
type SubStoreName = string
type SubStoreId = string


type PincodeData = Record<Pincode, {
    subStoreName: SubStoreName
    subStoreId: SubStoreId
}>

type SubStoreData = Record<SubStoreName, {
    subStoreId: SubStoreId
    cookies?: string
} | string>


type SubStoreDataObject = Record<SubStoreName, {
    subStoreId: SubStoreId
    cookies?: string
}>

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


    async setSubStoreData({ subStoreName, subStoreId, cookies }: { subStoreName: string, subStoreId: string, cookies: string }) {
        const data = await this.getSubStoreData() ?? {}
        console.log("storing sub store data", data)

        data[subStoreName] = {
            subStoreId,
            cookies: cookies,
        }

        await this.set(this.subStoreNameToSubStoreIdKey, JSON.stringify(data))
    }


    async setSubStoreCookies({ subStoreId, cookies }: { subStoreId: string, cookies: string }) {
        const data = await this.getSubStoreData() ?? {}

        Object.keys(data).forEach((key) => {
            if (data[key]?.subStoreId === subStoreId) {
                data[key].cookies = cookies
            }
        })

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

        const parsedData = await this.safeParseSubStoreData(data)
        return parsedData
    }


    async safeParseSubStoreData(data: string) {

        try {
            const parsedData = JSON.parse(data) as SubStoreData

            const keys = Object.keys(parsedData)

            if (typeof keys?.[0] === 'string') {
                const firstItem = parsedData[keys?.[0]]

                if (typeof firstItem === 'string') {
                    const subStoreDataObject: SubStoreDataObject = {}
                    keys.forEach((key) => {
                        subStoreDataObject[key] = {
                            subStoreId: parsedData[key] as SubStoreId,
                            cookies: ""
                        }
                    })
                    return subStoreDataObject
                }
                else {
                    if (typeof firstItem === 'object') {
                        return parsedData as SubStoreDataObject
                    }
                }
                return parsedData as SubStoreDataObject

            }

        } catch (error) {
            console.error(error)
            return {} as SubStoreDataObject
        }




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
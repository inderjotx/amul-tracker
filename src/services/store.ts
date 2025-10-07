import { type RedisService, redisService } from "./redis";


interface PincodeRecord {
    _id: string;
    pincode: string;
    substore: string;
    created_on: string;
    _created_by: string;
    _size: number;
    _updated_by: string;
    updated_on: string;
}

interface PincodeResponse {
    limit: number;
    start: number;
    records: PincodeRecord[];
    count: number;
    total: number;
}


interface InfoResponse {
    data: {
        substore_id: string
    }
}


export interface ProductResponse {
    data: Array<{
        _id: string,
        available: 1 | 0
    }>
}







export class StoreService {

    private cookie
    private tid
    private headers: Record<string, string>
    private MAX_RETRIES = 3
    private RETRY_DELAY = 1000

    constructor(private redisService: RedisService) {
        this.cookie = ''
        this.redisService = redisService

        this.tid = ''
        this.headers = {
            'Content-Type': 'application/json',
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-US,en;q=0.9',
            'base_url': 'https://shop.amul.com/en/browse/protein',
            'frontend': '1',
            'priority': 'u=1, i',
            'sec-ch-ua': '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
        }
    }

    getCookiesFromHeaders(headers: Headers) {
        // const allSetCookies = headers.raw()['set-cookie'] ?? []
        const allSetCookies = headers.getSetCookie()
        return allSetCookies.join('; ')
    }

    async makeCallJustToGetCookies() {
        const url = `https://shop.amul.com/en/browse/protein`
        const response = await fetch(url, {
            headers: {
                ...this.headers,
                ...(this.cookie.length > 0 ? { 'cookie': this.cookie } : {})
            }
        })
        const cookies = this.getCookiesFromHeaders(response.headers)
        this.cookie = cookies
    }


    async makeInfoCall() {

        try {
            const url = `https://shop.amul.com/user/info.js?_v=${Date.now()}`
            const response = await fetch(url, {
                headers: {
                    ...this.headers,
                    'cookie': this.cookie
                }
            })

            const data = await response.text() as unknown as string
            const cleanedData = data.replace(/^session\s*=\s*/, "");

            const info = JSON.parse(cleanedData) as InfoResponse


            if (typeof info.data.substore_id !== 'string' || info.data.substore_id.trim().length === 0) {
                throw new Error("Failed to get substore id from session info call ")
            }

            return info.data.substore_id

        } catch (error) {
            if (error instanceof Error) {
                throw new Error("Failed to get substore id from session info call ", error)
            } else {
                throw new Error("Failed to get substore id from session info call ", error as Error)
            }
        }
    }



    async getTid() {
        const storeId = '62fa94df8c13af2e242eba16'
        const timeStamp = Date.now()
        const randomNumber = Math.floor(Math.random() * 1e3)
        const prevTid = this.tid
        const digest = `${storeId}:${timeStamp}:${randomNumber}:${prevTid}`;
        const encoder = new TextEncoder()
        const encodedDigest = encoder.encode(digest)

        const hash = await crypto.subtle.digest("SHA-256", encodedDigest)
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");


        return `${timeStamp}:${randomNumber}:${hashHex}`;
    }




    async getStoreData() {
        const storeData = await this.redisService.getSubStoreData()
        return storeData
    }

    async getStoreName(pincode: string) {
        const tid = await this.getTid()
        const url = `https://shop.amul.com/entity/pincode?limit=50&filters[0][field]=pincode&filters[0][value]=${pincode}&filters[0][operator]=regex&cf_cache=1h`
        const response = await fetch(url, {
            headers: {
                ...this.headers,
                'tid': tid,
                'cookie': this.cookie
            }
        })
        const data = await response.json() as PincodeResponse

        const substoreName = data?.records?.[0]?.substore

        const setCookie = response.headers.get('set-cookie')
        this.cookie = setCookie ?? ''

        if (typeof substoreName === 'string') {
            return substoreName
        } else {
            throw new Error("Failed to get store name")
        }

    }


    async getStoreId(pincode: string) {
        try {

            const pincodeToSubStoreData = await this.redisService.getPincodeToSubStoreData(pincode)
            if (pincodeToSubStoreData) {
                return {
                    substoreId: pincodeToSubStoreData.subStoreId,
                    substoreName: pincodeToSubStoreData.subStoreName
                }
            }

            await this.makeCallJustToGetCookies()
            const substoreName = await this.getStoreName(pincode)

            const subStoreId = await this.redisService.getSubStoreToSubStoreId(substoreName)

            if (subStoreId) {
                await this.redisService.setPincodeData({ pincode: pincode, subStoreName: substoreName, subStoreId: subStoreId.subStoreId })
                return {
                    substoreId: subStoreId?.subStoreId,
                    substoreName: substoreName
                }
            }
            await this.setPreferences(substoreName ?? '')
            const substoreId = await this.makeInfoCall()

            await Promise.all([
                this.redisService.setSubStoreData({ subStoreName: substoreName, subStoreId: substoreId, cookies: this.cookie }),
                this.redisService.setPincodeData({ pincode: pincode, subStoreName: substoreName, subStoreId: substoreId })
            ])

            return {
                substoreId,
                substoreName,
            }

        } catch (error) {
            console.log("error", error)
        }
    }




    async setPreferences(name: string) {

        const tid = await this.getTid()
        const url = `https://shop.amul.com/entity/ms.settings/_/setPreferences`
        const body = {
            "data": {
                "store": name
            }
        }
        const response = await fetch(url, {
            method: 'PUT',
            referrer: 'https://shop.amul.com/',
            body: JSON.stringify(body),
            headers: {
                ...this.headers,
                'tid': tid,
                'cookie': this.cookie
            },
        });

        try {
            await response.text()
            if (!response.ok) {
                throw new Error("Failed to get preferences")
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error("Failed to set preferences", error)
            } else {
                throw new Error("Failed to set preferences", error as Error)
            }
        }
        const newCookie = this.getCookiesFromHeaders(response.headers)
        this.cookie = newCookie
    }


    async getProducts(substoreId: string, cookies: string) {
        let response = null
        const tid = await this.getTid()
        try {
            const url = `https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=24&total=1&start=0&cdc=1m&substore=${substoreId}`
            response = await fetch(url, {
                headers: {
                    'cookie': cookies,
                    ...this.headers,
                    'tid': tid
                }
            })

            this.tid = tid
            const data = await response.json() as ProductResponse
            const products = data.data.map((product) => ({
                _id: product._id,
                available: product.available === 1
            }))

            return {
                products,
                cookie: this.getCookiesFromHeaders(response.headers)
            }
        }
        catch (error) {
            if (response) {
                const newCookie = this.getCookiesFromHeaders(response.headers)
                return {
                    products: [],
                    cookie: newCookie
                }
            }
            throw new Error("Failed to get products ")
        }
    }

    async retryGetProducts(substoreId: string, cookies: string) {
        let retries = 0
        let errorMessage = null
        let cookie = cookies
        while (retries < this.MAX_RETRIES) {
            try {
                const { products, cookie: newCookie } = await this.getProducts(substoreId, cookie)
                if (products.length > 0) {
                    await this.redisService.setSubStoreCookies({ subStoreId: substoreId, cookies: newCookie })
                    return products
                } else {
                    cookie = newCookie
                    console.log("updated cookie ", substoreId)
                    retries++
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY))
                }
            } catch (error) {
                errorMessage = error
            }
        }

        return []
    }

}


export const storeService = new StoreService(redisService)
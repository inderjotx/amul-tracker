

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





export class StoreService {

    private cookie
    private tid
    private headers: Record<string, string>

    constructor() {
        this.cookie = ''

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



    private storeNametoSubStoreId: Record<string, string> = {}
    private pinCodeToSubStore: Record<string, {
        substoreId: string,
        substoreName: string
    }> = {}

    getStoreData() {
        return this.storeNametoSubStoreId
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

            if (this.pinCodeToSubStore[pincode]) {
                return {
                    substoreId: this.pinCodeToSubStore[pincode].substoreId,
                    substoreName: this.pinCodeToSubStore[pincode].substoreName
                }
            }

            await this.makeCallJustToGetCookies()
            const substoreName = await this.getStoreName(pincode)


            if (this.storeNametoSubStoreId[substoreName]) {
                return {
                    substoreId: this.storeNametoSubStoreId[substoreName],
                    substoreName: substoreName
                }
            }
            await this.setPreferences(substoreName ?? '')
            const substoreId = await this.makeInfoCall()

            this.storeNametoSubStoreId[substoreName] = substoreId
            this.pinCodeToSubStore[pincode] = {
                substoreId,
                substoreName,
            }

            return {
                substoreName: substoreName,
                substoreId,
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

}


export const storeService = new StoreService()
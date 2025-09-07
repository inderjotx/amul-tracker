

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

class StoreService {

    private storeNametoId: Record<string, string> = {
        "punjab": "66505ff3998183e1b1935d0e"
    }

    getStoreData() {
        return this.storeNametoId
    }

    async getStoreName(pincode: string) {
        const url = `https://shop.amul.com/entity/pincode?limit=50&filters[0][field]=pincode&filters[0][value]=${pincode}&filters[0][operator]=regex&cf_cache=1h`
        const response = await fetch(url)
        const data = await response.json() as PincodeResponse

        const substoreName = data?.records[0]?.substore

        const setCookie = response.headers.get('set-cookie')

        return {
            substoreName,
            setCookie
        }
    }


    async getStoreId(pincode: string) {
        const { substoreName, setCookie } = await this.getStoreName(pincode)
        const { isSuccess, cookie } = await this.getPreferences(substoreName ?? '', setCookie ?? '')
        const info = await this.getInfo(cookie ?? '')
        return {
            isSuccess,
            cookie,
            substoreName,
            info
        }
    }


    async getInfo(cookie: string) {

        const url = `https://shop.amul.com/user/info.js`
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Cookie': cookie ?? ''
            }
        })
        const data = await response.text() as unknown
        console.log("data is", data)
        return data

    }


    async getPreferences(name: string, cookie?: string) {

        const url = `https://shop.amul.com/entity/ms.settings/_/setPreferences`
        const body = {
            "data": {
                "store": name
            }
        }
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookie ?? '',
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
                'tid': '1757221676557:499:12523a1e80124e22d57c77ffdab2bfa911a1a905bba084aedced150fd8a20e53'
            },
            referrer: 'https://shop.amul.com/',
            body: JSON.stringify(body),
            mode: 'cors',
            credentials: 'include'
        });

        try {
            const data = await response.text() as unknown
            console.log("data is", data)
            if (!response.ok) {
                throw new Error("Failed to get preferences")
            }
        } catch (error) {
            console.log("error", error)
        }
        const isSuccess = response.ok
        const newCookie = response.headers.get('set-cookie')
        return {
            isSuccess,
            cookie: newCookie
        }
    }

}


export const storeService = new StoreService()
import { storeService } from "./store"
import { redisService, type RedisService } from "./redis"
import { notificationService, type NotificationService } from "./aws-sns"
import { type MongoService, mongoService } from "./mongo"

export type ProductData = Record<string, Array<{ _id: string, available: boolean }>>
type StoreService = typeof storeService
interface ProductResponse {
    data: Array<{
        _id: string,
        available: 1 | 0
    }>
}


class ProductService {



    constructor(private storeService: StoreService, private redisService: RedisService, private notificationService: NotificationService, private mongoService: MongoService) {
        this.storeService = storeService
        this.redisService = redisService
        this.notificationService = notificationService
        this.mongoService = mongoService
    }


    async cron() {
        const data = await this.getProductRecentlyComeInStock()
        await this.sendProductNotification(data)
        return
    }


    async singleTrackNotification(subStoreId: string, productId: string, trackingRequestId: string) {

        const previousData = await this.redisService.getPrevProductData()
        const subStoredIds = Object.keys(previousData ?? {})

        const isUserSubStoreIdInDatabase = subStoredIds.includes(subStoreId)

        if (!isUserSubStoreIdInDatabase) {
            // do nothing 
            return false
        }

        const productData = previousData?.[subStoreId]
        const product = productData?.find((p) => p._id === productId)
        if (!product) {
            // do nothing 
            return false
        }

        if (product.available) {
            const trackingRequest = await this.mongoService.getUserTrackingRequest(trackingRequestId)
            await this.notificationService.sendNotification({ trackingRequests: [trackingRequest] })
            return true
        }

        return false


    }



    async getProductRecentlyComeInStock() {

        const prevProductData = await this.redisService.getPrevProductData()
        const productData = await this.getAllSubStoreProducts()

        console.log("prevProductData", prevProductData)
        console.log("productData", productData)

        const productRecentlyComeInStock: ProductData = {}

        Object.entries(productData).forEach(([substoreId, products]) => {
            products.forEach((product) => {
                const previouslyAvailable = prevProductData?.[substoreId]?.find((p) => p._id === product._id)?.available === true
                const currentlyAvailable = product.available

                if (!previouslyAvailable && currentlyAvailable) {
                    productRecentlyComeInStock[substoreId] = productRecentlyComeInStock[substoreId] ?? []
                    productRecentlyComeInStock[substoreId].push(product)
                }

            })
        })


        if (
            Object.keys(productRecentlyComeInStock)
                .map((substoreId) => productRecentlyComeInStock[substoreId]?.length ?? 0)
                .reduce((a, b) => a + b, 0) > 0
        ) {
            await this.redisService.setPrevProductData(productData)
        }

        return productRecentlyComeInStock
    }


    async sendProductNotification(productData: ProductData) {

        const trackingRequests = await Promise.all(
            Object.entries(productData).flatMap(([substoreId, products]) =>
                products.map((product) =>
                    this.getTrackingRequests(substoreId, product._id)
                )
            )
        );
        console.log("trackingRequests", trackingRequests)
        return
    }


    async getTrackingRequests(subStoreId: string, productId: string) {

        const trackingRequests = await this.mongoService.getTrackingRequests(subStoreId, productId)

        if (trackingRequests.length > 0) {
            await this.notificationService.sendNotification({ trackingRequests })
            console.log("Tracking requests sent -----------")
        } else {
            console.log("No tracking requests -----------")
        }
        return trackingRequests;
    }



    async getAllSubStoreProducts() {
        const storeData = await this.storeService.getStoreData();
        const substoreIds = Object.values(storeData ?? {});
        const productsArray = await Promise.all(
            substoreIds.map(async (substoreId) => {
                const data = await this.getProducts(substoreId);
                return { substoreId, data };
            })
        );
        const result: Record<string, unknown> = {};
        for (const { substoreId, data } of productsArray) {
            result[substoreId] = data;
        }
        return result as ProductData;
    }



    async getProducts(substoreId: string) {
        try {
            const url = `https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&facets=true&facetgroup=default_category_facet&limit=24&total=1&start=0&cdc=1m&substore=${substoreId}`
            const response = await fetch(url)
            const data = await response.json() as ProductResponse

            const products = data.data.map((product) => ({
                _id: product._id,
                available: product.available === 1
            }))
            return products
        } catch (error) {
            console.error(error)
            return []
        }
    }

}


export const productService = new ProductService(storeService, redisService, notificationService, mongoService)
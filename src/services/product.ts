import { storeService } from "./store"
import { redisService, type RedisService } from "./redis"
import { notificationService, type NotificationService } from "./aws-sns"
import { type MongoService, mongoService, type TrackingRequest, type CombinedTrackingRequest, type User, type Product } from "./mongo"

export type ProductData = Record<string, Array<{ _id: string, available: boolean }>>
type StoreService = typeof storeService



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

        console.log("productData previous", productData)
        const product = productData?.find((p) => p._id === productId)
        console.log("product", product)
        if (!product) {
            // do nothing 
            return false
        }

        console.log("product.available", product.available)
        if (product.available) {
            const trackingRequest = await this.mongoService.getUserTrackingRequest(trackingRequestId)
            await this.notificationService.sendNotification({
                trackingRequests: {
                    user: trackingRequest.user! as User,
                    products: [trackingRequest.product!] as Product[]
                }
            })
            return true
        }

        return false


    }



    async getProductRecentlyComeInStock() {

        const prevProductData = await this.redisService.getPrevProductData()
        console.log("prevProductData")
        this.printSubStoreData(prevProductData)

        const productData = await this.getAllSubStoreProducts()
        console.log("latest product data")
        this.printSubStoreData(productData)

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

        await this.setPrevProductData(productData, prevProductData)

        return productRecentlyComeInStock
    }


    async setPrevProductData(productData: ProductData, prevProductData: ProductData) {

        const newPrevProductData: ProductData = prevProductData

        Object.entries(productData).forEach(([substoreId, products]) => {
            if (products.length > 0) {
                newPrevProductData[substoreId] = products
            }
        })

        await this.redisService.setPrevProductData(newPrevProductData)
    }


    async sendProductNotification(productData: ProductData) {

        console.log("product recently come in stock", JSON.stringify(productData, null, 2))

        const trackingRequests = await Promise.all(
            Object.entries(productData).flatMap(([substoreId, products]) =>
                products.map((product) =>
                    this.getTrackingRequests(substoreId, product._id)
                )
            )
        );
        console.log("trackingRequests", JSON.stringify(trackingRequests, null, 2))
        const allTrackingRequests = trackingRequests.flat()
        console.log("allTrackingRequests", JSON.stringify(allTrackingRequests, null, 2))
        const combinedTrackingRequests = await this.combineTrackingRequestForUser(allTrackingRequests)
        console.log("combinedTrackingRequests", JSON.stringify(combinedTrackingRequests, null, 2))
        await this.sendNotificationForEachUser(combinedTrackingRequests)
        return
    }

    async sendNotificationUser(combinedTrackingRequests: CombinedTrackingRequest) {
        await this.notificationService.sendNotification({ trackingRequests: combinedTrackingRequests })
    }

    async sendNotificationForEachUser(combinedTrackingRequests: CombinedTrackingRequest[]) {
        await Promise.all(
            combinedTrackingRequests.map((combinedTrackingRequest) =>
                this.sendNotificationUser(combinedTrackingRequest)
            )
        );
    }

    async getTrackingRequests(subStoreId: string, productId: string) {

        const trackingRequests = await this.mongoService.getTrackingRequests(subStoreId, productId)
        return trackingRequests;
    }


    async combineTrackingRequestForUser(trackingRequests: TrackingRequest[]): Promise<CombinedTrackingRequest[]> {

        const userToProducts = new Map<string, TrackingRequest[]>()


        trackingRequests.forEach((trackingRequest) => {
            if (userToProducts.has(trackingRequest.userId)) {
                userToProducts.get(trackingRequest.userId)?.push(trackingRequest)
            } else {
                userToProducts.set(trackingRequest.userId, [trackingRequest])
            }
        })

        const combinedTrackingRequests: CombinedTrackingRequest[] = []

        userToProducts.forEach((products) => {

            if (products?.[0]?.user) {
                combinedTrackingRequests.push({
                    user: products[0].user,
                    products: products.map((product) => product.product!).filter(Boolean)
                })
            }
        })

        return combinedTrackingRequests

    }


    async getAllSubStoreProducts() {
        const storeData = await this.storeService.getStoreData();
        const substoreIds = Object.values(storeData ?? {});
        const productsArray = await Promise.all(
            substoreIds.map(async (substore) => {
                const data = await this.storeService.retryGetProducts(substore.subStoreId, substore?.cookies ?? '');
                return { substoreId: substore.subStoreId, data };
            })
        );
        const result: Record<string, unknown> = {};
        for (const { substoreId, data } of productsArray) {
            result[substoreId] = data;
        }

        return result as ProductData;
    }


    printSubStoreData(subStoreData: ProductData) {
        console.log("Number of substores", Object.keys(subStoreData).length)
        for (const substoreId of Object.keys(subStoreData)) {
            console.log("products in substore ", substoreId, subStoreData?.[substoreId]?.length)
        }
    }




}


export const productService = new ProductService(storeService, redisService, notificationService, mongoService)
import { productService } from "@/services/product"


while (true) {
    console.log("Running cron")
    await productService.cron()
    // 60 seconds wait
    console.log("Waiting for 60 seconds")
    await new Promise(resolve => setTimeout(resolve, 60000))
}

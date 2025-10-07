import { productService } from "@/services/product"


// while (true) {
// console.log("Running cron")
// for (let i = 0; i < 10; i++) {
//     console.log("Running ", i)
//     await productService.getAllSubStoreProducts()
// }
// 60 seconds wait
// console.log("Waiting for 60 seconds")
// await new Promise(resolve => setTimeout(resolve, 60000))
// }

await productService.cron()
// import { storeService } from "@/services/store"
import { productService } from "@/services/product"


// storeService.getProducts("66505ff3998183e1b1935d0e").then(console.log).catch(console.error)
productService.getProductRecentlyComeInStock().then(console.log).catch(console.error)

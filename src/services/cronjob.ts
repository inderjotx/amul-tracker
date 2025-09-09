import { productService } from "./product";

productService.cron().catch((error) => {
    console.error("Error in cronjob", error);
});

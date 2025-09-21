
import 'tsconfig-paths/register';
import { productService } from "./product";


export const handler = async () => {
    try {
        await productService.cron();
        return { statusCode: 200, body: "Job done" };
    } catch (error) {
        console.error("Error in cronjob", error);
        return { statusCode: 500, body: "Error in cronjob" };
    }
};



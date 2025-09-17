
import dotenv from "dotenv";
dotenv.config();

import { handler } from "./handler";

handler().then(() => {
    console.log("Cronjob completed");
    process.exit(0);
}).catch((error) => {
    console.error("Error in cronjob", error);
});
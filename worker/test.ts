import { handler } from "./handler";

const data = {
    "Records": [
        {
            "body": "{\n                \"trackingRequests\": [\n                    {\n                        \"id\": \"28c6515a-6f8c-46d9-b8f6-dcd48efb6c09\",\n                        \"userId\": \"3WvOqg6XQNCvPT4GAhxThEcekvgiXn9m\",\n                        \"productId\": \"6707b9eaec74db003270ba80\",\n                        \"substoreId\": \"66505ff3998183e1b1935d0e\",\n                        \"user\": {\n                            \"id\": \"3WvOqg6XQNCvPT4GAhxThEcekvgiXn9m\",\n                            \"name\": \"Inderjot Singh\",\n                            \"email\": \"inderjotsingh141@gmail.com\",\n                            \"emailVerified\": true,\n                            \"image\": \"https://lh3.googleusercontent.com/a/ACg8ocJMwEgteYy7NZfknkn2oLIGuih_R6BpwFJf_gwYBd9d-BXmBg=s96-c\",\n                            \"createdAt\": \"2025-09-17T04:26:31.558Z\",\n                            \"pincode\": \"144002\",\n                            \"substoreId\": \"66505ff3998183e1b1935d0e\",\n                            \"substoreName\": \"punjab\",\n                            \"city\": null,\n                            \"address\": {},\n                            \"updatedAt\": \"2025-09-17T04:26:31.558Z\"\n                        },\n                        \"product\": {\n                            \"id\": \"6707b9eaec74db003270ba80\",\n                            \"alias\": \"amul-kool-protein-milkshake-or-arabica-coffee-180-ml-or-pack-of-30\",\n                            \"sku\": \"DBDCP43_30\",\n                            \"name\": \"Amul Kool Protein Milkshake | Arabica Coffee, 180 mL | Pack of 30\",\n                            \"description\": \"Amul Kool Protein Arabica Coffee Milkshake with 10 g of milk protein\",\n                            \"image\": \"https://shop.amul.com/s/62fa94df8c13af2e242eba16/6707ba5cee5d0400352b44a5/01-hero-image-multipack_protein-milkshake-coffee.png\",\n                            \"usualPrice\": 1200\n                        }\n                    }\n                ]\n            }"
        }
    ]
}

handler(data).then(() => {
    console.log("Cronjob completed");
    process.exit(0);
}).catch((error) => {
    console.error("Error in cronjob", error);
});
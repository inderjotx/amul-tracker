# Scripts

This directory contains utility scripts for the Amul Tracker application.

## Available Scripts

### Database Scripts

#### `seed-mongo.ts`

Seeds the MongoDB database with product data from the JSON file.

```bash
pnpm run db:seed
```

#### `download-images.ts`

Downloads product images from the Amul API and updates the database with local image paths.

```bash
pnpm run db:download-images
```

**What this script does:**

1. Reads product data from `data.json`
2. For each product, downloads the first image from the `fileBaseUrl + images[0].image` URL
3. Saves images to `public/product-images/` directory
4. Names each image file using a slug created from the product name
5. Updates the product record in MongoDB with the new local image path (`/product-images/slug.ext`)

**Features:**

- Creates product slugs from product names (removes special characters, converts to lowercase, replaces spaces with hyphens)
- Handles different image file extensions (jpg, png, etc.)
- Provides detailed logging of download progress
- Error handling for failed downloads
- Summary statistics at the end

**Example output:**

```
📥 Downloading image for: Amul Kool Protein Milkshake | Vanilla, 180 mL | Pack of 8
   URL: https://shop.amul.com/s/62fa94df8c13af2e242eba16/685cd6ff0b6d723bb83fa8fd/01-hero-image-multipack-amul-kool-protein-vanilla-180ml.png
   Local path: /product-images/amul-kool-protein-milkshake-or-vanilla-180-ml-or-pack-of-8.png
✅ Downloaded: Amul Kool Protein Milkshake | Vanilla, 180 mL | Pack of 8
```

## Prerequisites

- MongoDB connection configured in environment variables
- `data.json` file with product data
- Internet connection for downloading images

## Environment Variables

Make sure these are set in your `.env` file:

- `MONGODB_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name

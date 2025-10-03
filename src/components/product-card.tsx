"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Heart, HeartOff, Loader2 } from "lucide-react";
import { type ObjectId } from "mongodb";
import { unstable_ViewTransition as ViewTransition } from "react";

interface Product {
  _id: ObjectId;
  alias: string;
  sku: string;
  name: string;
  description: string;
  image: string;
  usualPrice: number;
}

interface ProductCardProps {
  product: Product;
  isTracked: boolean;
  isTracking: boolean;
  isUntracking: boolean;
  isAnyProcessing: boolean;
  onTrack: (productId: string) => void;
  onUntrack: (productId: string) => void;
  onBuy: (alias: string) => void;
}

const AMUL_SHOP_BASE_URL = "https://shop.amul.com/en/product/";

export function ProductCard({
  product,
  isTracked,
  isTracking,
  isUntracking,
  isAnyProcessing,
  onTrack,
  onUntrack,
  onBuy,
}: ProductCardProps) {
  const isProcessing = isTracking || isUntracking;
  const isDisabled = isAnyProcessing;

  const handleBuy = () => {
    const buyUrl = `${AMUL_SHOP_BASE_URL}${product.alias}`;
    window.open(buyUrl, "_blank");
  };

  return (
    <ViewTransition name={`${product.alias}`}>
      <Card
        key={`${product._id.toString()}-${product.name}`}
        className="flex flex-col justify-between overflow-hidden pt-0 pb-2 transition-shadow hover:shadow-lg"
      >
        <CardHeader className="p-0">
          {product.image && (
            <div className="aspect-square overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                width={200}
                height={200}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-2 pt-0">
            <CardTitle className="mb-1 line-clamp-2 text-sm font-semibold">
              {product.name}
            </CardTitle>
            <div
              className="line-clamp-2 text-xs text-gray-600"
              dangerouslySetInnerHTML={{
                __html:
                  product.description?.replace(
                    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                    "",
                  ) ?? "",
              }}
            />
          </div>
        </CardHeader>

        <CardContent className="p-2 pt-0">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="text-lg font-bold text-green-600">
              ₹{product.usualPrice}
            </span>

            <div className="flex items-center justify-between gap-1 md:justify-start md:gap-2">
              {isTracked ? (
                <Button
                  onClick={() => onUntrack(product._id.toString())}
                  variant="outline"
                  className="border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 md:px-3 md:py-2 md:text-sm"
                  disabled={isDisabled}
                >
                  {isUntracking ? (
                    <Loader2 className="mr-0.5 h-3 w-3 animate-spin md:mr-1 md:h-4 md:w-4" />
                  ) : (
                    <HeartOff className="mr-0.5 h-3 w-3 md:mr-1 md:h-4 md:w-4" />
                  )}
                  <span className="text-xs md:text-sm">
                    {isUntracking ? "Untracking..." : "Untrack"}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={() => onTrack(product._id.toString())}
                  variant="default"
                  className="px-2 py-1 text-xs shadow-xl shadow-teal-200 md:px-3 md:py-2 md:text-sm"
                  disabled={isDisabled}
                >
                  {isTracking ? (
                    <Loader2 className="mr-0.5 h-3 w-3 animate-spin md:mr-1 md:h-4 md:w-4" />
                  ) : (
                    <Heart className="mr-0.5 h-3 w-3 md:mr-1 md:h-4 md:w-4" />
                  )}
                  <span className="text-xs md:text-sm">
                    {isTracking ? "Tracking..." : "Track"}
                  </span>
                </Button>
              )}
              <Button
                onClick={handleBuy}
                variant="outline"
                className="border-blue-200 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 md:px-3 md:py-2 md:text-sm"
                disabled={isDisabled}
              >
                <ExternalLink className="mr-0.5 h-3 w-3 md:mr-1 md:h-4 md:w-4" />
                <span className="text-xs md:text-sm">Buy</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </ViewTransition>
  );
}

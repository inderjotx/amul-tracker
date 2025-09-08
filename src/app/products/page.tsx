"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Heart, HeartOff, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/auth/client";
import SignInDialog from "@/components/sign-in";
import { Pagination } from "@/components/ui/pagination";

const AMUL_SHOP_BASE_URL = "https://shop.amul.com/en/product/";

type FilterType = "all" | "tracked" | "untracked";

function ProductsContent() {
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 30;
  const [optimisticTracked, setOptimisticTracked] = useState<Set<string>>(
    new Set(),
  );
  const [processingProducts, setProcessingProducts] = useState<Set<string>>(
    new Set(),
  );
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch products with pagination
  const { data: productsData, isLoading: productsLoading } =
    api.products.getAll.useQuery({
      limit: productsPerPage,
      offset: (currentPage - 1) * productsPerPage,
    });

  // Fetch tracked products to check which ones are already tracked
  const { data: trackedProducts, refetch: refetchTracked } =
    api.products.getTracked.useQuery();

  // Track mutation
  const trackMutation = api.products.track.useMutation({
    onSuccess: () => {
      toast.success("Product added to tracking!");
      // Refetch tracked products data
      void refetchTracked();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Untrack mutation
  const untrackMutation = api.products.untrack.useMutation({
    onSuccess: () => {
      toast.success("Product removed from tracking!");
      // Refetch tracked products data
      void refetchTracked();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Check if a product is tracked (including optimistic updates)
  const isProductTracked = (productId: string) => {
    // Check optimistic state first
    if (optimisticTracked.has(productId)) {
      return true;
    }
    // Then check actual tracked products
    return (
      trackedProducts?.some((tracked) => tracked.id === productId) ?? false
    );
  };

  // Get track ID for a product
  const getTrackId = (productId: string) => {
    return (
      trackedProducts?.find((tracked) => tracked.id === productId)?.trackId ??
      null
    );
  };

  const handleBuy = (alias: string) => {
    const buyUrl = `${AMUL_SHOP_BASE_URL}${alias}`;
    window.open(buyUrl, "_blank");
  };

  const handleTrack = (productId: string) => {
    if (processingProducts.has(productId)) return;

    // Set processing state
    setProcessingProducts((prev) => new Set(prev).add(productId));
    // Optimistic update
    setOptimisticTracked((prev) => new Set(prev).add(productId));

    trackMutation.mutate(
      {
        productId,
        substoreId: "default-store",
      },
      {
        onSettled: () => {
          // Remove from processing state
          setProcessingProducts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        },
      },
    );
  };

  const handleUntrack = (trackId: string) => {
    // Find the product ID for optimistic update
    const productId = trackedProducts?.find(
      (tracked) => tracked.trackId === trackId,
    )?.id;
    if (!productId || processingProducts.has(productId)) return;

    // Set processing state
    setProcessingProducts((prev) => new Set(prev).add(productId));
    // Optimistic update
    setOptimisticTracked((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });

    untrackMutation.mutate(
      { trackId },
      {
        onSettled: () => {
          // Remove from processing state
          setProcessingProducts((prev) => {
            const newSet = new Set(prev);
            newSet.delete(productId);
            return newSet;
          });
        },
      },
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync optimistic state with actual tracked products
  useEffect(() => {
    if (trackedProducts) {
      const actualTrackedIds = new Set(
        trackedProducts.map((tracked) => tracked.id),
      );
      setOptimisticTracked(actualTrackedIds);
    }
  }, [trackedProducts]);

  // Filter products based on tracking status
  const allProducts = productsData?.products ?? [];
  const filteredProducts = allProducts.filter((product) => {
    const isTracked = isProductTracked(product.id);
    switch (filter) {
      case "tracked":
        return isTracked;
      case "untracked":
        return !isTracked;
      case "all":
      default:
        return true;
    }
  });

  const products = filteredProducts;

  // Calculate counts for each filter
  const trackedCount = allProducts.filter((product) =>
    isProductTracked(product.id),
  ).length;
  const untrackedCount = allProducts.length - trackedCount;

  const totalPages = Math.ceil(
    (productsData?.totalCount ?? 0) / productsPerPage,
  );
  const hasNextPage = productsData?.hasMore ?? false;
  const hasPreviousPage = currentPage > 1;

  if (productsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">
              Amul Products
            </h1>
            <p className="text-gray-600">
              Discover and track your favorite Amul products
            </p>
            {productsData && (
              <div className="mt-2 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
                <span>
                  Showing {products.length} of {allProducts.length} products
                  {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                </span>
                {filter !== "all" && (
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {filter === "tracked" ? "Tracked" : "Untracked"} only
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Filter Buttons */}
            <div className="flex rounded-lg border border-gray-200 p-1">
              <Button
                variant={filter === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("all")}
                className="h-8 px-2 text-xs sm:px-3 sm:text-sm"
              >
                <span className="hidden sm:inline">All</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1">({allProducts.length})</span>
              </Button>
              <Button
                variant={filter === "tracked" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("tracked")}
                className="h-8 px-2 text-xs sm:px-3 sm:text-sm"
              >
                <span className="hidden sm:inline">Tracked</span>
                <span className="sm:hidden">T</span>
                <span className="ml-1">({trackedCount})</span>
              </Button>
              <Button
                variant={filter === "untracked" ? "default" : "ghost"}
                size="sm"
                onClick={() => setFilter("untracked")}
                className="h-8 px-2 text-xs sm:px-3 sm:text-sm"
              >
                <span className="hidden sm:inline">Untracked</span>
                <span className="sm:hidden">U</span>
                <span className="ml-1">({untrackedCount})</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products?.map((product) => {
          const isTracked = isProductTracked(product.id);
          const trackId = getTrackId(product.id);
          const isProcessing = processingProducts.has(product.id);

          return (
            <Card
              key={product.id}
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
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">
                    ₹{product.usualPrice}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleBuy(product.alias)}
                      className="bg-blue-600 text-white hover:bg-blue-700"
                      disabled={isProcessing}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Buy
                    </Button>
                    {isTracked ? (
                      <Button
                        onClick={() => trackId && handleUntrack(trackId)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50"
                        disabled={isProcessing}
                      >
                        <HeartOff className="mr-1 h-3 w-3" />
                        {isProcessing ? "..." : "Untrack"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleTrack(product.id)}
                        variant="outline"
                        className="border-pink-200 text-pink-600 hover:bg-pink-50"
                        disabled={isProcessing}
                      >
                        <Heart className="mr-1 h-3 w-3" />
                        {isProcessing ? "..." : "Track"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {products?.length === 0 && (
        <div className="py-12 text-center">
          {filter === "all" ? (
            <p className="text-lg text-gray-500">
              No products available at the moment.
            </p>
          ) : (
            <div>
              <p className="text-lg text-gray-500">
                No {filter} products found.
              </p>
              <Button
                onClick={() => setFilter("all")}
                variant="outline"
                className="mt-4"
              >
                Show All Products
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {products?.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          hasNextPage={hasNextPage}
          hasPreviousPage={hasPreviousPage}
        />
      )}
    </div>
  );
}

export default function ProductsPage() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Sign In Required
          </h1>
          <p className="mb-6 text-gray-600">
            Please sign in to view and track Amul products.
          </p>
          <SignInDialog
            triggerText="Sign In"
            triggerVariant="default"
            triggerClassName="w-full"
          />
        </div>
      </div>
    );
  }

  return <ProductsContent />;
}

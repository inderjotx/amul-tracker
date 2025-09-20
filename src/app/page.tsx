"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Heart, HeartOff, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { useSignIn } from "@/contexts/signin-context";
import { usePincode } from "@/contexts/pincode-context";

const AMUL_SHOP_BASE_URL = "https://shop.amul.com/en/product/";

type FilterType = "all" | "tracked" | "untracked";

function ProductsContent() {
  const { data: session } = api.products.getUserSession.useQuery();
  const { openSignIn } = useSignIn();
  const { openPincode } = usePincode();
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 30;
  const [processingProducts, setProcessingProducts] = useState<Set<string>>(
    new Set(),
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch products with pagination
  const { data: productsData, isLoading: productsLoading } =
    api.products.getAll.useQuery({
      limit: productsPerPage,
      offset: (currentPage - 1) * productsPerPage,
    });

  const isLoggedIn =
    typeof session?.user?.email === "string" && session?.user?.email.length > 0;

  const { data: trackedProducts, refetch: refetchTracked } =
    api.products.getTracked.useQuery(undefined, {
      enabled: isLoggedIn,
    });

  const trackMutation = api.products.track.useMutation({
    onSuccess: () => {
      toast.success(
        "Product tracking started!. Once this product is in stock, you will receive a notification. Make sure to check Promotions and Spam inboxes as well ",
        {
          duration: 10000,
        },
      );
      void refetchTracked();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

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

  // Check if a product is tracked
  const isProductTracked = (productId: string) => {
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
    if (!isLoggedIn) {
      openSignIn();
      return;
    }
    if (processingProducts.has(productId)) return;

    if (!session?.user?.substoreId) {
      openPincode();
      return;
    }

    setProcessingProducts((prev) => new Set(prev).add(productId));

    trackMutation.mutate(
      {
        productId,
      },
      {
        onSettled: () => {
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
    if (!isLoggedIn) {
      openSignIn();
      return;
    }

    if (!session?.user?.substoreId) {
      openPincode();
      return;
    }

    const productId = trackedProducts?.find(
      (tracked) => tracked.trackId === trackId,
    )?.id;
    if (!productId || processingProducts.has(productId)) return;

    setProcessingProducts((prev) => new Set(prev).add(productId));

    untrackMutation.mutate(
      { trackId },
      {
        onSettled: () => {
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter products based on tracking status and search query
  const allProducts = productsData?.products ?? [];
  const filteredProducts = allProducts.filter((product) => {
    const isTracked = isProductTracked(product.id);

    // Apply search filter
    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Apply tracking filter
    let matchesTracking = true;
    switch (filter) {
      case "tracked":
        matchesTracking = isTracked;
        break;
      case "untracked":
        matchesTracking = !isTracked;
        break;
      case "all":
      default:
        matchesTracking = true;
        break;
    }

    return matchesSearch && matchesTracking;
  });

  const products = filteredProducts;

  // Calculate counts for each filter (considering search results)
  const searchFilteredProducts = allProducts.filter((product) => {
    return (
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const trackedCount = searchFilteredProducts.filter((product) =>
    isProductTracked(product.id),
  ).length;
  const untrackedCount = searchFilteredProducts.length - trackedCount;

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
            {isLoggedIn && session?.user && (
              <div className="mt-3 flex flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:items-center sm:gap-4">
                {session.user.pincode && (
                  <>
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 uppercase">
                      Pincode: {session.user.pincode}
                    </span>
                  </>
                )}
                {session.user.substoreName && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 uppercase">
                    Store: {session.user.substoreName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-2">
            {/* Search Input */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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
                <span className="ml-1">({searchFilteredProducts.length})</span>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                        variant="default"
                        className="shadow-xl shadow-teal-200"
                        disabled={isProcessing}
                      >
                        <Heart className="mr-1 h-3 w-3" />
                        {isProcessing ? "..." : "Track"}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleBuy(product.alias)}
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      disabled={isProcessing}
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      Buy
                    </Button>
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
  return <ProductsContent />;
}

"use client";

import { useState, useTransition, useEffect } from "react";
import { ProductsContentSkeleton } from "@/components/product-page-skeleton";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import { useSignIn } from "@/contexts/signin-context";
import { usePincode } from "@/contexts/pincode-context";
import { ProductCard } from "@/components/product-card";

const AMUL_SHOP_BASE_URL = "https://shop.amul.com/en/product/";

type FilterType = "all" | "tracked" | "untracked";

function ProductsContent() {
  const { data: session } = api.products.getUserSession.useQuery();

  const { openSignIn } = useSignIn();
  const { openPincode } = usePincode();
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 30;
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();
  const [deBouncedSearchQuery, setDeBouncedSearchQuery] = useState("");
  const [processingProductId, setProcessingProductId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    startTransition(() => {
      setDeBouncedSearchQuery(searchQuery);
    });
  }, [searchQuery]);

  const updateFilter = (filter: FilterType) => {
    startTransition(() => {
      setFilter(filter);
    });
  };

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
    onMutate: (variables) => {
      setProcessingProductId(variables.productId);
      toast.loading("Starting product tracking...", {
        id: "track-product",
      });
    },
    onSuccess: () => {
      setProcessingProductId(null);
      toast.dismiss("track-product");
      toast.success(
        "Tracking started! You'll get a notification when this product is in stock.",
        {
          duration: 10000,
        },
      );
      void refetchTracked();
    },
    onError: (error) => {
      setProcessingProductId(null);
      toast.dismiss("track-product");
      toast.error(`Error: ${error.message}`);
    },
  });

  const untrackMutation = api.products.untrack.useMutation({
    onMutate: (variables) => {
      setProcessingProductId(variables.productId);
      toast.loading("Removing product from tracking...", {
        id: "untrack-product",
      });
    },
    onSuccess: () => {
      setProcessingProductId(null);
      toast.dismiss("untrack-product");
      toast.success("Product removed from tracking!");
      // Refetch tracked products data
      void refetchTracked();
    },
    onError: (error) => {
      setProcessingProductId(null);
      toast.dismiss("untrack-product");
      toast.error(`Error: ${error.message}`);
    },
  });

  // Check if a product is tracked
  const isProductTracked = (productId: string) => {
    return (
      trackedProducts?.some(
        (tracked) => tracked._id.toString() === productId,
      ) ?? false
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

    if (!session?.user?.substoreId) {
      openPincode();
      return;
    }

    trackMutation.mutate(
      {
        productId,
      },
      {},
    );
  };

  const handleUntrack = (productId: string) => {
    if (!isLoggedIn) {
      openSignIn();
      return;
    }

    if (!session?.user?.substoreId) {
      openPincode();
      return;
    }

    untrackMutation.mutate({ productId });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter products based on tracking status and search query
  const allProducts = productsData?.products ?? [];
  const filteredProducts = allProducts.filter((product) => {
    const isTracked = isProductTracked(product._id.toString());

    // Apply search filter
    const matchesSearch =
      deBouncedSearchQuery === "" ||
      product.name.toLowerCase().includes(deBouncedSearchQuery.toLowerCase()) ||
      product.description
        ?.toLowerCase()
        .includes(deBouncedSearchQuery.toLowerCase());

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
    isProductTracked(product._id.toString()),
  ).length;
  const untrackedCount = searchFilteredProducts.length - trackedCount;

  const totalPages = Math.ceil(
    (productsData?.totalCount ?? 0) / productsPerPage,
  );
  const hasNextPage = productsData?.hasMore ?? false;
  const hasPreviousPage = currentPage > 1;

  if (productsLoading) {
    return <ProductsContentSkeleton />;
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Products</h1>
            {isLoggedIn && session?.user && (
              <div className="mt-3 flex flex-row items-center justify-between gap-1 text-sm text-gray-500 sm:gap-4 md:justify-start">
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:min-w-sm"
              />
            </div>

            {/* Quick Filter Tabs */}
            <Tabs
              value={filter}
              onValueChange={(value) => updateFilter(value as FilterType)}
              className="w-full"
            >
              <TabsList className="w-full">
                <TabsTrigger value="all">
                  <span className="">All</span>
                  <span className="ml-1">
                    ({searchFilteredProducts.length})
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tracked">
                  <span className="">Tracked</span>
                  <span className="ml-1">({trackedCount})</span>
                </TabsTrigger>
                <TabsTrigger value="untracked">
                  <span className="">Untracked</span>
                  <span className="ml-1">({untrackedCount})</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products?.map((product) => {
          const productId = product._id.toString();
          const isTracked = isProductTracked(productId);
          const isProcessing = processingProductId === productId;
          const isTracking = isProcessing && trackMutation.isPending;
          const isUntracking = isProcessing && untrackMutation.isPending;
          const isAnyProcessing = processingProductId !== null;

          return (
            <ProductCard
              key={`${productId}-${product.name}`}
              product={product}
              isTracked={isTracked}
              isTracking={isTracking}
              isUntracking={isUntracking}
              isAnyProcessing={isAnyProcessing}
              onTrack={handleTrack}
              onUntrack={handleUntrack}
              onBuy={handleBuy}
            />
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

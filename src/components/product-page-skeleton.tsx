import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCardSkeleton } from "@/components/ui/product-card-skeleton";

export const ProductsContentSkeleton = () => {
  return (
    <div className="w-full">
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900">Products</h1>
            {/* Placeholder for pincode and substore info */}
            <div className="mt-3 flex flex-row items-center justify-between gap-1 text-sm text-gray-500 sm:gap-4 md:justify-start">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 rounded-full" />
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative max-w-md flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search products..."
                className="pl-10 md:min-w-sm"
              />
            </div>

            {/* Quick Filter Tabs */}
            <Tabs className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="all">
                  <span className="">All</span>
                  <span className="ml-1">
                    <Skeleton className="h-4 w-6 rounded" />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="tracked">
                  <span className="">Tracked</span>
                  <span className="ml-1">
                    <Skeleton className="h-4 w-6 rounded" />
                  </span>
                </TabsTrigger>
                <TabsTrigger value="untracked">
                  <span className="">Untracked</span>
                  <span className="ml-1">
                    <Skeleton className="h-4 w-6 rounded" />
                  </span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>

      {/* Empty State Skeleton - This will be hidden when products are loading */}
      <div className="hidden py-12 text-center">
        <div className="mx-auto h-6 w-48 animate-pulse rounded bg-gray-200"></div>
        <div className="mx-auto mt-4 h-10 w-32 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Pagination Skeleton */}
      <div className="mt-8 flex justify-center">
        <div className="flex items-center space-x-2">
          <div className="h-9 w-9 animate-pulse rounded bg-gray-200"></div>
          <div className="h-9 w-9 animate-pulse rounded bg-gray-200"></div>
          <div className="h-9 w-9 animate-pulse rounded bg-gray-200"></div>
          <div className="h-9 w-9 animate-pulse rounded bg-gray-200"></div>
          <div className="h-9 w-9 animate-pulse rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
};

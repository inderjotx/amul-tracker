import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="flex flex-col justify-between overflow-hidden pt-0 pb-2">
      <CardHeader className="p-0">
        {/* Image skeleton */}
        <div className="aspect-square overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>

        <div className="flex flex-col gap-1 p-2 pt-0">
          {/* Title skeleton */}
          <Skeleton className="mb-1 h-4 w-3/4" />
          <Skeleton className="mb-1 h-4 w-1/2" />

          {/* Description skeleton */}
          <Skeleton className="h-3 w-full" />
        </div>
      </CardHeader>

      <CardContent className="p-2 pt-0">
        <div className="flex items-center justify-between">
          {/* Price skeleton */}
          <Skeleton className="h-6 w-16" />

          <div className="flex items-center gap-2">
            {/* Track button skeleton */}
            <Skeleton className="h-8 w-20" />
            {/* Buy button skeleton */}
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Skeleton } from "@/components/ui/skeleton"

export const RedemptionCardSkeleton = () => {
  return (
    <div className="bg-brown-sidebar rounded-md max-w-md border-2 border-brown-border p-4 flex flex-col">
      {/* Tag */}
      <Skeleton className="h-6 w-24 rounded-sm mb-3" />

      {/* Title */}
      <Skeleton className="h-5 w-3/4 mb-4" />

      {/* Divider */}
      <Skeleton className="h-px w-full my-4" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>

        <div className="flex flex-col items-end gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>

      {/* Divider */}
      <Skeleton className="h-px w-full my-4" />

      {/* Button */}
      <Skeleton className="h-10 w-full rounded-md mt-4" />
    </div>
  )
}


export const RedemptionSkeleton = () => {
  return (
    <>
      {/* Header */}
      <div className="pt-10 pb-1 space-y-2  max-md:hidden">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-4 py-4 max-md:hidden">
        {[...Array(3)].map((_, i) => (
          <RedemptionCardSkeleton key={i} />
        ))}
      </div>

      {/* Value Breakdown Title */}
      <Skeleton className="h-5 w-48 mt-10 mb-4" />

      {/* Table Skeleton */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
    </>
  )
}

import { Skeleton } from "@/components/ui/skeleton";

const CreditCardSkeleton = () => {
  return (
    <div className="relative w-98 h-[250px] max-md:w-[280px] max-md:h-[190px]">
      {/* Bottom shadow */}
      <div className="absolute inset-0 rounded-lg hidden md:block bg-muted/40" />

      {/* Card */}
      <div className="absolute inset-0 rounded-lg border border-border overflow-hidden">
        {/* Background shimmer */}
        <Skeleton className="absolute inset-0 rounded-lg" />

        {/* Bank + Card Name */}
        <div className="absolute top-6 left-4 flex items-center gap-2">
          <Skeleton className="w-5 h-5 rounded-sm" />
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Chip placeholder */}
        <div className="absolute top-6 left-4 mt-8">
          <Skeleton className="w-[42px] h-[32px] rounded-sm" />
        </div>

        {/* Card Number */}
        <div className="absolute top-[48%] left-4 -translate-y-1/2 flex gap-2">
          <Skeleton className="h-5 w-40" />
        </div>

        {/* Card Holder Name */}
        <div className="absolute top-[61%] left-4 -translate-y-1/2">
          <Skeleton className="h-4 w-28" />
        </div>

        {/* Visa logo */}
        <div className="absolute bottom-3 right-4">
          <Skeleton className="h-10 w-14 rounded-md" />
        </div>

        {/* Hover action strip */}
        <div className="absolute top-0 right-0 h-full w-14 border-l border-border bg-muted/60 flex items-center justify-center">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default CreditCardSkeleton;

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function Loader() {
  return (
    <div className="flex flex-col h-screen bg-[#fafafa]">
      {/* Top Navbar */}
      <div className="flex items-center gap-3 px-6 h-14 bg-gradient-to-r from-purple-600 to-indigo-500 text-white">
        <Skeleton className="w-8 h-8 rounded-full bg-white/30" />
        <div className="flex flex-col">
          <Skeleton className="h-4 w-24 bg-white/40" />
          <Skeleton className="h-3 w-32 mt-1 bg-white/30" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 items-center justify-center text-center space-y-6 px-4">
        <Skeleton className="h-4 w-80 bg-gray-200" />
        <Skeleton className="h-3 w-64 bg-gray-200" />
        <Skeleton className="h-3 w-60 bg-gray-200" />
      </div>

      {/* Chat Input */}
      <div className="flex justify-center items-center py-6">
        <div className="flex items-center gap-3 border border-gray-200 rounded-full px-4 py-3 w-[90%] max-w-lg bg-white shadow-sm">
          <Skeleton className="w-4 h-4 rounded-full bg-gray-200" />
          <Skeleton className="h-4 w-full bg-gray-200" />
          <Skeleton className="w-4 h-4 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4">
        <Skeleton className="h-3 w-32 mx-auto bg-gray-200" />
      </div>
    </div>
  );
}

export function SpendOptimizerCreditCardSkeleton() {
  return (
    <div className="flex flex-col p-6 px-4 rounded-sm gap-3 items-starts h-[160px] w-[260px] border border-white/30">
      <Skeleton className="h-[25px] w-[25px] rounded-sm" />
      <div className="flex flex-col items-starts gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex justify-between gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-5 rounded-sm" />
      </div>
    </div>
  );
}

export function TransactionHistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="flex items-center justify-between rounded-xl border border-border bg-brown-sidebar px-4 py-4"
        >
          {/* Left section */}
          <div className="flex items-center gap-4">
            {/* Icon */}
            <Skeleton className="h-12 w-12 rounded-full" />

            {/* Merchant info */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>

          {/* Middle section */}
          <div className="hidden md:flex items-center gap-10">
            {/* Date */}
            <Skeleton className="h-4 w-24" />

            {/* Amount */}
            <Skeleton className="h-4 w-20" />

            {/* EMI */}
            <Skeleton className="h-4 w-16" />
          </div>

          {/* Right section */}
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSelectorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("w-4xl mx-auto flex flex-col gap-6", className)}>
      {/* Question Block 1 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar ml-auto w-xs rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full" />
      </div>

      {/* Question Block 2 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar  ml-auto w-xs rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full" />
      </div>

      {/* Question Block 3 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar  ml-auto w-xs rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full" />
      </div>
    </div>
  );
}

function QuestionSkeleton({ pills }: { pills: number }) {
  return (
    <div className="rounded-2xl border border-brown-border bg-brown-sidebar p-6 space-y-5 max-w-md">
      {/* Question text */}
      <Skeleton className="h-5 w-2/3 " />

      {/* Pills */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: pills }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-[90px] rounded-full" />
        ))}
      </div>
    </div>
  );
}

export const ChatSideBarSkeleton = () => {
  return (
    <div className="w-full">
      <div className="p-3 mt-5 grow bg-brown-background  ml-auto rounded-md border border-brown-border">
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="p-3 bg-brown-background mt-2  ml-auto rounded-md border border-brown-border">
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="p-3 bg-brown-background  mt-2  ml-auto rounded-md border border-brown-border">
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="p-3 bg-brown-background  mt-2  ml-auto rounded-md border border-brown-border">
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="p-3 bg-brown-background  mt-2  ml-auto rounded-md border border-brown-border">
        <Skeleton className="h-2 w-full" />
      </div>
    </div>
  );
};

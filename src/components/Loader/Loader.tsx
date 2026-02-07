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
    <div className={cn("w-4xl mx-auto flex flex-col gap-6 max-md:w-full max-md:p-4", className)}>
      {/* Question Block 1 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar ml-auto w-xs max-md:my-4 max-md:w-[200px] rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full max-md:h-3" />
      </div>

      {/* Question Block 2 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar  ml-auto w-xs max-md:my-4 max-md:w-[200px] rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full max-md:h-3" />
      </div>

      {/* Question Block 3 */}
      <QuestionSkeleton pills={4} />
      <div className="p-4 bg-brown-sidebar  ml-auto w-xs max-md:my-4 max-md:w-[200px] rounded-2xl border border-brown-border">
        <Skeleton className="h-5 w-full max-md:h-3" />
      </div>
    </div>
  );
}

function QuestionSkeleton({ pills }: { pills: number }) {
  return (
    <div className="rounded-2xl max-md:p-3 max-md:max-md:w-[250px] border border-brown-border bg-brown-sidebar p-6 space-y-5 max-w-md">
      {/* Question text */}
      <Skeleton className="h-5 w-2/3 max-md:h-3" />

      {/* Pills */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: pills }).map((_, i) => (
          <Skeleton key={i} className={`${i===0||i===1?'hidden':'inline'} h-6 max-md:h-3 w-[90px] rounded-full`} />
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

export const TopPerformingCardSectionSkeleton = () => {
  return (
    <div className="w-sm bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px] max-md:p-4 max-md:w-full max-md:min-h-fit">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-4 w-40 bg-[#AD744A]" />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg bg-brown-background p-3"
          >
            {/* Card name */}
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-32 bg-[#AD744A]" />
              <Skeleton className="h-3 w-24 bg-[#AD744A]" />
            </div>

            {/* Spend / Reward */}
            <div className="flex flex-col items-end gap-2">
              <Skeleton className="h-4 w-16 bg-[#AD744A]" />
              <Skeleton className="h-3 w-12 bg-[#AD744A]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const StatsSectionSkeleton = () => {
  return (
    <div className="bg-brown-sidebar p-4 px-6 rounded-xl grid grid-cols-2 gap-4 min-h-[292px] max-md:gap-2 max-md:p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="w-40 h-30 max-md:w-full border-b-6 border-brown-border flex flex-col justify-between bg-brown-background p-3 rounded-lg"
        >
          {/* Top row: icon + amount */}
          <div className="flex justify-between items-start">
            {/* Icon placeholder */}
            <Skeleton className="h-6 w-6 rounded-full bg-[#AD744A]" />

            {/* Amount */}
            <Skeleton className="h-6 w-20 bg-[#AD744A]" />
          </div>

          {/* Title */}
          <Skeleton className="h-3 w-28 self-end bg-[#AD744A]" />
        </div>
      ))}
    </div>
  )
}


const TransactionRowSkeleton = () => {
  return (
    <div className="flex justify-between items-center">
      {/* Left side */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <Skeleton className="h-10 w-10 rounded-full bg-[#AD744A]" />

        {/* Merchant + date */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36 bg-[#AD744A]" />
          <Skeleton className="h-3 w-24 bg-[#AD744A]" />
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-16 bg-[#AD744A]" />
        <Skeleton className="h-3 w-20 bg-[#AD744A]" />
      </div>
    </div>
  )
}

export const RecentSpendTransactionSectionSkeleton = () => {
  return (
    <div className="w-md bg-brown-sidebar p-4 px-6 rounded-xl min-h-[292px] max-md:w-full max-md:min-h-fit max-md:p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-4 w-48 bg-[#AD744A]" />
      </div>

      {/* Transactions */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <TransactionRowSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export const CreditCardSkeleton = () => {
  return (
    <div className="relative w-98 h-[250px] max-md:w-[280px] max-md:h-[190px] mb-8 lg:mb-0">
      <div className="absolute inset-0 rounded-lg bg-brown-background border border-secondary-orange overflow-hidden p-4">
        {/* Top row (chip + card name) */}
        <div className="flex items-start gap-2 mb-6">
          <Skeleton className="h-6 w-10 rounded-sm bg-[#AD744A]" />
          <Skeleton className="h-4 w-40 bg-[#AD744A]" />
        </div>

        {/* Card number */}
        <div className="mt-12">
          <Skeleton className="h-4 w-48 bg-[#AD744A]" />
        </div>

        {/* Card holder */}
        <div className="absolute bottom-6 left-4">
          <Skeleton className="h-4 w-32 bg-[#AD744A]" />
        </div>

        {/* Visa logo */}
        <div className="absolute bottom-6 right-4">
          <Skeleton className="h-8 w-12 bg-[#AD744A]" />
        </div>
      </div>
    </div>
  )
}

export const LastRecommendationSkeleton = () => {
  return (
    <div className="bg-brown-sidebar max-w-[1270px] rounded-xl w-full p-4 px-6 max-md:p-4 mx-auto max-md:w-full max-md:max-w-[448px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-4 w-80 bg-[#AD744A]" />
      </div>

      {/* Cards */}
      <div className="flex justify-between gap-4 max-md:overflow-x-auto max-md:gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <CreditCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}






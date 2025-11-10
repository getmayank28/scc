
import { Skeleton } from "@/components/ui/skeleton"

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
  )
}

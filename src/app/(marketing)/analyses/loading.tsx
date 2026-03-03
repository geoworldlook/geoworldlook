import { Skeleton } from "@/components/ui/skeleton";

export default function AnalysesLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-24 space-y-12">
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#111] border border-white/[0.06] rounded-xl overflow-hidden h-[450px]">
            <Skeleton className="h-56 w-full" />
            <div className="p-6 space-y-4">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

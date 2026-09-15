import { Skeleton } from "@/components/ui/Skeleton";

export function DebtsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <Skeleton className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="space-y-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-20" />
        ))}
      </div>
    </div>
  );
}

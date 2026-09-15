import { Skeleton } from "@/components/ui/Skeleton";

export function BudgetsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </div>
    </div>
  );
}

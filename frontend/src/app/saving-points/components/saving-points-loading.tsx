import { Skeleton } from "@/components/ui/Skeleton";

export function SavingPointsLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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

import { Skeleton } from "@/components/ui/Skeleton";

export function loadingIncomeScreen() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <Skeleton className="h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-[320px]" />
        <Skeleton className="h-[320px]" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}
import { PiggyBank } from "lucide-react";

export function SavingPointsHeader() {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <div className="p-2 bg-sky-500/10 rounded-lg">
            <PiggyBank className="w-5 h-5 text-sky-400" />
          </div>
          Saving Points
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Auto-generated from unused budget surplus
        </p>
      </div>
    </header>
  );
}

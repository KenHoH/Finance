import { AlertTriangle } from "lucide-react";

export function DebtsHeader() {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-7">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          Debts
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Auto-generated from overspent budgets</p>
      </div>
    </header>
  );
}

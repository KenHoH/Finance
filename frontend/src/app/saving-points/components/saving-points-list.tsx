import { EmptyState } from "@/components/ui/EmptyState";
import type { SavingPoint } from "@/lib/types";
import { SavingPointItem } from "./saving-point-item";

interface SavingPointsListProps {
  points: SavingPoint[];
  onAllocate: (point: SavingPoint) => void;
  onEdit: (point: SavingPoint) => void;
  onDelete: (id: string) => void;
}

export function SavingPointsList({
  points,
  onAllocate,
  onEdit,
  onDelete,
}: SavingPointsListProps) {
  return (
    <div className="space-y-3">
      {points.map((point, index) => (
        <SavingPointItem
          key={point.id}
          point={point}
          index={index}
          onAllocate={onAllocate}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {points.length === 0 && (
        <EmptyState
          image="/empty-savingpoints.webp"
          title="No saving points yet"
          description="Saving points are auto-generated when your budget has leftover funds at the end of the period."
        />
      )}
    </div>
  );
}

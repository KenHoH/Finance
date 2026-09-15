"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { SavingPoint } from "@/lib/types";
import { AllocateSavingPointModal } from "./components/allocate-saving-point-modal";
import { EditSavingPointModal } from "./components/edit-saving-point-modal";
import type { AllocatableSavingPoint } from "./components/saving-point.types";
import { SavingPointsHeader } from "./components/saving-points-header";
import { SavingPointsList } from "./components/saving-points-list";
import { SavingPointsLoading } from "./components/saving-points-loading";
import { SavingPointsSummary } from "./components/saving-points-summary";
import { useSavingPoints } from "./hooks/use-saving-points";

export default function SavingPointsPage() {
  const savingPoints = useSavingPoints();
  const [allocatePoint, setAllocatePoint] =
    useState<AllocatableSavingPoint | null>(null);
  const [editPoint, setEditPoint] = useState<SavingPoint | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pointToDelete, setPointToDelete] = useState<string | null>(null);

  if (savingPoints.isLoading) {
    return <SavingPointsLoading />;
  }

  const totalSaved = savingPoints.points.reduce(
    (sum, point) => sum + Number(point.savingAmount),
    0,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      <SavingPointsHeader />

      <SavingPointsSummary
        totalSaved={totalSaved}
        activePoints={savingPoints.points.length}
        availableGoals={savingPoints.goals.length}
      />

      <SavingPointsList
        points={savingPoints.points}
        onAllocate={(point) =>
          setAllocatePoint({
            id: point.id,
            amount: Number(point.savingAmount),
          })
        }
        onEdit={setEditPoint}
        onDelete={(id) => {
          setPointToDelete(id);
          setShowDeleteConfirm(true);
        }}
      />

      <AllocateSavingPointModal
        point={allocatePoint}
        onClose={() => setAllocatePoint(null)}
        savingPoints={savingPoints}
      />

      <EditSavingPointModal
        point={editPoint}
        onClose={() => setEditPoint(null)}
        savingPoints={savingPoints}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onConfirm={() => {
          if (pointToDelete) {
            savingPoints.deleteMutation.mutate(pointToDelete);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete saving point?"
        description="Are you sure you want to delete this saving point? This action cannot be undone."
        confirmLabel={
          savingPoints.deleteMutation.isPending ? "Deleting..." : "Delete"
        }
        variant="danger"
      />
    </div>
  );
}

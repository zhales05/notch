"use client"

import { useMemo, useState } from "react"
import { Plus, Gauge } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMeasures } from "@/hooks/use-measures"
import { useCategories } from "@/hooks/use-categories"
import { useProfile } from "@/hooks/use-profile"
import { MeasureCard } from "@/components/measures/measure-card"
import { MeasureFormDialog } from "@/components/measures/measure-form-dialog"
import { ArchiveMeasureDialog } from "@/components/measures/archive-measure-dialog"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import type { MeasureWithCategory, MeasureFormData } from "@/lib/types/measures"

export default function MeasuresPage() {
  const [showArchived, setShowArchived] = useState(false)
  const { profile } = useProfile()
  const isFreeUser = profile?.plan === "free"

  const {
    measures,
    isLoading,
    error,
    createMeasure,
    updateMeasure,
    archiveMeasure,
    unarchiveMeasure,
  } = useMeasures()

  const { categories } = useCategories()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMeasure, setEditingMeasure] =
    useState<MeasureWithCategory | null>(null)
  const [archivingMeasure, setArchivingMeasure] =
    useState<MeasureWithCategory | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const activeMeasureCount = useMemo(
    () => measures.filter((m) => !m.archived_at).length,
    [measures]
  )

  const filteredMeasures = useMemo(
    () =>
      showArchived
        ? measures
        : measures.filter((m) => !m.archived_at),
    [measures, showArchived]
  )

  function handleNewMeasure() {
    if (isFreeUser && activeMeasureCount >= 4) {
      setShowUpgrade(true)
      return
    }
    setShowUpgrade(false)
    setIsFormOpen(true)
  }

  function handleEdit(measure: MeasureWithCategory) {
    setEditingMeasure(measure)
    setIsFormOpen(true)
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) setEditingMeasure(null)
  }

  async function handleSubmit(data: MeasureFormData) {
    if (editingMeasure) {
      const result = await updateMeasure(editingMeasure.id, data)
      if (!result) throw new Error("Update failed")
    } else {
      const result = await createMeasure(data)
      if (!result) throw new Error("Create failed")
    }
  }

  async function handleArchive() {
    if (!archivingMeasure) return
    const success = await archiveMeasure(archivingMeasure.id)
    if (!success) throw new Error("Archive failed")
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Measures</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track metrics like sleep, steps, and screen time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Button onClick={handleNewMeasure}>
            <Plus className="size-4" />
            New Measure
          </Button>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {showUpgrade && (
        <div className="mt-4">
          <UpgradePrompt
            title="You've reached the free plan limit of 4 measures."
            description="Upgrade to Premium for unlimited measures."
          />
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : filteredMeasures.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <Gauge className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-medium">No measures yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first measure to start tracking life metrics.
          </p>
          <Button className="mt-4" onClick={handleNewMeasure}>
            <Plus className="size-4" />
            Create Measure
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMeasures.map((measure) => (
            <MeasureCard
              key={measure.id}
              measure={measure}
              onEdit={() => handleEdit(measure)}
              onArchive={() => setArchivingMeasure(measure)}
              onUnarchive={() => unarchiveMeasure(measure.id)}
            />
          ))}
        </div>
      )}

      <MeasureFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        measure={editingMeasure}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ArchiveMeasureDialog
        open={archivingMeasure !== null}
        onOpenChange={(open) => {
          if (!open) setArchivingMeasure(null)
        }}
        measure={archivingMeasure}
        onConfirm={handleArchive}
      />
    </div>
  )
}

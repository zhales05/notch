"use client"

import { Pencil, Archive, ArchiveRestore, Gauge } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ICON_MAP } from "@/components/categories/icon-picker"
import type { MeasureWithCategory } from "@/lib/types/measures"

interface MeasureCardProps {
  measure: MeasureWithCategory
  onEdit: () => void
  onArchive: () => void
  onUnarchive: () => void
}

export function MeasureCard({
  measure,
  onEdit,
  onArchive,
  onUnarchive,
}: MeasureCardProps) {
  const Icon = ICON_MAP[measure.icon] ?? Gauge
  const isArchived = measure.archived_at !== null

  return (
    <Card size="sm" className={isArchived ? "opacity-50" : undefined}>
      <CardContent className="flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: measure.color + "20",
            color: measure.color,
          }}
        >
          <Icon className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{measure.title}</span>
            {isArchived && (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {measure.unit && <span>{measure.unit}</span>}
            {measure.category && (
              <>
                {measure.unit && <span>&middot;</span>}
                <span>{measure.category.title}</span>
              </>
            )}
          </div>
        </div>

        {!isArchived && (
          <Button variant="ghost" size="icon-sm" onClick={onEdit}>
            <Pencil />
          </Button>
        )}

        {isArchived ? (
          <Button variant="ghost" size="icon-sm" onClick={onUnarchive}>
            <ArchiveRestore />
          </Button>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={onArchive}>
            <Archive />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

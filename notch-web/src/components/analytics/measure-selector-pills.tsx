"use client"

import { Gauge } from "lucide-react"
import { ICON_MAP } from "@/components/categories/icon-picker"
import type { MeasureWithCategory } from "@/lib/types/measures"

interface MeasureSelectorPillsProps {
  measures: MeasureWithCategory[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function MeasureSelectorPills({
  measures,
  selectedId,
  onSelect,
}: MeasureSelectorPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {measures.map((measure) => {
        const isActive = measure.id === selectedId
        const Icon = ICON_MAP[measure.icon] ?? Gauge

        return (
          <button
            key={measure.id}
            type="button"
            onClick={() => onSelect(measure.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Icon
              className="size-3.5"
              style={isActive ? undefined : { color: measure.color }}
            />
            {measure.title}
          </button>
        )
      })}
    </div>
  )
}

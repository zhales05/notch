"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ICON_MAP } from "@/components/categories/icon-picker"
import { Gauge } from "lucide-react"
import type { MeasureWithLog } from "@/lib/types/measures"

interface MeasureLogCardProps {
  measure: MeasureWithLog
  onValueChange: (measureId: string, value: number) => void
}

export function MeasureLogCard({ measure, onValueChange }: MeasureLogCardProps) {
  const Icon = ICON_MAP[measure.icon] ?? Gauge
  const [localValue, setLocalValue] = useState(
    measure.log?.value?.toString() ?? ""
  )

  function handleSave() {
    const num = parseFloat(localValue)
    if (!isNaN(num)) {
      onValueChange(measure.id, num)
    } else if (localValue === "" && measure.log !== null) {
      onValueChange(measure.id, 0)
    }
  }

  return (
    <Card className="!flex-row items-center gap-3 p-3">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: measure.color + "20" }}
      >
        <Icon className="size-5" style={{ color: measure.color }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{measure.title}</p>
        {measure.category && (
          <p className="truncate text-xs text-muted-foreground">
            {measure.category.title}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
          }}
          className="h-8 w-20 text-right text-sm"
          placeholder="0"
        />
        {measure.unit && (
          <span className="text-xs text-muted-foreground">{measure.unit}</span>
        )}
      </div>
    </Card>
  )
}

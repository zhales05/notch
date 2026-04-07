"use client"

import Link from "next/link"
import { Gauge, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { MeasureLogCard } from "./measure-log-card"
import type { MeasureWithLog } from "@/lib/types/measures"

interface TodayMeasureListProps {
  measuresWithLogs: MeasureWithLog[]
  isLoading: boolean
  onValueChange: (measureId: string, value: number) => void
}

export function TodayMeasureList({
  measuresWithLogs,
  isLoading,
  onValueChange,
}: TodayMeasureListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px] rounded-xl" />
        ))}
      </div>
    )
  }

  if (measuresWithLogs.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
          <Gauge className="size-5 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm font-medium">No measures yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Track things like sleep, steps, or screen time.
        </p>
        <Link
          href="/measures"
          className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Add Measure
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {measuresWithLogs.map((measure) => (
        <MeasureLogCard
          key={measure.id}
          measure={measure}
          onValueChange={onValueChange}
        />
      ))}
    </div>
  )
}

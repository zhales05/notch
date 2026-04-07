"use client"

import { useMemo, useRef, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { parseDateKey } from "@/lib/date-utils"
import type { HeatmapDay, DateRange } from "@/lib/types/analytics"
import type { LogType, TargetDirection } from "@/lib/types/habits"

interface HeatmapCardProps {
  data: HeatmapDay[]
  habitColor: string
  isLoading: boolean
  logType?: LogType
  unit?: string
  dateRange?: DateRange
  dailyTarget?: number | null
  targetDirection?: TargetDirection
}

const DAY_LABEL_WIDTH = 32
const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"]
const MIN_CELL_SIZE = 10
const MAX_CELL_SIZE = 14
const CELL_GAP = 3
const CELL_RADIUS = 2

export function HeatmapCard({
  data,
  habitColor,
  isLoading,
  logType,
  unit,
  dailyTarget,
  targetDirection = "at_least",
}: HeatmapCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const isScale = logType === "value" || logType === "time"

  // Compute max value for gradient coloring (only used for scale types)
  const maxValue = useMemo(() => {
    if (!isScale) return 1
    let max = 0
    for (const d of data) {
      if (d.value !== null && d.value > max) max = d.value
    }
    return max || 1
  }, [data, isScale])

  // Calculate cell size and column count to fill width
  const { cellSize, maxColumns } = useMemo(() => {
    if (containerWidth === 0) return { cellSize: 0, maxColumns: 0 }
    const gridWidth = containerWidth - DAY_LABEL_WIDTH
    // Start with max cell size, find how many columns fit
    for (let size = MAX_CELL_SIZE; size >= MIN_CELL_SIZE; size--) {
      const cols = Math.floor((gridWidth + CELL_GAP) / (size + CELL_GAP))
      if (cols >= 1) return { cellSize: size, maxColumns: cols }
    }
    return { cellSize: MIN_CELL_SIZE, maxColumns: Math.floor((gridWidth + CELL_GAP) / (MIN_CELL_SIZE + CELL_GAP)) }
  }, [containerWidth])

  // Slice data to fit and organize into columns
  const { columns, monthLabels } = useMemo(() => {
    if (data.length === 0 || maxColumns === 0)
      return { columns: [], monthLabels: [] }

    // Limit data to what fits
    const maxDays = maxColumns * 7
    const slicedData = data.length > maxDays ? data.slice(-maxDays) : data

    // Pad start so first day aligns to correct weekday row
    const firstDate = parseDateKey(slicedData[0].date)
    const firstDayOfWeek = (firstDate.getDay() + 6) % 7 // Mon=0..Sun=6

    const padded: (HeatmapDay | null)[] = []
    for (let i = 0; i < firstDayOfWeek; i++) padded.push(null)
    padded.push(...slicedData)

    // Split into columns of 7
    const cols: (HeatmapDay | null)[][] = []
    for (let i = 0; i < padded.length; i += 7) {
      cols.push(padded.slice(i, i + 7))
    }
    // Pad last column to 7
    const last = cols[cols.length - 1]
    while (last.length < 7) last.push(null)

    // Month labels
    const labels: { colIndex: number; label: string }[] = []
    let prevMonth = -1
    for (let c = 0; c < cols.length; c++) {
      const firstDay = cols[c].find((d) => d !== null)
      if (firstDay) {
        const date = parseDateKey(firstDay.date)
        const month = date.getMonth()
        if (month !== prevMonth) {
          labels.push({
            colIndex: c,
            label: date.toLocaleDateString("en-US", { month: "short" }),
          })
          prevMonth = month
        }
      }
    }

    return { columns: cols, monthLabels: labels }
  }, [data, maxColumns])

  // Cell color logic
  const getCellStyle = (day: HeatmapDay) => {
    if (!day.completed) {
      return { backgroundColor: "var(--color-muted)" }
    }
    // Scale types: intensity gradient based on value
    if (isScale && day.value !== null) {
      let intensity: number
      if (targetDirection === "at_most" && dailyTarget) {
        // "At most" — lower is better. At/under target = full, over = dimmer
        const ratio = day.value / dailyTarget
        intensity = ratio <= 1 ? 1 : Math.max(0.2, 1 - (ratio - 1))
      } else {
        // "At least" — higher is better (default GitHub style)
        intensity = 0.3 + 0.7 * (day.value / maxValue)
      }
      return {
        backgroundColor: habitColor,
        opacity: intensity,
      }
    }
    // Binary: simple on/off
    return { backgroundColor: habitColor }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[120px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Activity</CardTitle>
        {/* Legend — gradient for scale types, simple for binary */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {isScale ? (
            <>
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: "var(--color-muted)",
                    borderRadius: CELL_RADIUS,
                  }}
                />
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: habitColor,
                    opacity: 0.3,
                    borderRadius: CELL_RADIUS,
                  }}
                />
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: habitColor,
                    opacity: 0.6,
                    borderRadius: CELL_RADIUS,
                  }}
                />
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: habitColor,
                    opacity: 1,
                    borderRadius: CELL_RADIUS,
                  }}
                />
              </div>
              <span>More</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: "var(--color-muted)",
                    borderRadius: CELL_RADIUS,
                  }}
                />
                <span>None</span>
              </div>
              <div className="flex items-center gap-1">
                <div
                  className="size-2.5"
                  style={{
                    backgroundColor: habitColor,
                    borderRadius: CELL_RADIUS,
                  }}
                />
                <span>Done</span>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="min-h-[1px]" />
        {containerWidth > 0 && columns.length > 0 && (
          <>
            {/* Month labels */}
            <div className="mb-1 flex" style={{ paddingLeft: DAY_LABEL_WIDTH }}>
              {columns.map((_, colIdx) => {
                const monthLabel = monthLabels.find(
                  (m) => m.colIndex === colIdx
                )
                return (
                  <div
                    key={colIdx}
                    className="text-[10px] text-muted-foreground"
                    style={{ width: cellSize + CELL_GAP }}
                  >
                    {monthLabel?.label ?? ""}
                  </div>
                )
              })}
            </div>

            {/* Grid: day labels + cells */}
            <div className="flex">
              {/* Day labels column */}
              <div
                className="flex shrink-0 flex-col"
                style={{ width: DAY_LABEL_WIDTH, gap: CELL_GAP }}
              >
                {DAY_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center text-[10px] text-muted-foreground"
                    style={{ height: cellSize }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Heatmap columns */}
              <TooltipProvider>
                <div className="flex" style={{ gap: CELL_GAP }}>
                  {columns.map((col, colIdx) => (
                    <div
                      key={colIdx}
                      className="flex flex-col"
                      style={{ gap: CELL_GAP }}
                    >
                      {col.map((day, rowIdx) => {
                        if (!day) {
                          return (
                            <div
                              key={rowIdx}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                borderRadius: CELL_RADIUS,
                              }}
                            />
                          )
                        }

                        const date = parseDateKey(day.date)
                        const dateLabel = date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })

                        const tooltipValue = day.completed
                          ? isScale && day.value !== null
                            ? `${day.value} ${unit}`
                            : "Completed"
                          : "Not logged"

                        return (
                          <Tooltip key={day.date}>
                            <TooltipTrigger
                              style={{
                                width: cellSize,
                                height: cellSize,
                                borderRadius: CELL_RADIUS,
                                outline: "1px solid rgba(27, 31, 35, 0.06)",
                                outlineOffset: -1,
                                ...getCellStyle(day),
                              }}
                            />
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{dateLabel}</p>
                              <p className="text-muted-foreground">
                                {tooltipValue}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

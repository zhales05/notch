"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ICON_MAP } from "@/components/categories/icon-picker"
import type { HabitWithLog } from "@/lib/types/logs"

interface HabitLogCardProps {
  habit: HabitWithLog
  completionRate: number | null
  onToggle: () => void
  onValueChange: (value: number) => void
}

function getRateBadgeColor(rate: number): string {
  if (rate >= 80) return "bg-emerald-100 text-emerald-700"
  if (rate >= 50) return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-700"
}

export function HabitLogCard({ habit, completionRate, onToggle, onValueChange }: HabitLogCardProps) {
  const isComplete = habit.log !== null
  const Icon = ICON_MAP[habit.icon] ?? Check

  return (
    <Card className="!flex-row items-center gap-3 p-3">
      {/* Icon */}
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: habit.color + "20" }}
      >
        <Icon className="size-5" style={{ color: habit.color }} />
      </div>

      {/* Title + category */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{habit.title}</p>
        {habit.category && (
          <p className="truncate text-xs text-muted-foreground">
            {habit.category.title}
            {habit.log_type === "value" && habit.unit && habit.daily_target != null && (
              <> &middot; target: {habit.daily_target} {habit.unit}</>
            )}
            {habit.log_type === "time" && habit.daily_target != null && (
              <> &middot; by {String(Math.floor(habit.daily_target / 60)).padStart(2, "0")}:{String(habit.daily_target % 60).padStart(2, "0")}</>
            )}
          </p>
        )}
      </div>

      {/* Completion rate badge */}
      {completionRate !== null && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getRateBadgeColor(completionRate)}`}
        >
          {completionRate}%
        </span>
      )}

      {/* Action */}
      {habit.log_type === "boolean" ? (
        <BooleanToggle
          color={habit.color}
          isComplete={isComplete}
          onToggle={onToggle}
        />
      ) : habit.log_type === "time" ? (
        <TimeInput
          value={habit.log?.value ?? null}
          onSave={onValueChange}
        />
      ) : (
        <ValueInput
          value={habit.log?.value ?? null}
          unit={habit.unit}
          dailyTarget={habit.daily_target}
          onSave={onValueChange}
        />
      )}
    </Card>
  )
}

function BooleanToggle({
  color,
  isComplete,
  onToggle,
}: {
  color: string
  isComplete: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
      style={{
        borderColor: color,
        backgroundColor: isComplete ? color : "transparent",
      }}
    >
      {isComplete && <Check className="size-4 text-white" />}
    </button>
  )
}

function ValueInput({
  value,
  unit,
  dailyTarget,
  onSave,
}: {
  value: number | null
  unit: string | null
  dailyTarget: number | null
  onSave: (value: number) => void
}) {
  const [localValue, setLocalValue] = useState(value?.toString() ?? "")

  function handleSave() {
    const num = parseFloat(localValue)
    if (!isNaN(num)) {
      onSave(num)
    } else if (localValue === "" && value !== null) {
      onSave(0)
    }
  }

  const current = value ?? 0
  const pct = dailyTarget ? Math.min(100, Math.round((current / dailyTarget) * 100)) : null

  return (
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
      {unit && (
        <span className="text-xs text-muted-foreground">{unit}</span>
      )}
      {pct !== null && (
        <span className="text-xs text-muted-foreground">{pct}%</span>
      )}
    </div>
  )
}

function TimeInput({
  value,
  onSave,
}: {
  value: number | null
  onSave: (value: number) => void
}) {
  // value is minutes since midnight
  const toTimeString = (mins: number | null) => {
    if (mins == null) return ""
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }

  const [localValue, setLocalValue] = useState(toTimeString(value))

  function handleSave() {
    if (!localValue) return
    const [h, m] = localValue.split(":").map(Number)
    if (!isNaN(h) && !isNaN(m)) {
      onSave(h * 60 + m)
    }
  }

  return (
    <Input
      type="time"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value)
      }}
      onBlur={handleSave}
      onKeyDown={(e) => {
        if (e.key === "Enter") handleSave()
      }}
      className="h-8 w-28 text-sm"
    />
  )
}

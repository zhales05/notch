"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { HabitWithCategory } from "@/lib/types/habits"
import type { GoalHabitFormEntry, ContributionMode, GoalType } from "@/lib/types/goals"

interface GoalHabitRowProps {
  entry: GoalHabitFormEntry
  habits: HabitWithCategory[]
  alreadyLinkedIds: string[]
  goalType?: GoalType
  onChange: (entry: GoalHabitFormEntry) => void
  onRemove: () => void
}

const CONTRIBUTION_LABELS: Record<ContributionMode, string> = {
  count: "Count (logs)",
  value_sum: "Value Sum",
  streak: "Streak (days)",
  best_min: "Best (lowest)",
  best_max: "Best (highest)",
}

const ACCUMULATION_MODES: ContributionMode[] = ["count", "value_sum", "streak"]

export function GoalHabitRow({
  entry,
  habits,
  alreadyLinkedIds,
  goalType = "accumulate",
  onChange,
  onRemove,
}: GoalHabitRowProps) {
  const availableHabits = habits.filter(
    (h) => h.id === entry.habit_id || !alreadyLinkedIds.includes(h.id)
  )

  const selectedHabit = habits.find((h) => h.id === entry.habit_id)
  const isBooleanHabit = selectedHabit?.log_type === "boolean"
  const isPerformanceGoal = goalType !== "accumulate"

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={entry.habit_id}
        onChange={(e) =>
          onChange({
            ...entry,
            habit_id: e.target.value,
            // Reset to count if switching to a boolean habit with a value-dependent mode
            contribution_mode:
              habits.find((h) => h.id === e.target.value)?.log_type ===
                "boolean" && ["value_sum", "best_min", "best_max"].includes(entry.contribution_mode)
                ? "count"
                : entry.contribution_mode,
          })
        }
      >
        <option value="">Select habit...</option>
        {availableHabits.map((h) => (
          <option key={h.id} value={h.id}>
            {h.title}
          </option>
        ))}
      </select>

      {!isPerformanceGoal && (
        <select
          className="h-9 w-[130px] shrink-0 rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={entry.contribution_mode}
          onChange={(e) =>
            onChange({
              ...entry,
              contribution_mode: e.target.value as ContributionMode,
            })
          }
        >
          {ACCUMULATION_MODES.map((mode) => (
            <option
              key={mode}
              value={mode}
              disabled={isBooleanHabit && mode === "value_sum"}
            >
              {CONTRIBUTION_LABELS[mode]}
            </option>
          ))}
        </select>
      )}

      {!isPerformanceGoal && (
        <Input
          type="number"
          step="0.1"
          min="0.1"
          className="h-9 w-[70px] shrink-0"
          placeholder="Weight"
          value={entry.weight}
          onChange={(e) =>
            onChange({ ...entry, weight: parseFloat(e.target.value) || 1 })
          }
        />
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onRemove}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}

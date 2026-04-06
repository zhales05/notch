"use client"

import { Pencil, Trash2, Target } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GoalStatusBadge } from "./goal-status-badge"
import { GoalProgressBar } from "./goal-progress-bar"
import type { GoalWithCategory, GoalProgress, GoalStatus } from "@/lib/types/goals"

interface GoalCardProps {
  goal: GoalWithCategory
  progress?: GoalProgress
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: GoalStatus) => void
  onClick: () => void
}

export function GoalCard({
  goal,
  progress,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
}: GoalCardProps) {
  const categoryColor = goal.category?.color ?? "#6b7280"

  return (
    <Card size="sm" className="cursor-pointer transition-shadow hover:shadow-md">
      <CardContent className="grid gap-2.5" onClick={onClick}>
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: categoryColor + "20",
              color: categoryColor,
            }}
          >
            <Target className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <span className="truncate font-medium">{goal.title}</span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {goal.goal_type === "milestone"
                ? "Milestone"
                : `${goal.target_value}${goal.unit ? ` ${goal.unit}` : ""}`}
              {goal.category && (
                <>
                  <span>&middot;</span>
                  <span>{goal.category.title}</span>
                </>
              )}
            </div>
          </div>

          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <select
              className="h-7 rounded-md border border-input bg-background px-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={goal.status}
              onChange={(e) =>
                onStatusChange(e.target.value as GoalStatus)
              }
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <Button variant="ghost" size="icon-sm" onClick={onEdit}>
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onDelete}>
              <Trash2 />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GoalStatusBadge status={goal.status} />
          {progress && (
            <GoalProgressBar
              percentage={progress.percentage}
              compact
              className="flex-1"
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

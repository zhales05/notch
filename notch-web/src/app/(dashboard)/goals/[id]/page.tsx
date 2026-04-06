"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Pencil, Trash2, Target, Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { GoalStatusBadge } from "@/components/goals/goal-status-badge"
import { GoalProgressBar } from "@/components/goals/goal-progress-bar"
import { GoalFormDialog } from "@/components/goals/goal-form-dialog"
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog"
import { ICON_MAP } from "@/components/categories/icon-picker"
import { useGoals } from "@/hooks/use-goals"
import { useCategories } from "@/hooks/use-categories"
import { useHabits } from "@/hooks/use-habits"
import { parseDateKey } from "@/lib/date-utils"
import type {
  GoalWithCategory,
  GoalHabitWithHabit,
  GoalProgress,
  GoalFormData,
  GoalHabitFormEntry,
  GoalStatus,
  ContributionMode,
} from "@/lib/types/goals"

const CONTRIBUTION_LABELS: Record<ContributionMode, string> = {
  count: "Count (logs)",
  value_sum: "Value Sum",
  streak: "Streak (days)",
  best_min: "Best (lowest)",
  best_max: "Best (highest)",
}

export default function GoalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const goalId = params.id as string

  const { fetchGoalDetail, updateGoal, updateGoalStatus, deleteGoal } =
    useGoals()
  const { categories } = useCategories()
  const { habits } = useHabits()

  const [goal, setGoal] = useState<GoalWithCategory | null>(null)
  const [linkedHabits, setLinkedHabits] = useState<GoalHabitWithHabit[]>([])
  const [progress, setProgress] = useState<GoalProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    const detail = await fetchGoalDetail(goalId)
    if (detail) {
      setGoal(detail.goal)
      setLinkedHabits(detail.linkedHabits)
      setProgress(detail.progress)
    }
    setIsLoading(false)
  }, [goalId, fetchGoalDetail])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  async function handleSubmit(data: GoalFormData) {
    const result = await updateGoal(goalId, data)
    if (!result) throw new Error("Update failed")
    loadDetail()
  }

  async function handleStatusChange(status: GoalStatus) {
    const success = await updateGoalStatus(goalId, status)
    if (success && goal) {
      setGoal({ ...goal, status })
    }
  }

  async function handleDelete() {
    const success = await deleteGoal(goalId)
    if (!success) throw new Error("Delete failed")
    router.push("/goals")
  }

  const editingLinkedHabits: GoalHabitFormEntry[] = linkedHabits.map((lh) => ({
    habit_id: lh.habit_id,
    contribution_mode: lh.contribution_mode,
    weight: lh.weight,
  }))

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <h2 className="font-medium">Goal not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This goal may have been deleted.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/goals")}
        >
          <ArrowLeft className="size-4" />
          Back to Goals
        </Button>
      </div>
    )
  }

  const categoryColor = goal.category?.color ?? "#6b7280"

  function formatDate(dateStr: string) {
    return parseDateKey(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const isMilestone = goal.goal_type === "milestone"
  const isPerformanceGoal = goal.goal_type === "best_min" || goal.goal_type === "best_max"
  const targetPrefix = isPerformanceGoal
    ? goal.goal_type === "best_min"
      ? "Under "
      : "Over "
    : ""

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={() => router.push("/goals")}
      >
        <ArrowLeft className="size-4" />
        Back to Goals
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl"
            style={{
              backgroundColor: categoryColor + "20",
              color: categoryColor,
            }}
          >
            <Target className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{goal.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <GoalStatusBadge status={goal.status} />
              <select
                className="h-7 rounded-md border border-input bg-background px-1.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={goal.status}
                onChange={(e) =>
                  handleStatusChange(e.target.value as GoalStatus)
                }
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setIsFormOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {goal.description && (
        <p className="mt-3 text-sm text-muted-foreground">{goal.description}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {isMilestone ? "Type" : "Target"}
            </p>
            <p className="text-lg font-semibold">
              {isMilestone
                ? "Milestone"
                : `${targetPrefix}${goal.target_value}${goal.unit ? ` ${goal.unit}` : ""}`}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-lg font-semibold">{formatDate(goal.start_date)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent>
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-lg font-semibold">
              {goal.end_date ? formatDate(goal.end_date) : "No end date"}
            </p>
          </CardContent>
        </Card>
        {goal.category && (
          <Card size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-lg font-semibold">{goal.category.title}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {progress && (
        <div className="mt-6">
          <GoalProgressBar
            percentage={progress.percentage}
            currentValue={isMilestone ? undefined : progress.current_value}
            targetValue={progress.target_value ?? undefined}
            unit={goal.unit}
            bestValue={progress.best_value}
            isPerformanceGoal={isPerformanceGoal}
            isMilestone={isMilestone}
          />
        </div>
      )}

      {!isMilestone && (
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Linked Habits
        </h2>

        {linkedHabits.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed p-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Link className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No habits linked to this goal yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsFormOpen(true)}
            >
              Edit Goal to Link Habits
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {linkedHabits.map((lh) => {
              const HabitIcon = ICON_MAP[lh.habit.icon] ?? Target
              return (
                <Card key={lh.id} size="sm">
                  <CardContent className="flex items-center gap-3">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: lh.habit.color + "20",
                        color: lh.habit.color,
                      }}
                    >
                      <HabitIcon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="truncate font-medium">
                        {lh.habit.title}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{CONTRIBUTION_LABELS[lh.contribution_mode]}</span>
                        {lh.weight !== 1 && (
                          <>
                            <span>&middot;</span>
                            <span>Weight: {lh.weight}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      )}

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        goal={goal}
        categories={categories}
        habits={habits}
        existingLinkedHabits={editingLinkedHabits}
        onSubmit={handleSubmit}
      />

      <DeleteGoalDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        goal={goal}
        onConfirm={handleDelete}
      />
    </div>
  )
}

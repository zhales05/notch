"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, CircleDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useGoals } from "@/hooks/use-goals"
import { useCategories } from "@/hooks/use-categories"
import { useHabits } from "@/hooks/use-habits"
import { useProfile } from "@/hooks/use-profile"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { GoalCard } from "@/components/goals/goal-card"
import { GoalFormDialog } from "@/components/goals/goal-form-dialog"
import { DeleteGoalDialog } from "@/components/goals/delete-goal-dialog"
import type {
  GoalWithCategory,
  GoalFormData,
  GoalStatus,
  GoalHabitFormEntry,
} from "@/lib/types/goals"

type StatusFilter = GoalStatus | "all"

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "abandoned", label: "Abandoned" },
]

export default function GoalsPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const {
    goals,
    progressMap,
    isLoading,
    error,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
    fetchGoalDetail,
  } = useGoals(statusFilter === "all" ? undefined : statusFilter)

  const { profile } = useProfile()
  const { categories } = useCategories()
  const { habits } = useHabits()

  const isFreeUser = profile?.plan === "free"

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<GoalWithCategory | null>(null)
  const [editingLinkedHabits, setEditingLinkedHabits] = useState<
    GoalHabitFormEntry[]
  >([])
  const [deletingGoal, setDeletingGoal] = useState<GoalWithCategory | null>(
    null
  )

  function handleNewGoal() {
    setEditingGoal(null)
    setEditingLinkedHabits([])
    setIsFormOpen(true)
  }

  async function handleEdit(goal: GoalWithCategory) {
    // Fetch linked habits for edit mode
    const detail = await fetchGoalDetail(goal.id)
    if (detail) {
      setEditingGoal(goal)
      setEditingLinkedHabits(
        detail.linkedHabits.map((lh) => ({
          habit_id: lh.habit_id,
          contribution_mode: lh.contribution_mode,
          weight: lh.weight,
        }))
      )
      setIsFormOpen(true)
    }
  }

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingGoal(null)
      setEditingLinkedHabits([])
    }
  }

  async function handleSubmit(data: GoalFormData) {
    if (editingGoal) {
      const result = await updateGoal(editingGoal.id, data)
      if (!result) throw new Error("Update failed")
    } else {
      const result = await createGoal(data)
      if (!result) throw new Error("Create failed")
    }
  }

  async function handleDelete() {
    if (!deletingGoal) return
    const success = await deleteGoal(deletingGoal.id)
    if (!success) throw new Error("Delete failed")
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        {!isFreeUser && (
          <Button onClick={handleNewGoal}>
            <Plus className="size-4" />
            New Goal
          </Button>
        )}
      </div>

      {isFreeUser && (
        <div className="mt-4">
          <UpgradePrompt
            title="Goals are a Premium feature."
            description="Upgrade to Premium to create and track goals."
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "secondary" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {error && error !== "GOALS_BLOCKED" && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {error === "GOALS_BLOCKED" && !isFreeUser && (
        <div className="mt-4">
          <UpgradePrompt
            title="Goals are a Premium feature."
            description="Upgrade to Premium to create and track goals."
          />
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <CircleDot className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-medium">No goals yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first goal to start tracking progress.
          </p>
          {!isFreeUser && (
            <Button className="mt-4" onClick={handleNewGoal}>
              <Plus className="size-4" />
              Create Goal
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={progressMap[goal.id]}
              onEdit={() => handleEdit(goal)}
              onDelete={() => setDeletingGoal(goal)}
              onStatusChange={(status) => updateGoalStatus(goal.id, status)}
              onClick={() => router.push(`/goals/${goal.id}`)}
            />
          ))}
        </div>
      )}

      <GoalFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        goal={editingGoal}
        categories={categories}
        habits={habits}
        existingLinkedHabits={editingLinkedHabits}
        onSubmit={handleSubmit}
      />

      <DeleteGoalDialog
        open={deletingGoal !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingGoal(null)
        }}
        goal={deletingGoal}
        onConfirm={handleDelete}
      />
    </div>
  )
}

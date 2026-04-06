"use client"

import { useMemo, useState, useCallback } from "react"
import { Plus, AlignJustify } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useHabits } from "@/hooks/use-habits"
import { useCategories } from "@/hooks/use-categories"
import { useGoals } from "@/hooks/use-goals"
import { useProfile } from "@/hooks/use-profile"
import { HabitCard } from "@/components/habits/habit-card"
import { HabitFormDialog } from "@/components/habits/habit-form-dialog"
import { ArchiveHabitDialog } from "@/components/habits/archive-habit-dialog"
import { UpgradePrompt } from "@/components/upgrade-prompt"
import { createClient } from "@/lib/supabase/client"
import type { HabitWithCategory, HabitFormData } from "@/lib/types/habits"

export default function HabitsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const {
    habits,
    isLoading,
    error,
    activeHabitCount,
    createHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
  } = useHabits(showArchived)

  const { categories } = useCategories()
  const { goals } = useGoals("active")
  const { profile } = useProfile()

  const isFreeUser = profile?.plan === "free"

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<HabitWithCategory | null>(
    null
  )
  const [editingGoalIds, setEditingGoalIds] = useState<string[]>([])
  const [archivingHabit, setArchivingHabit] =
    useState<HabitWithCategory | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      {
        category: { id: string; title: string; color: string; icon: string } | null
        habits: HabitWithCategory[]
      }
    >()

    for (const habit of habits) {
      const key = habit.category_id ?? "__uncategorized__"
      if (!map.has(key)) {
        map.set(key, { category: habit.category ?? null, habits: [] })
      }
      map.get(key)!.habits.push(habit)
    }

    return Array.from(map.values()).sort((a, b) => {
      if (!a.category) return 1
      if (!b.category) return -1
      return a.category.title.localeCompare(b.category.title)
    })
  }, [habits])

  const supabase = createClient()

  function handleNewHabit() {
    if (isFreeUser && activeHabitCount >= 4) {
      setShowUpgrade(true)
      return
    }
    setShowUpgrade(false)
    setEditingGoalIds([])
    setIsFormOpen(true)
  }

  const handleEdit = useCallback(async (habit: HabitWithCategory) => {
    // Fetch existing goal links for this habit
    const { data } = await supabase
      .from("goal_habits")
      .select("goal_id")
      .eq("habit_id", habit.id)

    setEditingGoalIds(data?.map((gh) => gh.goal_id) ?? [])
    setEditingHabit(habit)
    setIsFormOpen(true)
  }, [supabase])

  function handleFormClose(open: boolean) {
    setIsFormOpen(open)
    if (!open) {
      setEditingHabit(null)
      setEditingGoalIds([])
    }
  }

  async function handleSubmit(data: HabitFormData) {
    if (editingHabit) {
      const result = await updateHabit(editingHabit.id, data)
      if (!result) throw new Error("Update failed")
    } else {
      const result = await createHabit(data)
      if (!result) throw new Error("Create failed")
    }
  }

  async function handleArchive() {
    if (!archivingHabit) return
    const success = await archiveHabit(archivingHabit.id)
    if (!success) throw new Error("Archive failed")
  }

  const isHabitLimitError = error === "HABIT_LIMIT"

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Habits</h1>
        <div className="flex items-center gap-2">
          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Hide Archived" : "Show Archived"}
          </Button>
          <Button onClick={handleNewHabit}>
            <Plus className="size-4" />
            New Habit
          </Button>
        </div>
      </div>

      {error && !isHabitLimitError && (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      )}

      {(showUpgrade || isHabitLimitError) && (
        <div className="mt-4">
          <UpgradePrompt
            title="You've reached the free plan limit of 4 habits."
            description="Upgrade to Premium for unlimited habits."
          />
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-xl" />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
            <AlignJustify className="size-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-medium">No habits yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first habit to start tracking.
          </p>
          <Button className="mt-4" onClick={handleNewHabit}>
            <Plus className="size-4" />
            Create Habit
          </Button>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {grouped.map((group) => (
            <section key={group.category?.id ?? "__uncategorized__"}>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                {group.category?.title ?? "Uncategorized"}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    onEdit={() => handleEdit(habit)}
                    onArchive={() => setArchivingHabit(habit)}
                    onUnarchive={() => unarchiveHabit(habit.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <HabitFormDialog
        open={isFormOpen}
        onOpenChange={handleFormClose}
        habit={editingHabit}
        categories={categories}
        goals={goals}
        existingGoalIds={editingGoalIds}
        onSubmit={handleSubmit}
      />

      <ArchiveHabitDialog
        open={archivingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setArchivingHabit(null)
        }}
        habit={archivingHabit}
        onConfirm={handleArchive}
      />
    </div>
  )
}

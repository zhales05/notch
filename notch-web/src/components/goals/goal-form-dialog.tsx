"use client"

import { useEffect, useState } from "react"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GoalHabitRow } from "./goal-habit-row"
import { formatDateKey } from "@/lib/date-utils"
import type { Category } from "@/lib/types/categories"
import type { HabitWithCategory } from "@/lib/types/habits"
import type {
  GoalWithCategory,
  GoalFormData,
  GoalHabitFormEntry,
  GoalType,
} from "@/lib/types/goals"

interface GoalFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal: GoalWithCategory | null
  categories: Category[]
  habits: HabitWithCategory[]
  existingLinkedHabits?: GoalHabitFormEntry[]
  onSubmit: (data: GoalFormData) => Promise<void>
}

export function GoalFormDialog({
  open,
  onOpenChange,
  goal,
  categories,
  habits,
  existingLinkedHabits = [],
  onSubmit,
}: GoalFormDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [goalType, setGoalType] = useState<GoalType>("accumulate")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [targetValue, setTargetValue] = useState("")
  const [unit, setUnit] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [linkedHabits, setLinkedHabits] = useState<GoalHabitFormEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = goal !== null

  useEffect(() => {
    if (open) {
      if (goal) {
        setTitle(goal.title)
        setDescription(goal.description ?? "")
        setGoalType(goal.goal_type ?? "accumulate")
        setCategoryId(goal.category_id)
        setTargetValue(String(goal.target_value))
        setUnit(goal.unit ?? "")
        setStartDate(goal.start_date)
        setEndDate(goal.end_date ?? "")
        setLinkedHabits(existingLinkedHabits)
      } else {
        setTitle("")
        setDescription("")
        setGoalType("accumulate")
        setCategoryId(null)
        setTargetValue("")
        setUnit("")
        setStartDate(formatDateKey(new Date()))
        setEndDate("")
        setLinkedHabits([])
      }
      setError(null)
    }
  }, [open, goal, existingLinkedHabits])

  function addHabitRow() {
    setLinkedHabits((prev) => [
      ...prev,
      { habit_id: "", contribution_mode: "count", weight: 1 },
    ])
  }

  function updateHabitRow(index: number, entry: GoalHabitFormEntry) {
    setLinkedHabits((prev) => prev.map((e, i) => (i === index ? entry : e)))
  }

  function removeHabitRow(index: number) {
    setLinkedHabits((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError("Title is required")
      return
    }

    const numericTarget = parseFloat(targetValue)
    if (!targetValue || isNaN(numericTarget) || numericTarget <= 0) {
      setError("Target value must be a positive number")
      return
    }

    if (!startDate) {
      setError("Start date is required")
      return
    }

    // Validate linked habits have selections
    const validLinkedHabits = linkedHabits.filter((lh) => lh.habit_id)
    const hasEmptyRows = linkedHabits.some((lh) => !lh.habit_id)
    if (hasEmptyRows && linkedHabits.length > 0) {
      setError("Please select a habit for each linked row or remove empty rows")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit({
        title: trimmedTitle,
        description: description.trim(),
        goal_type: goalType,
        category_id: categoryId,
        target_value: numericTarget,
        unit: unit.trim(),
        start_date: startDate,
        end_date: endDate,
        linked_habits: validLinkedHabits,
      })
      onOpenChange(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const alreadyLinkedIds = linkedHabits.map((lh) => lh.habit_id).filter(Boolean)
  const activeHabits = habits.filter((h) => !h.archived_at)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Goal" : "New Goal"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your goal details."
              : "Create a new goal to track your progress."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid max-h-[60vh] gap-4 overflow-y-auto px-1"
        >
          <div className="grid gap-2">
            <Label htmlFor="goal-title">Title</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Run 50 miles this month"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-description">Description</Label>
            <textarea
              id="goal-description"
              className="field-sizing-content min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-type">Goal Type</Label>
            <select
              id="goal-type"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={goalType}
              onChange={(e) => setGoalType(e.target.value as GoalType)}
            >
              <option value="accumulate">Accumulate toward target</option>
              <option value="best_min">Get under target (e.g. race time)</option>
              <option value="best_max">Get over target (e.g. max lift)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-category">Category</Label>
            <select
              id="goal-category"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="goal-target">Target Value</Label>
              <Input
                id="goal-target"
                type="number"
                step="any"
                min="0.01"
                placeholder="e.g. 50"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-unit">Unit</Label>
              <Input
                id="goal-unit"
                placeholder="e.g. miles, pages"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="goal-start">Start Date</Label>
              <Input
                id="goal-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-end">End Date</Label>
              <Input
                id="goal-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Linked Habits</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHabitRow}
                disabled={activeHabits.length === 0}
              >
                <Plus className="size-3.5" />
                Add Habit
              </Button>
            </div>
            {linkedHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No habits linked yet. Add habits to track progress
                automatically.
              </p>
            ) : (
              <div className="grid gap-2">
                {linkedHabits.map((entry, index) => (
                  <GoalHabitRow
                    key={index}
                    entry={entry}
                    habits={activeHabits}
                    alreadyLinkedIds={alreadyLinkedIds}
                    goalType={goalType}
                    onChange={(updated) => updateHabitRow(index, updated)}
                    onRemove={() => removeHabitRow(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

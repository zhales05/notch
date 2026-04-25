"use client"

import { useEffect, useState } from "react"
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
import { ColorPicker } from "@/components/categories/color-picker"
import { IconPicker } from "@/components/categories/icon-picker"
import type { Category } from "@/lib/types/categories"
import type {
  HabitWithCategory,
  HabitFormData,
  LogType,
  FrequencyType,
  FrequencyConfig,
  TargetDirection,
} from "@/lib/types/habits"
import type { GoalWithCategory } from "@/lib/types/goals"

interface HabitFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: HabitWithCategory | null
  categories: Category[]
  goals?: GoalWithCategory[]
  existingGoalIds?: string[]
  onSubmit: (data: HabitFormData) => Promise<void>
}

export function HabitFormDialog({
  open,
  onOpenChange,
  habit,
  categories,
  goals = [],
  existingGoalIds = [],
  onSubmit,
}: HabitFormDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [logType, setLogType] = useState<LogType>("boolean")
  const [frequency, setFrequency] = useState<FrequencyType>("daily")
  const [specificDays, setSpecificDays] = useState<number[]>([])
  const [xPerPeriodTimes, setXPerPeriodTimes] = useState(3)
  const [xPerPeriodPeriod, setXPerPeriodPeriod] = useState<"week" | "month">("week")
  const [everyNWeeks, setEveryNWeeks] = useState(2)
  const [dailyTarget, setDailyTarget] = useState("")
  const [targetDirection, setTargetDirection] = useState<TargetDirection>("at_least")
  const [unit, setUnit] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [icon, setIcon] = useState("check")
  const [startDate, setStartDate] = useState("")
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = habit !== null

  useEffect(() => {
    if (open) {
      if (habit) {
        setTitle(habit.title)
        setDescription(habit.description ?? "")
        setCategoryId(habit.category_id)
        setLogType(habit.log_type)
        setUnit(habit.unit ?? "")
        if (habit.log_type === "time" && habit.daily_target != null) {
          const h = Math.floor(habit.daily_target / 60)
          const m = habit.daily_target % 60
          setDailyTarget(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
        } else {
          setDailyTarget(habit.daily_target?.toString() ?? "")
        }
        setTargetDirection(habit.target_direction ?? "at_least")
        setColor(habit.color)
        setIcon(habit.icon)
        setStartDate(habit.start_date)
        setSelectedGoalIds(existingGoalIds)

        // Normalize legacy weekly/monthly into x_per_period for the form
        if (habit.frequency === "weekly") {
          setFrequency("x_per_period")
          setXPerPeriodTimes(1)
          setXPerPeriodPeriod("week")
        } else if (habit.frequency === "monthly") {
          setFrequency("x_per_period")
          setXPerPeriodTimes(1)
          setXPerPeriodPeriod("month")
        } else {
          setFrequency(habit.frequency)
        }

        // Restore config fields
        const cfg = habit.frequency_config
        if (habit.frequency === "specific_days" && cfg && "days" in cfg) {
          setSpecificDays(cfg.days)
        } else if (habit.frequency === "x_per_period" && cfg && "times" in cfg) {
          setXPerPeriodTimes(cfg.times)
          setXPerPeriodPeriod(cfg.period)
        } else if (habit.frequency === "every_n_weeks" && cfg && "interval_weeks" in cfg) {
          setEveryNWeeks(cfg.interval_weeks)
        }
      } else {
        setTitle("")
        setDescription("")
        setCategoryId(null)
        setLogType("boolean")
        setFrequency("daily")
        setSpecificDays([])
        setXPerPeriodTimes(3)
        setXPerPeriodPeriod("week")
        setEveryNWeeks(2)
        setUnit("")
        setDailyTarget("")
        setTargetDirection("at_least")
        setColor("#6366f1")
        setIcon("check")
        const now = new Date()
        setStartDate(
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
        )
        setSelectedGoalIds([])
      }
      setError(null)
    }
  }, [open, habit, existingGoalIds])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmed = title.trim()
    if (!trimmed) {
      setError("Title is required")
      return
    }

    if (frequency === "specific_days" && specificDays.length === 0) {
      setError("Select at least one day")
      return
    }

    if (!startDate) {
      setError("Start date is required")
      return
    }

    setIsSubmitting(true)
    setError(null)

    let frequencyConfig: FrequencyConfig = null
    if (frequency === "specific_days") {
      frequencyConfig = { days: specificDays }
    } else if (frequency === "x_per_period") {
      frequencyConfig = { times: xPerPeriodTimes, period: xPerPeriodPeriod }
    } else if (frequency === "every_n_weeks") {
      // Use current Monday as anchor for new habits
      const now = new Date()
      const day = now.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(now)
      monday.setDate(monday.getDate() + diff)
      const anchor = habit?.frequency === "every_n_weeks" && habit.frequency_config && "anchor_date" in habit.frequency_config
        ? habit.frequency_config.anchor_date
        : `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`
      frequencyConfig = { interval_weeks: everyNWeeks, anchor_date: anchor }
    }

    // Parse daily target
    let parsedDailyTarget: number | null = null
    if (logType === "time" && dailyTarget) {
      // Convert HH:MM to minutes since midnight
      const [h, m] = dailyTarget.split(":").map(Number)
      parsedDailyTarget = h * 60 + m
    } else if (logType === "value" && dailyTarget) {
      const num = parseFloat(dailyTarget)
      if (!isNaN(num)) parsedDailyTarget = num
    }

    try {
      await onSubmit({
        title: trimmed,
        description: description.trim(),
        category_id: categoryId,
        log_type: logType,
        frequency,
        frequency_config: frequencyConfig,
        unit: unit.trim(),
        daily_target: parsedDailyTarget,
        target_direction: targetDirection,
        color,
        icon,
        start_date: startDate,
        goal_ids: selectedGoalIds,
      })
      onOpenChange(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Habit" : "New Habit"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your habit details."
              : "Create a new habit to start tracking."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="grid max-h-[60vh] gap-4 overflow-y-auto px-1"
        >
          <div className="grid gap-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input
              id="habit-title"
              placeholder="e.g. Morning Run, Read 30 min"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-description">Description</Label>
            <textarea
              id="habit-description"
              className="field-sizing-content min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-category">Category</Label>
            <select
              id="habit-category"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={categoryId ?? ""}
              onChange={(e) =>
                setCategoryId(e.target.value || null)
              }
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label>Log Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={logType === "boolean" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setLogType("boolean")}
              >
                Yes / No
              </Button>
              <Button
                type="button"
                variant={logType === "value" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setLogType("value")}
              >
                Value
              </Button>
              <Button
                type="button"
                variant={logType === "time" ? "default" : "outline"}
                size="sm"
                className="flex-1"
                onClick={() => setLogType("time")}
              >
                Time
              </Button>
            </div>
          </div>

          {logType === "value" && (
            <div className="grid gap-2">
              <Label htmlFor="habit-unit">Unit</Label>
              <Input
                id="habit-unit"
                placeholder="e.g. minutes, pages, glasses"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          )}

          {(logType === "value" || logType === "time") && (
            <div className="grid gap-2">
              <Label htmlFor="habit-daily-target">
                Daily Target {logType === "time" ? "(e.g. arrive by 8:30)" : unit ? `(${unit})` : ""}
              </Label>
              {logType === "time" ? (
                <Input
                  id="habit-daily-target"
                  type="time"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                />
              ) : (
                <Input
                  id="habit-daily-target"
                  type="number"
                  placeholder="e.g. 64"
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                />
              )}
              {dailyTarget && logType === "value" && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={targetDirection === "at_least" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setTargetDirection("at_least")}
                  >
                    At least
                  </Button>
                  <Button
                    type="button"
                    variant={targetDirection === "at_most" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => setTargetDirection("at_most")}
                  >
                    At most
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label>Frequency</Label>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["daily", "Every day"],
                ["specific_days", "Specific days"],
                ["x_per_period", "X times per..."],
                ["every_n_weeks", "Every N weeks"],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={frequency === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFrequency(value)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {frequency === "specific_days" && (
              <div className="flex gap-1 pt-1">
                {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map(
                  (dayLabel, dayIndex) => (
                    <Button
                      key={dayIndex}
                      type="button"
                      variant={specificDays.includes(dayIndex) ? "default" : "outline"}
                      size="sm"
                      className="h-8 flex-1 px-0 text-xs"
                      onClick={() =>
                        setSpecificDays((prev) =>
                          prev.includes(dayIndex)
                            ? prev.filter((d) => d !== dayIndex)
                            : [...prev, dayIndex]
                        )
                      }
                    >
                      {dayLabel}
                    </Button>
                  )
                )}
              </div>
            )}

            {frequency === "x_per_period" && (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="number"
                  min={1}
                  max={31}
                  className="w-20"
                  value={xPerPeriodTimes}
                  onChange={(e) => setXPerPeriodTimes(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <span className="text-sm text-muted-foreground">times per</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={xPerPeriodPeriod === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setXPerPeriodPeriod("week")}
                  >
                    Week
                  </Button>
                  <Button
                    type="button"
                    variant={xPerPeriodPeriod === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setXPerPeriodPeriod("month")}
                  >
                    Month
                  </Button>
                </div>
              </div>
            )}

            {frequency === "every_n_weeks" && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Every</span>
                <Input
                  type="number"
                  min={2}
                  max={52}
                  className="w-20"
                  value={everyNWeeks}
                  onChange={(e) => setEveryNWeeks(Math.max(2, parseInt(e.target.value) || 2))}
                />
                <span className="text-sm text-muted-foreground">weeks</span>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-start-date">Start date</Label>
            <Input
              id="habit-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The habit only counts from this day forward. Pick a future day to
              schedule it.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div className="grid gap-2">
            <Label>Icon</Label>
            <IconPicker value={icon} onChange={setIcon} color={color} />
          </div>

          {goals.filter((g) => g.goal_type !== "milestone").length > 0 && (
            <div className="grid gap-2">
              <Label>Link to Goals</Label>
              <div className="grid gap-1.5 rounded-md border border-input p-2">
                {goals.filter((g) => g.goal_type !== "milestone").map((goal) => (
                  <label
                    key={goal.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      className="size-4 rounded border-input"
                      checked={selectedGoalIds.includes(goal.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGoalIds((prev) => [...prev, goal.id])
                        } else {
                          setSelectedGoalIds((prev) =>
                            prev.filter((id) => id !== goal.id)
                          )
                        }
                      }}
                    />
                    <span>{goal.title}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected goals will automatically track this habit&apos;s
                progress.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save Changes"
                  : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

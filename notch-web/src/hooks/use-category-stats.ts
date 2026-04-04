"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey } from "@/lib/date-utils"
import { getDateRangeStart } from "@/lib/analytics-utils"
import { useHabits } from "./use-habits"
import { useCategories } from "./use-categories"
import type { DateRange, CategoryStat } from "@/lib/types/analytics"

interface LogRow {
  habit_id: string
  logged_at: string
}

export function useCategoryStats(dateRange: DateRange) {
  const supabase = useMemo(() => createClient(), [])
  const { habits, isLoading: habitsLoading } = useHabits()
  const { categories, isLoading: categoriesLoading } = useCategories()
  const [logs, setLogs] = useState<LogRow[]>([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayKey = formatDateKey(today)
  const rangeStart = useMemo(
    () => getDateRangeStart(dateRange),
    [dateRange]
  )

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("habit_logs")
      .select("habit_id, logged_at")
      .gte("logged_at", rangeStart)
      .lte("logged_at", todayKey)

    if (fetchError) {
      setError(fetchError.message)
      setLogs([])
    } else {
      setLogs((data as LogRow[]) ?? [])
    }

    setLogsLoading(false)
  }, [supabase, rangeStart, todayKey])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const isLoading = habitsLoading || categoriesLoading || logsLoading

  const categoryStats: CategoryStat[] = useMemo(() => {
    if (isLoading || habits.length === 0) return []

    // Count days in range
    const start = new Date(rangeStart)
    const end = new Date(todayKey)
    const daysInRange =
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    // Group active habits by category
    const activeHabits = habits.filter((h) => !h.archived_at)
    const habitsByCategory = new Map<string, string[]>()
    for (const h of activeHabits) {
      const catId = h.category_id ?? "uncategorized"
      const list = habitsByCategory.get(catId) ?? []
      list.push(h.id)
      habitsByCategory.set(catId, list)
    }

    // Count logs per habit
    const logsByHabit = new Map<string, number>()
    for (const l of logs) {
      logsByHabit.set(l.habit_id, (logsByHabit.get(l.habit_id) ?? 0) + 1)
    }

    const results: CategoryStat[] = []

    for (const [catId, habitIds] of Array.from(habitsByCategory.entries())) {
      const category = categories.find((c) => c.id === catId)

      const totalLogs = habitIds.reduce(
        (sum, hid) => sum + (logsByHabit.get(hid) ?? 0),
        0
      )
      const totalDue = habitIds.length * daysInRange
      const completionRate =
        totalDue > 0 ? Math.round((totalLogs / totalDue) * 100) : 0

      // Per-habit breakdown
      const habitBreakdowns = habitIds.map((hid) => {
        const habit = activeHabits.find((h) => h.id === hid)!
        const habitLogs = logsByHabit.get(hid) ?? 0
        const habitRate =
          daysInRange > 0 ? Math.round((habitLogs / daysInRange) * 100) : 0
        return {
          habitId: hid,
          habitTitle: habit.title,
          habitColor: habit.color,
          completionRate: Math.min(habitRate, 100),
        }
      })

      results.push({
        categoryId: catId,
        categoryTitle: category?.title ?? "Uncategorized",
        categoryColor: category?.color ?? "#6366f1",
        categoryIcon: category?.icon ?? "folder",
        habitCount: habitIds.length,
        completionRate: Math.min(completionRate, 100),
        totalLogs,
        totalDue,
        habits: habitBreakdowns,
      })
    }

    // Sort by completion rate descending
    results.sort((a, b) => b.completionRate - a.completionRate)

    return results
  }, [isLoading, habits, categories, logs, rangeStart, todayKey])

  return { categoryStats, isLoading, error }
}

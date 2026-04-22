"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useHabits } from "./use-habits"
import { useLogs } from "./use-logs"
import { isHabitDueOnDate } from "@/lib/frequency-utils"
import type { HabitWithLog } from "@/lib/types/logs"
import type { HabitWithCategory } from "@/lib/types/habits"

export interface CategoryProgress {
  categoryId: string | null
  categoryTitle: string
  categoryColor: string
  completed: number
  total: number
}

function habitCompletion(h: HabitWithLog): number {
  if (h.log === null) return 0
  if (h.log_type === "boolean" || h.daily_target == null) return 1
  const current = h.log.value ?? 0
  if (h.target_direction === "at_most") {
    return current <= h.daily_target ? 1 : 0
  }
  return Math.min(1, current / h.daily_target)
}

export function useTodayHabits(date: string) {
  const { habits, isLoading: habitsLoading } = useHabits()
  const { logs, isLoading: logsLoading, error, upsertLog, deleteLog } = useLogs(date)

  // Track how many logs each period-based habit has this period
  const [periodLogCounts, setPeriodLogCounts] = useState<Map<string, number>>(new Map())
  const [periodLoading, setPeriodLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])

  // Compute due results for all active habits that have started by `date`
  const dueResults = useMemo(() => {
    const selectedDate = new Date(date + "T00:00:00")
    const map = new Map<string, ReturnType<typeof isHabitDueOnDate>>()
    for (const h of habits) {
      if (h.archived_at) continue
      if (date < h.start_date) continue
      map.set(h.id, isHabitDueOnDate(h, selectedDate))
    }
    return map
  }, [habits, date])

  // Fetch period logs for habits that have periodInfo (count-based frequencies)
  useEffect(() => {
    const habitsWithPeriod = habits.filter((h) => {
      if (h.archived_at) return false
      const result = dueResults.get(h.id)
      return result?.periodInfo != null
    })

    if (habitsWithPeriod.length === 0) {
      setPeriodLogCounts(new Map())
      return
    }

    async function fetchPeriodLogs() {
      setPeriodLoading(true)
      const counts = new Map<string, number>()

      // Group by period boundaries to batch queries
      const periodGroups = new Map<string, string[]>()
      for (const h of habitsWithPeriod) {
        const info = dueResults.get(h.id)!.periodInfo!
        const key = `${info.periodStart}_${info.periodEnd}`
        if (!periodGroups.has(key)) periodGroups.set(key, [])
        periodGroups.get(key)!.push(h.id)
      }

      for (const [key, habitIds] of Array.from(periodGroups.entries())) {
        const [periodStart, periodEnd] = key.split("_")
        const { data } = await supabase
          .from("habit_logs")
          .select("habit_id")
          .in("habit_id", habitIds)
          .gte("logged_at", periodStart)
          .lte("logged_at", periodEnd)

        // Count logs per habit
        const localCounts = new Map<string, number>()
        data?.forEach((row) => {
          localCounts.set(row.habit_id, (localCounts.get(row.habit_id) ?? 0) + 1)
        })
        for (const id of habitIds) {
          counts.set(id, localCounts.get(id) ?? 0)
        }
      }

      setPeriodLogCounts(counts)
      setPeriodLoading(false)
    }

    fetchPeriodLogs()
  }, [habits, date, supabase, dueResults])

  // Filter habits by frequency using isHabitDueOnDate
  const filteredHabits = useMemo(() => {
    return habits.filter((h) => {
      if (h.archived_at) return false
      if (date < h.start_date) return false

      const result = dueResults.get(h.id)
      if (!result) return false

      // Not due on this date (e.g. specific_days, every_n_weeks off-week)
      if (!result.isDue) return false

      // For period-based habits, check if target already met
      if (result.periodInfo) {
        const hasLogToday = logs.some((l) => l.habit_id === h.id)
        if (hasLogToday) return true // always show if logged today
        const count = periodLogCounts.get(h.id) ?? 0
        return count < result.periodInfo.targetCount
      }

      return true
    })
  }, [habits, date, logs, dueResults, periodLogCounts])

  // Merge habits with their log for the selected date
  const habitsWithLogs: HabitWithLog[] = useMemo(() => {
    return filteredHabits.map((habit) => ({
      ...habit,
      log: logs.find((l) => l.habit_id === habit.id) ?? null,
    }))
  }, [filteredHabits, logs])

  const completedCount = useMemo(
    () => habitsWithLogs.reduce((sum, h) => sum + habitCompletion(h), 0),
    [habitsWithLogs]
  )

  const totalCount = habitsWithLogs.length

  // Category breakdown
  const categoryProgress: CategoryProgress[] = useMemo(() => {
    const map = new Map<string | null, { habits: HabitWithLog[]; cat: HabitWithCategory["category"] }>()

    for (const h of habitsWithLogs) {
      const key = h.category_id
      if (!map.has(key)) {
        map.set(key, { habits: [], cat: h.category })
      }
      map.get(key)!.habits.push(h)
    }

    return Array.from(map.entries()).map(([categoryId, { habits: catHabits, cat }]) => ({
      categoryId,
      categoryTitle: cat?.title ?? "Uncategorized",
      categoryColor: cat?.color ?? "#6b7280",
      completed: catHabits.reduce((sum, h) => sum + habitCompletion(h), 0),
      total: catHabits.length,
    }))
  }, [habitsWithLogs])

  const toggleBoolean = useCallback(
    async (habitId: string) => {
      const existingLog = logs.find((l) => l.habit_id === habitId)
      if (existingLog) {
        await deleteLog(habitId)
      } else {
        await upsertLog(habitId, 1)
      }
    },
    [logs, upsertLog, deleteLog]
  )

  const updateValue = useCallback(
    async (habitId: string, value: number) => {
      if (value === 0 || isNaN(value)) {
        await deleteLog(habitId)
      } else {
        await upsertLog(habitId, value)
      }
    },
    [upsertLog, deleteLog]
  )

  return {
    habitsWithLogs,
    completedCount,
    totalCount,
    categoryProgress,
    isLoading: habitsLoading || logsLoading || periodLoading,
    error,
    toggleBoolean,
    updateValue,
  }
}

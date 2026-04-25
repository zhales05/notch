"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey } from "@/lib/date-utils"

/**
 * Fetches completion rates for a set of habits.
 * Uses min(30, days since habit started) as the denominator.
 * Returns a Map<habitId, percentage (0–100)>.
 */
export function useCompletionRates(
  habits: { id: string; start_date: string }[]
) {
  const habitIds = useMemo(() => habits.map((h) => h.id), [habits])
  const [rates, setRates] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const idsKey = habitIds.slice().sort().join(",")

  useEffect(() => {
    if (habitIds.length === 0) {
      setRates(new Map())
      return
    }

    async function fetchRates() {
      setIsLoading(true)

      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

      const { data, error } = await supabase
        .from("habit_logs")
        .select("habit_id, logged_at")
        .in("habit_id", habitIds)
        .gte("logged_at", formatDateKey(thirtyDaysAgo))
        .lte("logged_at", formatDateKey(today))

      if (error) {
        setIsLoading(false)
        return
      }

      // Count unique days per habit
      const dayCounts = new Map<string, Set<string>>()
      for (const row of data ?? []) {
        if (!dayCounts.has(row.habit_id)) {
          dayCounts.set(row.habit_id, new Set())
        }
        dayCounts.get(row.habit_id)!.add(row.logged_at)
      }

      const result = new Map<string, number>()
      const todayKey = formatDateKey(today)
      for (const habit of habits) {
        const days = dayCounts.get(habit.id)?.size ?? 0
        // If the habit hasn't started yet, there are no eligible days.
        if (habit.start_date > todayKey) {
          result.set(habit.id, 0)
          continue
        }
        const startMs = new Date(habit.start_date + "T00:00:00").getTime()
        const daysSinceStart = Math.max(
          1,
          Math.floor((today.getTime() - startMs) / (1000 * 60 * 60 * 24)) + 1
        )
        const denominator = Math.min(30, daysSinceStart)
        result.set(habit.id, Math.round((days / denominator) * 100))
      }

      setRates(result)
      setIsLoading(false)
    }

    fetchRates()
  }, [idsKey, supabase])

  return { rates, isLoading }
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey } from "@/lib/date-utils"

/**
 * Fetches completion rates for a set of habits.
 * Uses min(30, days since habit created) as the denominator.
 * Returns a Map<habitId, percentage (0–100)>.
 */
export function useCompletionRates(
  habits: { id: string; created_at: string }[]
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
      for (const habit of habits) {
        const days = dayCounts.get(habit.id)?.size ?? 0
        const daysSinceCreated = Math.max(
          1,
          Math.ceil(
            (today.getTime() - new Date(habit.created_at).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
        const denominator = Math.min(30, daysSinceCreated)
        result.set(habit.id, Math.round((days / denominator) * 100))
      }

      setRates(result)
      setIsLoading(false)
    }

    fetchRates()
  }, [idsKey, supabase])

  return { rates, isLoading }
}

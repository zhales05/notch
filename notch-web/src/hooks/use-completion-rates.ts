"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey } from "@/lib/date-utils"

/**
 * Fetches 30-day completion rates for a set of habit IDs.
 * Returns a Map<habitId, percentage (0–100)>.
 */
export function useCompletionRates(habitIds: string[]) {
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
      for (const id of habitIds) {
        const days = dayCounts.get(id)?.size ?? 0
        result.set(id, Math.round((days / 30) * 100))
      }

      setRates(result)
      setIsLoading(false)
    }

    fetchRates()
  }, [idsKey, supabase])

  return { rates, isLoading }
}

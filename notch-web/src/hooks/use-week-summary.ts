"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getLastNDays, getDayLabel, parseDateKey } from "@/lib/date-utils"

export interface DaySummary {
  date: string
  label: string
  percentage: number
}

export function useWeekSummary(date: string, totalHabits: number) {
  const [data, setData] = useState<DaySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  const days = useMemo(() => getLastNDays(7, parseDateKey(date)), [date])

  const fetchWeekData = useCallback(async () => {
    if (totalHabits === 0) {
      setData(days.map((d) => ({
        date: d,
        label: getDayLabel(parseDateKey(d)),
        percentage: 0,
      })))
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const { data: logData, error } = await supabase
      .from("habit_logs")
      .select("logged_at")
      .gte("logged_at", days[0])
      .lte("logged_at", days[days.length - 1])

    if (error) {
      setData([])
      setIsLoading(false)
      return
    }

    // Count logs per day
    const countsPerDay = new Map<string, number>()
    for (const row of logData ?? []) {
      const d = row.logged_at as string
      countsPerDay.set(d, (countsPerDay.get(d) ?? 0) + 1)
    }

    setData(
      days.map((d) => ({
        date: d,
        label: getDayLabel(parseDateKey(d)),
        percentage: Math.round(
          ((countsPerDay.get(d) ?? 0) / totalHabits) * 100
        ),
      }))
    )

    setIsLoading(false)
  }, [supabase, days, totalHabits])

  useEffect(() => {
    fetchWeekData()
  }, [fetchWeekData])

  return { data, isLoading }
}

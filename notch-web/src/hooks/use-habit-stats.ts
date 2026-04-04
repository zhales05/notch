"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey, getLastNDays, parseDateKey } from "@/lib/date-utils"
import {
  getDateRangeStart,
  computeStreaks,
  computeHeatmapData,
  computeWeeklyTrend,
  computeMonthlyBars,
  computeDayOfWeekStats,
  getWeeksForRange,
  getMonthsForRange,
} from "@/lib/analytics-utils"
import type { DateRange, HabitStats } from "@/lib/types/analytics"

interface RawLog {
  logged_at: string
  value: number | null
}

export function useHabitStats(
  habitId: string | null,
  dateRange: DateRange,
  habitCreatedAt?: string
) {
  const supabase = useMemo(() => createClient(), [])
  const [logs, setLogs] = useState<RawLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayKey = formatDateKey(today)

  // For "all" range, expand heatmap up to 365 days
  const heatmapDays = useMemo(() => {
    if (dateRange === "all" && habitCreatedAt) {
      const created = parseDateKey(habitCreatedAt.slice(0, 10))
      const diffMs = today.getTime() - created.getTime()
      const daysSinceCreation = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
      return Math.min(daysSinceCreation, 365)
    }
    return 91
  }, [dateRange, habitCreatedAt, today])

  // Fetch window: max(heatmapDays, range) so heatmap always has data
  const fetchStart = useMemo(() => {
    const rangeStart = getDateRangeStart(dateRange, habitCreatedAt)
    const heatmapStart = getLastNDays(heatmapDays, today)[0]
    return rangeStart < heatmapStart ? rangeStart : heatmapStart
  }, [dateRange, habitCreatedAt, today, heatmapDays])

  const fetchLogs = useCallback(async () => {
    if (!habitId) {
      setLogs([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("habit_logs")
      .select("logged_at, value")
      .eq("habit_id", habitId)
      .gte("logged_at", fetchStart)
      .lte("logged_at", todayKey)
      .order("logged_at", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLogs([])
    } else {
      setLogs((data as RawLog[]) ?? [])
    }

    setIsLoading(false)
  }, [supabase, habitId, fetchStart, todayKey])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const stats: HabitStats | null = useMemo(() => {
    if (!habitId) return null

    const sortedDates = logs.map((l) => l.logged_at)
    const logMap = new Map<string, number | null>()
    for (const l of logs) {
      logMap.set(l.logged_at, l.value)
    }

    const { current, best } = computeStreaks(sortedDates)
    const heatmapData = computeHeatmapData(logMap, today, heatmapDays)

    // 30-day completion rate (always 30 days, regardless of range toggle)
    const last30 = new Set(getLastNDays(30, today))
    const logsIn30 = sortedDates.filter((d) => last30.has(d)).length
    const completionRate30d = Math.round((logsIn30 / 30) * 100)

    // Total logs in the selected range
    const rangeStart = getDateRangeStart(dateRange, habitCreatedAt)
    const totalLogs = sortedDates.filter((d) => d >= rangeStart).length

    // Daily average for value-type habits
    const valuesInRange = logs
      .filter((l) => l.logged_at >= rangeStart && l.value !== null)
      .map((l) => l.value as number)
    const dailyAvg =
      valuesInRange.length > 0
        ? Math.round(
            (valuesInRange.reduce((s, v) => s + v, 0) / valuesInRange.length) *
              10
          ) / 10
        : null

    // Last logged days ago
    const lastLoggedDaysAgo =
      sortedDates.length > 0
        ? Math.round(
            (today.getTime() - parseDateKey(sortedDates[sortedDates.length - 1]).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null

    // Best / toughest day of week
    const dayStats = computeDayOfWeekStats(sortedDates, logMap, rangeStart, today)
    const daysWithData = dayStats.filter((d) => d.rate > 0)
    const bestDay =
      daysWithData.length > 0
        ? daysWithData.reduce((a, b) => (b.rate > a.rate ? b : a))
        : null
    const toughestDay =
      daysWithData.length > 0
        ? daysWithData.reduce((a, b) => (b.rate < a.rate ? b : a))
        : null

    const weeks = getWeeksForRange(dateRange)
    const months = getMonthsForRange(dateRange)
    const weeklyTrend = computeWeeklyTrend(sortedDates, today, weeks, logMap)
    const monthlyBars = computeMonthlyBars(sortedDates, today, months, logMap)

    return {
      currentStreak: current,
      bestStreak: best,
      completionRate30d,
      totalLogs,
      dailyAvg,
      lastLoggedDaysAgo,
      bestDay,
      toughestDay,
      heatmapData,
      weeklyTrend,
      monthlyBars,
    }
  }, [logs, habitId, dateRange, habitCreatedAt, today, heatmapDays])

  return { stats, isLoading, error }
}

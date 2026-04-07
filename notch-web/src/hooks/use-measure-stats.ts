"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { formatDateKey, getLastNDays, parseDateKey } from "@/lib/date-utils"
import {
  getDateRangeStart,
  computeWeeklyTrend,
  computeMonthlyBars,
  computeHeatmapData,
  getWeeksForRange,
  getMonthsForRange,
} from "@/lib/analytics-utils"
import type { DateRange, HeatmapDay, WeeklyTrendPoint, MonthlyBarPoint } from "@/lib/types/analytics"

export interface MeasureStats {
  totalLogs: number
  dailyAvg: number | null
  minValue: number | null
  maxValue: number | null
  lastLoggedDaysAgo: number | null
  heatmapData: HeatmapDay[]
  weeklyTrend: WeeklyTrendPoint[]
  monthlyBars: MonthlyBarPoint[]
}

interface RawLog {
  logged_at: string
  value: number | null
}

export function useMeasureStats(
  measureId: string | null,
  dateRange: DateRange,
  measureCreatedAt?: string
) {
  const supabase = useMemo(() => createClient(), [])
  const [logs, setLogs] = useState<RawLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const todayKey = formatDateKey(today)

  const heatmapDays = useMemo(() => {
    if (dateRange === "all" && measureCreatedAt) {
      const created = parseDateKey(measureCreatedAt.slice(0, 10))
      const diffMs = today.getTime() - created.getTime()
      const daysSinceCreation = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
      return Math.min(daysSinceCreation, 365)
    }
    return 91
  }, [dateRange, measureCreatedAt, today])

  const fetchStart = useMemo(() => {
    const rangeStart = getDateRangeStart(dateRange, measureCreatedAt)
    const heatmapStart = getLastNDays(heatmapDays, today)[0]
    return rangeStart < heatmapStart ? rangeStart : heatmapStart
  }, [dateRange, measureCreatedAt, today, heatmapDays])

  const fetchLogs = useCallback(async () => {
    if (!measureId) {
      setLogs([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("measure_logs")
      .select("logged_at, value")
      .eq("measure_id", measureId)
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
  }, [supabase, measureId, fetchStart, todayKey])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const stats: MeasureStats | null = useMemo(() => {
    if (!measureId) return null

    const sortedDates = logs.map((l) => l.logged_at)
    const logMap = new Map<string, number | null>()
    for (const l of logs) {
      logMap.set(l.logged_at, l.value)
    }

    const heatmapData = computeHeatmapData(logMap, today, heatmapDays)

    const rangeStart = getDateRangeStart(dateRange, measureCreatedAt)
    const logsInRange = logs.filter((l) => l.logged_at >= rangeStart)
    const totalLogs = logsInRange.length

    const values = logsInRange
      .filter((l) => l.value !== null)
      .map((l) => l.value as number)

    const dailyAvg =
      values.length > 0
        ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
        : null

    const minValue = values.length > 0 ? Math.min(...values) : null
    const maxValue = values.length > 0 ? Math.max(...values) : null

    const lastLoggedDaysAgo =
      sortedDates.length > 0
        ? Math.round(
            (today.getTime() -
              parseDateKey(sortedDates[sortedDates.length - 1]).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null

    const weeks = getWeeksForRange(dateRange)
    const months = getMonthsForRange(dateRange)
    const weeklyTrend = computeWeeklyTrend(sortedDates, today, weeks, logMap)
    const monthlyBars = computeMonthlyBars(sortedDates, today, months, logMap)

    return {
      totalLogs,
      dailyAvg,
      minValue,
      maxValue,
      lastLoggedDaysAgo,
      heatmapData,
      weeklyTrend,
      monthlyBars,
    }
  }, [logs, measureId, dateRange, measureCreatedAt, today, heatmapDays])

  return { stats, isLoading, error }
}

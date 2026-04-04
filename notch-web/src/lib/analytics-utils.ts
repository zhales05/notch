import {
  formatDateKey,
  parseDateKey,
  getLastNDays,
  getLastNWeeks,
  getLastNMonths,
} from "./date-utils"
import type {
  DateRange,
  DayOfWeekStat,
  HeatmapDay,
  WeeklyTrendPoint,
  MonthlyBarPoint,
} from "./types/analytics"

/**
 * Returns the start date key for a given range.
 * For "all", uses habitCreatedAt or falls back to 365 days ago.
 */
export function getDateRangeStart(
  range: DateRange,
  habitCreatedAt?: string
): string {
  const today = new Date()
  switch (range) {
    case "30d":
      return formatDateKey(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
      )
    case "90d":
      return formatDateKey(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89)
      )
    case "all":
      return habitCreatedAt
        ? habitCreatedAt.slice(0, 10)
        : formatDateKey(
            new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate() - 364
            )
          )
  }
}

/**
 * Compute current streak and best streak from sorted date keys.
 * V1 simplification: consecutive calendar days with a log.
 */
export function computeStreaks(sortedDateKeys: string[]): {
  current: number
  best: number
} {
  if (sortedDateKeys.length === 0) return { current: 0, best: 0 }

  const dateSet = new Set(sortedDateKeys)
  const today = formatDateKey(new Date())

  // Current streak: walk backwards from today
  let current = 0
  const d = new Date()
  // If today has no log, start checking from yesterday
  if (!dateSet.has(today)) {
    d.setDate(d.getDate() - 1)
  }
  while (dateSet.has(formatDateKey(d))) {
    current++
    d.setDate(d.getDate() - 1)
  }

  // Best streak: walk through all sorted dates
  let best = 0
  let streak = 1
  for (let i = 1; i < sortedDateKeys.length; i++) {
    const prev = parseDateKey(sortedDateKeys[i - 1])
    const curr = parseDateKey(sortedDateKeys[i])
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 1) {
      streak++
    } else {
      best = Math.max(best, streak)
      streak = 1
    }
  }
  best = Math.max(best, streak)

  return { current, best }
}

/**
 * Build heatmap data for the last N days (default 91 = 13 weeks).
 */
export function computeHeatmapData(
  logMap: Map<string, number | null>,
  endDate: Date,
  days = 91
): HeatmapDay[] {
  const allDays = getLastNDays(days, endDate)
  return allDays.map((date) => ({
    date,
    completed: logMap.has(date),
    value: logMap.get(date) ?? null,
  }))
}

/**
 * Compute weekly completion trend (logs per week / 7 days).
 * When logMap is provided, also computes avgValue per week.
 */
export function computeWeeklyTrend(
  logDates: string[],
  endDate: Date,
  weeks: number,
  logMap?: Map<string, number | null>
): WeeklyTrendPoint[] {
  const weekBoundaries = getLastNWeeks(weeks, endDate)
  const dateSet = new Set(logDates)

  return weekBoundaries.map(({ start, end, label }) => {
    let logged = 0
    let valueSum = 0
    let valueCount = 0
    const d = parseDateKey(start)
    const endD = parseDateKey(end)
    while (d <= endD) {
      const key = formatDateKey(d)
      if (dateSet.has(key)) {
        logged++
        if (logMap) {
          const v = logMap.get(key)
          if (v !== null && v !== undefined) {
            valueSum += v
            valueCount++
          }
        }
      }
      d.setDate(d.getDate() + 1)
    }
    const point: WeeklyTrendPoint = {
      weekLabel: label,
      weekStart: start,
      completionRate: Math.round((logged / 7) * 100),
    }
    if (logMap && valueCount > 0) {
      point.avgValue = Math.round((valueSum / valueCount) * 10) / 10
    }
    return point
  })
}

/**
 * Compute monthly completion bars (logs per month / days in month).
 * When logMap is provided, also computes avgValue per month.
 */
export function computeMonthlyBars(
  logDates: string[],
  endDate: Date,
  months: number,
  logMap?: Map<string, number | null>
): MonthlyBarPoint[] {
  const monthBoundaries = getLastNMonths(months, endDate)

  // Group log dates by "YYYY-MM"
  const logsByMonth = new Map<string, number>()
  const valuesByMonth = new Map<string, { sum: number; count: number }>()
  for (const date of logDates) {
    const monthKey = date.slice(0, 7)
    logsByMonth.set(monthKey, (logsByMonth.get(monthKey) ?? 0) + 1)
    if (logMap) {
      const v = logMap.get(date)
      if (v !== null && v !== undefined) {
        const entry = valuesByMonth.get(monthKey) ?? { sum: 0, count: 0 }
        entry.sum += v
        entry.count++
        valuesByMonth.set(monthKey, entry)
      }
    }
  }

  return monthBoundaries.map(({ month, label, daysInMonth }) => {
    const totalLogged = logsByMonth.get(month) ?? 0
    const point: MonthlyBarPoint = {
      monthLabel: label,
      month,
      completionRate: Math.round((totalLogged / daysInMonth) * 100),
      totalLogged,
      totalDue: daysInMonth,
    }
    if (logMap) {
      const entry = valuesByMonth.get(month)
      if (entry && entry.count > 0) {
        point.avgValue = Math.round((entry.sum / entry.count) * 10) / 10
      }
    }
    return point
  })
}

/**
 * Compute completion rate and average value per day of week.
 */
export function computeDayOfWeekStats(
  logDates: string[],
  logMap: Map<string, number | null>,
  rangeStart: string,
  endDate: Date
): DayOfWeekStat[] {
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const counts = dayNames.map(() => ({ total: 0, logged: 0, valueSum: 0, valueCount: 0 }))
  const logSet = new Set(logDates)

  // Walk every day in the range
  const d = parseDateKey(rangeStart)
  const end = new Date(endDate)
  end.setHours(23, 59, 59)
  while (d <= end) {
    const dayIdx = (d.getDay() + 6) % 7 // Mon=0..Sun=6
    counts[dayIdx].total++
    const key = formatDateKey(d)
    if (logSet.has(key)) {
      counts[dayIdx].logged++
      const v = logMap.get(key)
      if (v !== null && v !== undefined) {
        counts[dayIdx].valueSum += v
        counts[dayIdx].valueCount++
      }
    }
    d.setDate(d.getDate() + 1)
  }

  return dayNames.map((day, i) => {
    const c = counts[i]
    const stat: DayOfWeekStat = {
      day,
      rate: c.total > 0 ? Math.round((c.logged / c.total) * 100) : 0,
    }
    if (c.valueCount > 0) {
      stat.avgValue = Math.round((c.valueSum / c.valueCount) * 10) / 10
    }
    return stat
  })
}

/**
 * Number of weeks to show in the trend chart for a given date range.
 */
export function getWeeksForRange(range: DateRange): number {
  switch (range) {
    case "30d":
      return 4
    case "90d":
      return 12
    case "all":
      return 52
  }
}

/**
 * Number of months to show in the bar chart for a given date range.
 */
export function getMonthsForRange(range: DateRange): number {
  switch (range) {
    case "30d":
      return 3
    case "90d":
      return 4
    case "all":
      return 6
  }
}

import { getWeekStart, getMonthStart, formatDateKey } from "./date-utils"
import type {
  Habit,
  EveryNWeeksConfig,
  XPerPeriodConfig,
  SpecificDaysConfig,
} from "@/lib/types/habits"

export interface PeriodInfo {
  periodStart: string // YYYY-MM-DD
  periodEnd: string // YYYY-MM-DD
  targetCount: number
}

export interface DueResult {
  isDue: boolean
  periodInfo: PeriodInfo | null
}

type HabitFrequencyFields = Pick<Habit, "frequency" | "frequency_config">

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export function isHabitDueOnDate(
  habit: HabitFrequencyFields,
  date: Date
): DueResult {
  switch (habit.frequency) {
    case "daily":
      return { isDue: true, periodInfo: null }

    case "weekly":
      return {
        isDue: true,
        periodInfo: {
          periodStart: formatDateKey(getWeekStart(date)),
          periodEnd: formatDateKey(getWeekEnd(date)),
          targetCount: 1,
        },
      }

    case "monthly":
      return {
        isDue: true,
        periodInfo: {
          periodStart: formatDateKey(getMonthStart(date)),
          periodEnd: formatDateKey(getMonthEnd(date)),
          targetCount: 1,
        },
      }

    case "every_n_weeks": {
      const config = habit.frequency_config as EveryNWeeksConfig
      const anchor = new Date(config.anchor_date + "T00:00:00")
      const current = getWeekStart(date)
      const anchorWeek = getWeekStart(anchor)
      const diffMs = current.getTime() - anchorWeek.getTime()
      const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000))
      const isOnWeek =
        ((diffWeeks % config.interval_weeks) + config.interval_weeks) %
          config.interval_weeks ===
        0
      return { isDue: isOnWeek, periodInfo: null }
    }

    case "x_per_period": {
      const config = habit.frequency_config as XPerPeriodConfig
      if (config.period === "week") {
        return {
          isDue: true,
          periodInfo: {
            periodStart: formatDateKey(getWeekStart(date)),
            periodEnd: formatDateKey(getWeekEnd(date)),
            targetCount: config.times,
          },
        }
      }
      return {
        isDue: true,
        periodInfo: {
          periodStart: formatDateKey(getMonthStart(date)),
          periodEnd: formatDateKey(getMonthEnd(date)),
          targetCount: config.times,
        },
      }
    }

    case "specific_days": {
      const config = habit.frequency_config as SpecificDaysConfig
      return { isDue: config.days.includes(date.getDay()), periodInfo: null }
    }

    default:
      return { isDue: true, periodInfo: null }
  }
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function getFrequencyLabel(habit: HabitFrequencyFields): string {
  switch (habit.frequency) {
    case "daily":
      return "Daily"
    case "weekly":
      return "Weekly"
    case "monthly":
      return "Monthly"
    case "every_n_weeks": {
      const config = habit.frequency_config as EveryNWeeksConfig
      if (config.interval_weeks === 2) return "Every other week"
      return `Every ${config.interval_weeks} weeks`
    }
    case "x_per_period": {
      const config = habit.frequency_config as XPerPeriodConfig
      return `${config.times}x per ${config.period}`
    }
    case "specific_days": {
      const config = habit.frequency_config as SpecificDaysConfig
      const sorted = [...config.days].sort((a, b) => a - b)
      return sorted.map((d) => DAY_NAMES[d]).join(", ")
    }
    default:
      return "Unknown"
  }
}

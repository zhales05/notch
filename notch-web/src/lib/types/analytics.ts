export type DateRange = "30d" | "90d" | "all"

export interface HeatmapDay {
  date: string
  completed: boolean
  value: number | null
}

export interface WeeklyTrendPoint {
  weekLabel: string
  weekStart: string
  completionRate: number
  avgValue?: number
}

export interface MonthlyBarPoint {
  monthLabel: string
  month: string
  completionRate: number
  totalLogged: number
  totalDue: number
  avgValue?: number
}

export interface DayOfWeekStat {
  day: string
  rate: number
  avgValue?: number
}

export interface HabitStats {
  currentStreak: number
  bestStreak: number
  completionRate30d: number
  totalLogs: number
  dailyAvg: number | null
  lastLoggedDaysAgo: number | null
  bestDay: DayOfWeekStat | null
  toughestDay: DayOfWeekStat | null
  heatmapData: HeatmapDay[]
  weeklyTrend: WeeklyTrendPoint[]
  monthlyBars: MonthlyBarPoint[]
}

export interface CategoryHabitBreakdown {
  habitId: string
  habitTitle: string
  habitColor: string
  completionRate: number
}

export interface CategoryStat {
  categoryId: string
  categoryTitle: string
  categoryColor: string
  categoryIcon: string
  habitCount: number
  completionRate: number
  totalLogs: number
  totalDue: number
  habits: CategoryHabitBreakdown[]
}

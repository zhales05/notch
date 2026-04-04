import type { HabitWithCategory } from "./habits"

export type LogSource = "web" | "ios" | "watch"

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  logged_at: string
  value: number | null
  source: LogSource
  created_at: string
}

export interface HabitLogInsert {
  habit_id: string
  logged_at: string
  value: number | null
  source?: LogSource
}

export interface HabitWithLog extends HabitWithCategory {
  log: HabitLog | null
}

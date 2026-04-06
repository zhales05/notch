import type { Category } from "./categories"

export type LogType = "boolean" | "value" | "time"
export type FrequencyType =
  | "daily"
  | "weekly"
  | "monthly"
  | "every_n_weeks"
  | "x_per_period"
  | "specific_days"

export type EveryNWeeksConfig = { interval_weeks: number; anchor_date: string }
export type XPerPeriodConfig = { times: number; period: "week" | "month" }
export type SpecificDaysConfig = { days: number[] }

export type FrequencyConfig =
  | EveryNWeeksConfig
  | XPerPeriodConfig
  | SpecificDaysConfig
  | null

export interface Habit {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  log_type: LogType
  frequency: FrequencyType
  frequency_config: FrequencyConfig
  unit: string | null
  color: string
  icon: string
  daily_target: number | null
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface HabitWithCategory extends Habit {
  category: Pick<Category, "id" | "title" | "color" | "icon"> | null
}

export interface HabitFormData {
  title: string
  description: string
  category_id: string | null
  log_type: LogType
  frequency: FrequencyType
  frequency_config: FrequencyConfig
  unit: string
  daily_target: number | null
  color: string
  icon: string
  goal_ids: string[]
}

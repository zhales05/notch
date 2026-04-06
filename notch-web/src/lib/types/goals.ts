import type { Category } from "./categories"

export type GoalStatus = "active" | "completed" | "paused" | "abandoned"
export type GoalType = "accumulate" | "best_min" | "best_max" | "milestone"
export type ContributionMode = "count" | "value_sum" | "streak" | "best_min" | "best_max"

export interface Goal {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  status: GoalStatus
  goal_type: GoalType
  target_value: number | null
  unit: string | null
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export interface GoalWithCategory extends Goal {
  category: Pick<Category, "id" | "title" | "color" | "icon"> | null
}

export interface GoalHabit {
  id: string
  goal_id: string
  habit_id: string
  contribution_mode: ContributionMode
  weight: number
}

export interface GoalHabitWithHabit extends GoalHabit {
  habit: {
    id: string
    title: string
    icon: string
    color: string
    log_type: "boolean" | "value" | "time"
    unit: string | null
  }
}

export interface GoalProgress {
  current_value: number
  target_value: number | null
  percentage: number
  best_value?: number | null
}

export interface GoalFormData {
  title: string
  description: string
  goal_type: GoalType
  category_id: string | null
  target_value: number | null
  unit: string
  start_date: string
  end_date: string
  linked_habits: GoalHabitFormEntry[]
}

export interface GoalHabitFormEntry {
  habit_id: string
  contribution_mode: ContributionMode
  weight: number
}

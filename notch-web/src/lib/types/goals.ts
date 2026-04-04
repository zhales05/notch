import type { Category } from "./categories"

export type GoalStatus = "active" | "completed" | "paused" | "abandoned"
export type ContributionMode = "count" | "value_sum" | "streak"

export interface Goal {
  id: string
  user_id: string
  category_id: string | null
  title: string
  description: string | null
  status: GoalStatus
  target_value: number
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
  target_value: number
  percentage: number
}

export interface GoalFormData {
  title: string
  description: string
  category_id: string | null
  target_value: number
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

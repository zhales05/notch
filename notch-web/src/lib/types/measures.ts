import type { Category } from "./categories"
import type { LogSource } from "./logs"

export interface Measure {
  id: string
  user_id: string
  category_id: string | null
  title: string
  unit: string | null
  color: string
  icon: string
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface MeasureWithCategory extends Measure {
  category: Pick<Category, "id" | "title" | "color" | "icon"> | null
}

export interface MeasureLog {
  id: string
  measure_id: string
  user_id: string
  logged_at: string
  value: number
  source: LogSource
  created_at: string
}

export interface MeasureWithLog extends MeasureWithCategory {
  log: MeasureLog | null
}

export interface MeasureFormData {
  title: string
  category_id: string | null
  unit: string
  color: string
  icon: string
}

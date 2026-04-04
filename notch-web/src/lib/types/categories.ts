export interface Category {
  id: string
  user_id: string
  title: string
  color: string
  icon: string
  sort_order: number
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface CategoryFormData {
  title: string
  color: string
  icon: string
}

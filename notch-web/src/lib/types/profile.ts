export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  plan: "free" | "premium"
  created_at: string
  updated_at: string
}

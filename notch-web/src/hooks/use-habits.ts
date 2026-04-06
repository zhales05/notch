"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { HabitWithCategory, HabitFormData } from "@/lib/types/habits"

const HABIT_LIMIT_ERROR = "HABIT_LIMIT"

export function useHabits(showArchived = false) {
  const [habits, setHabits] = useState<HabitWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const activeHabitCount = useMemo(
    () => habits.filter((h) => !h.archived_at).length,
    [habits]
  )

  const fetchHabits = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from("habits")
      .select("*, category:categories(id, title, color, icon)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (!showArchived) {
      query = query.is("archived_at", null)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setHabits([])
    } else {
      setHabits(data ?? [])
    }

    setIsLoading(false)
  }, [showArchived])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  const createHabit = useCallback(
    async (formData: HabitFormData): Promise<HabitWithCategory | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      const { data, error: insertError } = await supabase
        .from("habits")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id,
          log_type: formData.log_type,
          frequency: formData.frequency,
          frequency_config: formData.frequency_config,
          unit: formData.log_type === "value" ? formData.unit || null : null,
          daily_target: formData.log_type !== "boolean" ? formData.daily_target : null,
          color: formData.color,
          icon: formData.icon,
          sort_order: habits.length,
        })
        .select("*, category:categories(id, title, color, icon)")
        .single()

      if (insertError) {
        if (insertError.message.includes("Free plan is limited")) {
          setError(HABIT_LIMIT_ERROR)
        } else {
          setError(insertError.message)
        }
        return null
      }

      // Link habit to goals
      if (formData.goal_ids && formData.goal_ids.length > 0) {
        await supabase.from("goal_habits").insert(
          formData.goal_ids.map((goalId) => ({
            goal_id: goalId,
            habit_id: data.id,
            contribution_mode: "count" as const,
            weight: 1,
          }))
        )
      }

      setHabits((prev) => [...prev, data])
      return data
    },
    [habits.length]
  )

  const updateHabit = useCallback(
    async (
      id: string,
      formData: Partial<HabitFormData>
    ): Promise<HabitWithCategory | null> => {
      setError(null)

      const { goal_ids, ...rest } = formData
      const updateData: Record<string, unknown> = { ...rest }
      if (formData.log_type === "boolean") {
        updateData.unit = null
        updateData.daily_target = null
      }

      const { data, error: updateError } = await supabase
        .from("habits")
        .update(updateData)
        .eq("id", id)
        .select("*, category:categories(id, title, color, icon)")
        .single()

      if (updateError) {
        setError(updateError.message)
        return null
      }

      // Replace goal links if provided
      if (goal_ids !== undefined) {
        await supabase.from("goal_habits").delete().eq("habit_id", id)

        if (goal_ids.length > 0) {
          await supabase.from("goal_habits").insert(
            goal_ids.map((goalId) => ({
              goal_id: goalId,
              habit_id: id,
              contribution_mode: "count" as const,
              weight: 1,
            }))
          )
        }
      }

      setHabits((prev) => prev.map((h) => (h.id === id ? data : h)))
      return data
    },
    []
  )

  const archiveHabit = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    const { error: archiveError } = await supabase
      .from("habits")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", id)

    if (archiveError) {
      setError(archiveError.message)
      return false
    }

    setHabits((prev) => prev.filter((h) => h.id !== id))
    return true
  }, [])

  const unarchiveHabit = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    const { data, error: unarchiveError } = await supabase
      .from("habits")
      .update({ archived_at: null })
      .eq("id", id)
      .select("*, category:categories(id, title, color, icon)")
      .single()

    if (unarchiveError) {
      if (unarchiveError.message.includes("Free plan is limited")) {
        setError(HABIT_LIMIT_ERROR)
      } else {
        setError(unarchiveError.message)
      }
      return false
    }

    setHabits((prev) => prev.map((h) => (h.id === id ? data : h)))
    return true
  }, [])

  return {
    habits,
    isLoading,
    error,
    activeHabitCount,
    fetchHabits,
    createHabit,
    updateHabit,
    archiveHabit,
    unarchiveHabit,
  }
}

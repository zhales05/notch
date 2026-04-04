"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type {
  GoalWithCategory,
  GoalHabitWithHabit,
  GoalProgress,
  GoalFormData,
  GoalStatus,
} from "@/lib/types/goals"

export function useGoals(statusFilter?: GoalStatus) {
  const [goals, setGoals] = useState<GoalWithCategory[]>([])
  const [progressMap, setProgressMap] = useState<Record<string, GoalProgress>>(
    {}
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchAllProgress = useCallback(async (goalIds: string[]) => {
    if (goalIds.length === 0) {
      setProgressMap({})
      return
    }

    const results = await Promise.all(
      goalIds.map(async (id) => {
        const { data } = await supabase.rpc("calculate_goal_progress", {
          p_goal_id: id,
        })
        return { id, data: data as GoalProgress | null }
      })
    )

    const map: Record<string, GoalProgress> = {}
    for (const { id, data } of results) {
      if (data && !("error" in data)) {
        map[id] = data
      }
    }
    setProgressMap(map)
  }, [])

  const fetchGoals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    let query = supabase
      .from("goals")
      .select("*, category:categories(id, title, color, icon)")
      .order("created_at", { ascending: false })

    if (statusFilter) {
      query = query.eq("status", statusFilter)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setGoals([])
      setIsLoading(false)
      return
    }

    const goalsData = data ?? []
    setGoals(goalsData)
    setIsLoading(false)

    // Fetch progress in background for all goals
    fetchAllProgress(goalsData.map((g) => g.id))
  }, [statusFilter, fetchAllProgress])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const fetchGoalDetail = useCallback(
    async (
      goalId: string
    ): Promise<{
      goal: GoalWithCategory
      linkedHabits: GoalHabitWithHabit[]
      progress: GoalProgress | null
    } | null> => {
      const [goalResult, habitsResult, progressResult] = await Promise.all([
        supabase
          .from("goals")
          .select("*, category:categories(id, title, color, icon)")
          .eq("id", goalId)
          .single(),
        supabase
          .from("goal_habits")
          .select("*, habit:habits(id, title, icon, color, log_type, unit)")
          .eq("goal_id", goalId),
        supabase.rpc("calculate_goal_progress", { p_goal_id: goalId }),
      ])

      if (goalResult.error) return null

      const progressData = progressResult.data as GoalProgress | null
      return {
        goal: goalResult.data,
        linkedHabits: habitsResult.data ?? [],
        progress:
          progressData && !("error" in progressData) ? progressData : null,
      }
    },
    []
  )

  const createGoal = useCallback(
    async (formData: GoalFormData): Promise<GoalWithCategory | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      const { data, error: insertError } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description || null,
          category_id: formData.category_id,
          target_value: formData.target_value,
          unit: formData.unit || null,
          start_date: formData.start_date,
          end_date: formData.end_date || null,
        })
        .select("*, category:categories(id, title, color, icon)")
        .single()

      if (insertError) {
        if (insertError.code === "42501") {
          setError("GOALS_BLOCKED")
        } else {
          setError(insertError.message)
        }
        return null
      }

      // Insert linked habits
      if (formData.linked_habits.length > 0) {
        const { error: linkError } = await supabase
          .from("goal_habits")
          .insert(
            formData.linked_habits.map((lh) => ({
              goal_id: data.id,
              habit_id: lh.habit_id,
              contribution_mode: lh.contribution_mode,
              weight: lh.weight,
            }))
          )

        if (linkError) {
          setError(linkError.message)
        }
      }

      setGoals((prev) => [data, ...prev])
      return data
    },
    []
  )

  const updateGoal = useCallback(
    async (
      id: string,
      formData: Partial<GoalFormData>
    ): Promise<GoalWithCategory | null> => {
      setError(null)

      const { linked_habits, ...goalFields } = formData

      const updateData: Record<string, unknown> = {}
      if (goalFields.title !== undefined) updateData.title = goalFields.title
      if (goalFields.description !== undefined)
        updateData.description = goalFields.description || null
      if (goalFields.category_id !== undefined)
        updateData.category_id = goalFields.category_id
      if (goalFields.target_value !== undefined)
        updateData.target_value = goalFields.target_value
      if (goalFields.unit !== undefined)
        updateData.unit = goalFields.unit || null
      if (goalFields.start_date !== undefined)
        updateData.start_date = goalFields.start_date
      if (goalFields.end_date !== undefined)
        updateData.end_date = goalFields.end_date || null

      const { data, error: updateError } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", id)
        .select("*, category:categories(id, title, color, icon)")
        .single()

      if (updateError) {
        setError(updateError.message)
        return null
      }

      // Replace linked habits if provided
      if (linked_habits) {
        await supabase.from("goal_habits").delete().eq("goal_id", id)

        if (linked_habits.length > 0) {
          const { error: linkError } = await supabase
            .from("goal_habits")
            .insert(
              linked_habits.map((lh) => ({
                goal_id: id,
                habit_id: lh.habit_id,
                contribution_mode: lh.contribution_mode,
                weight: lh.weight,
              }))
            )

          if (linkError) {
            setError(linkError.message)
          }
        }
      }

      setGoals((prev) => prev.map((g) => (g.id === id ? data : g)))
      return data
    },
    []
  )

  const updateGoalStatus = useCallback(
    async (id: string, status: GoalStatus): Promise<boolean> => {
      setError(null)

      const { error: updateError } = await supabase
        .from("goals")
        .update({ status })
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setGoals((prev) =>
        prev.map((g) => (g.id === id ? { ...g, status } : g))
      )
      return true
    },
    []
  )

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    const { error: deleteError } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setGoals((prev) => prev.filter((g) => g.id !== id))
    return true
  }, [])

  return {
    goals,
    progressMap,
    isLoading,
    error,
    fetchGoals,
    fetchGoalDetail,
    createGoal,
    updateGoal,
    updateGoalStatus,
    deleteGoal,
  }
}

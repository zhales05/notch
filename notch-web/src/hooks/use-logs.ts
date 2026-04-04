"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { HabitLog } from "@/lib/types/logs"

export function useLogs(date: string) {
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("habit_logs")
      .select("*")
      .eq("logged_at", date)

    if (fetchError) {
      setError(fetchError.message)
      setLogs([])
    } else {
      setLogs(data ?? [])
    }

    setIsLoading(false)
  }, [date])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const upsertLog = useCallback(
    async (habitId: string, value: number | null): Promise<HabitLog | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      // Snapshot for rollback
      const previousLogs = [...logs]

      // Optimistic update
      const existingIndex = logs.findIndex((l) => l.habit_id === habitId)
      const optimisticLog: HabitLog = {
        id: crypto.randomUUID(),
        habit_id: habitId,
        user_id: user.id,
        logged_at: date,
        value,
        source: "web",
        created_at: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        setLogs((prev) =>
          prev.map((l) =>
            l.habit_id === habitId ? { ...l, value } : l
          )
        )
      } else {
        setLogs((prev) => [...prev, optimisticLog])
      }

      const { data, error: upsertError } = await supabase
        .from("habit_logs")
        .upsert(
          {
            habit_id: habitId,
            user_id: user.id,
            logged_at: date,
            value,
            source: "web",
          },
          { onConflict: "habit_id,logged_at" }
        )
        .select()
        .single()

      if (upsertError) {
        setLogs(previousLogs)
        setError(upsertError.message)
        return null
      }

      // Replace optimistic entry with real DB response
      setLogs((prev) =>
        prev.map((l) => (l.habit_id === habitId ? data : l))
      )
      return data
    },
    [logs, date]
  )

  const deleteLog = useCallback(
    async (habitId: string): Promise<boolean> => {
      setError(null)

      const previousLogs = [...logs]

      // Optimistic remove
      setLogs((prev) => prev.filter((l) => l.habit_id !== habitId))

      const { error: deleteError } = await supabase
        .from("habit_logs")
        .delete()
        .eq("habit_id", habitId)
        .eq("logged_at", date)

      if (deleteError) {
        setLogs(previousLogs)
        setError(deleteError.message)
        return false
      }

      return true
    },
    [logs, date]
  )

  return {
    logs,
    isLoading,
    error,
    fetchLogs,
    upsertLog,
    deleteLog,
  }
}

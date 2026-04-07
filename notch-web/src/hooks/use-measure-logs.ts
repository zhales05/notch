"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { MeasureLog } from "@/lib/types/measures"

export function useMeasureLogs(date: string) {
  const [logs, setLogs] = useState<MeasureLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("measure_logs")
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
    async (measureId: string, value: number): Promise<MeasureLog | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      const previousLogs = [...logs]

      // Optimistic update
      const existingIndex = logs.findIndex((l) => l.measure_id === measureId)
      const optimisticLog: MeasureLog = {
        id: crypto.randomUUID(),
        measure_id: measureId,
        user_id: user.id,
        logged_at: date,
        value,
        source: "web",
        created_at: new Date().toISOString(),
      }

      if (existingIndex >= 0) {
        setLogs((prev) =>
          prev.map((l) =>
            l.measure_id === measureId ? { ...l, value } : l
          )
        )
      } else {
        setLogs((prev) => [...prev, optimisticLog])
      }

      const { data, error: upsertError } = await supabase
        .from("measure_logs")
        .upsert(
          {
            measure_id: measureId,
            user_id: user.id,
            logged_at: date,
            value,
            source: "web",
          },
          { onConflict: "measure_id,logged_at" }
        )
        .select()
        .single()

      if (upsertError) {
        setLogs(previousLogs)
        setError(upsertError.message)
        return null
      }

      setLogs((prev) =>
        prev.map((l) => (l.measure_id === measureId ? data : l))
      )
      return data
    },
    [logs, date]
  )

  const deleteLog = useCallback(
    async (measureId: string): Promise<boolean> => {
      setError(null)

      const previousLogs = [...logs]
      setLogs((prev) => prev.filter((l) => l.measure_id !== measureId))

      const { error: deleteError } = await supabase
        .from("measure_logs")
        .delete()
        .eq("measure_id", measureId)
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

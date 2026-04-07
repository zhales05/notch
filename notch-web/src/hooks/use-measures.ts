"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Measure, MeasureWithCategory, MeasureFormData } from "@/lib/types/measures"

export function useMeasures() {
  const [measures, setMeasures] = useState<MeasureWithCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const fetchMeasures = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("measures")
      .select("*, category:categories(id, title, color, icon)")
      .order("sort_order")

    if (fetchError) {
      setError(fetchError.message)
      setMeasures([])
    } else {
      setMeasures(data ?? [])
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchMeasures()
  }, [fetchMeasures])

  const createMeasure = useCallback(
    async (formData: MeasureFormData): Promise<Measure | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      const { data, error: insertError } = await supabase
        .from("measures")
        .insert({
          user_id: user.id,
          title: formData.title,
          category_id: formData.category_id || null,
          unit: formData.unit || null,
          color: formData.color,
          icon: formData.icon,
          sort_order: measures.length,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      await fetchMeasures()
      return data
    },
    [measures.length, fetchMeasures]
  )

  const updateMeasure = useCallback(
    async (id: string, formData: Partial<MeasureFormData>): Promise<boolean> => {
      setError(null)

      const updates: Record<string, unknown> = {}
      if (formData.title !== undefined) updates.title = formData.title
      if (formData.category_id !== undefined) updates.category_id = formData.category_id || null
      if (formData.unit !== undefined) updates.unit = formData.unit || null
      if (formData.color !== undefined) updates.color = formData.color
      if (formData.icon !== undefined) updates.icon = formData.icon

      const { error: updateError } = await supabase
        .from("measures")
        .update(updates)
        .eq("id", id)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      await fetchMeasures()
      return true
    },
    [fetchMeasures]
  )

  const archiveMeasure = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      const { error: archiveError } = await supabase
        .from("measures")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)

      if (archiveError) {
        setError(archiveError.message)
        return false
      }

      await fetchMeasures()
      return true
    },
    [fetchMeasures]
  )

  const unarchiveMeasure = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      const { error: unarchiveError } = await supabase
        .from("measures")
        .update({ archived_at: null })
        .eq("id", id)

      if (unarchiveError) {
        setError(unarchiveError.message)
        return false
      }

      await fetchMeasures()
      return true
    },
    [fetchMeasures]
  )

  const deleteMeasure = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      const { error: deleteError } = await supabase
        .from("measures")
        .delete()
        .eq("id", id)

      if (deleteError) {
        setError(deleteError.message)
        return false
      }

      await fetchMeasures()
      return true
    },
    [fetchMeasures]
  )

  return {
    measures,
    isLoading,
    error,
    fetchMeasures,
    createMeasure,
    updateMeasure,
    archiveMeasure,
    unarchiveMeasure,
    deleteMeasure,
  }
}

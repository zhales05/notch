"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Category, CategoryFormData } from "@/lib/types/categories"

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .is("archived_at", null)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setCategories([])
    } else {
      setCategories(data ?? [])
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = useCallback(
    async (formData: CategoryFormData): Promise<Category | null> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return null
      }

      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          title: formData.title,
          color: formData.color,
          icon: formData.icon,
          sort_order: categories.length,
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.message.includes("Free plan is limited")) {
          setError("CATEGORY_LIMIT")
        } else {
          setError(insertError.message)
        }
        return null
      }

      setCategories((prev) => [...prev, data])
      return data
    },
    [supabase, categories.length]
  )

  const updateCategory = useCallback(
    async (
      id: string,
      formData: Partial<CategoryFormData>
    ): Promise<Category | null> => {
      setError(null)

      const { data, error: updateError } = await supabase
        .from("categories")
        .update(formData)
        .eq("id", id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return null
      }

      setCategories((prev) =>
        prev.map((cat) => (cat.id === id ? data : cat))
      )
      return data
    },
    [supabase]
  )

  const archiveCategory = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null)

      const { error: archiveError } = await supabase
        .from("categories")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)

      if (archiveError) {
        setError(archiveError.message)
        return false
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id))
      return true
    },
    [supabase]
  )

  const getHabitCount = useCallback(
    async (categoryId: string): Promise<number> => {
      const { count, error: countError } = await supabase
        .from("habits")
        .select("id", { count: "exact", head: true })
        .eq("category_id", categoryId)

      if (countError) {
        return 0
      }

      return count ?? 0
    },
    [supabase]
  )

  const activeCategoryCount = categories.length

  return {
    categories,
    activeCategoryCount,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    archiveCategory,
    getHabitCount,
  }
}

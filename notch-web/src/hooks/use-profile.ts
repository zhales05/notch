"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types/profile"

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Not authenticated")
      setIsLoading(false)
      return
    }

    setEmail(user.email ?? null)

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (fetchError) {
      setError(fetchError.message)
      setProfile(null)
    } else {
      setProfile(data)
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const updateProfile = useCallback(
    async (data: { display_name: string }): Promise<boolean> => {
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return false
      }

      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ display_name: data.display_name })
        .eq("id", user.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setProfile(updated)
      return true
    },
    [supabase]
  )

  const upgradeToPremium = useCallback(async (): Promise<boolean> => {
    setError(null)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("Not authenticated")
      return false
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({ plan: "premium" })
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setProfile(updated)
    return true
  }, [supabase])

  return {
    profile,
    email,
    isLoading,
    error,
    updateProfile,
    upgradeToPremium,
  }
}

"use client"

import { createClient } from "@/utils/supabase/client"

export type Profile = {
  id: string
  fullname: string | null
}

/**
 * Ensures the authenticated user has a profile row and returns it.
 */
export const getOrCreateProfile = async (): Promise<Profile> => {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error("You must be signed in to load a profile")

  const userId = user.id

  const { data: existingProfile, error: fetchError } = await supabase
    .from("profile")
    .select("id, fullname")
    .eq("id", userId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (existingProfile) return existingProfile as Profile

  const metadataName =
    typeof user.user_metadata?.full_name === "string"
      ? (user.user_metadata.full_name as string)
      : null

  const defaultFullName = metadataName?.trim() || user.email || undefined

  const { data: insertedProfile, error: insertError } = await supabase
    .from("profile")
    .insert({
      id: userId,
      fullname: defaultFullName,
    })
    .select("id, fullname")
    .single()

  if (insertError) throw insertError

  return insertedProfile as Profile
}

"use client"

import { useEffect, useState } from "react"

import { useBookshelf } from "@/components/bookshelf/bookshelf-context"
import { getOrCreateProfile } from "@/lib/client-profile"

type AuthMode = "sign-in" | "sign-up"

export default function ProfileTab() {
  const { supabase, user } = useBookshelf()
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [profileFullName, setProfileFullName] = useState("")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileUpdateMessage, setProfileUpdateMessage] = useState<
    string | null
  >(null)
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<
    "success" | "error" | null
  >(null)

  useEffect(() => {
    if (!copyFeedback) return
    const timeout = window.setTimeout(() => setCopyFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [copyFeedback])

  useEffect(() => {
    if (!user) {
      setProfileFullName("")
      setProfileUpdateMessage(null)
      setProfileUpdateStatus(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfileLoading(true)
    setProfileUpdateMessage(null)
    setProfileUpdateStatus(null)

    getOrCreateProfile()
      .then((profile) => {
        if (!active) return
        setProfileFullName(profile.fullname ?? "")
      })
      .catch((error) => {
        if (!active) return
        setProfileFullName("")
        setProfileUpdateMessage(error.message ?? "Unable to load profile")
        setProfileUpdateStatus("error")
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user])

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAuthLoading(true)
    setErrorMessage(null)
    setStatusMessage(null)

    if (!email || !password) {
      setErrorMessage("Email and password are required")
      setAuthLoading(false)
      return
    }

    const action =
      mode === "sign-in"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })

    const { error } = await action

    if (error) {
      setErrorMessage(error.message)
    } else {
      const confirmationMessage =
        mode === "sign-in"
          ? "Signed in successfully"
          : "Account created. Check your inbox to confirm your email."
      setStatusMessage(confirmationMessage)
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        await getOrCreateProfile()
      }
    }

    setAuthLoading(false)
  }

  const handleSignOut = async () => {
    setAuthLoading(true)
    setErrorMessage(null)
    setStatusMessage(null)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setErrorMessage(error.message)
    } else {
      setStatusMessage("Signed out")
    }
    setAuthLoading(false)
  }

  const handleCopyProfileLink = async () => {
    if (!user) return
    const profileUrl = `${window.location.origin}/bookshelf/profile/${user.id}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopyFeedback("Profile link copied to clipboard")
    } catch {
      setCopyFeedback(`Copy failed. You can share ${profileUrl}`)
    }
  }

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user) return
    setProfileSaving(true)
    setProfileUpdateMessage(null)
    setProfileUpdateStatus(null)

    const trimmedName = profileFullName.trim()
    const { error } = await supabase.from("profile").upsert({
      id: user.id,
      fullname: trimmedName || undefined,
    })

    if (error) {
      setProfileUpdateMessage(error.message)
      setProfileUpdateStatus("error")
    } else {
      setProfileFullName(trimmedName)
      setProfileUpdateMessage("Profile updated")
      setProfileUpdateStatus("success")
    }

    setProfileSaving(false)
  }

  if (user) {
    return (
      <section className="space-y-4 rounded-md border border-gray-200 p-6">
        <button
          type="button"
          className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          onClick={handleCopyProfileLink}
          disabled={authLoading}
        >
          Copy and share profile
        </button>
        {copyFeedback && (
          <p className="text-sm text-gray-600">{copyFeedback}</p>
        )}

        <div className="rounded-md border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>
        <form className="space-y-3" onSubmit={handleProfileSave}>
          <div>
            <label
              className="mb-1 block text-sm font-medium"
              htmlFor="profile-fullname"
            >
              Full name
            </label>
            <input
              id="profile-fullname"
              type="text"
              value={profileFullName}
              onChange={(event) => setProfileFullName(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
              placeholder="Add your name"
              disabled={profileLoading || profileSaving}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-pink-600 px-4 py-2 text-white hover:bg-pink-500 disabled:opacity-60"
            disabled={profileSaving || profileLoading}
          >
            {profileSaving ? "Saving…" : "Save profile"}
          </button>
        </form>
        {profileLoading && (
          <p className="text-sm text-gray-500">Loading profile…</p>
        )}
        {profileUpdateMessage && (
          <p
            className={`text-sm ${
              profileUpdateStatus === "error"
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {profileUpdateMessage}
          </p>
        )}
        <hr className="my-8 border-gray-300" />
        <button
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-60"
          onClick={handleSignOut}
          disabled={authLoading}
        >
          Sign out
        </button>

        {statusMessage && (
          <p className="text-sm text-green-600">{statusMessage}</p>
        )}
        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
      </section>
    )
  }

  return (
    <section className="rounded-md border border-gray-200 p-6">
      <form className="space-y-4" onSubmit={handleAuth}>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
          />
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
        {statusMessage && (
          <p className="text-sm text-green-600">{statusMessage}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-500 disabled:opacity-60"
          disabled={authLoading}
        >
          {authLoading
            ? "Processing…"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      <div className="mt-4 text-center text-sm">
        {mode === "sign-in" ? (
          <button
            type="button"
            className="text-pink-600 hover:underline"
            onClick={() => setMode("sign-up")}
            disabled={authLoading}
          >
            Need an account? Sign up
          </button>
        ) : (
          <button
            type="button"
            className="text-pink-600 hover:underline"
            onClick={() => setMode("sign-in")}
            disabled={authLoading}
          >
            Already have an account? Sign in
          </button>
        )}
      </div>
    </section>
  )
}

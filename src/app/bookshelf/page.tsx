"use client"

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"

import BookshelfView, {
  type BookshelfEntry,
} from "@/components/bookshelf/bookshelf-view"
import {
  denormalizeRating,
  isValidHalfStep,
  normalizeRating,
  ratingSteps,
} from "@/components/bookshelf/rating"
import { createClient } from "@/utils/supabase/client"

type AuthMode = "sign-in" | "sign-up"

type BookSuggestion = {
  id: number
  title: string
  author: string
  genre: string | null
  year: number | null
}

type RawBook = {
  id: number | null
  title: string | null
  author: string | null
  genre: string | null
  year: number | null
}

type RawUserBookRow = {
  id: number | null
  created_at: string | null
  rating: number | null
  owned: boolean | null
  read_at: string | null
  book_id: number | null
  book: RawBook | RawBook[] | null
}

export default function BookshelfPage() {
  const supabase = useMemo(() => createClient(), [])
  const [mode, setMode] = useState<AuthMode>("sign-in")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const [userBooks, setUserBooks] = useState<BookshelfEntry[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookSuggestion | null>(null)
  const [newBookAuthor, setNewBookAuthor] = useState("")
  const [newBookGenre, setNewBookGenre] = useState("")
  const [newBookYear, setNewBookYear] = useState("")
  const [addRating, setAddRating] = useState("")
  const [addOwned, setAddOwned] = useState(false)
  const [addRead, setAddRead] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addFormError, setAddFormError] = useState<string | null>(null)
  const [collectionMessage, setCollectionMessage] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)

  const [editingEntry, setEditingEntry] = useState<BookshelfEntry | null>(null)
  const [editRating, setEditRating] = useState("")
  const [editOwned, setEditOwned] = useState(false)
  const [editRead, setEditRead] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
    })
  }, [supabase])

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => {
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  const loadUserBooks = useCallback(async () => {
    if (!user) {
      setUserBooks([])
      return
    }
    setBooksLoading(true)
    setBooksError(null)
    const { data, error } = await supabase
      .from("user_book")
      .select(
        "id, created_at, rating, owned, read_at, book_id, book:book_id (id, title, author, genre, year)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      setBooksError(error.message)
      setUserBooks([])
    } else {
      const normalizedEntries = ((data ?? []) as RawUserBookRow[]).map((row) => {
        const relatedBook = Array.isArray(row.book) ? row.book[0] ?? null : row.book

        return {
          id: row.id ?? 0,
          created_at: row.created_at ?? "",
          rating: row.rating ?? null,
          owned: Boolean(row.owned),
          read_at: row.read_at ?? null,
          book_id: row.book_id ?? 0,
          book: relatedBook
            ? {
                id: relatedBook.id ?? 0,
                title: relatedBook.title ?? "",
                author: relatedBook.author ?? "",
                genre: relatedBook.genre ?? null,
                year: relatedBook.year ?? null,
              }
            : null,
        } satisfies BookshelfEntry
      })

      setUserBooks(normalizedEntries)
    }
    setBooksLoading(false)
  }, [supabase, user])

  useEffect(() => {
    loadUserBooks()
  }, [loadUserBooks])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }

    let active = true
    setSuggestionsLoading(true)
    const timer = setTimeout(() => {
      supabase
        .from("book")
        .select("id, title, author, genre, year")
        .ilike("title", `%${searchTerm}%`)
        .order("title")
        .limit(7)
        .then(({ data, error }) => {
          if (!active) return
          if (error) {
            setSuggestions([])
          } else {
            setSuggestions(data ?? [])
          }
          setSuggestionsLoading(false)
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [searchTerm, supabase])

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
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
      setUser(data.user ?? null)
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
      setUser(null)
      setUserBooks([])
      setStatusMessage("Signed out")
    }
    setAuthLoading(false)
  }

  const handleCopyProfileLink = async () => {
    if (!user) return
    const profileUrl = `${window.location.origin}/bookshelf/${user.id}`
    try {
      await navigator.clipboard.writeText(profileUrl)
      setCopyFeedback("Profile link copied to clipboard")
    } catch {
      setCopyFeedback(`Copy failed. You can share ${profileUrl}`)
    }
  }

  useEffect(() => {
    if (!copyFeedback) return
    const timeout = window.setTimeout(() => setCopyFeedback(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [copyFeedback])

  const handleSuggestionSelect = (suggestion: BookSuggestion) => {
    setSelectedBook(suggestion)
    setSearchTerm(suggestion.title)
    setSuggestions([])
    setCollectionMessage(null)
    setAddFormError(null)
  }

  const resetAddForm = () => {
    setSearchTerm("")
    setSelectedBook(null)
    setNewBookAuthor("")
    setNewBookGenre("")
    setNewBookYear("")
    setAddRating("")
    setAddOwned(false)
    setAddRead(false)
  }

  const handleAddBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAddFormError(null)
    setCollectionMessage(null)

    if (!user) {
      setAddFormError("You need to be signed in to add books")
      return
    }

    if (!searchTerm.trim()) {
      setAddFormError("Enter a book title")
      return
    }

    if (!selectedBook && !newBookAuthor.trim()) {
      setAddFormError("Provide an author for new books")
      return
    }

    const ratingValue = addRating ? Number.parseFloat(addRating) : null
    if (
      ratingValue !== null &&
      (ratingValue < 0.5 || ratingValue > 5 || !isValidHalfStep(ratingValue))
    ) {
      setAddFormError("Rating must be between 0.5 and 5 in half-star steps")
      return
    }

    setAddLoading(true)

    let bookId = selectedBook?.id ?? null

    if (!bookId) {
      const { data, error } = await supabase
        .from("book")
        .insert({
          title: searchTerm.trim(),
          author: newBookAuthor.trim(),
          genre: newBookGenre.trim() || null,
          year: newBookYear ? Number.parseInt(newBookYear, 10) : null,
        })
        .select()
        .single()

      if (error || !data) {
        setAddFormError(error?.message ?? "Unable to create book")
        setAddLoading(false)
        return
      }

      bookId = data.id
    }

    const storedRating = denormalizeRating(ratingValue)

    const { error: insertError } = await supabase.from("user_book").insert({
      user_id: user.id,
      book_id: bookId,
      rating: storedRating,
      owned: addOwned,
      read_at: addRead ? new Date().toISOString() : null,
    })

    if (insertError) {
      setAddFormError(insertError.message)
      setAddLoading(false)
      return
    }

    setCollectionMessage("Book added to your shelf")
    resetAddForm()
    setAddLoading(false)
    await loadUserBooks()
  }

  const openEditModal = (entry: BookshelfEntry) => {
    setEditingEntry(entry)
    const displayRating = normalizeRating(entry.rating)
    setEditRating(displayRating !== null ? displayRating.toString() : "")
    setEditOwned(entry.owned)
    setEditRead(Boolean(entry.read_at))
    setUpdateError(null)
    setCollectionMessage(null)
  }

  const closeEditModal = () => {
    setEditingEntry(null)
    setUpdateLoading(false)
    setUpdateError(null)
  }

  const handleUpdateEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingEntry || !user) return

    const ratingValue = editRating ? Number.parseFloat(editRating) : null
    if (
      ratingValue !== null &&
      (ratingValue < 0.5 || ratingValue > 5 || !isValidHalfStep(ratingValue))
    ) {
      setUpdateError("Rating must be between 0.5 and 5 in half-star steps")
      return
    }

    setUpdateLoading(true)
    setUpdateError(null)

    const readAtValue = editRead
      ? editingEntry.read_at ?? new Date().toISOString()
      : null

    const storedRating = denormalizeRating(ratingValue)

    const { error } = await supabase
      .from("user_book")
      .update({
        rating: storedRating,
        owned: editOwned,
        read_at: readAtValue,
      })
      .eq("id", editingEntry.id)
      .eq("user_id", user.id)

    if (error) {
      setUpdateError(error.message)
      setUpdateLoading(false)
      return
    }

    setCollectionMessage("Book details updated")
    setUpdateLoading(false)
    closeEditModal()
    await loadUserBooks()
  }

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
    setSelectedBook(null)
    setCollectionMessage(null)
    setAddFormError(null)
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Bookshelf</h1>
        <p className="text-gray-600">
          {user
            ? "Add books, then keep track of your collection and reading status."
            : "Sign in with email and password to access your shelf."}
        </p>
      </section>

      {user ? (
        <>
          <section className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <button
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700 disabled:opacity-60"
              onClick={handleSignOut}
              disabled={authLoading}
            >
              Sign out
            </button>
            <button
              type="button"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              onClick={handleCopyProfileLink}
              disabled={authLoading}
            >
              Copy profile link
            </button>
            {statusMessage && (
              <p className="text-sm text-green-600">{statusMessage}</p>
            )}
            {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}
            {copyFeedback && <p className="text-sm text-gray-600">{copyFeedback}</p>}
          </section>

          <section className="rounded-md border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Add a book</h2>
              <p className="text-sm text-gray-500">
                Start typing to search existing titles or add a new one.
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleAddBook}>
              <div className="relative">
                <label className="mb-1 block text-sm font-medium" htmlFor="book-search">
                  Book title
                </label>
                <input
                  id="book-search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                  placeholder="Search titles"
                  autoComplete="off"
                  required
                />
                {suggestionsLoading && (
                  <p className="absolute right-3 top-9 text-xs text-gray-500">
                    Searching…
                  </p>
                )}
                {suggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white text-left shadow-md">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className="w-full px-3 py-2 text-left hover:bg-pink-50"
                        >
                          <span className="block font-medium">{suggestion.title}</span>
                          <span className="block text-xs text-gray-500">
                            {suggestion.author}
                            {suggestion.year ? ` · ${suggestion.year}` : ""}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selectedBook ? (
                <div className="flex items-center justify-between rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{selectedBook.title}</p>
                    <p className="text-xs text-gray-600">by {selectedBook.author}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-pink-600 hover:underline"
                    onClick={() => setSelectedBook(null)}
                  >
                    Clear selection
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="new-author">
                      Author
                    </label>
                    <input
                      id="new-author"
                      type="text"
                      value={newBookAuthor}
                      onChange={(event) => setNewBookAuthor(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                      placeholder="Required for new books"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="new-genre">
                      Genre
                    </label>
                    <input
                      id="new-genre"
                      type="text"
                      value={newBookGenre}
                      onChange={(event) => setNewBookGenre(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="new-year">
                      Year
                    </label>
                    <input
                      id="new-year"
                      type="number"
                      value={newBookYear}
                      onChange={(event) => setNewBookYear(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                      min={0}
                      max={9999}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="rating">
                    Rating
                  </label>
                  <select
                    id="rating"
                    value={addRating}
                    onChange={(event) => setAddRating(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="">Unrated</option>
                    {ratingSteps.map((value) => {
                      const label =
                        value % 1 === 0
                          ? `${value} star${value > 1 ? "s" : ""}`
                          : `${value.toFixed(1)} stars`
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={addOwned}
                    onChange={(event) => setAddOwned(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Owned copy
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={addRead}
                    onChange={(event) => setAddRead(event.target.checked)}
                    className="h-4 w-4"
                  />
                  Mark as read
                </label>
              </div>

              {addFormError && (
                <p className="text-sm text-red-600">{addFormError}</p>
              )}
              {collectionMessage && (
                <p className="text-sm text-green-600">{collectionMessage}</p>
              )}

              <button
                type="submit"
                className="w-full rounded-md bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-500 disabled:opacity-60"
                disabled={addLoading}
              >
                {addLoading ? "Adding…" : "Add to bookshelf"}
              </button>
            </form>
          </section>

          <BookshelfView
            title="Your bookshelf"
            entries={userBooks}
            loading={booksLoading}
            error={booksError}
            onRefresh={loadUserBooks}
            editable
            onEditEntry={openEditModal}
            emptyMessage="No books yet. Add a title above to get started."
          />

          {editingEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-xl font-semibold">
                  Edit &ldquo;{editingEntry.book?.title ?? "Book"}&rdquo;
                </h3>
                <p className="text-sm text-gray-500">
                  Update your rating, ownership, and read status.
                </p>
                <form className="mt-4 space-y-4" onSubmit={handleUpdateEntry}>
                  <div>
                    <label className="mb-1 block text-sm font-medium" htmlFor="edit-rating">
                      Rating
                    </label>
                    <select
                      id="edit-rating"
                      value={editRating}
                      onChange={(event) => setEditRating(event.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-pink-500 focus:outline-none"
                    >
                      <option value="">Unrated</option>
                      {ratingSteps.map((value) => {
                        const label =
                          value % 1 === 0
                            ? `${value} star${value > 1 ? "s" : ""}`
                            : `${value.toFixed(1)} stars`
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={editOwned}
                      onChange={(event) => setEditOwned(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Owned copy
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={editRead}
                      onChange={(event) => setEditRead(event.target.checked)}
                      className="h-4 w-4"
                    />
                    Mark as read
                  </label>

                  {updateError && (
                    <p className="text-sm text-red-600">{updateError}</p>
                  )}

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      onClick={closeEditModal}
                      disabled={updateLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-md bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500 disabled:opacity-60"
                      disabled={updateLoading}
                    >
                      {updateLoading ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
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
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                required
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
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
      )}
    </main>
  )
}

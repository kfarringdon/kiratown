"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import BookshelfAuthPrompt from "@/components/bookshelf/bookshelf-auth-prompt"
import { useBookshelf } from "@/components/bookshelf/bookshelf-context"

type BorrowBook = {
  id: number | null
  title: string | null
  author: string | null
  genre: string | null
  year: number | null
  image_url?: string | null
}

type BorrowQueryRow = {
  book_id: number | null
  created_at: string | null
  user_id: string | null
  book: BorrowBook | BorrowBook[] | null
}

type BorrowEntry = {
  book: {
    id: number
    title: string
    author: string | null
    genre: string | null
    year: number | null
    imageUrl: string | null
  }
  ownerCount: number
  lastAdded: Date
}

export default function BorrowTab() {
  const { supabase, user } = useBookshelf()
  const [entries, setEntries] = useState<BorrowEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBorrowEntries = useCallback(async () => {
    setLoading(true)
    setError(null)

    const { data, error: queryError } = await supabase
      .from("user_book")
      .select(
        "book_id, created_at, user_id, book:book_id (id, title, author, genre, year, image_url)",
      )
      .order("created_at", { ascending: false })
      .limit(200)

    if (queryError) {
      setError(queryError.message)
      setEntries([])
      setLoading(false)
      return
    }

    const grouped = new Map<
      number,
      { book: BorrowEntry["book"]; ownerIds: Set<string>; lastAdded: Date }
    >()

    for (const row of data) {
      if (!row.book_id || !row.book) continue

      const bookRecord = Array.isArray(row.book)
        ? (row.book[0] ?? null)
        : row.book
      if (!bookRecord) continue

      const existing = grouped.get(row.book_id)
      if (existing) {
        if (row.user_id) existing.ownerIds.add(row.user_id)
      } else {
        grouped.set(row.book_id, {
          book: {
            id: bookRecord.id ?? row.book_id,
            title: bookRecord.title ?? "Untitled",
            author: bookRecord.author,
            genre: bookRecord.genre,
            year: bookRecord.year,
            imageUrl: bookRecord.image_url ?? null,
          },
          ownerIds: row.user_id ? new Set([row.user_id]) : new Set(),
          lastAdded: new Date(row.created_at),
        })
      }
      if (grouped.size >= 25) break
    }

    const mapped: BorrowEntry[] = Array.from(grouped.values()).map((entry) => ({
      book: entry.book,
      ownerCount: entry.ownerIds.size,
      lastAdded: entry.lastAdded,
    }))

    setEntries(mapped)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchBorrowEntries()
  }, [fetchBorrowEntries])

  if (!user) {
    return <BookshelfAuthPrompt message="Sign in to browse books to borrow." />
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">New books</h2>
        <button
          type="button"
          onClick={fetchBorrowEntries}
          className="text-sm text-pink-600 hover:underline"
          disabled={loading}
        >
          Refresh
        </button>
      </div>
      <p className="text-gray-500">
        These are books people have recently listed on their shelves.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-gray-500">Loading recent books…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">
          No recent books available to borrow.
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => (
            <Link href={`/bookshelf/book/${entry.book.id}`} key={entry.book.id}>
              <li className="rounded-md border border-gray-200 p-4 shadow-sm">
                <h3 className="text-lg font-semibold">{entry.book.title}</h3>
                <p className="text-sm text-gray-600">
                  {entry.book.author
                    ? `by ${entry.book.author}`
                    : "Author unknown"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Owned by{" "}
                  <span className="font-semibold">{entry.ownerCount}</span>{" "}
                  {entry.ownerCount === 1 ? "person" : "people"}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  Last added {entry.lastAdded.toISOString().slice(0, 10)}
                </p>
              </li>
            </Link>
          ))}
        </ul>
      )}
    </section>
  )
}

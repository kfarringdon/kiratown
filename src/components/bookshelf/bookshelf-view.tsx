"use client"

import type { ReactNode } from "react"

import { RatingStars, normalizeRating } from "./rating"

export type BookshelfEntry = {
  id: number
  book_id: number
  rating: number | null
  owned: boolean
  read_at: string | null
  created_at: string
  book: {
    id: number
    title: string
    author: string
    genre: string | null
    year: number | null
  } | null
}

type BookshelfViewProps = {
  entries: BookshelfEntry[]
  loading: boolean
  error: string | null
  onRefresh?: () => void | Promise<void>
  editable?: boolean
  onEditEntry?: (entry: BookshelfEntry) => void
  emptyMessage?: string
  title?: string
  actions?: ReactNode
}

const defaultEmptyMessage = "No books yet."
const defaultTitle = "Bookshelf"

export default function BookshelfView({
  entries,
  loading,
  error,
  onRefresh,
  editable = false,
  onEditEntry,
  emptyMessage = defaultEmptyMessage,
  title = defaultTitle,
  actions,
}: BookshelfViewProps) {
  const showRefresh = Boolean(onRefresh)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          {actions}
          {showRefresh && (
            <button
              type="button"
              onClick={() => onRefresh?.()}
              className="text-sm text-pink-600 hover:underline"
              disabled={loading}
            >
              Refresh
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-500">Loading your books…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {entries.map((entry) => {
            const displayRating = normalizeRating(entry.rating)
            const hasRead = Boolean(entry.read_at)

            return (
              <li
                key={entry.id}
                className="rounded-md border border-gray-200 p-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold">
                  {entry.book?.title ?? "Unknown title"}
                </h3>
                <p className="text-sm text-gray-600">
                  {entry.book?.author ? `by ${entry.book.author}` : "Author unknown"}
                </p>
                <dl className="mt-3 space-y-1 text-sm text-gray-700">
                  <div className="flex items-center justify-between">
                    <dt className="font-medium">Rating</dt>
                    <dd>
                      {displayRating !== null ? (
                        <RatingStars rating={displayRating} />
                      ) : (
                        "Unrated"
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Owned</dt>
                    <dd>
                      {entry.owned ? (
                        <span role="img" aria-label="Yes">
                          ✅
                        </span>
                      ) : (
                        <span role="img" aria-label="No">
                          ❌
                        </span>
                      )}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium">Read</dt>
                    <dd>
                      {hasRead ? (
                        <span role="img" aria-label="Yes">
                          ✅
                        </span>
                      ) : (
                        <span role="img" aria-label="No">
                          ❌
                        </span>
                      )}
                    </dd>
                  </div>
                </dl>
                {editable && onEditEntry && (
                  <button
                    type="button"
                    className="mt-4 w-full rounded-md border border-pink-200 px-3 py-2 text-sm font-semibold text-pink-600 hover:bg-pink-50"
                    onClick={() => onEditEntry(entry)}
                  >
                    Edit details
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

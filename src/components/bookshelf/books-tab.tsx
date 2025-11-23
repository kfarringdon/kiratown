"use client"

import Link from "next/link"
import { useState } from "react"

import BookshelfView, { type BookshelfEntry } from "@/components/bookshelf/bookshelf-view"
import BookshelfAuthPrompt from "@/components/bookshelf/bookshelf-auth-prompt"
import {
  denormalizeRating,
  isValidHalfStep,
  normalizeRating,
  ratingSteps,
} from "@/components/bookshelf/rating"
import { useBookshelf } from "@/components/bookshelf/bookshelf-context"

export default function BooksTab() {
  const { user, userBooks, booksLoading, booksError, supabase, loadUserBooks } = useBookshelf()
  const [editingEntry, setEditingEntry] = useState<BookshelfEntry | null>(null)
  const [editRating, setEditRating] = useState("")
  const [editOwned, setEditOwned] = useState(false)
  const [editRead, setEditRead] = useState(false)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [collectionMessage, setCollectionMessage] = useState<string | null>(null)

  if (!user) {
    return <BookshelfAuthPrompt message="Sign in to view and manage your bookshelf." />
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

  const handleUpdateEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingEntry) return

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

    const readAtValue = editRead ? editingEntry.read_at ?? new Date().toISOString() : null
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

  return (
    <>
      {collectionMessage && (
        <p className="text-sm text-green-600 rounded-md border border-green-200 bg-green-50 px-3 py-2">
          {collectionMessage}
        </p>
      )}
      <BookshelfView
        title="Your bookshelf"
        entries={userBooks}
        loading={booksLoading}
        error={booksError}
        onRefresh={loadUserBooks}
        editable
        onEditEntry={openEditModal}
        emptyMessage="No books yet. Add a title above to get started."
        actions={
          <Link
            href="/bookshelf/add"
            className="rounded-full bg-pink-600 px-3 py-1 text-sm font-semibold text-white hover:bg-pink-500"
          >
            + Add
          </Link>
        }
      />

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold">
              Edit &ldquo;{editingEntry.book?.title ?? "Book"}&rdquo;
            </h3>
            <p className="text-sm text-gray-500">Update your rating, ownership, and read status.</p>
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
                      value % 1 === 0 ? `${value} star${value > 1 ? "s" : ""}` : `${value.toFixed(1)} stars`
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

              {updateError && <p className="text-sm text-red-600">{updateError}</p>}

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
  )
}

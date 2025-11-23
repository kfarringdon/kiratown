"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"

import BookshelfAuthPrompt from "@/components/bookshelf/bookshelf-auth-prompt"
import { ratingSteps } from "@/components/bookshelf/rating"
import { useBookshelf } from "@/components/bookshelf/bookshelf-context"
import { denormalizeRating, isValidHalfStep } from "@/components/bookshelf/rating"

type BookSuggestion = {
  id: string
  bookId: number | null
  title: string
  author: string | null
  genre: string | null
  year: number | null
  imageUrl: string | null
}

type GoogleBooksResponse = {
  items?: Array<{
    id?: string
    volumeInfo?: {
      title?: string
      authors?: string[]
      categories?: string[]
      publishedDate?: string
      imageLinks?: {
        smallThumbnail?: string
      }
    }
  }>
}

export default function AddTab() {
  const { user, supabase, loadUserBooks } = useBookshelf()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<BookSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookSuggestion | null>(null)
  const [newBookAuthor, setNewBookAuthor] = useState("")
  const [newBookGenre, setNewBookGenre] = useState("")
  const [newBookYear, setNewBookYear] = useState("")
  const [newBookImageUrl, setNewBookImageUrl] = useState("")
  const [addRating, setAddRating] = useState("")
  const [addOwned, setAddOwned] = useState(false)
  const [addRead, setAddRead] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [addFormError, setAddFormError] = useState<string | null>(null)
  const [collectionMessage, setCollectionMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }

    let active = true
    const controller = new AbortController()
    setSuggestionsLoading(true)
    const timer = window.setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const query = encodeURIComponent(searchTerm.trim())
          const response = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=7`,
            { signal: controller.signal },
          )
          if (!response.ok) throw new Error("Suggestion request failed")
          const data = (await response.json()) as GoogleBooksResponse
          if (!active) return
          const mappedSuggestions =
            data.items
              ?.map((item) => {
                const volumeInfo = item.volumeInfo ?? {}
                const title = volumeInfo.title ?? ""
                if (!title) return null
                const authors = volumeInfo.authors ?? []
                const yearMatch = volumeInfo.publishedDate?.match(/\d{4}/)
                const yearValue = yearMatch ? Number.parseInt(yearMatch[0] ?? "", 10) : null
                const thumbnail = volumeInfo.imageLinks?.smallThumbnail ?? null
                return {
                  id: item.id ?? `${title}-${Math.random().toString(36).slice(2)}`,
                  bookId: null,
                  title,
                  author: authors[0] ?? null,
                  genre: volumeInfo.categories?.[0] ?? null,
                  year: Number.isFinite(yearValue) ? yearValue : null,
                  imageUrl: thumbnail ? thumbnail.replace(/^http:\/\//, "https://") : null,
                } as BookSuggestion | null
              })
              .filter((suggestion): suggestion is BookSuggestion => suggestion !== null) ?? []
          setSuggestions(mappedSuggestions)
        } catch (error) {
          if (!active) return
          if (error instanceof DOMException && error.name === "AbortError") {
            return
          }
          setSuggestions([])
        } finally {
          if (active) {
            setSuggestionsLoading(false)
          }
        }
      }
      fetchSuggestions()
    }, 250)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [searchTerm])

  const handleSuggestionSelect = (suggestion: BookSuggestion) => {
    setSelectedBook(suggestion)
    setSearchTerm(suggestion.title)
    if (!suggestion.bookId) {
      setNewBookAuthor(suggestion.author ?? "")
      setNewBookGenre(suggestion.genre ?? "")
      setNewBookYear(suggestion.year ? suggestion.year.toString() : "")
      setNewBookImageUrl(suggestion.imageUrl ?? "")
    } else {
      setNewBookImageUrl("")
    }
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
    setNewBookImageUrl("")
    setAddRating("")
    setAddOwned(false)
    setAddRead(false)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedBook && !selectedBook.bookId) {
      setNewBookAuthor("")
      setNewBookGenre("")
      setNewBookYear("")
    }
    setSearchTerm(event.target.value)
    setNewBookImageUrl("")
    setSelectedBook(null)
    setCollectionMessage(null)
    setAddFormError(null)
  }

  const handleAddBook = async (event: React.FormEvent<HTMLFormElement>) => {
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

    if (!selectedBook?.bookId && !newBookAuthor.trim()) {
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

    let bookId = selectedBook?.bookId ?? null

    if (!bookId) {
      const { data, error } = await supabase
        .from("book")
        .insert({
          title: searchTerm.trim(),
          author: newBookAuthor.trim(),
          genre: newBookGenre.trim() || null,
          year: newBookYear ? Number.parseInt(newBookYear, 10) : null,
          image_url: newBookImageUrl.trim() || null,
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
    router.push("/bookshelf/books")
  }

  if (!user) {
    return <BookshelfAuthPrompt message="Sign in to add books to your shelf." />
  }

  return (
    <section className="rounded-md border border-gray-200 p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Add a book</h2>
        <p className="text-sm text-gray-500">Start typing to search existing titles or add a new one.</p>
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
            <p className="absolute right-3 top-9 text-xs text-gray-500">Searching…</p>
          )}
          {suggestions.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white text-left shadow-md">
              {suggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-pink-50"
                  >
                    <div className="flex-1">
                      <span className="block font-medium">{suggestion.title}</span>
                      <span className="block text-xs text-gray-500">
                        {suggestion.author ?? "Unknown author"}
                        {suggestion.year ? ` · ${suggestion.year}` : ""}
                      </span>
                    </div>
                    {suggestion.imageUrl && (
                      <Image
                        src={suggestion.imageUrl}
                        alt={`Cover of ${suggestion.title}`}
                        width={48}
                        height={72}
                        className="h-16 w-12 flex-shrink-0 rounded-sm border border-gray-200 object-cover"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedBook && (
          <div className="flex items-center justify-between rounded-md border border-pink-200 bg-pink-50 px-3 py-2 text-sm">
            <div>
              <p className="font-medium">{selectedBook.title}</p>
              <p className="text-xs text-gray-600">
                {selectedBook.author ? `by ${selectedBook.author}` : "Author unknown"}
                {selectedBook.year ? ` · ${selectedBook.year}` : ""}
              </p>
              {!selectedBook.bookId && (
                <p className="text-xs text-gray-500">Details imported from Google Books. Edit below before saving.</p>
              )}
            </div>
            <button
              type="button"
              className="text-xs font-semibold text-pink-600 hover:underline"
              onClick={() => {
                if (selectedBook && !selectedBook.bookId) {
                  setNewBookAuthor("")
                  setNewBookGenre("")
                  setNewBookYear("")
                  setNewBookImageUrl("")
                }
                setSelectedBook(null)
              }}
            >
              Clear selection
            </button>
          </div>
        )}
        {(!selectedBook || !selectedBook.bookId) && (
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

        <input type="hidden" name="image-url" value={newBookImageUrl} readOnly />

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
                const label = value % 1 === 0 ? `${value} star${value > 1 ? "s" : ""}` : `${value.toFixed(1)} stars`
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

        {addFormError && <p className="text-sm text-red-600">{addFormError}</p>}
        {collectionMessage && <p className="text-sm text-green-600">{collectionMessage}</p>}

        <button
          type="submit"
          className="w-full rounded-md bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-500 disabled:opacity-60"
          disabled={addLoading}
        >
          {addLoading ? "Adding…" : "Add to bookshelf"}
        </button>
      </form>
    </section>
  )
}

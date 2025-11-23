"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { User } from "@supabase/supabase-js"

import type { BookshelfEntry } from "@/components/bookshelf/bookshelf-view"
import { createClient } from "@/utils/supabase/client"

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

type BookshelfContextValue = {
  supabase: ReturnType<typeof createClient>
  user: User | null
  userBooks: BookshelfEntry[]
  booksLoading: boolean
  booksError: string | null
  loadUserBooks: () => Promise<void>
}

const BookshelfContext = createContext<BookshelfContextValue | undefined>(undefined)

export const BookshelfProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [userBooks, setUserBooks] = useState<BookshelfEntry[]>([])
  const [booksLoading, setBooksLoading] = useState(false)
  const [booksError, setBooksError] = useState<string | null>(null)

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

  const value: BookshelfContextValue = {
    supabase,
    user,
    userBooks,
    booksLoading,
    booksError,
    loadUserBooks,
  }

  return <BookshelfContext.Provider value={value}>{children}</BookshelfContext.Provider>
}

export const useBookshelf = () => {
  const context = useContext(BookshelfContext)
  if (!context) {
    throw new Error("useBookshelf must be used within a BookshelfProvider")
  }
  return context
}

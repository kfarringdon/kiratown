import { cookies } from "next/headers"

import BookshelfView, {
  type BookshelfEntry,
} from "@/components/bookshelf/bookshelf-view"
import { createClient } from "@/utils/supabase/server"

const formatUserHeading = (userId: string) => {
  if (userId.length <= 12) {
    return userId
  }
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`
}

type RouteParams = {
  params: Promise<{
    user_id: string
  }>
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

export default async function UserBookshelfPage({ params }: RouteParams) {
  const { user_id: userId } = await params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("user_book")
    .select(
      "id, created_at, rating, owned, read_at, book_id, book:book_id (id, title, author, genre, year)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const entries: BookshelfEntry[] = ((data ?? []) as RawUserBookRow[]).map((row) => {
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
    }
  })
  const displayName = formatUserHeading(userId)

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Bookshelf</h1>
        <p className="text-gray-600">
          Viewing the collection saved by <span className="font-semibold">{displayName}</span>.
        </p>
      </section>

      <BookshelfView
        title="Saved books"
        entries={entries}
        loading={false}
        error={error ? error.message : null}
        editable={false}
        emptyMessage="This reader hasn't added any books yet."
      />
    </main>
  )
}

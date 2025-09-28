import { cookies } from "next/headers"

import BookshelfView, {
  type BookshelfEntry,
} from "@/components/bookshelf/bookshelf-view"
import { createClient } from "@/utils/supabase/server"

type PageProps = {
  params: {
    user_id: string
  }
}

const formatUserHeading = (userId: string) => {
  if (userId.length <= 12) {
    return userId
  }
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`
}

export default async function UserBookshelfPage({ params }: PageProps) {
  const { user_id: userId } = params

  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase
    .from("user_book")
    .select(
      "id, created_at, rating, owned, read_at, book_id, book:book_id (id, title, author, genre, year)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  const entries = (data ?? []) as BookshelfEntry[]
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

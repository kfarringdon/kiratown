import Link from "next/link"
import Image from "next/image"
import { cookies } from "next/headers"

import BookshelfLayout from "@/components/bookshelf/bookshelf-layout"
import { createClient } from "@/utils/supabase/server"

const formatUserHeading = (userId: string) => {
  if (userId.length <= 12) return userId
  return `${userId.slice(0, 8)}...${userId.slice(-4)}`
}

type RouteParams = {
  params: Promise<{
    book_id: string
  }>
}

export default async function BookDetailPage({ params }: RouteParams) {
  const { book_id } = await params
  const bookIdNumber = Number.parseInt(book_id, 10)

  if (Number.isNaN(bookIdNumber)) {
    return (
      <BookshelfLayout activeTab="borrow">
        <p className="text-center text-red-600">Invalid book selection.</p>
      </BookshelfLayout>
    )
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: userBooks, error } = await supabase
    .from("user_book")
    .select(
      "user_id, created_at, book:book_id (id, title, author, genre, year, image_url)"
    )
    .eq("book_id", bookIdNumber)
    .order("created_at", { ascending: false })

  const firstBook = (userBooks ?? []).find((row) => row.book)?.book
  const uniqueOwnerIds = Array.from(new Set((userBooks ?? []).map((row) => row.user_id).filter(Boolean)))

  let profileMap: Record<string, string | null> = {}
  if (uniqueOwnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profile")
      .select("id, fullname")
      .in("id", uniqueOwnerIds)
    profileMap = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile.fullname]))
  }

  return (
    <BookshelfLayout activeTab="borrow">
      <section className="space-y-4 rounded-md border border-gray-200 p-6">
        {firstBook ? (
          <>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{firstBook.title ?? "Untitled"}</h2>
              <p className="text-sm text-gray-600">
                {firstBook.author ? `by ${firstBook.author}` : "Author unknown"}
              </p>
              {firstBook.genre && <p className="text-sm text-gray-500">Genre: {firstBook.genre}</p>}
              {firstBook.year && <p className="text-sm text-gray-500">Year: {firstBook.year}</p>}
            </div>
            {firstBook.image_url && (
              <Image
                src={firstBook.image_url}
                alt={`Cover of ${firstBook.title ?? "Book"}`}
                width={160}
                height={240}
                className="h-60 w-auto rounded-md border border-gray-200 object-cover"
              />
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">No details available for this book.</p>
        )}

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Borrow from</h3>
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          {userBooks && userBooks.length > 0 ? (
            <ul className="space-y-2">
              {uniqueOwnerIds.map((ownerId) => {
                const name = profileMap[ownerId] ?? formatUserHeading(ownerId)
                return (
                  <li key={ownerId}>
                    <Link
                      href={`/bookshelf/profile/${ownerId}`}
                      className="text-pink-600 hover:underline"
                    >
                      {name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No one is sharing this book yet.</p>
          )}
        </div>
      </section>
    </BookshelfLayout>
  )
}

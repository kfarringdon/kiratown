"use client"

import Link from "next/link"

type Props = {
  message: string
}

export default function BookshelfAuthPrompt({ message }: Props) {
  return (
    <section className="rounded-md border border-gray-200 p-6 text-center space-y-3">
      <p className="text-gray-700">{message}</p>
      <Link className="text-sm font-semibold text-pink-600 hover:underline" href="/bookshelf/profile">
        Go to profile tab
      </Link>
    </section>
  )
}

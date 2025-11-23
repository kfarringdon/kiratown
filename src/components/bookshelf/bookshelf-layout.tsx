"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type BookshelfTab = "books" | "borrow" | "profile"

const tabs: Array<{ id: BookshelfTab; label: string; href: string }> = [
  { id: "books", label: "Books", href: "/bookshelf/books" },
  { id: "borrow", label: "Borrow", href: "/bookshelf/borrow" },
  { id: "profile", label: "Profile", href: "/bookshelf/profile" },
]

type Props = {
  activeTab: BookshelfTab
  children: ReactNode
}

export default function BookshelfLayout({ activeTab, children }: Props) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Bookshelf</h1>
        <p className="text-gray-600">
          Keep track of your collection, add new favorites, and manage your profile.
        </p>
      </section>

      <nav className="flex justify-center gap-3">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                isActive ? "bg-pink-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>

      {children}
    </main>
  )
}

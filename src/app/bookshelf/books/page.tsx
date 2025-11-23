import BookshelfLayout from "@/components/bookshelf/bookshelf-layout"
import { BookshelfProvider } from "@/components/bookshelf/bookshelf-context"
import BooksTab from "@/components/bookshelf/books-tab"

export default function BooksTabPage() {
  return (
    <BookshelfProvider>
      <BookshelfLayout activeTab="books">
        <BooksTab />
      </BookshelfLayout>
    </BookshelfProvider>
  )
}

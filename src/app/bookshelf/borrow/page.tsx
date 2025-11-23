import BookshelfLayout from "@/components/bookshelf/bookshelf-layout"
import { BookshelfProvider } from "@/components/bookshelf/bookshelf-context"
import BorrowTab from "@/components/bookshelf/borrow-tab"

export default function BorrowPage() {
  return (
    <BookshelfProvider>
      <BookshelfLayout activeTab="borrow">
        <BorrowTab />
      </BookshelfLayout>
    </BookshelfProvider>
  )
}

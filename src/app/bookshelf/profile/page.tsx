import BookshelfLayout from "@/components/bookshelf/bookshelf-layout"
import { BookshelfProvider } from "@/components/bookshelf/bookshelf-context"
import ProfileTab from "@/components/bookshelf/profile-tab"

export default function ProfilePage() {
  return (
    <BookshelfProvider>
      <BookshelfLayout activeTab="profile">
        <ProfileTab />
      </BookshelfLayout>
    </BookshelfProvider>
  )
}

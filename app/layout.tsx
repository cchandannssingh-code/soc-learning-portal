import "./globals.css"
import { AuthProvider } from "@/components/AuthProvider"
import { getNotesTree, getAllNotes } from "@/lib/notes"
import CommunicationHub from "@/components/communication/CommunicationHub"
import GlobalCallUI from "@/components/communication/GlobalCallUI"
import FocusModeLayout from "@/components/FocusModeLayout"
import MouseGlow from "@/components/MouseGlow"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const tree = getNotesTree()
  const allNotes = getAllNotes()

  return (
    <html lang="en">
      <body>
        <MouseGlow />
        <AuthProvider>
          <FocusModeLayout tree={tree} notes={allNotes}>
            {children}
          </FocusModeLayout>
          <CommunicationHub />
          <GlobalCallUI />
        </AuthProvider>
      </body>
    </html>
  )
}

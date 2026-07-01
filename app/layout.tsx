import "./globals.css"
import Sidebar from "@/components/Sidebar"
import SearchBar from "@/components/SearchBar"
import { AuthProvider } from "@/components/AuthProvider"
import { getNotesTree, getAllNotes } from "@/lib/notes"
import CommunicationHub from "@/components/communication/CommunicationHub"
import GlobalCallUI from "@/components/communication/GlobalCallUI"

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
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <SearchBar notes={allNotes} />
            <div className="flex flex-col md:flex-row flex-1">
              <Sidebar tree={tree} />
              <main className="flex-1 bg-[#f4f7fb] p-4 md:p-8">
                {children}
                <footer className="mt-10 text-center text-sm text-slate-500 py-6">
                  © 2026 SOCForge. All rights reserved.
                </footer>
              </main>
            </div>
          </div>
          <CommunicationHub />
          <GlobalCallUI />
        </AuthProvider>
      </body>
    </html>
  )
}

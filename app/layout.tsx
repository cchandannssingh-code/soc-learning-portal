import "./globals.css"
import Sidebar from "@/components/Sidebar"
import { getAllNotes } from "@/lib/notes"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const notes = getAllNotes()

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col md:flex-row">
          <Sidebar notes={notes} />

          <main className="flex-1 bg-[#f4f7fb] min-h-screen p-4 md:p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
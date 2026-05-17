"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Sidebar({
  notes,
}: {
  notes: any[]
}) {
  const pathname = usePathname()

  const [openSections, setOpenSections] = useState<any>({
    windows: true,
  })

  const groupedNotes = notes.reduce((acc: any, note: any) => {
    if (!acc[note.category]) {
      acc[note.category] = []
    }

    acc[note.category].push(note)

    return acc
  }, {})

  const toggleSection = (category: string) => {
    setOpenSections((prev: any) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="w-full md:w-72 h-screen sticky top-0 bg-[#071224] text-white p-5 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-8 tracking-wide">
        SOC Portal
      </h1>

      <div className="space-y-4">
        {Object.entries(groupedNotes).map(
          ([category, categoryNotes]: any) => (
            <div
              key={category}
              className="bg-[#0d1b31] rounded-xl overflow-hidden border border-[#1e3354]"
            >
              <button
                onClick={() => toggleSection(category)}
                className={`
                  w-full flex items-center justify-between px-4 py-3
                  font-semibold uppercase tracking-wide transition
                  ${
                    openSections[category]
                      ? "bg-[#132541] text-cyan-300"
                      : "text-blue-300 hover:bg-[#132541]"
                  }
                `}
              >
                <span>{category}</span>

                <span className="text-sm">
                  {openSections[category] ? "▼" : "▶"}
                </span>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${
                    openSections[category]
                      ? "max-h-[500px] opacity-100"
                      : "max-h-0 opacity-0"
                  }
                `}
              >
                <div className="p-3 space-y-2">
                  {categoryNotes.map((note: any) => {
                    const isActive =
                      pathname === `/notes/${note.slug}`

                    return (
                      <Link
                        key={note.slug}
                        href={`/notes/${note.slug}`}
                        className={`
                          block px-3 py-2 rounded-lg text-sm transition
                          ${
                            isActive
                              ? "bg-cyan-700 text-white"
                              : "bg-[#162847] hover:bg-[#1c345d]"
                          }
                        `}
                      >
                        {note.title}
                      </Link>
                    )
                  })}

                  <Link
                    href={`/assessment/${category}`}
                    className={`
                      block px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        pathname === `/assessment/${category}`
                          ? "bg-blue-600 text-white"
                          : "bg-[#162847] hover:bg-[#1c345d]"
                      }
                    `}
                  >
                    Assessment
                  </Link>
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
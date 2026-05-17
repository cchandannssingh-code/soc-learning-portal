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

  const [openSections, setOpenSections] =
    useState<any>({})

  const [openSubSections, setOpenSubSections] =
    useState<any>({})

  const [mobileOpen, setMobileOpen] =
    useState(false)

  const groupedNotes = notes.reduce(
    (acc: any, note: any) => {

      const category = note.category
      const subcategory =
        note.subcategory || "general"

      if (!acc[category]) {
        acc[category] = {}
      }

      if (!acc[category][subcategory]) {
        acc[category][subcategory] = []
      }

      acc[category][subcategory].push(note)

      return acc
    },
    {}
  )

  const toggleSection = (category: string) => {
    setOpenSections((prev: any) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  const toggleSubSection = (
    category: string,
    subcategory: string
  ) => {

    const key =
      `${category}-${subcategory}`

    setOpenSubSections((prev: any) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <>
      {/* MOBILE HEADER */}

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#071224] border-b border-[#1e3354] px-4 py-3 flex items-center justify-between">
        <h1 className="text-white font-bold text-lg">
          SOC Portal
        </h1>

        <button
          onClick={() =>
            setMobileOpen(!mobileOpen)
          }
          className="text-white text-xl"
        >
          ☰
        </button>
      </div>

      {/* OVERLAY */}

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}

      <div
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-72 h-screen bg-[#071224]
          text-white p-5 overflow-y-auto
          transition-transform duration-300
          border-r border-[#1e3354]

          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }

          md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between mb-8 mt-10 md:mt-0">
          <h1 className="text-2xl font-bold tracking-wide">
            SOC Portal
          </h1>

          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {Object.entries(groupedNotes).map(
            ([category, subcategories]: any) => (
              <div
                key={category}
                className="bg-[#0d1b31] rounded-xl overflow-hidden border border-[#1e3354]"
              >
                {/* CATEGORY */}

                <button
                  onClick={() =>
                    toggleSection(category)
                  }
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

                  <span>
                    {openSections[category]
                      ? "▼"
                      : "▶"}
                  </span>
                </button>

                {/* SUBCATEGORY */}

                <div
                  className={`
                    overflow-hidden transition-all duration-300
                    ${
                      openSections[category]
                        ? "max-h-[2000px] opacity-100"
                        : "max-h-0 opacity-0"
                    }
                  `}
                >
                  <div className="p-3 space-y-3">

                    {Object.entries(subcategories).map(
                      ([subcategory, subNotes]: any) => {

                        const subKey =
                          `${category}-${subcategory}`

                        return (
                          <div
                            key={subcategory}
                            className="bg-[#132541] rounded-lg overflow-hidden"
                          >
                            {/* SUBCATEGORY BUTTON */}

                            <button
                              onClick={() =>
                                toggleSubSection(
                                  category,
                                  subcategory
                                )
                              }
                              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-200 hover:bg-[#1b3358] transition"
                            >
                              <span>
                                {subcategory}
                              </span>

                              <span>
                                {openSubSections[subKey]
                                  ? "▼"
                                  : "▶"}
                              </span>
                            </button>

                            {/* NOTES */}

                            <div
                              className={`
                                overflow-hidden transition-all duration-300
                                ${
                                  openSubSections[subKey]
                                    ? "max-h-[1000px] opacity-100"
                                    : "max-h-0 opacity-0"
                                }
                              `}
                            >
                              <div className="p-2 space-y-2">

                                {subNotes.map(
                                  (note: any) => {

                                    const isActive =
                                      pathname ===
                                      `/notes/${note.slug}`

                                    return (
                                      <Link
                                        key={note.slug}
                                        href={`/notes/${note.slug}`}
                                        onClick={() =>
                                          setMobileOpen(false)
                                        }
                                        className={`
                                          block px-3 py-2 rounded-lg text-sm transition
                                          ${
                                            isActive
                                              ? "bg-cyan-700 text-white"
                                              : "bg-[#1b3358] hover:bg-[#25406b]"
                                          }
                                        `}
                                      >
                                        {note.title}
                                      </Link>
                                    )
                                  }
                                )}

                                <Link
                                  href={`/assessment/${category}/${subcategory}`}
                                  className={`
                                    block px-3 py-2 rounded-lg text-sm font-medium transition
                                    ${
                                      pathname ===
                                      `/assessment/${category}`
                                        ? "bg-blue-600 text-white"
                                        : "bg-[#1b3358] hover:bg-[#25406b]"
                                    }
                                  `}
                                >
                                  Assessment
                                </Link>

                              </div>
                            </div>
                          </div>
                        )
                      }
                    )}

                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Note } from "@/lib/notes"

interface SearchBarProps {
  notes: Note[]
}

export default function SearchBar({ notes }: SearchBarProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const navigateToNote = (note: Note) => {
    setSearchTerm("")
    setSelectedIndex(-1)
    router.push(`/notes/${note.slug}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredNotes.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredNotes.length - 1 ? prev + 1 : 0
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredNotes.length - 1
        )
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0) {
          navigateToNote(filteredNotes[selectedIndex])
        } else if (filteredNotes.length > 0) {
          navigateToNote(filteredNotes[0])
        }
        break
      case "Escape":
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div className="relative w-full mt-16 md:mt-0 px-4 md:px-8 py-4 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search notes by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
        />
      </div>

      {isFocused && searchTerm && filteredNotes.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-3 bg-white border border-slate-200 rounded-2xl shadow-xl z-[9999] max-h-[500px] overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredNotes.map((note, index) => (
              <button
                key={note.slug}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => navigateToNote(note)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full text-left flex items-center px-4 py-3 rounded-xl transition-all duration-150 ${
                  selectedIndex === index
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-4 w-4 mr-3 flex-shrink-0 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium truncate">{note.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

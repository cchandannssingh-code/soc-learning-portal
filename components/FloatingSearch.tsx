"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createPortal } from "react-dom"
import SearchBar from "@/components/SearchBar"
import type { Note } from "@/lib/notes"

interface FloatingSearchProps {
  notes: Note[]
  action?: React.ReactNode
  searchBarRef?: React.RefObject<HTMLDivElement | null>
}

export default function FloatingSearch({ notes, action, searchBarRef: externalSearchBarRef }: FloatingSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isOriginalVisible, setIsOriginalVisible] = useState(true)
  const floatingRef = useRef<HTMLDivElement>(null)
  
  // Use provided action or default to null
  const renderAction = action !== undefined ? action : null

  // Detect when original search bar leaves viewport
  useEffect(() => {
    const searchBar = externalSearchBarRef?.current
    if (!searchBar) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOriginalVisible(entry.isIntersecting)
      },
      {
        threshold: 0,
        rootMargin: "0px",
      }
    )

    observer.observe(searchBar)

    return () => {
      observer.disconnect()
    }
  }, [externalSearchBarRef])

  // Keyboard shortcut: Ctrl+K to open floating search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        if (!isOriginalVisible) {
          setIsExpanded(true)
        }
      }
      if (e.key === "Escape" && isExpanded) {
        setIsExpanded(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isExpanded, isOriginalVisible])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        floatingRef.current &&
        !floatingRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isExpanded])

  const handleExpand = useCallback(() => {
    setIsExpanded(true)
  }, [])

  const handleCollapse = useCallback(() => {
    setIsExpanded(false)
  }, [])

  // Don't show floating button if original is visible
  if (isOriginalVisible) {
    return null
  }

  if (typeof document !== "undefined" && document.body) {
    return createPortal(
      <div
        ref={floatingRef}
        className="fixed top-20 right-12 z-50 flex items-center gap-2 md:top-4 md:right-12"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 5rem)',
          right: 'calc(env(safe-area-inset-right, 0px) + 3rem)',
        }}
      >
      {isExpanded ? (
        <div
          className="animate-in fade-in slide-in-from-top-2 duration-200"
          style={{
            animation: "fadeIn 200ms ease-out, slideDown 200ms ease-out",
          }}
        >
          <div className="relative w-fit md:w-[600px] max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl p-4">
            <SearchBar notes={notes} action={renderAction} />
          </div>
        </div>
      ) : (
        <button
          onClick={handleExpand}
          className="group flex h-12 w-12 items-center justify-center rounded-full bg-slate-900/90 md:bg-transparent border border-emerald-500/30 md:border-emerald-500/50 text-emerald-400 shadow-lg md:shadow-none transition-all duration-200 hover:border-emerald-400/60 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] md:hover:shadow-none md:hover:scale-110 hover:scale-110 active:scale-95"
          style={{
            animation: "breathingGlow 3s ease-in-out infinite",
          }}
          aria-label="Open search"
        >
          <svg
            className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      )}
    </div>
    ,
    document.body
  )
  }

  return null
}

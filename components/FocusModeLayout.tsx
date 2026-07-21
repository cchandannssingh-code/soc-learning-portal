"use client"

import { useSyncExternalStore } from "react"
import type { ReactNode } from "react"
import type { Note, TreeItem } from "@/lib/notes"
import SearchBar from "./SearchBar"
import Sidebar from "./Sidebar"

const focusModeStorageKey = "socforge-focus-mode"
const focusModeChangeEvent = "socforge-focus-mode-change"

function subscribeToFocusMode(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(focusModeChangeEvent, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(focusModeChangeEvent, onStoreChange)
  }
}

function getFocusModeSnapshot() {
  return window.localStorage.getItem(focusModeStorageKey) === "true"
}

interface FocusModeLayoutProps {
  children: ReactNode
  notes: Note[]
  tree: TreeItem[]
}

export default function FocusModeLayout({ children, notes, tree }: FocusModeLayoutProps) {
  const focusMode = useSyncExternalStore(subscribeToFocusMode, getFocusModeSnapshot, () => false)

  const toggleFocusMode = () => {
    window.localStorage.setItem(focusModeStorageKey, String(!focusMode))
    window.dispatchEvent(new Event(focusModeChangeEvent))
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col md:flex-row flex-1 min-w-0">
        <Sidebar tree={tree} focusMode={focusMode} />
        <main className="flex-1 min-w-0 bg-[#f4f7fb] transition-all duration-300 ease-in-out">
          <SearchBar
            notes={notes}
            action={
              <button
              type="button"
              onClick={toggleFocusMode}
              aria-pressed={focusMode}
              aria-label={focusMode ? "Exit focus mode" : "Enter focus mode"}
              title={focusMode ? "Exit focus mode" : "Enter focus mode"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm transition-all duration-300 ease-in-out hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {focusMode ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l5 5m-5-5v4.25A1.75 1.75 0 0113.25 21H4.75A1.75 1.75 0 013 19.25V10.75A1.75 1.75 0 014.75 9H9m6 6V9m0 0h6m-6 0l6-6" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
                  <circle cx="12" cy="12" r="2.5" />
                </svg>
              )}
              <span className="sr-only">{focusMode ? "Exit focus mode" : "Enter focus mode"}</span>
            </button>
            }
          />
          <div className={`w-full p-4 md:p-8 transition-all duration-300 ease-in-out ${focusMode ? "max-w-6xl mx-auto" : ""}`}>
            {children}
            <footer className={`mt-10 text-center text-sm text-slate-500 py-6 transition-all duration-300 ease-in-out ${focusMode ? "hidden" : ""}`}>
              © 2026 SOCForge. All rights reserved.
            </footer>
          </div>
        </main>
      </div>
    </div>
  )
}

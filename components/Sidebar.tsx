"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { TreeItem } from "@/lib/notes"
import SidebarTree from "./SidebarTree"
import { useAuth } from "./AuthProvider"

interface SidebarProps {
  tree: TreeItem[]
}

export default function Sidebar({ tree }: SidebarProps) {
  const { logout, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({})

  const toggleFolder = useCallback((path: string) => {
    setOpenFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }))
  }, [])

  const handleLogout = async () => {
    logout()
    await fetch("/api/logout", { method: "POST" })
    window.location.href = "/"
  }

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-5 py-4 flex items-center justify-between shadow-sm">
        <h1 className="text-slate-900 font-extrabold text-xl tracking-tight font-display flex items-center gap-2">
          <span className="text-indigo-600">🛡️</span> SOCForge
        </h1>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-700 hover:text-indigo-600 focus:outline-none transition p-1.5 rounded-lg hover:bg-slate-100"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
          fixed md:sticky top-0 left-0 z-50
          w-72 h-screen bg-white/95 backdrop-blur-md
          text-slate-700 p-6 overflow-y-auto
          transition-all duration-300 ease-in-out
          border-r border-slate-200/80
          shadow-[4px_0_24px_rgba(0,0,0,0.015)]

          ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between mb-6 mt-12 md:mt-0">
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <span className="text-2xl">🛡️</span>
            <h1 className="text-2xl font-black font-display tracking-tight text-slate-900">SOCForge</h1>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* CORE NAVIGATION LINKS */}
        <div className="space-y-1 mb-6">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${
                pathname === "/"
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <svg className={`w-5 h-5 mr-3 transition-colors ${pathname === "/" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 m-6 0h6" />
            </svg>
            Home
          </Link>

          <Link
            href="/quiz"
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${
                pathname === "/quiz"
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <svg className={`w-5 h-5 mr-3 transition-colors ${pathname === "/quiz" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Quiz
          </Link>

          <Link
            href="/about"
            onClick={() => setMobileOpen(false)}
            className={`
              flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${
                pathname === "/about"
                  ? "bg-indigo-50 text-indigo-700 font-semibold shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }
            `}
          >
            <svg className={`w-5 h-5 mr-3 transition-colors ${pathname === "/about" ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            About
          </Link>
        </div>

        <div className="border-t border-slate-100 my-4" />

        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4 font-display">
          Learning Paths
        </h2>

        <SidebarTree
          items={tree}
          openFolders={openFolders}
          toggleFolder={toggleFolder}
          setMobileOpen={setMobileOpen}
        />

        {/* LOGOUT BUTTON */}
        {isAuthenticated && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-600 border border-red-100 font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 text-sm"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </>
  )
}
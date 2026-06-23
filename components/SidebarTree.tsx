"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { TreeItem } from "@/lib/notes"

interface SidebarTreeProps {
  items: TreeItem[]
  openFolders: Record<string, boolean>
  toggleFolder: (path: string) => void
  setMobileOpen: (open: boolean) => void
  level?: number
}

const getCategoryIcon = (name: string) => {
  const cat = name.toLowerCase()
  if (cat.includes("window")) {
    return (
      <svg className="w-5 h-5 mr-2.5 text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 3v18M3 9h18" />
      </svg>
    )
  }
  if (cat.includes("kerberos") || cat.includes("auth") || cat.includes("attack")) {
    return (
      <svg className="w-5 h-5 mr-2.5 text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h3m-3 4h3m-6.25 3h.01M12 19h.01M8.25 15h.01M8.25 19h.01m-4.72-2h.01M4.72 15h.01m.08-6H12a2 2 0 012 2v8a2 2 0 01-2 2H4.8a2 2 0 01-2-2V11a2 2 0 012-2z" />
      </svg>
    )
  }
  if (cat.includes("splunk") || cat.includes("log") || cat.includes("detect")) {
    return (
      <svg className="w-5 h-5 mr-2.5 text-cyan-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }
  return (
    <svg className="w-5 h-5 mr-2.5 text-slate-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

export default function SidebarTree({
  items,
  openFolders,
  toggleFolder,
  setMobileOpen,
  level = 0,
}: SidebarTreeProps) {
  const pathname = usePathname()

  return (
    <div className={level === 0 ? "space-y-3" : "space-y-1 pl-4"}>
      {items.map((item) => {
        if (item.type === "folder" && item.children) {
          const isOpen = openFolders[item.path] || false
          const key = item.path
          const assessmentUrl = `/assessment/${item.path.toLowerCase()}`
          const isAssessmentActive = pathname === assessmentUrl

          // For top-level folders, use category icon
          const folderIcon = level === 0 ? getCategoryIcon(item.name) : null

          return (
            <div
              key={key}
              className={
                level === 0
                  ? "bg-slate-50/50 border border-slate-200/40 rounded-2xl overflow-hidden transition-all duration-150"
                  : "bg-white/80 border border-slate-100 rounded-xl overflow-hidden shadow-2xs"
              }
            >
              <button
                onClick={() => toggleFolder(key)}
                className={`
                  w-full flex items-center justify-between px-4 py-3.5 transition-all duration-200 group/cat
                  ${level === 0 ? "font-bold text-xs uppercase tracking-wide" : "text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
                  ${openFolders[key] && level === 0 ? "bg-indigo-50/40 text-indigo-600" : ""}
                `}
              >
                <span className="flex items-center">
                  {folderIcon}
                  <span className={level === 0 ? "font-display font-bold" : ""}>{item.name}</span>
                </span>
                <svg
                  className={`w-4 h-4 text-slate-400 group-hover/cat:text-slate-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300
                  ${isOpen ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <div className={level === 0 ? "p-2.5 space-y-2.5 bg-white/40" : "p-2 space-y-1 bg-slate-50/20 border-t border-slate-100/50"}>
                  <SidebarTree
                    items={item.children}
                    openFolders={openFolders}
                    toggleFolder={toggleFolder}
                    setMobileOpen={setMobileOpen}
                    level={level + 1}
                  />

                  {/* Assessment link only for folders that have notes */}
                  {item.children.some(child => child.type === "file") && (
                    <Link
                      href={assessmentUrl}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        flex items-center px-3.5 py-2 rounded-lg text-xs font-bold transition-all duration-150
                        ${
                          isAssessmentActive
                            ? "bg-indigo-100 text-indigo-800 border-l-2 border-indigo-600"
                            : "text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 hover:text-indigo-700"
                        }
                      `}
                    >
                      <svg className="w-3.5 h-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      Assessment
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        } else if (item.type === "file" && item.note) {
          const isActive = pathname === `/notes/${item.note.slug}`

          return (
            <Link
              key={item.path}
              href={`/notes/${item.note.slug}`}
              onClick={() => setMobileOpen(false)}
              className={`
                flex items-center px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 group/item
                ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold border-l-2 border-indigo-600 shadow-2xs"
                    : "text-slate-500 hover:bg-slate-100/50 hover:text-slate-900"
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-2.5 transition-colors ${isActive ? "bg-indigo-600" : "bg-slate-300 group-hover/item:bg-slate-500"}`} />
              <span className="truncate">{item.note.title}</span>
            </Link>
          )
        }

        return null
      })}
    </div>
  )
}
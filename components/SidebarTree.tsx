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

export default function SidebarTree({
  items,
  openFolders,
  toggleFolder,
  setMobileOpen,
  level = 0,
}: SidebarTreeProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-2">
      {items.map((item) => {
        if (item.type === "folder" && item.children) {
          const isOpen = openFolders[item.path] || false
          const key = item.path
          const assessmentUrl = `/assessment/${item.path.toLowerCase()}`

          const folderBg = level === 0 ? "bg-[#0d1b31] border border-[#1e3354] rounded-xl" : "bg-[#132541] rounded-lg"
          const folderButtonPadding = level === 0 ? "px-4 py-3" : "px-3 py-2"
          const folderButtonFont = level === 0 ? "font-semibold uppercase tracking-wide" : "text-sm font-medium"
          const folderButtonText = level === 0 ? (isOpen ? "text-cyan-300" : "text-blue-300") : "text-slate-200"
          const folderButtonBg = isOpen ? "bg-[#132541]" : "hover:bg-[#132541]"
          const folderContentPadding = level === 0 ? "p-3 space-y-3" : "p-2"

          return (
            <div
              key={key}
              className={`${folderBg} overflow-hidden`}
            >
              <button
                onClick={() => toggleFolder(key)}
                className={`
                  w-full flex items-center justify-between transition
                  ${folderButtonPadding}
                  ${folderButtonFont}
                  ${folderButtonText}
                  ${folderButtonBg}
                `}
              >
                <span>{item.name}</span>
                <span>{isOpen ? "▼" : "▶"}</span>
              </button>

              <div
                className={`
                  overflow-hidden transition-all duration-300
                  ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}
                `}
              >
                <div className={folderContentPadding}>
                  <SidebarTree
                    items={item.children}
                    openFolders={openFolders}
                    toggleFolder={toggleFolder}
                    setMobileOpen={setMobileOpen}
                    level={level + 1}
                  />
                  <Link
                    href={assessmentUrl}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      block px-3 py-2 rounded-lg text-sm font-medium transition
                      ${
                        pathname === assessmentUrl
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
        } else if (item.type === "file" && item.note) {
          const isActive = pathname === `/notes/${item.note.slug}`

          return (
            <Link
              key={item.path}
              href={`/notes/${item.note.slug}`}
              onClick={() => setMobileOpen(false)}
              className={`
                block px-3 py-2 rounded-lg text-sm transition
                ${
                  isActive
                    ? "bg-cyan-700 text-white"
                    : "bg-[#1b3358] hover:bg-[#25406b]"
                }
              `}
            >
              {item.note.title}
            </Link>
          )
        }

        return null
      })}
    </div>
  )
}

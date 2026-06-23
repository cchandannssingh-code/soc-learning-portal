"use client"

import { Announcement } from "@/types/communication"
import { useAnnouncements } from "@/hooks/useAnnouncements"

export default function AnnouncementsTab() {
  const { announcements } = useAnnouncements()

  const formatDate = (timestamp: Date) => {
    return timestamp.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Announcements</h3>
      </div>

      {/* Announcements List */}
      <div className="flex-1 overflow-y-auto p-3">
        {announcements.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No announcements yet
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement: Announcement) => (
              <div
                key={announcement.id}
                className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 hover:shadow-md transition-shadow"
              >
                {/* Title */}
                <h4 className="text-sm font-bold text-slate-900 mb-2">
                  {announcement.title}
                </h4>

                {/* Content */}
                <p className="text-sm text-slate-700 leading-relaxed mb-3">
                  {announcement.content}
                </p>

                {/* Date */}
                {announcement.createdAt && (
                  <p className="text-xs text-slate-500">
                    {formatDate(announcement.createdAt.toDate())}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { OnlineUser } from "@/types/communication"
import { usePresence } from "@/hooks/usePresence"

interface OnlineUsersTabProps {
  userId: string
  userName: string
  onStartConversation?: (userId: string, userName: string) => void
  onInitiateCall?: (userId: string, userName: string) => void
}

export default function OnlineUsersTab({ userId, userName, onStartConversation, onInitiateCall }: OnlineUsersTabProps) {
  const { onlineUsers, onlineCount } = usePresence(userId, userName)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Online Users</h3>
          <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {onlineCount} online
          </span>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-3">
        {onlineUsers.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No users online
          </div>
        ) : (
          <div className="space-y-2">
            {onlineUsers.map((user: OnlineUser) => (
              <div
                key={user.userId}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {user.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.userName}
                    {user.userId === userId && (
                      <span className="ml-2 text-xs text-indigo-600 font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">Online</p>
                </div>

                {/* Message Button */}
                {user.userId !== userId && onStartConversation && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartConversation(user.userId, user.userName)
                    }}
                    className="
                      flex-shrink-0 p-2
                      bg-indigo-600 hover:bg-indigo-700
                      text-white rounded-lg
                      transition-colors
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    "
                    aria-label={`Message ${user.userName}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                )}

                {/* Call Button */}
                {user.userId !== userId && onInitiateCall && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onInitiateCall(user.userId, user.userName)
                    }}
                    className="
                      flex-shrink-0 p-2
                      bg-green-500 hover:bg-green-600
                      text-white rounded-lg
                      transition-colors
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    "
                    aria-label={`Call ${user.userName}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
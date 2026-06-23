"use client"

import { useState } from "react"

interface FloatingButtonProps {
  unreadCount: number
  onClick: () => void
  isExpanded: boolean
}

export default function FloatingButton({ unreadCount, onClick, isExpanded }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={isExpanded ? "Close communication hub" : "Open communication hub"}
      aria-expanded={isExpanded}
      className={`
        fixed bottom-6 right-6 z-40
        w-14 h-14 rounded-full
        bg-gradient-to-br from-indigo-500 to-indigo-600
        hover:from-indigo-600 hover:to-indigo-700
        text-white shadow-lg shadow-indigo-500/30
        hover:shadow-xl hover:shadow-indigo-500/40
        hover:scale-110
        active:scale-95
        transition-all duration-300 ease-out
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        group
      `}
    >
      {/* Chat Icon */}
      <svg
        className={`w-6 h-6 transition-transform duration-300 ${isExpanded ? "rotate-90 scale-0" : "rotate-0 scale-100"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {/* Close Icon */}
      <svg
        className={`w-6 h-6 absolute transition-transform duration-300 ${isExpanded ? "rotate-0 scale-100" : "-rotate-90 scale-0"}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>

      {/* Unread Badge */}
      {!isExpanded && unreadCount > 0 && (
        <span
          className="absolute -top-1 -right-1
            bg-red-500 text-white text-xs font-bold
            min-w-[20px] h-5 px-1.5 rounded-full
            flex items-center justify-center
            shadow-md animate-pulse"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}

      {/* Hover Tooltip */}
      <span
        className="absolute right-16 bg-slate-900 text-white text-sm px-3 py-1.5 rounded-lg
          opacity-0 group-hover:opacity-100 transition-opacity duration-200
          whitespace-nowrap pointer-events-none shadow-lg"
      >
        {isExpanded ? "Close" : "Community Chat"}
      </span>
    </button>
  )
}
"use client"

import { useState, useEffect, useCallback, ReactNode } from "react"
import { TabType } from "@/types/communication"
import FloatingButton from "./FloatingButton"
import ChatTab from "./ChatTab"
import OnlineUsersTab from "./OnlineUsersTab"
import AnnouncementsTab from "./AnnouncementsTab"
import ProfileTab from "./ProfileTab"
import DirectMessagesTab from "./DirectMessagesTab"
import { getUserId, getUserName } from "@/lib/user"

interface CommunicationHubProps {
  userId?: string
  userName?: string
}

export default function CommunicationHub({ userId: propUserId, userName: propUserName }: CommunicationHubProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("chat")
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [isClient, setIsClient] = useState(false)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  useEffect(() => {
    setIsClient(true)
    setUserId(getUserId())
    setUserName(getUserName())
  }, [])

  // Aggregate unread counts from child components
  const handleUnreadCountChange = useCallback((count: number) => {
    setTotalUnreadCount(count)
  }, [])

  const handleUserNameUpdate = (newName: string) => {
    setUserName(newName)
  }

  const handleStartConversation = (otherUserId: string, otherUserName: string) => {
    setActiveTab("direct")
    // Store the target user to start conversation with
    ;(window as any).__dmTargetUser = { userId: otherUserId, userName: otherUserName }
  }

  const handleToggle = () => {
    setIsExpanded((prev) => !prev)
  }

  const tabs: { id: TabType; label: string; icon: ReactNode }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "online",
      label: "Online",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "announcements",
      label: "Announcements",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      id: "profile",
      label: "Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "direct",
      label: "Messages",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ]

  return (
    <>
      <FloatingButton
        unreadCount={totalUnreadCount}
        onClick={handleToggle}
        isExpanded={isExpanded}
      />

      {isExpanded && isClient && (
        <div
          className="
            fixed bottom-6 right-6 z-40
            w-[380px] h-[600px] max-h-[calc(100vh-3rem)]
            bg-white/95 backdrop-blur-xl
            rounded-3xl border border-slate-200/80
            shadow-2xl shadow-slate-900/10
            flex flex-col overflow-hidden
            transition-all duration-300 ease-out
            animate-in fade-in slide-in-from-bottom-4
          "
          role="dialog"
          aria-modal="true"
          aria-label="Communication Hub"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🛡️</span>
              <h2 className="text-lg font-bold font-display text-slate-900">SOCForge Hub</h2>
            </div>
            <button
              onClick={handleToggle}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              aria-label="Close communication hub"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-3
                  text-sm font-medium transition-all duration-200
                  border-b-2
                  ${
                    activeTab === tab.id
                      ? "text-indigo-600 border-indigo-600 bg-indigo-50/50"
                      : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                  }
                `}
                aria-selected={activeTab === tab.id}
                role="tab"
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "chat" && userId && (
              <ChatTab 
                userId={userId} 
                userName={userName} 
                onUnreadCountChange={handleUnreadCountChange}
              />
            )}
            {activeTab === "online" && userId && (
              <OnlineUsersTab 
                userId={userId} 
                userName={userName} 
                onStartConversation={handleStartConversation}
              />
            )}
            {activeTab === "announcements" && <AnnouncementsTab />}
            {activeTab === "profile" && userId && (
              <ProfileTab userId={userId} onUserNameUpdate={handleUserNameUpdate} />
            )}
            {activeTab === "direct" && userId && (
              <DirectMessagesTab 
                userId={userId} 
                userName={userName}
                onUnreadCountChange={handleUnreadCountChange}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
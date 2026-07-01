"use client"

import { useState, useEffect, useRef } from "react"
import { DirectConversation, DirectMessage } from "@/types/communication"
import { useDirectMessages } from "@/hooks/useDirectMessages"

interface DirectMessagesTabProps {
  userId: string
  userName: string
  onUnreadCountChange?: (count: number) => void
  onInitiateCall?: (userId: string, userName: string) => void
}

export default function DirectMessagesTab({ userId, userName, onUnreadCountChange, onInitiateCall }: DirectMessagesTabProps) {
  const {
    conversations,
    activeConversationId,
    messages,
    unreadCounts,
    totalUnreadCount,
    isLoading,
    startConversation,
    sendMessage,
    selectConversation,
    goBackToList,
    getOtherParticipant,
    getTotalUnreadCount,
  } = useDirectMessages(userId, userName)

  // Notify parent of unread count changes
  useEffect(() => {
    onUnreadCountChange?.(totalUnreadCount)
  }, [totalUnreadCount, onUnreadCountChange])

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-start conversation if triggered from Online Users tab
  useEffect(() => {
    const targetUser = (window as any).__dmTargetUser
    if (targetUser && targetUser.userId && !activeConversationId) {
      startConversation(targetUser.userId, targetUser.userName)
      delete (window as any).__dmTargetUser
    }
  }, [userId, activeConversationId, startConversation])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput("")
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (timestamp: Date) => {
    const now = new Date()
    const date = new Date(timestamp)
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  // If there's an active conversation, show the chat view
  if (activeConversationId) {
    const activeConversation = conversations.find((c) => c.id === activeConversationId)
    
    // Defensive validation: Verify user is a participant
    if (!activeConversation?.participants?.includes(userId)) {
      console.error("UI: User not in conversation, returning to list")
      goBackToList()
      return null
    }
    
    const otherUser = activeConversation ? getOtherParticipant(activeConversation) : null

    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <button
            onClick={goBackToList}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
            aria-label="Back to conversations"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {otherUser?.userName || "Unknown User"}
            </h3>
          </div>
        </div>

        {/* Call Button */}
        {onInitiateCall && otherUser && (
          <div className="px-4 pb-3 pt-3">
            <button
              onClick={() => onInitiateCall(otherUser.userId, otherUser.userName)}
              className="
                w-full flex items-center justify-center gap-2
                bg-green-500 hover:bg-green-600
                text-white rounded-xl
                py-2.5 px-4
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
              aria-label={`Call ${otherUser.userName}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="font-medium">Voice Call</span>
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === userId
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      max-w-[80%] rounded-2xl px-4 py-2.5
                      ${isOwn
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-slate-100 text-slate-800 rounded-bl-none"
                      }
                    `}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold text-indigo-600 mb-1">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm leading-relaxed">{msg.message}</p>
                    <p
                      className={`
                        text-xs mt-1
                        ${isOwn ? "text-indigo-200" : "text-slate-400"}
                      `}
                    >
                      {msg.createdAt ? formatTime(msg.createdAt.toDate()) : "Sending..."}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="
                flex-1 px-4 py-2.5
                bg-slate-50 border border-slate-200
                rounded-xl text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all
              "
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="
                px-4 py-2.5
                bg-indigo-600 hover:bg-indigo-700
                disabled:bg-slate-300 disabled:cursor-not-allowed
                text-white rounded-xl
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              "
              aria-label="Send message"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Show conversation list
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Messages</h3>
          {getTotalUnreadCount() > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {getTotalUnreadCount()} unread
            </span>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <svg className="w-12 h-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Click a user in Online tab to start chatting</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation)
              if (!otherUser) return null

              const unread = unreadCounts[conversation.id || ""] || 0

              return (
                <button
                  key={conversation.id}
                  onClick={() => selectConversation(conversation.id || "")}
                  className="
                    w-full flex items-center gap-3 p-3 rounded-xl
                    bg-slate-50 hover:bg-slate-100
                    transition-colors text-left
                    relative
                  "
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                      {otherUser.userName.charAt(0).toUpperCase()}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {otherUser.userName}
                      </p>
                      {conversation.lastMessageAt && (
                        <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                          {formatDate(conversation.lastMessageAt.toDate())}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate">
                      {conversation.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { ChatMessage } from "@/types/communication"
import { useChat } from "@/hooks/useChat"

interface ChatTabProps {
  userId: string
  userName: string
}

export default function ChatTab({ userId, userName }: ChatTabProps) {
  const { messages, sendMessage, isActive, markAsRead } = useChat(userId, userName)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    markAsRead()
  }, [markAsRead])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    await sendMessage(input)
    setInput("")
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.userId === userId
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
                      {msg.userName}
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
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-100">
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
            disabled={!input.trim()}
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
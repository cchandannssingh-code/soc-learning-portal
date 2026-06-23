"use client"

import { useState, useEffect, useCallback } from "react"
import { ChatMessage } from "@/types/communication"
import { sendMessage as sendMessageService, subscribeToMessages } from "@/lib/communication/chat"

export function useChat(userId: string, userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isActive, setIsActive] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToMessages((newMessages) => {
      const previousCount = messages.length
      setMessages(newMessages)
      
      // Only increment unread if there are new messages and chat is not active
      if (!isActive && newMessages.length > previousCount) {
        const newMessageCount = newMessages.length - previousCount
        setUnreadCount((prev) => prev + newMessageCount)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isActive, messages.length])

  useEffect(() => {
    if (isActive) {
      setUnreadCount(0)
    }
  }, [isActive, messages.length])

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return
      await sendMessageService(userId, userName, message.trim())
    },
    [userId, userName]
  )

  const markAsRead = useCallback(() => {
    setIsActive(true)
    setUnreadCount(0)
  }, [])

  const resetUnread = useCallback(() => {
    setIsActive(false)
  }, [])

  return {
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
    resetUnread,
    isActive,
  }
}
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
      setMessages(newMessages)
      if (!isActive && newMessages.length > 0) {
        setUnreadCount((prev) => prev + 1)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [isActive])

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
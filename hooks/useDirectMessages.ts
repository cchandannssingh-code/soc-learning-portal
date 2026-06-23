"use client"

import { useState, useEffect, useCallback } from "react"
import { DirectConversation, DirectMessage } from "@/types/communication"
import {
  getOrCreateConversation,
  sendDirectMessage,
  subscribeToConversations,
  subscribeToMessages,
  markConversationAsRead,
} from "@/lib/communication/directMessages"

export function useDirectMessages(userId: string, userName: string) {
  const [conversations, setConversations] = useState<DirectConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to conversations list
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToConversations(userId, (conversationsList: DirectConversation[]) => {
      setConversations(conversationsList)
    })

    return () => {
      unsubscribe()
    }
  }, [userId])

  // Subscribe to messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    const unsubscribe = subscribeToMessages(activeConversationId, (messagesList) => {
      setMessages(messagesList)
      
      // Calculate unread count (messages not sent by current user and not read by user)
      const unread = messagesList.filter(
        (msg) => msg.senderId !== userId && !msg.readBy?.includes(userId)
      ).length
      
      setUnreadCounts((prev) => ({
        ...prev,
        [activeConversationId]: unread,
      }))
    })

    return () => {
      unsubscribe()
    }
  }, [activeConversationId, userId])

  // Calculate total unread count across all conversations
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  // Mark conversation as read when opened
  useEffect(() => {
    if (!activeConversationId || !userId) return

    const markAsRead = async () => {
      try {
        await markConversationAsRead(activeConversationId, userId)
        setUnreadCounts((prev) => ({
          ...prev,
          [activeConversationId]: 0,
        }))
      } catch (err) {
        console.error("Failed to mark as read:", err)
      }
    }

    markAsRead()
  }, [activeConversationId, userId])

  const startConversation = useCallback(
    async (otherUserId: string, otherUserName: string) => {
      if (!userId || !userName) return

      try {
        setIsLoading(true)
        const conversationId = await getOrCreateConversation(
          userId,
          otherUserId,
          userName,
          otherUserName
        )
        setActiveConversationId(conversationId)
      } catch (err) {
        console.error("Failed to start conversation:", err)
      } finally {
        setIsLoading(false)
      }
    },
    [userId, userName]
  )

  const sendMessage = useCallback(
    async (message: string) => {
      if (!activeConversationId || !message.trim() || !userId || !userName) return

      try {
        await sendDirectMessage(activeConversationId, userId, userName, message.trim())
      } catch (err) {
        console.error("Failed to send message:", err)
      }
    },
    [activeConversationId, userId, userName]
  )

  const selectConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId)
  }, [])

  const goBackToList = useCallback(() => {
    setActiveConversationId(null)
    setMessages([])
  }, [])

  const getOtherParticipant = useCallback(
    (conversation: DirectConversation): { userId: string; userName: string } | null => {
      if (!conversation.participants || !conversation.participantNames) return null

      const otherUserId = conversation.participants.find((p) => p !== userId)
      if (!otherUserId) return null

      return {
        userId: otherUserId,
        userName: conversation.participantNames[otherUserId] || "Unknown User",
      }
    },
    [userId]
  )

  const getTotalUnreadCount = useCallback(() => {
    return totalUnreadCount
  }, [totalUnreadCount])

  return {
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
  }
}

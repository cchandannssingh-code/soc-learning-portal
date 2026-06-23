"use client"

import { useState, useEffect, useCallback } from "react"
import { OnlineUser } from "@/types/communication"
import { setOnline, setOffline, subscribeToOnlineUsers } from "@/lib/communication/presence"

export function usePresence(userId: string, userName: string) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [isOnline, setIsOnline] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToOnlineUsers((users) => {
      setOnlineUsers(users)
      setError(null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!userId || !userName) return

    const updatePresence = async () => {
      try {
        await setOnline(userId, userName)
        setIsOnline(true)
        setError(null)
      } catch (err) {
        console.error("Failed to set online status:", err)
        setError("Failed to update presence")
      }
    }

    updatePresence()

    // Heartbeat: update presence every 30 seconds
    const heartbeatInterval = setInterval(async () => {
      try {
        await setOnline(userId, userName)
        setError(null)
      } catch (err) {
        console.error("Heartbeat failed:", err)
        setError("Connection issue")
      }
    }, 30000)

    const handleBeforeUnload = () => {
      setOffline(userId)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      clearInterval(heartbeatInterval)
      setOffline(userId)
    }
  }, [userId, userName])

  const goOffline = useCallback(async () => {
    try {
      await setOffline(userId)
      setIsOnline(false)
      setError(null)
    } catch (err) {
      console.error("Failed to set offline:", err)
      setError("Failed to update status")
    }
  }, [userId])

  const goOnline = useCallback(async () => {
    try {
      await setOnline(userId, userName)
      setIsOnline(true)
      setError(null)
    } catch (err) {
      console.error("Failed to set online:", err)
      setError("Failed to update status")
    }
  }, [userId, userName])

  return {
    onlineUsers,
    isOnline,
    goOffline,
    goOnline,
    onlineCount: onlineUsers.length,
    error,
  }
}

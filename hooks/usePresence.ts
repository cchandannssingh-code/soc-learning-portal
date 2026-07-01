"use client"

import { useState, useEffect, useCallback } from "react"
import { OnlineUser } from "@/types/communication"
import { setOnline, setOffline, updateLastSeen, subscribeToOnlineUsers } from "@/lib/communication/presence"

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

    // Heartbeat: update lastSeen every 30 seconds (lightweight update)
    const heartbeatInterval = setInterval(async () => {
      try {
        await updateLastSeen(userId)
        setError(null)
      } catch (err) {
        console.error("Heartbeat failed:", err)
        setError("Connection issue")
      }
    }, 30000)

    // Listen for browser online/offline events
    const handleOnline = () => {
      console.log("Network restored")
      setError(null)
    }

    const handleOffline = () => {
      console.log("Network lost")
      setError("You are currently offline")
    }

    // Best-effort cleanup on browser close
    const handleBeforeUnload = () => {
      setOffline(userId).catch(() => {
        // Silently fail - server will clean up stale users
      })
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(heartbeatInterval)
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

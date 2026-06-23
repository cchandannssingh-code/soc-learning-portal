"use client"

import { useState, useEffect } from "react"
import { Announcement } from "@/types/communication"
import { subscribeToAnnouncements } from "@/lib/communication/announcements"

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToAnnouncements((data) => {
      setAnnouncements(data)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    announcements,
  }
}
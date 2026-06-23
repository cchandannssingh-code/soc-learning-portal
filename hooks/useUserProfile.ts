"use client"

import { useState, useEffect, useCallback } from "react"
import { UserProfile } from "@/types/communication"
import { createOrUpdateUser, getUserProfile, updateLastSeen } from "@/lib/communication/users"

const DISPLAY_NAME_KEY = "socforge_display_name"

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile on mount
  useEffect(() => {
    if (!userId) return

    const loadProfile = async () => {
      try {
        setIsLoading(true)
        const userProfile = await getUserProfile(userId)
        
        if (userProfile) {
          setProfile(userProfile)
          setDisplayName(userProfile.displayName)
        } else {
          // No profile exists yet, use localStorage fallback
          const localName = typeof window !== "undefined" 
            ? localStorage.getItem(DISPLAY_NAME_KEY) || "" 
            : ""
          setDisplayName(localName)
        }
        setError(null)
      } catch (err) {
        console.error("Failed to load profile:", err)
        setError("Failed to load profile")
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [userId])

  // Update last seen periodically
  useEffect(() => {
    if (!userId || !profile) return

    const updateInterval = setInterval(async () => {
      try {
        await updateLastSeen(userId)
      } catch (err) {
        console.error("Failed to update last seen:", err)
      }
    }, 60000) // Every minute

    return () => clearInterval(updateInterval)
  }, [userId, profile])

  const saveProfile = useCallback(async (name: string) => {
    if (!userId) return

    const trimmedName = name.trim()
    
    // Validation
    if (!trimmedName) {
      setError("Display name cannot be empty")
      return false
    }
    
    if (trimmedName.length > 25) {
      setError("Display name must be 25 characters or less")
      return false
    }

    try {
      setIsLoading(true)
      await createOrUpdateUser(userId, trimmedName)
      
      // Save to localStorage as fallback
      if (typeof window !== "undefined") {
        localStorage.setItem(DISPLAY_NAME_KEY, trimmedName)
      }
      
      setDisplayName(trimmedName)
      setProfile({
        userId,
        displayName: trimmedName,
        createdAt: profile?.createdAt || new Date() as any,
        lastSeen: new Date() as any,
      })
      setError(null)
      return true
    } catch (err) {
      console.error("Failed to save profile:", err)
      setError("Failed to save profile")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [userId, profile])

  const getDisplayName = useCallback(() => {
    return displayName || `User_${userId.slice(-4)}`
  }, [displayName, userId])

  return {
    profile,
    displayName,
    isLoading,
    error,
    saveProfile,
    getDisplayName,
  }
}
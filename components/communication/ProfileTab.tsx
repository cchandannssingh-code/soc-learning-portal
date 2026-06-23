"use client"

import { useState, useEffect } from "react"
import { useUserProfile } from "@/hooks/useUserProfile"

interface ProfileTabProps {
  userId: string
  onUserNameUpdate?: (newName: string) => void
}

export default function ProfileTab({ userId, onUserNameUpdate }: ProfileTabProps) {
  const { profile, displayName, isLoading, error, saveProfile, getDisplayName } = useUserProfile(userId)
  const [editName, setEditName] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (displayName) {
      setEditName(displayName)
    }
  }, [displayName])

  const handleSave = async () => {
    const success = await saveProfile(editName)
    if (success) {
      setIsEditing(false)
      setSaveSuccess(true)
      onUserNameUpdate?.(editName)
      setTimeout(() => setSaveSuccess(false), 3000)
    }
  }

  const handleCancel = () => {
    setEditName(displayName || getDisplayName())
    setIsEditing(false)
  }

  const currentName = displayName || getDisplayName()

  const formatDate = (timestamp: Date | string | any) => {
    if (!timestamp) return "Unknown"
    
    // Handle Firestore Timestamp
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
    
    // Handle Date object or ISO string
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">User Profile</h3>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {currentName.charAt(0).toUpperCase()}
            </div>
          </div>

          {/* User ID (Read-only) */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              User ID
            </label>
            <p className="text-sm text-slate-700 font-mono bg-slate-50 px-3 py-2 rounded-lg break-all">
              {userId}
            </p>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Display Name
            </label>
            
            {!isEditing ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg">
                  {currentName}
                </p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="
                    w-full px-4 py-2
                    bg-indigo-600 hover:bg-indigo-700
                    text-white text-sm font-medium
                    rounded-lg transition-colors
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                  "
                >
                  Rename
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter display name"
                  maxLength={25}
                  className="
                    w-full px-3 py-2
                    bg-white border border-slate-200
                    rounded-lg text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                    transition-all
                  "
                  autoFocus
                />
                <p className="text-xs text-slate-500">
                  {editName.length}/25 characters
                </p>
                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={isLoading || !editName.trim()}
                    className="
                      flex-1 px-3 py-2
                      bg-indigo-600 hover:bg-indigo-700
                      disabled:bg-slate-300 disabled:cursor-not-allowed
                      text-white text-sm font-medium
                      rounded-lg transition-colors
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                    "
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="
                      flex-1 px-3 py-2
                      bg-slate-100 hover:bg-slate-200
                      disabled:bg-slate-50 disabled:cursor-not-allowed
                      text-slate-700 text-sm font-medium
                      rounded-lg transition-colors
                      focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2
                    "
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {saveSuccess && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 font-medium">
                  ✓ Display name updated successfully
                </p>
              </div>
            )}
          </div>

          {/* Profile Info */}
          {profile && (
            <div className="space-y-2 pt-4 border-t border-slate-100">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                Member Since
              </label>
              <p className="text-sm text-slate-700">
                {formatDate(profile.createdAt)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
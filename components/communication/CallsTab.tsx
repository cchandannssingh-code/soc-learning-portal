"use client"

import { useState, useEffect } from "react"
import { VoiceCall } from "@/types/communication"
import { useVoiceCall } from "@/hooks/useVoiceCall"

interface CallsTabProps {
  userId: string
  userName: string
}

export default function CallsTab({ userId, userName }: CallsTabProps) {
  const {
    activeCall,
    callStatus,
    isMuted,
    callDuration,
    error,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    isInCall,
  } = useVoiceCall(userId, userName)

  const [recentCalls, setRecentCalls] = useState<VoiceCall[]>([])

  // Auto-initiate call if triggered from other tabs
  useEffect(() => {
    const targetUser = (window as any).__callTargetUser
    if (targetUser && targetUser.userId && callStatus === "idle") {
      initiateCall(targetUser.userId, targetUser.userName)
      delete (window as any).__callTargetUser
    }
  }, [userId, callStatus, initiateCall])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getStatusText = () => {
    switch (callStatus) {
      case "ringing":
        return "Ringing..."
      case "connecting":
        return "Connecting..."
      case "connected":
        return formatDuration(callDuration)
      case "ended":
        return "Call ended"
      case "rejected":
        return "Call rejected"
      case "cancelled":
        return "Call cancelled"
      case "failed":
        return "Call failed"
      case "permission_denied":
        return "Microphone access denied"
      default:
        return null
    }
  }

  const statusText = getStatusText()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Voice Calls</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {!isInCall && callStatus === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm">
            <svg className="w-16 h-16 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p>No active call</p>
            <p className="text-xs mt-1">Start a call from Online or Messages tab</p>
          </div>
        )}

        {isInCall && activeCall && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold mb-4">
              {(activeCall.participantNames[activeCall.participants.find((p) => p !== userId) || ""] || "U").charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {activeCall.participantNames[activeCall.participants.find((p) => p !== userId) || ""] || "Unknown"}
            </h3>
            {statusText && (
              <p className="text-sm text-slate-500 mb-6">{statusText}</p>
            )}

            {/* Quick Controls */}
            <div className="flex gap-4">
              <button
                onClick={toggleMute}
                className={`
                  w-14 h-14 rounded-full
                  flex items-center justify-center
                  transition-all duration-200
                  ${
                    isMuted
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                  }
                `}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <button
                onClick={endCall}
                className="
                  w-14 h-14 rounded-full
                  bg-red-500 hover:bg-red-600
                  text-white
                  flex items-center justify-center
                  transition-all duration-200
                "
                aria-label="End call"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                </svg>
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}
          </div>
        )}

        {callStatus !== "idle" && !isInCall && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 mb-4">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium mb-2">{statusText}</p>
            {(callStatus === "ringing" || callStatus === "connecting") && (
              <button
                onClick={callStatus === "ringing" ? rejectCall : endCall}
                className="
                  mt-4 px-6 py-2
                  bg-red-500 hover:bg-red-600
                  text-white rounded-full
                  text-sm font-medium
                  transition-all duration-200
                "
              >
                Cancel
              </button>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-4">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
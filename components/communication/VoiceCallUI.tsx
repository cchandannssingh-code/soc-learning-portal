"use client"

import { useEffect } from "react"
import { VoiceCall } from "@/types/communication"

interface VoiceCallUIProps {
  call: VoiceCall
  isMuted: boolean
  callDuration: number
  onToggleMute: () => void
  onEndCall: () => void
  remoteStream: MediaStream | null
}

export default function VoiceCallUI({
  call,
  isMuted,
  callDuration,
  onToggleMute,
  onEndCall,
  remoteStream,
}: VoiceCallUIProps) {
  const otherUserId = call.participants.find((p) => p !== call.initiatorId) || call.initiatorId
  const otherUserName = call.participantNames[otherUserId] || "Unknown User"

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Determine connection quality (simplified)
  const getConnectionQuality = () => {
    if (callDuration < 5) return { text: "Connecting...", color: "text-yellow-600" }
    if (callDuration < 15) return { text: "Good", color: "text-green-600" }
    return { text: "Excellent", color: "text-green-600" }
  }

  const connectionQuality = getConnectionQuality()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="flex flex-col items-center justify-center w-full max-w-md px-8">
        {/* Remote User Avatar */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-6xl font-bold shadow-2xl">
            {otherUserName.charAt(0).toUpperCase()}
          </div>
          {/* Audio visualization indicator */}
          {remoteStream && (
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}
        </div>

        {/* User Name */}
        <h2 className="text-3xl font-bold text-white mb-2">{otherUserName}</h2>

        {/* Call Duration */}
        <div className="text-slate-300 text-lg mb-8">
          {formatDuration(callDuration)}
        </div>

        {/* Connection Quality */}
        <div className={`text-sm font-medium mb-12 ${connectionQuality.color}`}>
          {connectionQuality.text}
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-6">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            className={`
              w-16 h-16 rounded-full
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
              ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600 focus:ring-red-500"
                  : "bg-slate-700 hover:bg-slate-600 focus:ring-slate-500"
              }
            `}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={onEndCall}
            className="
              w-16 h-16 rounded-full
              bg-red-500 hover:bg-red-600
              flex items-center justify-center
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900
              shadow-lg
            "
            aria-label="End call"
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>

        {/* Mute Status Text */}
        {isMuted && (
          <p className="text-red-400 text-sm mt-6">Microphone muted</p>
        )}
      </div>
    </div>
  )
}
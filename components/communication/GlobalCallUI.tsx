"use client"

import { useState, useEffect } from "react"
import { useVoiceCall } from "@/hooks/useVoiceCall"
import { getUserId, getUserName } from "@/lib/user"
import IncomingCallModal from "./IncomingCallModal"
import VoiceCallUI from "./VoiceCallUI"

export default function GlobalCallUI() {
  const [userId, setUserId] = useState("")
  const [userName, setUserName] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUserId(getUserId())
    setUserName(getUserName())
  }, [])
  const {
    incomingCall,
    activeCall,
    callStatus,
    isMuted,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    remoteStream,
    isInCall,
  } = useVoiceCall(userId, userName)
  
  // Log every render with state
  useEffect(() => {
    console.log("[GlobalCallUI] RENDER", {
      isInCall,
      hasActiveCall: !!activeCall,
      activeCallId: activeCall?.callId || "null",
      callStatus,
      remoteStreamId: (remoteStream as MediaStream | null)?.id || "null",
    })
  })

  // Auto-initiate call if triggered from other tabs
  useEffect(() => {
    const targetUser = (window as any).__callTargetUser
    if (targetUser && targetUser.userId && callStatus === "idle") {
      // Trigger the call through the window event
      const event = new CustomEvent("initiateCall", {
        detail: { userId: targetUser.userId, userName: targetUser.userName },
      })
      window.dispatchEvent(event)
      delete (window as any).__callTargetUser
    }
  }, [callStatus])

  // Listen for initiate call events
  useEffect(() => {
    const handleInitiateCall = (event: any) => {
      const { userId: targetUserId, userName: targetUserName } = event.detail
      // This will be handled by the CallsTab component
      console.log("Initiate call event:", targetUserId, targetUserName)
    }

    window.addEventListener("initiateCall", handleInitiateCall)
    return () => window.removeEventListener("initiateCall", handleInitiateCall)
  }, [])

  return (
    <>
      {/* Incoming Call Modal - Shows globally */}
      {incomingCall && callStatus === "ringing" && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={acceptCall}
          onReject={rejectCall}
        />
      )}

      {/* Active Call UI - Shows globally */}
      {isInCall && activeCall && (
        <VoiceCallUI
          call={activeCall}
          isMuted={isMuted}
          callDuration={callDuration}
          onToggleMute={toggleMute}
          onEndCall={endCall}
          remoteStream={remoteStream}
        />
      )}
    </>
  )
}
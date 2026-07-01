"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { VoiceCall, CallStatus } from "@/types/communication"
import {
  createVoiceCall,
  updateCallWithOffer,
  updateCallWithAnswer,
  addIceCandidate,
  subscribeToCall,
  subscribeToCallEvents,
  subscribeToIncomingCalls,
  endCall,
  rejectCall,
  cancelCall,
  isUserInCall,
} from "@/lib/communication/voiceCalls"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

interface UseVoiceCallReturn {
  // State
  activeCall: VoiceCall | null
  incomingCall: VoiceCall | null
  callStatus: CallStatus
  localStream: MediaStream | null
  remoteStream: MediaStream | null
  isMuted: boolean
  callDuration: number
  error: string | null

  // Actions
  initiateCall: (targetUserId: string, targetUserName: string) => Promise<void>
  acceptCall: () => Promise<void>
  rejectCall: () => Promise<void>
  cancelCall: () => Promise<void>
  endCall: () => Promise<void>
  toggleMute: () => void

  // Utilities
  isInCall: boolean
  isRinging: boolean
}

export function useVoiceCall(userId: string, userName: string): UseVoiceCallReturn {
  const [activeCall, setActiveCall] = useState<VoiceCall | null>(null)
  const [incomingCall, setIncomingCall] = useState<VoiceCall | null>(null)
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Refs for WebRTC and cleanup
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const callEventsUnsubscribeRef = useRef<(() => void) | null>(null)
  const incomingCallsUnsubscribeRef = useRef<(() => void) | null>(null)
  const activeCallUnsubscribeRef = useRef<(() => void) | null>(null)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const isInitiatorRef = useRef(false)
  const currentCallIdRef = useRef<string | null>(null)
  const isCleaningUpRef = useRef(false)
  const callStatusRef = useRef<CallStatus>("idle")

  // Keep ref in sync with state
  useEffect(() => {
    callStatusRef.current = callStatus
  }, [callStatus])

  // Initialize ringtone
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    let ringtoneInterval: NodeJS.Timeout | null = null
    
    const playRingtone = () => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 440
      oscillator.type = "sine"
      gainNode.gain.value = 0.3
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.5)
    }

    ringtoneRef.current = {
      play: () => {
        playRingtone()
        // Repeat every 2 seconds
        ringtoneInterval = setInterval(playRingtone, 2000)
      },
      pause: () => {
        if (ringtoneInterval) {
          clearInterval(ringtoneInterval)
          ringtoneInterval = null
        }
      },
    } as any

    return () => {
      if (ringtoneInterval) {
        clearInterval(ringtoneInterval)
      }
      audioContext.close()
    }
  }, [])

  // Cleanup function
  const cleanup = useCallback(() => {
    // Prevent recursive cleanup
    if (isCleaningUpRef.current) {
      return
    }
    isCleaningUpRef.current = true

    try {
      // Stop timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          try {
            track.stop()
          } catch (e) {
            console.error("Error stopping track:", e)
          }
        })
      }

      // Unsubscribe from Firestore
      if (callEventsUnsubscribeRef.current) {
        callEventsUnsubscribeRef.current()
        callEventsUnsubscribeRef.current = null
      }
      if (incomingCallsUnsubscribeRef.current) {
        incomingCallsUnsubscribeRef.current()
        incomingCallsUnsubscribeRef.current = null
      }
      if (activeCallUnsubscribeRef.current) {
        activeCallUnsubscribeRef.current()
        activeCallUnsubscribeRef.current = null
      }

      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      // Reset state
      setLocalStream(null)
      setRemoteStream(null)
      setCallDuration(0)
      setIsMuted(false)
      setError(null)
      setActiveCall(null)
      setIncomingCall(null)
      currentCallIdRef.current = null
    } finally {
      isCleaningUpRef.current = false
    }
  }, [localStream])

  // Update call duration timer
  useEffect(() => {
    if (callStatus === "connected") {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1)
      }, 1000)
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
        callTimerRef.current = null
      }
      if (callStatus !== "connecting") {
        setCallDuration(0)
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current)
      }
    }
  }, [callStatus])

  // Subscribe to incoming calls
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeToIncomingCalls(userId, (call) => {
      // Ignore if we're already in a call or if this is our own call
      if (!call || call.initiatorId === userId) {
        return
      }

      // Check if we're already processing this call
      if (currentCallIdRef.current === call.callId) {
        return
      }

      setIncomingCall(call)
      setCallStatus("ringing")
      currentCallIdRef.current = call.callId
      
      // Play ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.play()
        // Auto-stop after 30s
        const ringtoneTimeout = setTimeout(() => {
          ringtoneRef.current?.pause()
        }, 30000)
        
        // Store timeout for cleanup
        ;(window as any).__ringtoneTimeout = ringtoneTimeout
      }
    })

    incomingCallsUnsubscribeRef.current = unsubscribe

    return () => {
      unsubscribe()
      // Cleanup ringtone timeout
      if ((window as any).__ringtoneTimeout) {
        clearTimeout((window as any).__ringtoneTimeout)
      }
    }
  }, [userId]) // Removed callStatus dependency to prevent resubscription

  // Create peer connection
  const createPeerConnection = useCallback((callId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = async (event) => {
      if (event.candidate && callId) {
        try {
          await addIceCandidate(callId, event.candidate.toJSON(), userId)
        } catch (err) {
          console.error("Error adding ICE candidate:", err)
        }
      }
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0])
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      if (state === "disconnected" || state === "failed") {
        console.error(`Connection ${state}`)
        setError(`Connection ${state}`)
        setCallStatus("failed")
        cleanup()
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      if (state === "failed" || state === "disconnected") {
        console.error(`ICE connection ${state}`)
        setError(`Connection ${state}`)
        setCallStatus("failed")
        cleanup()
      }
    }

    peerConnectionRef.current = pc
    return pc
  }, [userId, cleanup])

  // Initiate a call
  const initiateCall = useCallback(
    async (targetUserId: string, targetUserName: string) => {
      if (!userId || !userName) {
        setError("User not authenticated")
        return
      }

      // Prevent calling yourself
      if (targetUserId === userId) {
        setError("Cannot call yourself")
        return
      }

      // Check if already in a call using ref to avoid stale closure
      if (callStatusRef.current !== "idle") {
        setError("Already in a call")
        return
      }

      try {
        setError(null)
        isInitiatorRef.current = true

        // Create call document
        const callId = await createVoiceCall(userId, userName, targetUserId, targetUserName)
        currentCallIdRef.current = callId

        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        })
        setLocalStream(stream)

        // Create peer connection
        const pc = createPeerConnection(callId)

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream)
        })

        // Create offer
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // Update call with offer
        await updateCallWithOffer(callId, offer)

        // Subscribe to call updates
        const unsubscribe = subscribeToCall(callId, (call) => {
          if (call) {
            setActiveCall(call)
            
            if (call.status === "connecting") {
              setCallStatus("connecting")
            } else if (call.status === "connected") {
              setCallStatus("connected")
            } else if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
              setCallStatus(call.status)
              cleanup()
            } else if (call.status === "ended" || call.status === "failed") {
              setCallStatus(call.status)
              setTimeout(() => cleanup(), 1000)
            }
          }
        })

        activeCallUnsubscribeRef.current = unsubscribe

        // Subscribe to call events (ICE candidates)
        const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
          events.forEach((event) => {
            if (event.type === "ice-candidate" && event.userId !== userId) {
              try {
                const candidate = new RTCIceCandidate(event.data)
                pc.addIceCandidate(candidate)
              } catch (err) {
                console.error("Error adding ICE candidate:", err)
              }
            }
          })
        })

        callEventsUnsubscribeRef.current = eventsUnsubscribe

        setCallStatus("ringing")

        // Set timeout for 30 seconds
        const timeoutId = setTimeout(() => {
          if (callStatusRef.current === "ringing" && currentCallIdRef.current === callId) {
            setCallStatus("timeout")
            cancelCall(callId)
            setTimeout(() => cleanup(), 1000)
          }
        }, 30000)
        
        // Store timeout for cleanup
        ;(window as any).__callTimeoutId = timeoutId
      } catch (err) {
        console.error("Failed to initiate call:", err)
        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            setError("Microphone permission denied")
            setCallStatus("permission_denied")
          } else if (err.name === "NotFoundError") {
            setError("No microphone found")
            setCallStatus("failed")
          } else {
            setError("Failed to start call")
            setCallStatus("failed")
          }
        }
        cleanup()
      }
    },
    [userId, userName, createPeerConnection, cleanup]
  )

  // Accept incoming call
  const acceptCall = useCallback(async () => {
    if (!incomingCall || !userId) return

    const callId = incomingCall.callId
    currentCallIdRef.current = callId

    try {
      setError(null)
      isInitiatorRef.current = false

      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      })
      setLocalStream(stream)

      // Create peer connection
      const pc = createPeerConnection(callId)

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream)
      })

      // Set remote description (offer)
      if (incomingCall.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
      }

      // Create answer
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      // Update call with answer
      await updateCallWithAnswer(callId, answer)

      // Subscribe to call updates
      const unsubscribe = subscribeToCall(callId, (call) => {
        if (call) {
          setActiveCall(call)
          
          if (call.status === "connected") {
            setCallStatus("connected")
          } else if (call.status === "ended" || call.status === "failed") {
            setCallStatus(call.status)
            setTimeout(() => cleanup(), 1000)
          }
        }
      })

      activeCallUnsubscribeRef.current = unsubscribe

      // Subscribe to call events (ICE candidates)
      const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
        events.forEach((event) => {
          if (event.type === "ice-candidate" && event.userId !== userId) {
            try {
              const candidate = new RTCIceCandidate(event.data)
              pc.addIceCandidate(candidate)
            } catch (err) {
              console.error("Error adding ICE candidate:", err)
            }
          }
        })
      })

      callEventsUnsubscribeRef.current = eventsUnsubscribe

      setIncomingCall(null)
      setCallStatus("connecting")
    } catch (err) {
      console.error("Failed to accept call:", err)
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Microphone permission denied")
          setCallStatus("permission_denied")
        } else {
          setError("Failed to accept call")
          setCallStatus("failed")
        }
      }
      cleanup()
    }
  }, [incomingCall, userId, createPeerConnection, cleanup])

  // Reject incoming call
  const rejectIncomingCall = useCallback(async () => {
    if (!incomingCall) return

    try {
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      await rejectCall(incomingCall.callId)
      setIncomingCall(null)
      setCallStatus("rejected")
      currentCallIdRef.current = null
      
      // Reset after a short delay
      setTimeout(() => {
        setCallStatus("idle")
      }, 2000)
    } catch (err) {
      console.error("Failed to reject call:", err)
      setError("Failed to reject call")
    }
  }, [incomingCall])

  // Cancel outgoing call
  const cancelOutgoingCall = useCallback(async () => {
    if (!activeCall) return

    try {
      await cancelCall(activeCall.callId)
      cleanup()
      setActiveCall(null)
      setCallStatus("cancelled")
      currentCallIdRef.current = null
      
      // Reset after a short delay
      setTimeout(() => {
        setCallStatus("idle")
      }, 2000)
    } catch (err) {
      console.error("Failed to cancel call:", err)
      setError("Failed to cancel call")
    }
  }, [activeCall, cleanup])

  // End active call
  const endActiveCall = useCallback(async () => {
    if (!activeCall) return

    try {
      await endCall(activeCall.callId)
      cleanup()
      setActiveCall(null)
      setCallStatus("ended")
      currentCallIdRef.current = null
      
      // Reset after a short delay
      setTimeout(() => {
        setCallStatus("idle")
      }, 2000)
    } catch (err) {
      console.error("Failed to end call:", err)
      setError("Failed to end call")
    }
  }, [activeCall, cleanup])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }, [localStream])

  // Handle browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCall && (callStatus === "connected" || callStatus === "connecting")) {
        // Fire and forget - we can't await in beforeunload
        endCall(activeCall.callId).catch(() => {})
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [activeCall, callStatus, endCall])

  // Handle network disconnect
  useEffect(() => {
    const handleOnline = () => {
      if (callStatus === "connecting" || callStatus === "connected") {
        setError("Network connection restored")
        setTimeout(() => setError(null), 3000)
      }
    }

    const handleOffline = () => {
      if (callStatus === "connecting" || callStatus === "connected") {
        setError("Network connection lost")
      }
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [callStatus])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if ((window as any).__callTimeoutId) {
        clearTimeout((window as any).__callTimeoutId)
      }
      if ((window as any).__ringtoneTimeout) {
        clearTimeout((window as any).__ringtoneTimeout)
      }
      cleanup()
    }
  }, [cleanup])

  return {
    activeCall,
    incomingCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    callDuration,
    error,
    initiateCall,
    acceptCall,
    rejectCall: rejectIncomingCall,
    cancelCall: cancelOutgoingCall,
    endCall: endActiveCall,
    toggleMute,
    isInCall: callStatus === "connected" || callStatus === "connecting",
    isRinging: callStatus === "ringing" && !isInitiatorRef.current,
  }
}
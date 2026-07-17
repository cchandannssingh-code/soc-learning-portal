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


// Diagnostic logging helper
const log = (prefix: string, data: any) => {
  console.log(`[${prefix}]`, JSON.stringify(data, null, 2))
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
   const isNegotiatingRef = useRef(false) // Prevent duplicate negotiations
   const cleanupRef = useRef<(() => void) | null>(null) // Track cleanup function
   const incomingCallRef = useRef<VoiceCall | null>(null) // Track incoming call for comparison
    const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map()) // Queue for ICE candidates per call
    const flushQueueRef = useRef<((callId: string) => void) | null>(null) // Flush function accessible from callbacks
    const processedCandidatesRef = useRef<Set<string>>(new Set()) // Track processed ICE candidates for deduplication

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
  const cleanup = useCallback((reason: string = "unknown") => {
    // Prevent recursive cleanup
    if (isCleaningUpRef.current) {
      return
    }
    isCleaningUpRef.current = true

    try {
      log("cleanup() called", {
        reason,
        callId: currentCallIdRef.current,
        callStatus: callStatusRef.current,
        connectionState: peerConnectionRef.current?.connectionState,
        iceConnectionState: peerConnectionRef.current?.iceConnectionState,
        signalingState: peerConnectionRef.current?.signalingState,
      })

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
      if (activeCallUnsubscribeRef.current) {
        activeCallUnsubscribeRef.current()
        activeCallUnsubscribeRef.current = null
      }
      // NOTE: incomingCallsUnsubscribeRef is NOT cleaned up here -
      // it's a global listener that stays alive for the entire session

      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.pause()
      }

      // Clear ICE candidate queue
      iceCandidateQueueRef.current.clear()
      
      // Clear processed candidates
      processedCandidatesRef.current.clear()

      // Reset state
      setLocalStream(null)
      setRemoteStream(null)
      setCallDuration(0)
      setIsMuted(false)
      setError(null)
      setActiveCall(null)
      setIncomingCall(null)
      currentCallIdRef.current = null
      isNegotiatingRef.current = false
    } finally {
      isCleaningUpRef.current = false
    }
  }, [localStream])

  // Keep cleanupRef in sync with cleanup function
  useEffect(() => {
    cleanupRef.current = cleanup
  }, [cleanup])

  // Keep incomingCallRef in sync with state
  useEffect(() => {
    incomingCallRef.current = incomingCall
  }, [incomingCall])

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
        // Check if there's new information in the updated call
        const currentCall = incomingCallRef.current
        const hasNewOffer = !currentCall?.offer && call.offer
        const hasNewAnswer = !currentCall?.answer && call.answer
        const hasStatusChange = currentCall?.status !== call.status
        const hasTimestampChange = currentCall?.startedAt !== call.startedAt
        
        // Only update if there's meaningful new data
        if (hasNewOffer || hasNewAnswer || hasStatusChange || hasTimestampChange) {
          log("[Offer Pipeline] Updating incomingCall with new data", {
            callId: call.callId,
            hasNewOffer,
            hasNewAnswer,
            hasStatusChange,
            hasTimestampChange,
            currentOffer: currentCall?.offer ? "exists" : "missing",
            updatedOffer: call.offer ? "exists" : "missing",
            currentStatus: currentCall?.status,
            updatedStatus: call.status,
          })
          setIncomingCall(call)
        } else {
          log("[Offer Pipeline] Ignoring duplicate event - no new data", {
            callId: call.callId,
            currentOffer: currentCall?.offer ? "exists" : "missing",
            updatedOffer: call.offer ? "exists" : "missing",
          })
        }
        return
      }

      // New call - process it
      log("[Offer Pipeline] New incoming call", {
        callId: call.callId,
        hasOffer: !!call.offer,
        status: call.status,
      })

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
    log("createPeerConnection", { callId, userId })

    const pc = new RTCPeerConnection(ICE_SERVERS)
    
    // Get or create queue for this call
    const getQueue = () => iceCandidateQueueRef.current.get(callId) || []
    const setQueue = (queue: RTCIceCandidateInit[]) => iceCandidateQueueRef.current.set(callId, queue)
    
    const flushIceCandidateQueue = () => {
      const queue = getQueue()
      if (pc.remoteDescription && queue.length > 0) {
        log("Queue flushed", {
          callId,
          queueSize: queue.length,
          hasRemoteDescription: !!pc.remoteDescription,
        })
        
        const candidates = [...queue]
        setQueue([])
        
        candidates.forEach((candidateData) => {
          try {
            const candidate = new RTCIceCandidate(candidateData)
            pc.addIceCandidate(candidate)
            log("Candidate applied", {
              callId,
              candidateType: (candidateData as any).type || "unknown",
            })
          } catch (err) {
            console.error("Error adding queued ICE candidate:", err)
          }
        })
      }
    }

    pc.onicecandidate = async (event) => {
      if (event.candidate && callId) {
        const candidateJson = event.candidate.toJSON()
        const candidateString = candidateJson.candidate || ""
        const candidateHash = candidateString.substring(0, 50) + "..."
        
        log("ICE candidate generated", {
          callId,
          candidateHash,
          candidate: candidateString,
          type: event.candidate.type,
          protocol: event.candidate.protocol,
          address: event.candidate.address,
          mid: (candidateJson as any).mid,
          sdpMLineIndex: (candidateJson as any).sdpMLineIndex,
        })
        try {
          await addIceCandidate(callId, candidateJson, userId)
        } catch (err) {
          console.error("Error adding ICE candidate:", err)
        }
      }
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0]
      log("ontrack event", {
        callId,
        streamCount: event.streams.length,
        streamId: stream?.id,
        trackCount: stream?.getTracks().length,
        tracks: stream?.getTracks().map(t => ({
          kind: t.kind,
          readyState: t.readyState,
          enabled: t.enabled,
          muted: t.muted,
        })),
      })
      if (stream) {
        setRemoteStream(stream)
        
        // Log stream state after a short delay to verify it's live
        setTimeout(() => {
          const tracks = stream.getTracks()
          log("Remote stream state check", {
            callId,
            streamActive: stream.active,
            trackCount: tracks.length,
            tracks: tracks.map(t => ({
              kind: t.kind,
              readyState: t.readyState,
              enabled: t.enabled,
              muted: t.muted,
              audioLevel: t.getSettings ? t.getSettings() : "N/A",
            })),
          })
        }, 1000)
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      log("connectionState change", {
        callId,
        state,
        signalingState: pc.signalingState,
        iceConnectionState: pc.iceConnectionState,
      })
      
      // Log detailed connection info when connected
      if (state === "connected") {
        log("Connection established - checking media path", {
          callId,
          hasLocalStream: !!localStream,
          hasRemoteStream: !!remoteStream,
          localStreamActive: localStream?.active,
          remoteStreamActive: remoteStream?.active,
        })
        
        // Get connection stats to verify media flow
        pc.getStats().then((stats) => {
          const statsObj: any = {}
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              statsObj.selectedPair = {
                localCandidateId: report.localCandidateId,
                remoteCandidateId: report.remoteCandidateId,
                bytesSent: report.bytesSent,
                bytesReceived: report.bytesReceived,
                packetsSent: report.packetsSent,
                packetsReceived: report.packetsReceived,
                currentRoundTripTime: report.currentRoundTripTime,
              }
            }
            if (report.type === "local-candidate") {
              statsObj.localCandidate = {
                candidateType: report.candidateType,
                protocol: report.protocol,
                address: report.address,
                port: report.port,
              }
            }
            if (report.type === "remote-candidate") {
              statsObj.remoteCandidate = {
                candidateType: report.candidateType,
                protocol: report.protocol,
                address: report.address,
                port: report.port,
              }
            }
            if (report.type === "inbound-rtp" && report.kind === "audio") {
              statsObj.audioInbound = {
                bytesReceived: report.bytesReceived,
                packetsReceived: report.packetsReceived,
                audioLevel: report.audioLevel,
                jitter: report.jitter,
              }
            }
            if (report.type === "outbound-rtp" && report.kind === "audio") {
              statsObj.audioOutbound = {
                bytesSent: report.bytesSent,
                packetsSent: report.packetsSent,
              }
            }
          })
          
          log("Connection stats", {
            callId,
            stats: statsObj,
          })
          
          // Check if media is flowing
          if (statsObj.selectedPair && statsObj.selectedPair.bytesReceived === 0) {
            console.error("MEDIA PATH BROKEN: bytesReceived is 0 - no audio flowing")
            setError("No audio - media not flowing")
          }
        }).catch((err) => {
          console.error("Error getting stats:", err)
        })
        
        setCallStatus("connected")
      }
      
      // Only treat "failed" as error - "disconnected" can recover
      if (state === "failed") {
        console.error(`Connection ${state}`)
        setError(`Connection ${state}`)
        setCallStatus("failed")
        cleanup()
      }
    }

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState
      log("iceConnectionState change", {
        callId,
        state,
        connectionState: pc.connectionState,
        signalingState: pc.signalingState,
      })

      // ICE reaching "connected" or "completed" means media can flow.
      // Don't rely solely on pc.connectionState - it can lag behind or
      // never fire "connected" even though ICE (and audio) is actually
      // working, which was causing the UI to stay stuck on "connecting".
      if (state === "connected" || state === "completed") {
        setCallStatus("connected")
      }

      // Only treat "failed" as terminal - "disconnected" is recoverable
      if (state === "failed") {
        console.error(`ICE connection ${state}`)
        setError(`Connection ${state}`)
        setCallStatus("failed")
        cleanup()
      }
    }

    pc.onsignalingstatechange = () => {
      log("signalingState change", {
        callId,
        state: pc.signalingState,
        localDescription: pc.localDescription?.type,
        remoteDescription: pc.remoteDescription?.type,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
      })
      
      // Flush ICE candidate queue when remote description is set
      if (pc.signalingState === "have-remote-offer" || pc.signalingState === "stable") {
        flushIceCandidateQueue()
      }
    }

    pc.onicegatheringstatechange = () => {
      log("iceGatheringState change", {
        callId,
        state: pc.iceGatheringState,
      })
    }

    // Store flush function in ref so it can be accessed from other callbacks
    flushQueueRef.current = flushIceCandidateQueue

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
        log("Creating offer", { callId, userId })
        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        log("Offer created and local description set", {
          callId,
          offerType: offer.type,
          signalingState: pc.signalingState,
        })

        // Update call with offer
        await updateCallWithOffer(callId, offer)

        // Subscribe to call updates
        const unsubscribe = subscribeToCall(callId, (call) => {
          if (call) {
            setActiveCall(call)
            
            // Handle answer - set remote description
            if (call.answer && pc.signalingState === "have-local-offer" && !pc.remoteDescription) {
              log("Answer received", {
                callId,
                answerType: call.answer.type,
                signalingState: pc.signalingState,
              })
              
              log("Setting remote description (answer)", {
                callId,
                answerType: call.answer.type,
                signalingStateBefore: pc.signalingState,
              })
              
              pc.setRemoteDescription(new RTCSessionDescription(call.answer))
                .then(() => {
                  log("RemoteDescription applied", {
                    callId,
                    signalingStateAfter: pc.signalingState,
                    hasRemoteDescription: !!pc.remoteDescription,
                  })
                  
                  // Flush ICE candidate queue immediately after remoteDescription is set
                  if (flushQueueRef.current) {
                    flushQueueRef.current(callId)
                  }
                })
                .catch(err => {
                  console.error("Error setting remote description:", err)
                })
            }
            
            if (call.status === "connecting") {
              setCallStatus("connecting")
            } else if (call.status === "connected") {
              setCallStatus("connected")
            } else if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
              setCallStatus(call.status)
              cleanup(`firestore_${call.status}`)
            } else if (call.status === "ended" || call.status === "failed") {
              setCallStatus(call.status)
              setTimeout(() => cleanup(`firestore_${call.status}`), 1000)
            }
          }
        })

        activeCallUnsubscribeRef.current = unsubscribe

        // Subscribe to call events (ICE candidates)
        const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
          events.forEach((event) => {
            if (event.type === "ice-candidate" && event.userId !== userId) {
              // Create unique key for candidate deduplication
              const candidateData = event.data
              const candidateKey = `${candidateData.candidate?.substring(0, 50)}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`
              
              // Check if we've already processed this candidate
              if (processedCandidatesRef.current.has(candidateKey)) {
                log("[ICE] Duplicate candidate SKIPPED", {
                  callId,
                  candidateKey: candidateKey.substring(0, 70) + "...",
                  candidateType: candidateData.type,
                })
                return
              }
              
              // Mark as processed
              processedCandidatesRef.current.add(candidateKey)
              
              // Check if remoteDescription is available
              if (!pc.remoteDescription) {
                log("ICE candidate received but no remoteDescription - queuing", {
                  callId,
                  candidateKey: candidateKey.substring(0, 70) + "...",
                  candidateType: candidateData.type,
                  signalingState: pc.signalingState,
                })
                
                // Queue the candidate for later
                const queue = iceCandidateQueueRef.current.get(callId) || []
                queue.push(candidateData)
                iceCandidateQueueRef.current.set(callId, queue)
                
                log("Candidate queued", {
                  callId,
                  queueSize: queue.length,
                })
                return
              }
              
              try {
                const candidate = new RTCIceCandidate(candidateData)
                pc.addIceCandidate(candidate)
                log("ICE candidate added successfully", {
                  callId,
                  candidateKey: candidateKey.substring(0, 70) + "...",
                  candidateType: candidateData.type,
                })
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

    // Prevent duplicate negotiations
    if (isNegotiatingRef.current) {
      log("Duplicate negotiation prevented", { callId })
      return
    }
    isNegotiatingRef.current = true

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

      // Wait for offer with retry logic
      let offerData = incomingCall.offer
      let retryCount = 0
      const maxRetries = 10
      const retryDelay = 200 // ms

      while (!offerData && retryCount < maxRetries) {
        log("Waiting for offer", {
          callId,
          retryCount,
          maxRetries,
          currentCallStatus: incomingCall.status,
        })
        
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        retryCount++
        
        // Re-check the incoming call (it may have been updated by Firestore listener)
        // We need to access the latest incomingCall state
        // Since we're in a callback, we use the closure value which may be stale
        // The retry gives time for the Firestore listener to update
        if (currentCallIdRef.current !== callId) {
          throw new Error("Call was cancelled or replaced during accept")
        }
      }

      if (!offerData) {
        throw new Error(
          `Offer not received after ${maxRetries} retries - cannot accept call. ` +
          `This indicates a race condition in Firestore synchronization.`
        )
      }

      log("Setting remote description (offer)", {
        callId,
        offerType: offerData.type,
        signalingStateBefore: pc.signalingState,
      })

      await pc.setRemoteDescription(new RTCSessionDescription(offerData))

      log("Remote description set", {
        callId,
        signalingStateAfter: pc.signalingState,
      })

      // CRITICAL: Verify signaling state before creating answer
      if (pc.signalingState !== "have-remote-offer") {
        throw new Error(
          `Invalid signaling state for createAnswer: ${pc.signalingState} (expected: have-remote-offer)`
        )
      }

      // Create answer
      log("Creating answer", {
        callId,
        signalingState: pc.signalingState,
      })
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      log("Answer created and local description set", {
        callId,
        answerType: answer.type,
        signalingState: pc.signalingState,
      })

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
            // Create unique key for candidate deduplication
            const candidateData = event.data
            const candidateKey = `${candidateData.candidate?.substring(0, 50)}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`
            
            // Check if we've already processed this candidate
            if (processedCandidatesRef.current.has(candidateKey)) {
              log("[ICE] Duplicate candidate SKIPPED", {
                callId,
                candidateKey: candidateKey.substring(0, 70) + "...",
                candidateType: candidateData.type,
              })
              return
            }
            
            // Mark as processed
            processedCandidatesRef.current.add(candidateKey)
            
            // Check if remoteDescription is available
            if (!pc.remoteDescription) {
              log("ICE candidate received but no remoteDescription - queuing", {
                callId,
                candidateKey: candidateKey.substring(0, 70) + "...",
                candidateType: candidateData.type,
                signalingState: pc.signalingState,
              })
              
              // Queue the candidate for later
              const queue = iceCandidateQueueRef.current.get(callId) || []
              queue.push(candidateData)
              iceCandidateQueueRef.current.set(callId, queue)
              
              log("Candidate queued", {
                callId,
                queueSize: queue.length,
              })
              return
            }
            
            try {
              const candidate = new RTCIceCandidate(candidateData)
              pc.addIceCandidate(candidate)
              log("ICE candidate added successfully", {
                callId,
                candidateKey: candidateKey.substring(0, 70) + "...",
                candidateType: candidateData.type,
              })
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
          setError(err.message || "Failed to accept call")
          setCallStatus("failed")
        }
      }
      cleanup()
    } finally {
      // Reset negotiation flag
      isNegotiatingRef.current = false
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
    const callId = currentCallIdRef.current
    if (!callId) return

    try {
      await cancelCall(callId)
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
  }, [cleanup])

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

  // Cleanup on unmount only - use ref to avoid calling cleanup on re-renders
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if ((window as any).__callTimeoutId) {
        clearTimeout((window as any).__callTimeoutId)
      }
      if ((window as any).__ringtoneTimeout) {
        clearTimeout((window as any).__ringtoneTimeout)
      }
      // Only cleanup on actual unmount, not on re-renders
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, []) // Empty dependency array - only runs on unmount

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
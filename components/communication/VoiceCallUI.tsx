"use client"

import { useEffect, useRef } from "react"
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Track component lifecycle
  useEffect(() => {
    console.log("[VoiceCallUI] Component MOUNTED", {
      callId: call.callId,
      callStatus: call.status,
      hasRemoteStream: !!remoteStream,
      remoteStreamId: (remoteStream as MediaStream | null)?.id || "null",
    })
    
    return () => {
      console.log("[VoiceCallUI] Component UNMOUNTED", {
        callId: call.callId,
        callStatus: call.status,
        hasRemoteStream: !!remoteStream,
        remoteStreamId: (remoteStream as MediaStream | null)?.id || "null",
      })
    }
  }, [call.callId, call.status, remoteStream])
  
  // Track renders with full props
  useEffect(() => {
    const getStreamId = (srcObject: any): string => {
      if (srcObject && typeof srcObject.id === 'string') {
        return srcObject.id
      }
      return "null"
    }
    
    console.log("[VoiceCallUI] Component RENDER", {
      // Props
      isInCall: true, // This component only renders when isInCall is true
      activeCallId: call.callId,
      callStatus: call.status,
      remoteStreamId: getStreamId(remoteStream),
      localStreamId: "N/A - not passed as prop",
      // Other relevant state
      isMuted,
      callDuration,
    })
  })

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

  // Handle remote stream audio playback
  useEffect(() => {
    if (!remoteStream || !audioRef.current) return

    const audio = audioRef.current
    
    // Helper to get stream ID safely
    const getStreamId = (srcObject: any): string => {
      if (srcObject && typeof srcObject.id === 'string') {
        return srcObject.id
      }
      return "null"
    }
    
    // Log audio element identity
    const currentStreamId = getStreamId(audio.srcObject)
    
    console.log("[Audio] useEffect triggered", {
      audioElement: audio,
      audioElementId: audio.src || "no src",
      currentSrcObject: audio.srcObject?.constructor?.name || "null",
      currentSrcObjectId: currentStreamId,
      newStreamId: remoteStream.id,
      newStreamTracks: remoteStream.getTracks().map(t => ({ id: t.id, kind: t.kind })),
    })

    console.log("[Audio] Before srcObject assignment", {
      audioElement: audio,
      oldSrcObject: currentStreamId,
      newSrcObject: remoteStream.id,
    })

    // Only assign if it's a different stream
    if (getStreamId(audio.srcObject) !== remoteStream.id) {
      audio.srcObject = remoteStream
    }

    const newStreamId = getStreamId(audio.srcObject)
    console.log("[Audio] After srcObject assignment", {
      audioElement: audio,
      srcObject: newStreamId,
      paused: audio.paused,
      readyState: audio.readyState,
      muted: audio.muted,
      volume: audio.volume,
    })

    // Play audio (must be triggered by user gesture)
    const playAudio = async () => {
      // Don't play if already playing
      if (!audio.paused) {
        console.log("[Audio] Already playing, skipping play()")
        return
      }

      try {
        const srcObjectId = getStreamId(audio.srcObject)
        console.log("[Audio] Attempting play()", {
          audioElement: audio,
          srcObject: srcObjectId,
          paused: audio.paused,
        })
        await audio.play()
        console.log("[Audio] Playback started successfully", {
          audioElement: audio,
          paused: audio.paused,
          readyState: audio.readyState,
        })
      } catch (err) {
        // Handle AbortError specifically - it's harmless
        if (err instanceof Error && err.name === 'AbortError') {
          console.log("[Audio] play() aborted (expected during stream changes)")
          return
        }
        console.error("[Audio] Failed to start playback:", err)
        // Autoplay was prevented - this is expected on some browsers
        // Audio will play on next user interaction
      }
    }

    playAudio()

    return () => {
      // Don't clear srcObject on cleanup - only on actual unmount
      // This prevents the AbortError
      console.log("[Audio] useEffect cleanup (not clearing srcObject)", {
        audioElement: audio,
        paused: audio.paused,
      })
    }
  }, [remoteStream])

  // Monitor audio playback state
  useEffect(() => {
    if (!audioRef.current) return
    
    const audio = audioRef.current
    
    // Log audio state changes
    const handlePlay = () => {
      console.log("[Audio] Event: play", {
        paused: audio.paused,
        readyState: audio.readyState,
        muted: audio.muted,
        volume: audio.volume,
      })
    }
    
    const handlePause = () => {
      console.log("[Audio] Event: pause", {
        paused: audio.paused,
        readyState: audio.readyState,
      })
    }
    
    const handleError = (err: any) => {
      console.error("[Audio] Event: error", {
        error: err,
        paused: audio.paused,
        readyState: audio.readyState,
        errorCode: audio.error?.code,
        errorMessage: audio.error?.message,
      })
    }
    
    const handleAbort = (err: any) => {
      console.error("[Audio] Event: abort", {
        error: err,
        paused: audio.paused,
        readyState: audio.readyState,
      })
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audio.addEventListener('abort', handleAbort)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('abort', handleAbort)
    }
  }, [remoteStream])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Hidden audio element for remote stream playback */}
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        className="hidden"
      />
      
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
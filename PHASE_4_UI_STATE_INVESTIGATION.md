# Investigation: UI State and Audio Playback Issues

**Status:** INVESTIGATION IN PROGRESS  
**Date:** 2026-06-15  
**Purpose:** Determine why UI shows "Connecting", timer stays at 00:00, and audio doesn't play

---

## Part 1: callStatus Analysis

### Every Location That Calls setCallStatus()

| Line | Value | Reason | Context |
|------|-------|--------|---------|
| 280 | "ringing" | New incoming call received | subscribeToIncomingCalls callback |
| 587 | "ringing" | Call initiated by user | initiateCall() |
| 531 | "connecting" | Call status updated from Firestore | subscribeToCall callback (initiateCall) |
| 533 | "connected" | Call status updated from Firestore | subscribeToCall callback (initiateCall) |
| 535 | "rejected" | Call rejected | subscribeToCall callback (initiateCall) |
| 537 | "cancelled" | Call cancelled | subscribeToCall callback (initiateCall) |
| 539 | "timeout" | Call timeout | subscribeToCall callback (initiateCall) |
| 541 | "ended" | Call ended | subscribeToCall callback (initiateCall) |
| 541 | "failed" | Call failed | subscribeToCall callback (initiateCall) |
| 778 | "connecting" | Answer sent successfully | acceptCall() |
| 737 | "connected" | Call status updated from Firestore | subscribeToCall callback (acceptCall) |
| 739 | "ended" | Call ended | subscribeToCall callback (acceptCall) |
| 739 | "failed" | Call failed | subscribeToCall callback (acceptCall) |
| 809 | "rejected" | User rejected call | rejectIncomingCall() |
| 830 | "cancelled" | User cancelled call | cancelOutgoingCall() |
| 851 | "ended" | User ended call | endActiveCall() |
| 605 | "permission_denied" | Microphone permission denied | initiateCall() error |
| 608 | "failed" | No microphone found | initiateCall() error |
| 611 | "failed" | Failed to start call | initiateCall()() error |
| 785 | "failed" | Failed to accept call | acceptCall() error |

### Critical Finding: No setCallStatus("connected") in subscribeToCall callback (initiateCall)

**Location:** Lines 531-541

```typescript
const unsubscribe = subscribeToCall(callId, (call) => {
  if (call) {
    setActiveCall(call)
    
    // Handle answer - set remote description
    if (call.answer && pc.signalingState === "have-local-offer" && !pc.remoteDescription) {
      // ... setRemoteDescription code ...
    }
    
    if (call.status === "connecting") {
      setCallStatus("connecting")  // Line 531
    } else if (call.status === "connected") {
      setCallStatus("connected")   // Line 533
    } else if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
      setCallStatus(call.status)   // Line 535-537
    } else if (call.status === "ended" || call.status === "failed") {
      setCallStatus(call.status)   // Line 539-541
    }
  }
})
```

**Problem:** 
- The code checks `call.status === "connected"`
- But `call.status` comes from Firestore
- Firestore document status is set to "connecting" by receiver (updateCallWithAnswer line 641)
- Firestore document status is NEVER updated to "connected" by either side
- So `call.status === "connected"` is NEVER true
- Result: `callStatus` stays at "connecting"

### Why Firestore Status Never Becomes "connected"

**Caller side (initiateCall):**
- Creates document with status: "ringing" (line 459)
- Receives answer, but NEVER updates status to "connected"
- Only updates status if: rejected, cancelled, timeout, ended, failed

**Receiver side (acceptCall):**
- Receives offer
- Creates answer
- Updates document with status: "connecting" (updateCallWithAnswer line 641)
- NEVER updates status to "connected"

**Neither side updates status to "connected" in Firestore!**

---

## Part 2: Timer Analysis

### Timer Start Condition

**Location:** Lines 207-227

```typescript
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
```

**Timer starts ONLY when:** `callStatus === "connected"`

**Timer never starts because:** `callStatus` never becomes "connected"

**Root cause:** Same as Part 1 - Firestore status never becomes "connected"

---

## Part 3: Audio Playback Analysis

### Audio Element Location

**File:** `components/communication/VoiceCallUI.tsx`

**Expected code:**
```typescript
<audio
  ref={audioRef}
  autoPlay
  playsInline
  className="hidden"
/>
```

### Remote Stream Attachment

**Location:** `hooks/useVoiceCall.ts` lines 360-369

```typescript
pc.ontrack = (event) => {
  log("ontrack event", {
    callId,
    streamCount: event.streams.length,
    streamId: event.streams[0]?.id,
    trackCount: event.streams[0]?.getTracks().length,
  })
  if (event.streams && event.streams[0]) {
    setRemoteStream(event.streams[0])
  }
}
```

**What happens:**
1. `ontrack` event fires when remote track arrives
2. `setRemoteStream(event.streams[0])` is called
3. This updates React state

### Audio Element useEffect

**Expected code in VoiceCallUI.tsx:**
```typescript
useEffect(() => {
  if (!remoteStream || !audioRef.current) return
  
  const audio = audioRef.current
  audio.srcObject = remoteStream
  
  const playAudio = async () => {
    try {
      await audio.play()
      console.log("[Audio] Playback started successfully")
    } catch (err) {
      console.error("[Audio] Failed to start playback:", err)
    }
  }
  
  playAudio()
}, [remoteStream])
```

### Potential Issues

**Issue 1: AbortError - play() request interrupted**

**Cause:** 
- Component re-renders during call setup
- Audio element is recreated
- Previous play() request is aborted
- New play() request is not made

**Why it happens:**
- `remoteStream` changes from null to stream
- Component re-renders
- Audio element is recreated (if not memoized)
- Old play() is aborted
- New play() should be called, but...

**Issue 2: Race condition in audio playback**

**Timeline:**
```
T0: ontrack fires
T1: setRemoteStream(stream)
T2: Component re-renders
T3: useEffect runs
T4: audio.srcObject = stream
T5: audio.play() called
T6: [Another state update]
T7: Component re-renders AGAIN
T8: Audio element recreated
T9: play() request aborted ❌
T10: New useEffect should run, but...
```

**Issue 3: Component unmounts during acceptCall()**

**From Phase 2 fix:**
- We fixed cleanup() not running on re-renders
- But if component unmounts, cleanup() still runs
- cleanup() sets remoteStream to null
- This detaches the stream from audio

---

## Timeline of Failure

### Expected Timeline:
```
WebRTC connected
  ↓
ontrack fires
  ↓
remoteStream set
  ↓
Component re-renders
  ↓
useEffect runs
  ↓
audio.srcObject = remoteStream
  ↓
audio.play()
  ↓
Audio plays ✅
```

### Actual Timeline:
```
WebRTC connected
  ↓
ontrack fires
  ↓
remoteStream set
  ↓
Component re-renders
  ↓
useEffect runs
  ↓
audio.srcObject = remoteStream
  ↓
audio.play() called
  ↓
[State update during acceptCall()]
  ↓
Component re-renders
  ↓
Audio element recreated
  ↓
play() aborted ❌
  ↓
[New useEffect should run]
  ↓
But remoteStream is still set
  ↓
useEffect dependency hasn't changed
  ↓
useEffect DOES NOT RUN ❌
  ↓
Audio never plays
```

### Root Cause:

**The useEffect dependency is `[remoteStream]`**

- First time: `remoteStream` changes from null to stream
- useEffect runs, sets srcObject, calls play()
- Component re-renders (due to other state changes)
- Audio element is recreated
- play() is aborted
- But `remoteStream` hasn't changed (still the same stream)
- useEffect does NOT run again
- Audio never plays

---

## Required Logging

### Add to VoiceCallUI.tsx:

```typescript
useEffect(() => {
  console.log("[Audio] useEffect triggered", {
    hasRemoteStream: !!remoteStream,
    remoteStreamId: remoteStream?.id,
    audioElementExists: !!audioRef.current,
  })
  
  if (!remoteStream || !audioRef.current) {
    console.log("[Audio] Skipping - no remoteStream or audio element")
    return
  }
  
  const audio = audioRef.current
  console.log("[Audio] Before attachment", {
    srcObject: audio.srcObject,
    paused: audio.paused,
    readyState: audio.readyState,
    muted: audio.muted,
    volume: audio.volume,
  })
  
  audio.srcObject = remoteStream
  
  console.log("[Audio] After srcObject attachment", {
    srcObject: audio.srcObject?.id,
    paused: audio.paused,
    readyState: audio.readyState,
  })
  
  const playAudio = async () => {
    try {
      console.log("[Audio] Attempting play()")
      await audio.play()
      console.log("[Audio] Playback started successfully", {
        paused: audio.paused,
        readyState: audio.readyState,
      })
    } catch (err) {
      console.error("[Audio] Failed to start playback:", err)
    }
  }
  
  playAudio()
  
  return () => {
    console.log("[Audio] useEffect cleanup")
  }
}, [remoteStream])
```

### Add to ontrack handler:

```typescript
pc.ontrack = (event) => {
  console.log("[Audio] ontrack event fired", {
    callId,
    streamCount: event.streams.length,
    streamId: event.streams[0]?.id,
    trackCount: event.streams[0]?.getTracks().length,
    trackKinds: event.streams[0]?.getTracks().map(t => t.kind),
  })
  
  if (event.streams && event.streams[0]) {
    const stream = event.streams[0]
    console.log("[Audio] Setting remoteStream", {
      streamId: stream.id,
      trackCount: stream.getTracks().length,
    })
    setRemoteStream(stream)
  }
}
```

---

## Solutions to Investigigate

### Solution 1: Add audio element state tracking

```typescript
const [audioElementReady, setAudioElementReady] = useState(false)

// In audio element onLoadedMetadata:
const handleAudioLoaded = () => {
  setAudioElementReady(true)
}

// In useEffect:
useEffect(() => {
  if (!remoteStream || !audioRef.current || !audioElementReady) return
  // ... rest
}, [remoteStream, audioElementReady])
```

### Solution 2: Use a ref to track if audio is playing

```typescript
const isPlayingRef = useRef(false)

useEffect(() => {
  if (!remoteStream || !audioRef.current) return
  
  const audio = audioRef.current
  
  // Only play if not already playing
  if (!isPlayingRef.current) {
    audio.srcObject = remoteStream
    audio.play().then(() => {
      isPlayingRef.current = true
    }).catch(err => {
      console.error("[Audio] Failed to play:", err)
    })
  }
  
  return () => {
    isPlayingRef.current = false
  }
}, [remoteStream])
```

### Solution 3: Listen for audio element events

```typescript
useEffect(() => {
  if (!remoteStream || !audioRef.current) return
  
  const audio = audioRef.current
  
  const handlePlay = () => {
    console.log("[Audio] Playing")
  }
  
  const handlePause = () => {
    console.log("[Audio] Paused")
  }
  
  const handleAbort = () => {
    console.log("[Audio] Aborted")
  }
  
  audio.addEventListener('play', handlePlay)
  audio.addEventListener('pause', handlePause)
  audio.addEventListener('abort', handleAbort)
  
  audio.srcObject = remoteStream
  audio.play()
  
  return () => {
    audio.removeEventListener('play', handlePlay)
    audio.removeEventListener('pause', handlePause)
    audio.removeEventListener('abort', handleAbort)
  }
}, [remoteStream])
```

---

## Next Steps

1. Add logging to VoiceCallUI.tsx
2. Add logging to ontrack handler
3. Run test call
4. Check console output
5. Identify which step fails
6. Implement appropriate fix

**Do NOT modify signaling or ICE logic.**
**Only investigate UI state and media playback.**
# Additional Logging to Confirm Root Cause

**Status:** READY TO IMPLEMENT  
**Purpose:** Add targeted logging to identify exact state transition causing VoiceCallUI remount

---

## Root Cause Hypotheses

Based on log analysis, three possible causes:

1. **Firestore sends intermediate status** → cleanup() → activeCall = null → remount
2. **Connection state flicker** → setCallStatus("failed") → isInCall = false → remount  
3. **Multiple subscribeToCall callbacks** → duplicate listeners → conflicting state updates

---

## Additional Logging to Add

### 1. Stack Trace Logging for State Changes

**File:** `hooks/useVoiceCall.ts`

**Add wrapper functions with stack traces:**

```typescript
// Add at top of useVoiceCall function
const logStateChange = (action: string, details: any) => {
  console.trace(`[State Change] ${action}`, details)
}

// Replace setCallStatus calls with:
const setCallStatusWithLog = (status: CallStatus) => {
  logStateChange("setCallStatus", {
    from: callStatusRef.current,
    to: status,
    timestamp: Date.now()
  })
  setCallStatus(status)
}

// Replace setActiveCall calls with:
const setActiveCallWithLog = (call: VoiceCall | null) => {
  logStateChange("setActiveCall", {
    from: currentCallIdRef.current,
    to: call?.callId || "null",
    timestamp: Date.now()
  })
  setActiveCall(call)
}
```

**This will show:**
- Exactly where each state change originates
- Call stack showing which function triggered the change
- Before/after values

---

### 2. Firestore Snapshot Metadata Logging

**File:** `lib/communication/voiceCalls.ts`

**Add to subscribeToCall:**

```typescript
export function subscribeToCall(
  callId: string,
  callback: (call: VoiceCall | null) => void
): () => void {
  log("[Firestore] Subscribe to call", { callId })
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)

  const unsubscribe = onSnapshot(
    callRef,
    (snapshot) => {
      // ADD THIS LOGGING:
      console.log("[Firestore] Snapshot received", {
        callId,
        exists: snapshot.exists(),
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        fromCache: snapshot.metadata.fromCache,
        fromServer: !snapshot.metadata.fromCache,
      })
      
      if (snapshot.exists()) {
        const call = {
          id: snapshot.id,
          ...snapshot.data(),
        } as VoiceCall
        callback(call)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Call subscription error:", error)
    }
  )

  return () => {
    log("[Firestore] Unsubscribe from call", { callId })
    unsubscribe()
  }
}
```

**This will show:**
- Whether snapshots come from cache or server
- Whether there are pending writes
- How many times the listener fires

---

### 3. ICE Candidate Deduplication Logging

**File:** `hooks/useVoiceCall.ts`

**Add to subscribeToCallEvents callback:**

```typescript
// Add ref to track processed candidates
const processedCandidatesRef = useRef<Set<string>>(new Set())

// In subscribeToCallEvents callback:
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  // Reset processed candidates for new batch
  processedCandidatesRef.current.clear()
  
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      // Create unique key for candidate
      const candidateData = event.data
      const candidateKey = `${candidateData.candidate?.substring(0, 50)}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`
      
      // Check if already processed
      if (processedCandidatesRef.current.has(candidateKey)) {
        console.log("[ICE] Duplicate candidate SKIPPED", {
          callId,
          candidateKey,
          candidate: candidateData.candidate?.substring(0, 50) + "...",
        })
        return
      }
      
      // Mark as processed
      processedCandidatesRef.current.add(candidateKey)
      
      // Check if remoteDescription is available
      if (!pc.remoteDescription) {
        log("ICE candidate received but no remoteDescription - queuing", {
          callId,
          candidateKey,
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
          candidateKey,
          candidateType: candidateData.type,
        })
      } catch (err) {
        console.error("Error adding ICE candidate:", err)
      }
    }
  })
})
```

**This will show:**
- Which candidates are duplicates (skipped)
- Which candidates are new (added)
- Total count of unique vs duplicate candidates

---

### 4. VoiceCallUI Render Trigger Logging

**File:** `components/communication/GlobalCallUI.tsx`

**Add detailed render logging:**

```typescript
// Log every render with state changes
useEffect(() => {
  console.log("[GlobalCallUI] RENDER", {
    // State values
    isInCall,
    hasActiveCall: !!activeCall,
    activeCallId: activeCall?.callId || "null",
    callStatus,
    remoteStreamId: (remoteStream as MediaStream | null)?.id || "null",
    
    // VoiceCallUI visibility
    voiceCallUIVisible: isInCall && !!activeCall,
    
    // What changed (compare to previous render)
    timestamp: Date.now(),
  })
  
  // Log what triggered the render
  console.trace("[GlobalCallUI] Render triggered by")
})
```

**This will show:**
- Exact state values on every render
- Whether VoiceCallUI should be visible
- What triggered the render (stack trace)

---

## What to Look For in Logs

### For VoiceCallUI Remount:

**Look for this sequence:**
```
[State Change] setActiveCall
{
  from: "call-123",
  to: "null",  ← activeCall became null!
  timestamp: 1234567890
}
[Stack trace showing which function called setActiveCall]

[GlobalCallUI] RENDER
{
  isInCall: true,
  hasActiveCall: false,  ← activeCall is null
  voiceCallUIVisible: false
}

[VoiceCallUI] Component UNMOUNTED

[State Change] setActiveCall
{
  from: "null",
  to: "call-123",  ← activeCall set again
  timestamp: 1234567891
}

[VoiceCallUI] Component MOUNTED
```

**OR this sequence:**
```
[State Change] setCallStatus
{
  from: "connecting",
  to: "failed",  ← callStatus changed to failed!
  timestamp: 1234567890
}
[Stack trace showing which function called setCallStatus]

[GlobalCallUI] RENDER
{
  isInCall: false,  ← isInCall changed to false
  hasActiveCall: true,
  voiceCallUIVisible: false
}

[VoiceCallUI] Component UNMOUNTED
```

---

### For ICE Candidate Duplication:

**Look for this sequence:**
```
[Firestore] Snapshot received
{
  callId: "call-123",
  exists: true,
  hasPendingWrites: false,
  fromCache: false
}

ICE candidate added successfully
{
  callId: "call-123",
  candidateKey: "candidate:abc123..._0_0",
  candidateType: "host"
}

[Firestore] Snapshot received  ← Another snapshot!
{
  callId: "call-123",
  exists: true,
  hasPendingWrites: false,
  fromCache: false
}

ICE candidate added successfully
{
  callId: "call-123",
  candidateKey: "candidate:abc123..._0_0",  ← SAME candidate!
  candidateType: "host"
}

[ICE] Duplicate candidate SKIPPED  ← If deduplication added
{
  callId: "call-123",
  candidateKey: "candidate:abc123..._0_0"
}
```

**If you see the same candidateKey added multiple times, that's the duplication bug.**

---

## Implementation

### Step 1: Add stack trace logging

**Files to modify:**
- `hooks/useVoiceCall.ts` - Add logStateChange wrapper
- `lib/communication/voiceCalls.ts` - Add snapshot metadata logging
- `hooks/useVoiceCall.ts` - Add ICE candidate deduplication

### Step 2: Test with logging

1. Make test call
2. Copy ALL console logs
3. Look for state changes that cause unmount
4. Look for duplicate ICE candidates

### Step 3: Analyze logs

**For VoiceCallUI remount:**
- Find the state change that triggers unmount
- Check the stack trace to see which function made the change
- Determine why that function was called

**For ICE duplication:**
- Count how many times each candidate is processed
- Check if Firestore is sending duplicate snapshots
- Verify deduplication logic works

---

## Expected Outcomes

### If Hypothesis 1 is correct (Firestore intermediate status):
```
[Firestore] Snapshot received (status: "ringing")
[State Change] setActiveCall (from: null, to: "call-123")
[VoiceCallUI] MOUNTED

[Firestore] Snapshot received (status: "failed") ← INTERMEDIATE
[State Change] setCallStatus (from: "connecting", to: "failed")
cleanup() called (reason: "firestore_failed")
[VoiceCallUI] UNMOUNTED

[Firestore] Snapshot received (status: "connecting")
[State Change] setActiveCall (from: null, to: "call-123")
[VoiceCallUI] MOUNTED
```

### If Hypothesis 2 is correct (Connection state flicker):
```
connectionState change: connected
[VoiceCallUI] MOUNTED

connectionState change: disconnected ← FLICKER
[State Change] setCallStatus (from: "connecting", to: "failed")
cleanup() called (reason: "connection_failed")
[VoiceCallUI] UNMOUNTED

connectionState change: connected
[State Change] setCallStatus (from: "failed", to: "connected")
[VoiceCallUI] MOUNTED
```

### If Hypothesis 3 is correct (Multiple listeners):
```
[Firestore] Subscribe to call (call-123) ← Listener 1
[Firestore] Subscribe to call (call-123) ← Listener 2 (duplicate!)

[Firestore] Snapshot received
[State Change] setActiveCall (from: null, to: "call-123") ← From listener 1
[VoiceCallUI] MOUNTED

[Firestore] Snapshot received
[State Change] setActiveCall (from: "call-123", to: null) ← From listener 2?
[VoiceCallUI] UNMOUNTED
```

---

## Next Steps

1. **Implement additional logging** (stack traces, Firestore metadata, ICE deduplication)
2. **Make test call** and capture all logs
3. **Identify exact state transition** causing remount
4. **Identify ICE duplication source**
5. **Document findings** with evidence
6. **Propose minimal fixes**
7. **Get approval before implementing**

**DO NOT implement fixes yet. Only add logging and analyze.**
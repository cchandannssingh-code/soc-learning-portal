# Investigation: WebRTC Signaling/ICE Sequencing Problem

**Status:** INVESTIGATION IN PROGRESS  
**Date:** 2026-06-15  
**Purpose:** Determine why WebRTC handshake never reaches Connected state

---

## Critical Error Identified

**Error:** `InvalidStateError: No remoteDescription`  
**Location:** `pc.addIceCandidate(candidate)`  
**Cause:** ICE candidates are being added before `setRemoteDescription()` is called

---

## Complete Signaling Flow Analysis

### Caller Side (initiateCall)

```
Line 418: createVoiceCall() - Creates document
Line 422: getUserMedia() - Gets local stream
Line 432: createPeerConnection() - Creates RTCPeerConnection
Line 435: addTrack() - Adds local tracks
Line 441: createOffer() - Creates SDP offer
Line 442: setLocalDescription() - Sets local description
Line 451: updateCallWithOffer() - Writes offer to Firestore
Line 484: subscribeToCallEvents() - Subscribes to ICE candidates
Line 311: onicecandidate - GENERATES ICE CANDIDATES ⚠️
Line 459: subscribeToCall callback - RECEIVES ANSWER ⚠️
         ❌ MISSING: setRemoteDescription(answer)
Line 489: addIceCandidate() - TRIES TO ADD CANDIDATES ❌
         ERROR: No remoteDescription
```

### Receiver Side (acceptCall)

```
Line 536: Gets incoming call
Line 556: getUserMedia() - Gets local stream
Line 566: createPeerConnection() - Creates RTCPeerConnection
Line 569: addTrack() - Adds local tracks
Line 574: Gets offer from incomingCall
Line 612: setRemoteDescription() - Sets remote description ✅
Line 631: createAnswer() - Creates answer
Line 632: setLocalDescription() - Sets local description
Line 641: updateCallWithAnswer() - Writes answer to Firestore
Line 660: subscribeToCallEvents() - Subscribes to ICE candidates
Line 311: onicecandidate - GENERATES ICE CANDIDATES ✅
Line 665: addIceCandidate() - ADDS CALLER CANDIDATES ⚠️
         May work if remoteDescription exists
```

---

## Root Cause Found

### Caller Side: Missing setRemoteDescription(answer)

**Location:** `hooks/useVoiceCall.ts` lines 454-479

**Current Code:**
```typescript
const unsubscribe = subscribeToCall(callId, (call) => {
  if (call) {
    setActiveCall(call)
    
    // Log received answer
    if (call.answer && pc.signalingState === "have-local-offer") {
      log("Received answer", {
        callId,
        answerType: call.answer.type,
        signalingState: pc.signalingState,
      })
    }
    
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
```

**Problem:** 
- The code detects when `call.answer` arrives
- It logs it
- But it NEVER calls `pc.setRemoteDescription(answer)`
- Without remoteDescription, ICE candidates cannot be added
- Connection never establishes

### ICE Candidate Timing Issue

**Location:** `hooks/useVoiceCall.ts` lines 484-495 (Caller) and 660-671 (Receiver)

**Current Code:**
```typescript
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      try {
        const candidate = new RTCIceCandidate(event.data)
        pc.addIceCandidate(candidate) // ❌ FAILS if no remoteDescription
      } catch (err) {
        console.error("Error adding ICE candidate:", err)
      }
    }
  })
})
```

**Problem:**
- ICE candidates can arrive BEFORE remoteDescription is set
- This happens because:
  1. Caller creates offer and writes to Firestore
  2. Caller's ICE candidates start generating immediately
  3. Receiver gets offer, creates answer
  4. Receiver's ICE candidates start generating immediately
  5. Both sides start exchanging ICE candidates
  6. But caller hasn't called setRemoteDescription(answer) yet
  7. addIceCandidate() fails with "No remoteDescription"

---

## Timeline of Failure

### Caller Timeline:
```
T0: createOffer() - Creates offer
T1: setLocalDescription() - Sets local description
T2: updateCallWithOffer() - Writes to Firestore
T3: ICE gathering starts - Candidates generated
T4: ICE candidates written to Firestore
T5: [Receiver gets offer, creates answer]
T6: [Receiver writes answer to Firestore]
T7: subscribeToCall callback fires - call.answer exists
T8: ❌ MISSING: setRemoteDescription(answer)
T9: subscribeToCallEvents fires - ICE candidates arrive
T10: addIceCandidate() - ❌ ERROR: No remoteDescription
T11: ICE connection state: disconnected
T12: Connection state: failed
T13: Timer stays at 00:00
```

### Receiver Timeline:
```
T0: Receives offer
T1: setRemoteDescription(offer) - ✅ Works
T2: createAnswer() - Creates answer
T3: setLocalDescription(answer) - Sets local description
T4: updateCallWithAnswer() - Writes to Firestore
T5: ICE gathering starts - Candidates generated
T6: ICE candidates written to Firestore
T7: subscribeToCallEvents fires - Caller ICE candidates arrive
T8: addIceCandidate() - ⚠️ May work (has remoteDescription)
T9: ICE connection state: checking → connected?
T10: But caller never connects, so connection fails
```

---

## Why Timer Stays at 00:00

**Location:** `hooks/useVoiceCall.ts` lines 204-225

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
}, [callStatus])
```

**Problem:**
- Timer only starts when `callStatus === "connected"`
- `callStatus` is set to "connected" in subscribeToCall callback
- But connection never reaches "connected" state
- Because ICE handshake fails
- Because remoteDescription is never set on caller side
- Because addIceCandidate() fails
- Because ICE connection goes to "disconnected"/"failed"
- Because oniceconnectionstatechange triggers cleanup
- Timer never starts

---

## Required Logging

### Add logging to EVERY step:

**1. Caller: createOffer()**
```typescript
log("[Caller] createOffer() - BEFORE", { callId })
const offer = await pc.createOffer()
log("[Caller] createOffer() - AFTER", { 
  callId, 
  offerType: offer.type,
  sdpLength: offer.sdp?.length 
})
```

**2. Caller: setLocalDescription()**
```typescript
log("[Caller] setLocalDescription() - BEFORE", { callId })
await pc.setLocalDescription(offer)
log("[Caller] setLocalDescription() - AFTER", { 
  callId,
  signalingState: pc.signalingState 
})
```

**3. Caller: updateCallWithOffer()**
```typescript
log("[Caller] updateCallWithOffer() - BEFORE", { callId })
await updateCallWithOffer(callId, offer)
log("[Caller] updateCallWithOffer() - AFTER", { callId, success: true })
```

**4. Caller: subscribeToCall callback (RECEIVES ANSWER)**
```typescript
const unsubscribe = subscribeToCall(callId, (call) => {
  if (call) {
    setActiveCall(call)
    
    if (call.answer) {
      log("[Caller] Answer received from Firestore", {
        callId,
        answerType: call.answer.type,
        hasAnswer: !!call.answer,
        signalingState: pc.signalingState,
        hasRemoteDescription: !!pc.remoteDescription,
      })
      
      // ❌ THIS IS WHERE setRemoteDescription SHOULD BE CALLED
      log("[Caller] ❌ MISSING: setRemoteDescription(answer) - THIS IS THE BUG")
    }
    
    if (call.status === "connecting") {
      setCallStatus("connecting")
    }
    // ... rest of callback
  }
})
```

**5. Caller: subscribeToCallEvents (ICE CANDIDATES)**
```typescript
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      const hasRemoteDesc = !!pc.remoteDescription
      log("[Caller] ICE candidate received", {
        callId,
        candidateType: event.data.type,
        hasRemoteDescription: hasRemoteDesc,
        signalingState: pc.signalingState,
      })
      
      if (!hasRemoteDesc) {
        log("[Caller] ❌ ERROR: Cannot add candidate - no remoteDescription")
        return // Skip candidate
      }
      
      try {
        const candidate = new RTCIceCandidate(event.data)
        pc.addIceCandidate(candidate)
        log("[Caller] ICE candidate added successfully", {
          callId,
          candidateType: event.data.type,
        })
      } catch (err) {
        console.error("[Caller] Error adding ICE candidate:", err)
      }
    }
  })
})
```

**6. Receiver: setRemoteDescription()**
```typescript
log("[Receiver] setRemoteDescription() - BEFORE", {
  callId,
  offerType: offerData.type,
  signalingStateBefore: pc.signalingState,
})
await pc.setRemoteDescription(new RTCSessionDescription(offerData))
log("[Receiver] setRemoteDescription() - AFTER", {
  callId,
  signalingStateAfter: pc.signalingState,
  hasRemoteDescription: !!pc.remoteDescription,
})
```

**7. Receiver: createAnswer()**
```typescript
log("[Receiver] createAnswer() - BEFORE", {
  callId,
  signalingState: pc.signalingState,
})
const answer = await pc.createAnswer()
log("[Receiver] createAnswer() - AFTER", {
  callId,
  answerType: answer.type,
})
```

**8. Receiver: setLocalDescription()**
```typescript
log("[Receiver] setLocalDescription() - BEFORE", { callId })
await pc.setLocalDescription(answer)
log("[Receiver] setLocalDescription() - AFTER", {
  callId,
  signalingState: pc.signalingState,
})
```

**9. Receiver: updateCallWithAnswer()**
```typescript
log("[Receiver] updateCallWithAnswer() - BEFORE", { callId })
await updateCallWithAnswer(callId, answer)
log("[Receiver] updateCallWithAnswer() - AFTER", { callId, success: true })
```

**10. Receiver: subscribeToCallEvents (ICE CANDIDATES)**
```typescript
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      const hasRemoteDesc = !!pc.remoteDescription
      log("[Receiver] ICE candidate received", {
        callId,
        candidateType: event.data.type,
        hasRemoteDescription: hasRemoteDesc,
        signalingState: pc.signalingState,
      })
      
      if (!hasRemoteDesc) {
        log("[Receiver] ❌ ERROR: Cannot add candidate - no remoteDescription")
        return // Skip candidate
      }
      
      try {
        const candidate = new RTCIceCandidate(event.data)
        pc.addIceCandidate(candidate)
        log("[Receiver] ICE candidate added successfully", {
          callId,
          candidateType: event.data.type,
        })
      } catch (err) {
        console.error("[Receiver] Error adding ICE candidate:", err)
      }
    }
  })
})
```

**11. Connection state changes**
```typescript
pc.onconnectionstatechange = () => {
  const state = pc.connectionState
  log("connectionState change", {
    callId,
    state,
    signalingState: pc.signalingState,
    iceConnectionState: pc.iceConnectionState,
    hasLocalDescription: !!pc.localDescription,
    hasRemoteDescription: !!pc.remoteDescription,
  })
  // ... rest
}

pc.oniceconnectionstatechange = () => {
  const state = pc.iceConnectionState
  log("iceConnectionState change", {
    callId,
    state,
    connectionState: pc.connectionState,
    signalingState: pc.signalingState,
    hasLocalDescription: !!pc.localDescription,
    hasRemoteDescription: !!pc.remoteDescription,
  })
  // ... rest
}
```

---

## Expected Timeline with Logging

### Successful Call (What Should Happen):

```
[Caller] createVoiceCall() - Creates document
[Caller] getUserMedia() - Gets stream
[Caller] createPeerConnection() - Creates PC
[Caller] addTrack() - Adds tracks
[Caller] createOffer() - BEFORE
[Caller] createOffer() - AFTER { offerType: "offer" }
[Caller] setLocalDescription() - BEFORE
[Caller] setLocalDescription() - AFTER { signalingState: "have-local-offer" }
[Caller] updateCallWithOffer() - BEFORE
[Caller] updateCallWithOffer() - AFTER { success: true }
[Caller] ICE candidate generated - Started gathering

[Receiver] subscribeToIncomingCalls fires
[Receiver] New incoming call { callId: "A_B", hasOffer: false }
[Receiver] User clicks Accept
[Receiver] getUserMedia() - Gets stream
[Receiver] createPeerConnection() - Creates PC
[Receiver] addTrack() - Adds tracks
[Receiver] Waiting for offer...
[Receiver] Setting remote description (offer) - BEFORE
[Receiver] Remote description set - AFTER { signalingState: "have-remote-offer" }
[Receiver] createAnswer() - BEFORE
[Receiver] createAnswer() - AFTER { answerType: "answer" }
[Receiver] setLocalDescription() - BEFORE
[Receiver] setLocalDescription() - AFTER { signalingState: "stable" }
[Receiver] updateCallWithAnswer() - BEFORE
[Receiver] updateCallWithAnswer() - AFTER { success: true }
[Receiver] ICE candidate generated - Started gathering

[Caller] subscribeToCall callback fires
[Caller] Answer received from Firestore { hasAnswer: true }
[Caller] ❌ MISSING: setRemoteDescription(answer) - THIS IS THE BUG
[Caller] subscribeToCallEvents fires
[Caller] ICE candidate received { hasRemoteDescription: false }
[Caller] ❌ ERROR: Cannot add candidate - no remoteDescription
[Caller] Error adding ICE candidate: InvalidStateError: No remoteDescription
[Caller] iceConnectionState change { state: "failed" }
[Caller] connectionState change { state: "failed" }
[Caller] Timer stays at 00:00
```

---

## The Fix (Do Not Implement Yet)

### Option 1: Add setRemoteDescription in subscribeToCall callback (RECOMMENDED)

**Location:** `hooks/useVoiceCall.ts` lines 454-479

**Change:**
```typescript
const unsubscribe = subscribeToCall(callId, (call) => {
  if (call) {
    setActiveCall(call)
    
    // Handle answer
    if (call.answer && pc.signalingState === "have-local-offer") {
      log("Received answer", {
        callId,
        answerType: call.answer.type,
        signalingState: pc.signalingState,
      })
      
      // ✅ ADD: Set remote description
      log("Setting remote description (answer)", {
        callId,
        answerType: call.answer.type,
        signalingStateBefore: pc.signalingState,
      })
      
      pc.setRemoteDescription(new RTCSessionDescription(call.answer))
        .then(() => {
          log("Remote description set", {
            callId,
            signalingStateAfter: pc.signalingState,
          })
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
      cleanup()
    } else if (call.status === "ended" || call.status === "failed") {
      setCallStatus(call.status)
      setTimeout(() => cleanup(), 1000)
    }
  }
})
```

### Option 2: Implement ICE candidate queue

**Location:** `hooks/useVoiceCall.ts` in createPeerConnection

**Change:**
```typescript
const createPeerConnection = useCallback((callId: string) => {
  log("createPeerConnection", { callId, userId })

  const pc = new RTCPeerConnection(ICE_SERVERS)
  
  // ✅ ADD: ICE candidate queue
  const iceCandidateQueue: RTCIceCandidateInit[] = []
  
  const flushIceCandidateQueue = () => {
    if (pc.remoteDescription) {
      log("Flushing ICE candidate queue", {
        callId,
        queueSize: iceCandidateQueue.length,
      })
      
      iceCandidateQueue.forEach(candidate => {
        try {
          const iceCandidate = new RTCIceCandidate(candidate)
          pc.addIceCandidate(iceCandidate)
        } catch (err) {
          console.error("Error adding queued ICE candidate:", err)
        }
      })
      
      iceCandidateQueue.length = 0
    }
  }

  pc.onicecandidate = async (event) => {
    if (event.candidate && callId) {
      log("ICE candidate generated", {
        callId,
        type: event.candidate.type,
        protocol: event.candidate.protocol,
        address: event.candidate.address,
      })
      try {
        await addIceCandidate(callId, event.candidate.toJSON(), userId)
      } catch (err) {
        console.error("Error adding ICE candidate:", err)
      }
    }
  }

  pc.ontrack = (event) => {
    // ... existing code
  }

  pc.onconnectionstatechange = () => {
    // ... existing code
  }

  pc.oniceconnectionstatechange = () => {
    // ... existing code
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
    
    // ✅ ADD: Flush queue when remote description is set
    if (pc.signalingState === "have-remote-offer" || pc.signalingState === "stable") {
      flushIceCandidateQueue()
    }
  }

  pc.onicegatheringstatechange = () => {
    // ... existing code
  }

  peerConnectionRef.current = pc
  return pc
}, [userId, cleanup])
```

**And update subscribeToCallEvents:**
```typescript
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      const candidate = new RTCIceCandidate(event.data)
      
      // ✅ ADD: Queue candidate if no remote description
      if (!pc.remoteDescription) {
        log("Queueing ICE candidate - no remote description", {
          callId,
          candidateType: event.data.type,
          signalingState: pc.signalingState,
        })
        iceCandidateQueue.push(event.data)
        return
      }
      
      try {
        pc.addIceCandidate(candidate)
        log("ICE candidate added successfully", {
          callId,
          candidateType: event.data.type,
        })
      } catch (err) {
        console.error("Error adding ICE candidate:", err)
      }
    }
  })
})
```

---

## Next Steps

1. Add all the logging listed above
2. Run a test call
3. Check console output
4. Verify the exact sequence
5. Confirm that setRemoteDescription(answer) is never called on caller side
6. Confirm that ICE candidates arrive before remoteDescription
7. Implement Option 1 (add setRemoteDescription) + Option 2 (ICE candidate queue)
8. Test again

**Do NOT implement yet.**
**Just add logging and investigate.**

---

**END OF INVESTIGATION REPORT**
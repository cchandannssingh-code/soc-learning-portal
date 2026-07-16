# Investigation: Offer Pipeline - Why Offer Never Arrives

**Status:** INVESTIGATION IN PROGRESS  
**Date:** 2026-06-15  
**Purpose:** Find where the offer disappears in the pipeline

---

## Complete Execution Path

### Caller Side (initiateCall)

```
1. createVoiceCall() - Line 371
   ↓
2. getUserMedia() - Line 375
   ↓
3. createPeerConnection() - Line 385
   ↓
4. pc.addTrack() - Line 388
   ↓
5. pc.createOffer() - Line 394
   ↓
6. pc.setLocalDescription() - Line 395
   ↓
7. updateCallWithOffer() - Line 404
   ↓
8. Firestore write
   ↓
9. Firestore listener fires on receiver
```

### Receiver Side (subscribeToIncomingCalls)

```
1. Listener fires - Line 219
   ↓
2. Filter: status == "ringing" - Line 194
   ↓
3. Filter: initiatorId !== userId - Line 203
   ↓
4. Set incomingCall - Line 230
   ↓
5. Set currentCallIdRef - Line 232
   ↓
6. User clicks Accept
   ↓
7. acceptCall() reads incomingCall.offer - Line 527
```

---

## Code Analysis

### Step 1: createVoiceCall() - Line 371

**Location:** `hooks/useVoiceCall.ts` line 371
```typescript
const callId = await createVoiceCall(userId, userName, targetUserId, targetUserName)
currentCallIdRef.current = callId
```

**Function:** `lib/communication/voiceCalls.ts` lines 33-57
```typescript
export async function createVoiceCall(...): Promise<string> {
  const callId = getCallId(initiatorId, targetUserId)
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)

  const callData: Partial<VoiceCall> = {
    callId,
    participants: [initiatorId, targetUserId],
    participantNames: {...},
    status: "ringing",
    initiatorId,
    startedAt: new Date(),
    // ❌ NO OFFER HERE
  }

  await setDoc(callRef, callData, { merge: true })
  return callId
}
```

**Status:** ✅ Creates document WITHOUT offer
**Issue:** Document is created without offer field

---

### Step 2: getUserMedia() - Line 375

**Location:** `hooks/useVoiceCall.ts` line 375
```typescript
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  }
})
setLocalStream(stream)
```

**Status:** ✅ Gets local media stream
**Issue:** None - this works

---

### Step 3: createPeerConnection() - Line 385

**Location:** `hooks/useVoiceCall.ts` line 385
```typescript
const pc = createPeerConnection(callId)
```

**Function:** `hooks/useVoiceCall.ts` lines 259-344
```typescript
const createPeerConnection = useCallback((callId: string) => {
  log("createPeerConnection", { callId, userId })
  const pc = new RTCPeerConnection(ICE_SERVERS)
  // ... event handlers ...
  peerConnectionRef.current = pc
  return pc
}, [userId, cleanup])
```

**Status:** ✅ Creates new RTCPeerConnection
**Issue:** None - this works

---

### Step 4: pc.addTrack() - Line 388

**Location:** `hooks/useVoiceCall.ts` line 388
```typescript
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream)
})
```

**Status:** ✅ Adds local tracks to PeerConnection
**Issue:** None - this works

---

### Step 5: pc.createOffer() - Line 394

**Location:** `hooks/useVoiceCall.ts` line 394
```typescript
log("Creating offer", { callId, userId })
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)

log("Offer created and local description set", {
  callId,
  offerType: offer.type,
  signalingState: pc.signalingState,
})
```

**Status:** ✅ Creates SDP offer
**Issue:** None - this works

---

### Step 6: updateCallWithOffer() - Line 404

**Location:** `hooks/useVoiceCall.ts` line 404
```typescript
await updateCallWithOffer(callId, offer)
```

**Function:** `lib/communication/voiceCalls.ts` lines 84-93
```typescript
export async function updateCallWithOffer(
  callId: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)
  await updateDoc(callRef, {
    offer,
    status: "ringing",
  })
}
```

**Status:** ⚠️ Updates Firestore document with offer
**Issue:** This is a SEPARATE operation from createVoiceCall()

---

### Step 7: Firestore Write

**Operation:** `updateDoc(callRef, { offer, status: "ringing" })`

**Expected Result:**
```javascript
{
  callId: "userA_userB",
  participants: ["userA", "userB"],
  status: "ringing",
  initiatorId: "userA",
  startedAt: Timestamp,
  offer: {
    type: "offer",
    sdp: "v=0\r\n..."
  }
}
```

**Status:** ⚠️ Should succeed
**Issue:** Need to verify this actually writes

---

### Step 8: Firestore Listener Fires on Receiver

**Location:** `lib/communication/voiceCalls.ts` lines 187-218
```typescript
export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: VoiceCall | null) => void
): () => void {
  const q = query(
    collection(db, VOICE_CALLS_COLLECTION),
    where("participants", "array-contains", userId),
    where("status", "==", "ringing")
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const incomingCalls = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as VoiceCall))
        .filter((call) => call.initiatorId !== userId)

      if (incomingCalls.length > 0) {
        callback(incomingCalls[0])
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Incoming calls subscription error:", error)
    }
  )

  return unsubscribe
}
```

**Status:** ⚠️ Listens for incoming calls
**Issue:** Need to verify it receives the offer

---

### Step 9: Receiver Processes Call

**Location:** `hooks/useVoiceCall.ts` lines 219-245
```typescript
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
    // ...
  }
})
```

**Status:** ⚠️ Sets incomingCall state
**Issue:** Need to verify call.offer exists

---

### Step 10: acceptCall() Reads Offer

**Location:** `hooks/useVoiceCall.ts` line 527
```typescript
let offerData = incomingCall.offer
```

**Status:** ❌ offerData is undefined
**Issue:** This is where the error occurs

---

## Critical Finding

### The Race Condition

**Timeline:**
```
T0: Caller: createVoiceCall() → Firestore: { status: "ringing", NO offer }
   ↓
T1: [50-200ms Firestore latency]
   ↓
T2: Receiver: subscribeToIncomingCalls fires
   ↓
T3: Receiver: call = { status: "ringing", offer: undefined } ❌
   ↓
T4: Receiver: setIncomingCall(call)
   ↓
T5: Receiver: currentCallIdRef.current = call.callId
   ↓
T6: [500-1500ms] Caller: getUserMedia()
   ↓
T7: [50-100ms] Caller: createOffer()
   ↓
T8: [50-200ms] Caller: updateCallWithOffer() → Firestore: { offer: {...} }
   ↓
T9: [50-200ms] Receiver: Listener fires AGAIN
   ↓
T10: Receiver: call = { status: "ringing", offer: {...} } ✅
   ↓
T11: BUT: incomingCall state is already set
   ↓
T12: Listener checks: currentCallIdRef.current === call.callId
   ↓
T13: TRUE - so it returns early (line 226-228)
   ↓
T14: incomingCall.offer is STILL undefined ❌
```

**The Problem:**
1. Listener fires when document is created (NO offer)
2. Sets `incomingCall` and `currentCallIdRef.current`
3. Listener fires again when offer is added
4. But guard `currentCallIdRef.current === call.callId` returns early
5. `incomingCall` state is NEVER updated with the offer
6. When user clicks Accept, `incomingCall.offer` is undefined

---

## Root Cause

**The guard at line 226-228 prevents the offer from being received:**

```typescript
// Check if we're already processing this call
if (currentCallIdRef.current === call.callId) {
  return // ❌ Returns early, never updates incomingCall with offer
}
```

**Why this is a problem:**
1. First listener fire: `currentCallIdRef.current = null`, so it sets `incomingCall` (without offer)
2. Second listener fire: `currentCallIdRef.current === call.callId`, so it returns early
3. Result: `incomingCall` never gets updated with the offer

---

## Required Logging

### Add logging to EVERY step:

**1. createVoiceCall() - Before and After**
```typescript
console.log("[Offer Pipeline] createVoiceCall - BEFORE", {
  initiatorId: userId,
  targetUserId,
  targetUserName,
})

const callId = await createVoiceCall(userId, userName, targetUserId, targetUserId)

console.log("[Offer Pipeline] createVoiceCall - AFTER", {
  callId,
  success: true,
})
```

**2. getUserMedia() - Before and After**
```typescript
console.log("[Offer Pipeline] getUserMedia - BEFORE", { callId })

const stream = await navigator.mediaDevices.getUserMedia({...})

console.log("[Offer Pipeline] getUserMedia - AFTER", {
  callId,
  streamId: stream.id,
  audioTracks: stream.getAudioTracks().length,
})
```

**3. createOffer() - Before and After**
```typescript
console.log("[Offer Pipeline] createOffer - BEFORE", { callId })

const offer = await pc.createOffer()
await pc.setLocalDescription(offer)

console.log("[Offer Pipeline] createOffer - AFTER", {
  callId,
  offerType: offer.type,
  sdpLength: offer.sdp?.length,
  signalingState: pc.signalingState,
})
```

**4. updateCallWithOffer() - Before and After**
```typescript
console.log("[Offer Pipeline] updateCallWithOffer - BEFORE", {
  callId,
  offerType: offer.type,
})

await updateCallWithOffer(callId, offer)

console.log("[Offer Pipeline] updateCallWithOffer - AFTER", {
  callId,
  success: true,
})
```

**5. Firestore Write - Verify**
```typescript
// In updateCallWithOffer()
console.log("[Offer Pipeline] Firestore write - BEFORE", { callId, offer })

await updateDoc(callRef, { offer, status: "ringing" })

console.log("[Offer Pipeline] Firestore write - AFTER", { callId, success: true })
```

**6. Firestore Listener - Receiver**
```typescript
// In subscribeToIncomingCalls callback
console.log("[Offer Pipeline] Listener fired - BEFORE filter", {
  userId,
  callId: doc.id,
  hasOffer: !!doc.data().offer,
  offerType: doc.data().offer?.type,
  status: doc.data().status,
})

const incomingCalls = snapshot.docs
  .map((doc) => ({ id: doc.id, ...doc.data() } as VoiceCall))
  .filter((call) => call.initiatorId !== userId)

console.log("[Offer Pipeline] Listener fired - AFTER filter", {
  userId,
  incomingCallsCount: incomingCalls.length,
  callId: incomingCalls[0]?.callId,
  hasOffer: !!incomingCalls[0]?.offer,
})

if (incomingCalls.length > 0) {
  console.log("[Offer Pipeline] Calling callback with", {
    callId: incomingCalls[0].callId,
    hasOffer: !!incomingCalls[0].offer,
    offerType: incomingCalls[0].offer?.type,
  })
  callback(incomingCalls[0])
}
```

**7. Receiver Processes Call**
```typescript
// In useVoiceCall.ts subscribeToIncomingCalls callback
console.log("[Offer Pipeline] Processing incoming call", {
  callId: call.callId,
  hasOffer: !!call.offer,
  offerType: call.offer?.type,
  currentCallIdRef: currentCallIdRef.current,
  willReturnEarly: currentCallIdRef.current === call.callId,
})

if (!call || call.initiatorId === userId) {
  console.log("[Offer Pipeline] Filtered: no call or own call")
  return
}

if (currentCallIdRef.current === call.callId) {
  console.log("[Offer Pipeline] Filtered: already processing this call")
  return
}

console.log("[Offer Pipeline] Setting incomingCall", {
  callId: call.callId,
  hasOffer: !!call.offer,
})

setIncomingCall(call)
setCallStatus("ringing")
currentCallIdRef.current = call.callId
```

**8. acceptCall() Reads Offer**
```typescript
// In acceptCall()
console.log("[Offer Pipeline] acceptCall - Reading offer", {
  callId: incomingCall.callId,
  hasOffer: !!incomingCall.offer,
  offerType: incomingCall.offer?.type,
  offerSdpLength: incomingCall.offer?.sdp?.length,
})

let offerData = incomingCall.offer
```

---

## Expected Timeline with Logging

### Successful Call (What Should Happen):

```
[Caller] createVoiceCall - BEFORE
[Caller] createVoiceCall - AFTER { callId: "A_B" }
[Caller] getUserMedia - BEFORE
[Caller] getUserMedia - AFTER { streamId: "..." }
[Caller] createOffer - BEFORE
[Caller] createOffer - AFTER { offerType: "offer", sdpLength: 1234 }
[Caller] updateCallWithOffer - BEFORE { callId: "A_B" }
[Caller] Firestore write - BEFORE { callId: "A_B", offer: {...} }
[Caller] Firestore write - AFTER { success: true }
[Caller] updateCallWithOffer - AFTER { success: true }

[Receiver] Listener fired - BEFORE filter { callId: "A_B", hasOffer: false }
[Receiver] Listener fired - AFTER filter { incomingCallsCount: 1, hasOffer: false }
[Receiver] Calling callback with { callId: "A_B", hasOffer: false }
[Receiver] Processing incoming call { callId: "A_B", hasOffer: false }
[Receiver] Setting incomingCall { callId: "A_B", hasOffer: false }

[Receiver] Listener fired - BEFORE filter { callId: "A_B", hasOffer: true } ✅
[Receiver] Listener fired - AFTER filter { incomingCallsCount: 1, hasOffer: true } ✅
[Receiver] Calling callback with { callId: "A_B", hasOffer: true } ✅
[Receiver] Filtered: already processing this call ❌ RETURNS EARLY

[Receiver] User clicks Accept
[Receiver] acceptCall - Reading offer { callId: "A_B", hasOffer: false } ❌ ERROR
```

### The Problem is Clear:

The second listener fire (with offer) is blocked by the guard at line 226-228.

---

## Solution Analysis

### Why the Guard Exists

The guard prevents processing the same call twice:
```typescript
if (currentCallIdRef.current === call.callId) {
  return // Prevent duplicate processing
}
```

### Why It's a Problem

The guard assumes that if we're already processing a call, we don't need to update it. But this is wrong because:
1. First fire: call without offer
2. Second fire: call with offer
3. We NEED the second fire to get the offer

### The Fix (Do Not Implement Yet)

**Option 1: Always update incomingCall if offer is missing**
```typescript
if (currentCallIdRef.current === call.callId) {
  // If we don't have the offer yet, update the call
  if (!incomingCall?.offer && call.offer) {
    console.log("[Offer Pipeline] Updating incomingCall with offer")
    setIncomingCall(call)
  }
  return
}
```

**Option 2: Remove the guard and rely on callId comparison**
```typescript
// Remove the guard entirely
// The incomingCall state will be updated with the latest data
```

**Option 3: Use a ref to track if we've received the offer**
```typescript
const hasOfferRef = useRef(false)

// In listener:
if (currentCallIdRef.current === call.callId && hasOfferRef.current) {
  return
}

if (call.offer) {
  hasOfferRef.current = true
}

setIncomingCall(call)
```

---

## Next Steps

1. Add all the logging listed above
2. Run a test call
3. Check console output
4. Verify which step fails
5. Confirm the root cause
6. Implement the appropriate fix

**Do NOT implement a fix yet.**
**Do NOT increase retries.**
**Just add logging and investigate.**

---

**END OF INVESTIGATION REPORT**
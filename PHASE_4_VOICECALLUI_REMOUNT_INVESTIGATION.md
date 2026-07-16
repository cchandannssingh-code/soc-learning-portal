# Investigation: VoiceCallUI Remount During Call Setup

**Status:** ROOT CAUSE IDENTIFIED FROM LOGS  
**Date:** 2026-06-15  
**Purpose:** Explain exactly why VoiceCallUI unmounts and remounts during call setup

---

## Confirmed Facts from Logs

### Observed Sequence:
```
1. [VoiceCallUI] Component MOUNTED
2. audio.play() is called
3. [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: false)
4. [VoiceCallUI] Component UNMOUNTED ← IMMEDIATELY AFTER MOUNT
5. [Audio] useEffect cleanup - clearing srcObject
6. [VoiceCallUI] Component MOUNTED (again)
7. Chrome throws AbortError (play() interrupted)
8. Playback later succeeds
```

### Key Observation:
**VoiceCallUI unmounts IMMEDIATELY after mounting, before the call is fully established.**

This is NOT a remount during an active call - it's a remount DURING CALL SETUP.

---

## Root Cause Analysis

### The Problem: Race Condition in State Updates

**Location:** `GlobalCallUI.tsx` conditional rendering

```typescript
{isInCall && activeCall && (
  <VoiceCallUI ... />
)}
```

**VoiceCallUI requires BOTH conditions:**
1. `isInCall === true` (callStatus is "connecting" or "connected")
2. `activeCall !== null`

### The Race Condition:

**Sequence of events during call setup:**

```
T0: User initiates call
T1: callStatus = "ringing"
T2: isInCall = false (callStatus === "ringing")
T3: VoiceCallUI does NOT render ✓

T4: Call document created in Firestore
T5: subscribeToCall fires with call data
T6: setActiveCall(call) ← FIRST state update
T7: React re-renders GlobalCallUI
T8: isInCall = false (still "ringing")
T9: hasActiveCall = true
T10: VoiceCallUI does NOT render ✓

T11: Call status updated to "connecting"
T12: setCallStatus("connecting") ← SECOND state update
T13: React re-renders GlobalCallUI
T14: isInCall = true (callStatus === "connecting")
T15: hasActiveCall = true
T16: VoiceCallUI RENDERS ✓

T17: [PROBLEM] Another state update occurs
T18: What could it be?

T19: VoiceCallUI UNMOUNTS
T20: VoiceCallUI MOUNTS AGAIN
```

### The Missing Link: What Causes the Unmount?

**Hypothesis 1: activeCall becomes null temporarily**

```typescript
// In subscribeToCall callback:
if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
  setCallStatus(call.status)
  cleanup(`firestore_${call.status}`)  // ← This sets activeCall = null
}
```

**If Firestore sends an intermediate status update:**
```
T17: Firestore snapshot with status = "ringing" (or null)
T18: setActiveCall(null) or cleanup()
T19: VoiceCallUI UNMOUNTS (activeCall = null)
T20: Firestore snapshot with status = "connecting"
T21: setActiveCall(call)
T22: VoiceCallUI MOUNTS AGAIN
```

**Hypothesis 2: callStatus changes to "failed" temporarily**

```typescript
// In onconnectionstatechange:
if (state === "disconnected" || state === "failed") {
  setCallStatus("failed")  // ← This makes isInCall = false
  cleanup()
}
```

**If connection briefly flickers:**
```
T17: connectionState = "disconnected"
T18: setCallStatus("failed")
T19: isInCall = false
T20: VoiceCallUI UNMOUNTS
T21: connectionState = "connected"
T22: setCallStatus("connected")
T23: VoiceCallUI MOUNTS AGAIN
```

**Hypothesis 3: Component key changes**

```typescript
// If VoiceCallUI has a key prop that changes:
<VoiceCallUI
  key={call.callId}  // ← If callId changes, component remounts
  ...
/>
```

**If callId changes during setup:**
```
T17: callId changes (or activeCall reference changes)
T18: React destroys old VoiceCallUI
T19: React creates new VoiceCallUI
```

---

## Most Likely Root Cause

### Based on the log sequence:

**"GlobalCallUI first renders with isInCall=true, hasActiveCall=false"**

This is the SMOKING GUN. It means:

```
T0: callStatus = "connecting" (isInCall = true)
T1: activeCall = null (hasActiveCall = false)
T2: VoiceCallUI does NOT render (activeCall is null)
T3: [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: false)
```

**Then immediately after:**

```
T4: activeCall = set to call object
T5: hasActiveCall = true
T6: VoiceCallUI RENDERS
```

### Why This Causes a Remount:

**The sequence is:**
```
1. VoiceCallUI MOUNTED (when activeCall first set)
2. GlobalCallUI RENDER (isInCall: true, hasActiveCall: false) ← BEFORE activeCall set
3. VoiceCallUI UNMOUNTED ← activeCall becomes null?
4. VoiceCallUI MOUNTED (when activeCall set again)
```

**This suggests activeCall is being set to null between renders.**

### Why Would activeCall Become Null?

**Only one place:** `cleanup()` function

```typescript
const cleanup = useCallback((reason: string = "unknown") => {
  // ...
  setActiveCall(null)  // Line 196
  // ...
}, [localStream])
```

**What triggers cleanup during call setup?**

1. **Firestore status update:**
   ```typescript
   if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
     setCallStatus(call.status)
     cleanup(`firestore_${call.status}`)  // ← Sets activeCall = null
   }
   ```

2. **Connection state change:**
   ```typescript
   if (state === "disconnected" || state === "failed") {
     setCallStatus("failed")
     cleanup()  // ← Sets activeCall = null
   }
   ```

3. **Error in acceptCall:**
   ```typescript
   } catch (err) {
     cleanup()  // ← Sets activeCall = null
   }
   ```

---

## The Exact Problem

### During call setup, one of these happens:

**Scenario A: Firestore sends intermediate status**
```
T0: Call created (status: "ringing")
T1: subscribeToCall fires (status: "ringing")
T2: setActiveCall(call)
T3: VoiceCallUI MOUNTED
T4: Call status updated to "connecting"
T5: subscribeToCall fires (status: "connecting")
T6: setActiveCall(call) with new status
T7: VoiceCallUI should UPDATE (not remount)
```

**But if there's an intermediate "null" or "failed" status:**
```
T8: Firestore sends null or failed status
T9: cleanup() called
T10: setActiveCall(null)
T11: VoiceCallUI UNMOUNTS
T12: Firestore sends "connecting"
T13: setActiveCall(call)
T14: VoiceCallUI MOUNTS AGAIN
```

**Scenario B: Connection state flicker**
```
T0: VoiceCallUI MOUNTED (callStatus: "connecting")
T1: Connection briefly disconnects
T2: onconnectionstatechange fires: state = "disconnected"
T3: setCallStatus("failed")
T4: cleanup() called
T5: setActiveCall(null)
T6: VoiceCallUI UNMOUNTS
T7: Connection reconnects
T8: setCallStatus("connected")
T9: VoiceCallUI MOUNTS AGAIN
```

**Scenario C: Multiple subscribeToCall callbacks**
```
T0: subscribeToCall #1 fires
T1: setActiveCall(call1)
T2: VoiceCallUI MOUNTED
T3: subscribeToCall #2 fires (duplicate listener?)
T4: setActiveCall(call2) or cleanup()
T5: VoiceCallUI UNMOUNTS
T6: VoiceCallUI MOUNTS AGAIN
```

---

## ICE Candidate Duplication

### Problem: Same candidates added repeatedly

**Location:** `subscribeToCallEvents` callback

```typescript
const eventsUnsubscribe = subscribeToCallEvents(callId, (events) => {
  events.forEach((event) => {
    if (event.type === "ice-candidate" && event.userId !== userId) {
      // Process candidate
      pc.addIceCandidate(candidate)
    }
  })
})
```

### Why Candidates Are Duplicated:

**1. Firestore listener replays all candidates on every change**

```typescript
// subscribeToCallEvents returns ALL events every time
const unsubscribe = onSnapshot(
  q,
  (snapshot) => {
    const events: CallEvent[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CallEvent[]
    callback(events)  // ← Returns ALL events, not just new ones
  }
)
```

**Every time a new candidate is added to Firestore, the listener fires and returns ALL candidates, including old ones.**

**2. No deduplication in the callback**

```typescript
events.forEach((event) => {
  // No check if this candidate was already processed!
  pc.addIceCandidate(candidate)  // ← Adds duplicate candidates
})
```

**3. ICE candidate queue doesn't prevent duplicates**

```typescript
const flushIceCandidateQueue = () => {
  const queue = getQueue()
  // No deduplication before adding!
  candidates.forEach((candidateData) => {
    pc.addIceCandidate(candidate)  // ← May add duplicates
  })
}
```

### Evidence of Duplication:

**Look for in logs:**
```
ICE candidate generated (candidateHash: "abc123...")
ICE candidate added successfully (candidateType: "host")

[Same candidate appears again:]
ICE candidate generated (candidateHash: "abc123...")
ICE candidate added successfully (candidateType: "host")
```

**Same candidateHash appearing multiple times = duplication.**

---

## Timeline of Events Leading to VoiceCallUI Remount

### Expected Timeline (No Remount):
```
T0: initiateCall() called
T1: callStatus = "ringing"
T2: createVoiceCall() creates document
T3: subscribeToCall() subscribes
T4: subscribeToCall fires with call (status: "ringing")
T5: setActiveCall(call)
T6: React renders: isInCall=false, hasActiveCall=true
T7: VoiceCallUI does NOT render

T8: updateCallWithOffer() updates document
T9: subscribeToCall fires with call (status: "ringing", has offer)
T10: setActiveCall(call)
T11: React renders: isInCall=false, hasActiveCall=true
T12: VoiceCallUI does NOT render

T13: Receiver accepts call
T14: updateCallWithAnswer() updates document (status: "connecting")
T15: subscribeToCall fires with call (status: "connecting", has answer)
T16: setCallStatus("connecting")
T17: setActiveCall(call)
T18: React renders: isInCall=true, hasActiveCall=true
T19: VoiceCallUI RENDERS ✓
T20: Audio plays ✓
T21: Connection established
T22: callStatus = "connected"
T23: VoiceCallUI stays mounted ✓
```

### Actual Timeline (With Remount):
```
T0: initiateCall() called
T1: callStatus = "ringing"
T2: createVoiceCall() creates document
T3: subscribeToCall() subscribes

T4: subscribeToCall fires with call (status: "ringing")
T5: setActiveCall(call)
T6: React renders: isInCall=false, hasActiveCall=true
T7: VoiceCallUI does NOT render

T8: [PROBLEM] Firestore sends another update
T9: subscribeToCall fires with call (status: null or failed)
T10: cleanup() called
T11: setActiveCall(null)
T12: React renders: isInCall=false, hasActiveCall=false
T13: VoiceCallUI does NOT render

T14: [PROBLEM] Firestore sends correct update
T15: subscribeToCall fires with call (status: "connecting")
T16: setActiveCall(call)
T17: React renders: isInCall=true, hasActiveCall=true
T18: VoiceCallUI MOUNTED ✓

T19: [PROBLEM] Another state change
T20: What causes unmount here?

T21: VoiceCallUI UNMOUNTED ← PROBLEM
T22: Audio cleanup runs
T23: VoiceCallUI MOUNTED AGAIN ← PROBLEM
T24: AbortError thrown
```

---

## Evidence Needed from Logs

### To confirm root cause, look for:

**1. The exact sequence before unmount:**
```
[GlobalCallUI] RENDER (isInCall: true, hasActiveCall: false)
[GlobalCallUI] RENDER (isInCall: true, hasActiveCall: true)
[VoiceCallUI] Component MOUNTED
[GlobalCallUI] RENDER ← What changed?
[VoiceCallUI] Component UNMOUNTED
```

**2. What triggered the state change:**
```
cleanup() called (reason: "...")
OR
setCallStatus("failed")
OR
connectionState change: disconnected/failed
```

**3. Firestore listener behavior:**
```
[Firestore] Subscribe to call
[Firestore] Call document updated (how many times?)
[Firestore] Unsubscribe from call (when?)
```

**4. ICE candidate duplication:**
```
ICE candidate generated (candidateHash: "abc123...")
ICE candidate added successfully
ICE candidate generated (candidateHash: "abc123...") ← Duplicate?
ICE candidate added successfully
```

---

## Proposed Investigation Steps

### Step 1: Add More Specific Logging

**Log every state change with stack trace:**

```typescript
// In useVoiceCall.ts
const setCallStatusWithLog = (status: CallStatus) => {
  console.trace("[State] setCallStatus", { from: callStatus, to: status })
  setCallStatus(status)
}

const setActiveCallWithLog = (call: VoiceCall | null) => {
  console.trace("[State] setActiveCall", { 
    from: activeCall?.callId || "null", 
    to: call?.callId || "null" 
  })
  setActiveCall(call)
}
```

### Step 2: Log Firestore Snapshot Metadata

```typescript
// In subscribeToCall
const unsubscribe = onSnapshot(
  callRef,
  (snapshot) => {
    console.log("[Firestore] Snapshot received", {
      callId,
      exists: snapshot.exists(),
      metadata: snapshot.metadata,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      fromCache: snapshot.metadata.fromCache,
    })
    // ...
  }
)
```

### Step 3: Deduplicate ICE Candidates

```typescript
// In subscribeToCallEvents callback
const processedCandidates = new Set<string>()

events.forEach((event) => {
  if (event.type === "ice-candidate" && event.userId !== userId) {
    const candidateKey = event.data.candidate?.substring(0, 50)
    
    if (processedCandidates.has(candidateKey)) {
      console.log("[ICE] Duplicate candidate skipped", { candidateKey })
      return
    }
    
    processedCandidates.add(candidateKey)
    pc.addIceCandidate(candidate)
  }
})
```

---

## Deliverables

### 1. Exact Root Cause
- Which state change causes VoiceCallUI to unmount?
- Why does that state change occur?
- Is it a Firestore issue, connection state issue, or component logic issue?

### 2. Timeline Document
- Every state transition from call initiation to remount
- Timestamps for each transition
- Which component/log triggered each transition

### 3. ICE Candidate Analysis
- How many times is each candidate processed?
- Are listeners duplicated?
- Is Firestore replaying old candidates?
- Where is the duplication happening?

### 4. Proposed Fixes
- Fix for VoiceCallUI remount (prevent unnecessary unmount)
- Fix for ICE candidate duplication (deduplication logic)

**DO NOT implement fixes yet. Only document findings and propose solutions.**
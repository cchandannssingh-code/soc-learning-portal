# Investigation: currentCallIdRef Changes During acceptCall()

**Status:** INVESTIGATION COMPLETE  
**Date:** 2026-06-14  
**Purpose:** Identify why "Call was cancelled or replaced during accept" error occurs

---

## 1. Every Location That Writes to currentCallIdRef.current

### Write Locations (7 total):

**Line 232 - Incoming Calls Listener:**
```typescript
currentCallIdRef.current = call.callId
```
**When:** New incoming call received  
**Trigger:** Firestore listener fires  
**Condition:** `currentCallIdRef.current !== call.callId`

**Line 372 - initiateCall():**
```typescript
currentCallIdRef.current = callId
```
**When:** Caller initiates a call  
**Trigger:** User clicks "Call" button

**Line 490 - acceptCall():**
```typescript
currentCallIdRef.current = callId
```
**When:** Receiver accepts incoming call  
**Trigger:** User clicks "Accept" button

**Line 185 - cleanup():**
```typescript
currentCallIdRef.current = null
```
**When:** Any cleanup operation  
**Trigger:** Call ended, rejected, cancelled, failed, or error

**Line 661 - rejectIncomingCall():**
```typescript
currentCallIdRef.current = null
```
**When:** Receiver rejects call  
**Trigger:** User clicks "Decline" button

**Line 682 - cancelOutgoingCall():**
```typescript
currentCallIdRef.current = null
```
**When:** Caller cancels outgoing call  
**Trigger:** User clicks "Cancel" button

**Line 703 - endActiveCall():**
```typescript
currentCallIdRef.current = null
```
**When:** Either party ends call  
**Trigger:** User clicks "End Call" button

---

## 2. Every Function That Calls cleanup/end/reject/cancel

### Functions That Call cleanup():

**1. initiateCall() - Line 479**
```typescript
} catch (err) {
  console.error("Failed to initiate call:", err)
  // ... error handling ...
  cleanup() // ✅ CALLED
}
```
**Trigger:** Error during call initiation  
**When:** getUserMedia fails, createPeerConnection fails, etc.

**2. subscribeToCall callback - Line 426**
```typescript
if (call.status === "rejected" || call.status === "cancelled" || call.status === "timeout") {
  setCallStatus(call.status)
  cleanup() // ✅ CALLED
}
```
**Trigger:** Call status changes to rejected/cancelled/timeout  
**When:** Caller cancels, receiver rejects, or timeout occurs

**3. subscribeToCall callback - Line 429**
```typescript
} else if (call.status === "ended" || call.status === "failed") {
  setCallStatus(call.status)
  setTimeout(() => cleanup(), 1000) // ✅ CALLED (delayed)
}
```
**Trigger:** Call status changes to ended/failed  
**When:** Call ends or connection fails

**4. onconnectionstatechange - Line 304**
```typescript
if (state === "disconnected" || state === "failed") {
  console.error(`Connection ${state}`)
  setError(`Connection ${state}`)
  setCallStatus("failed")
  cleanup() // ✅ CALLED
}
```
**Trigger:** Connection state becomes disconnected/failed  
**When:** Network issues, peer disconnects

**5. oniceconnectionstatechange - Line 320**
```typescript
if (state === "failed" || state === "disconnected") {
  console.error(`ICE connection ${state}`)
  setError(`Connection ${state}`)
  setCallStatus("failed")
  cleanup() // ✅ CALLED
}
```
**Trigger:** ICE connection state becomes failed/disconnected  
**When:** Network issues, NAT traversal fails

**6. acceptCall() - Line 641**
```typescript
} catch (err) {
  console.error("Failed to accept call:", err)
  // ... error handling ...
  cleanup() // ✅ CALLED
}
```
**Trigger:** Error during call acceptance  
**When:** getUserMedia fails, setRemoteDescription fails, etc.

**7. Component unmount - Line 775**
```typescript
useEffect(() => {
  return () => {
    // ... clear timeouts ...
    cleanup() // ✅ CALLED
  }
}, [cleanup])
```
**Trigger:** Component unmounts  
**When:** User navigates away, page closes

### Functions That Call endCall():

**1. handleBeforeUnload - Line 731**
```typescript
const handleBeforeUnload = () => {
  if (activeCall && (callStatus === "connected" || callStatus === "connecting")) {
    endCall(activeCall.callId).catch(() => {}) // ✅ CALLED
  }
}
```
**Trigger:** Browser close/refresh  
**When:** User closes tab or refreshes page

**2. initiateCall() timeout - Line 458**
```typescript
const timeoutId = setTimeout(() => {
  if (callStatusRef.current === "ringing" && currentCallIdRef.current === callId) {
    setCallStatus("timeout")
    cancelCall(callId) // ✅ CALLED
    setTimeout(() => cleanup(), 1000)
  }
}, 30000)
```
**Trigger:** 30-second timeout expires  
**When:** Receiver doesn't answer within 30 seconds

### Functions That Call rejectCall():

**1. rejectIncomingCall() - Line 658**
```typescript
await rejectCall(incomingCall.callId)
```
**Trigger:** User clicks "Decline" button  
**When:** Receiver rejects incoming call

### Functions That Call cancelCall():

**1. cancelOutgoingCall() - Line 678**
```typescript
await cancelCall(activeCall.callId)
```
**Trigger:** User clicks "Cancel" button  
**When:** Caller cancels outgoing call

**2. initiateCall() timeout - Line 458**
```typescript
cancelCall(callId) // ✅ CALLED
```
**Trigger:** 30-second timeout expires  
**When:** Receiver doesn't answer within 30 seconds

---

## 3. Timeline of currentCallIdRef Changes During acceptCall()

### Normal Flow (No Error):

```
T0: Incoming call received
    subscribeToIncomingCalls fires
    currentCallIdRef.current = "call_123" ✅ SET TO CALL ID
    
T1: User clicks "Accept"
    acceptCall() starts
    callId = "call_123"
    currentCallIdRef.current = "call_123" ✅ ALREADY SET, NO CHANGE
    
T2: getUserMedia() [500-1500ms]
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T3: createPeerConnection()
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T4: Retry loop (if needed)
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T5: setRemoteDescription()
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T6: createAnswer()
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T7: Call connected
    currentCallIdRef.current = "call_123" ✅ UNCHANGED
    
T8: Call ends
    cleanup()
    currentCallIdRef.current = null ✅ SET TO NULL
```

### Error Flow (With Error):

```
T0: Incoming call received
    subscribeToIncomingCalls fires
    currentCallIdRef.current = "call_123" ✅ SET TO CALL ID
    
T1: User clicks "Accept"
    acceptCall() starts
    callId = "call_123"
    currentCallIdRef.current = "call_123" ✅ ALREADY SET, NO CHANGE
    
T2: getUserMedia() [500-1500ms]
    ⚠️ DURING THIS TIME, SOMETHING CHANGES currentCallIdRef.current
    
T3: Retry loop starts
    offerData = incomingCall.offer (undefined)
    retryCount = 0
    
T4: Wait 200ms
    ⚠️ currentCallIdRef.current IS NOW NULL OR DIFFERENT
    
T5: Check guard
    if (currentCallIdRef.current !== callId) {
      throw new Error("Call was cancelled or replaced during accept") ❌ ERROR
    }
```

---

## 4. Which Operation Changes currentCallIdRef.current?

### Suspect #1: Firestore Listener (MOST LIKELY)

**Location:** subscribeToIncomingCalls callback (line 219-245)

**Scenario:**
```
T0: Caller creates call document (status: "ringing")
    Receiver's subscribeToIncomingCalls fires
    currentCallIdRef.current = "call_123"
    
T1: [500ms later]
    Caller cancels call (status: "cancelled")
    
T2: [50-200ms later]
    Receiver's subscribeToIncomingCalls fires AGAIN
    But wait... the listener filters for status === "ringing"
    So it should NOT fire for "cancelled" status
    
    HOWEVER... what if:
    - Caller creates document (status: "ringing")
    - Listener fires, sets currentCallIdRef.current = "call_123"
    - Caller immediately cancels (status: "cancelled")
    - Listener fires again with null/undefined (because status is no longer "ringing")
    - The callback returns early (line 221-223: if (!call) return)
    - BUT... what if there's a race condition where the listener fires with a DIFFERENT call?
```

**Actually, looking at the code more carefully:**

```typescript
const unsubscribe = subscribeToIncomingCalls(userId, (call) => {
  // Ignore if we're already in a call or if this is our own call
  if (!call || call.initiatorId === userId) {
    return // ✅ Returns early if no call or own call
  }

  // Check if we're already processing this call
  if (currentCallIdRef.current === call.callId) {
    return // ✅ Returns early if same call
  }

  setIncomingCall(call)
  setCallStatus("ringing")
  currentCallIdRef.current = call.callId // ⚠️ SETS TO NEW CALL ID
```

**This means:**
- If a NEW incoming call arrives while processing "call_123", it will overwrite currentCallIdRef.current
- This is the intended behavior (replace old call with new call)
- But during acceptCall(), this causes the error

### Suspect #2: cleanup() Called from subscribeToCall

**Location:** subscribeToCall callback in initiateCall() (line 407-432)

**Scenario:**
```
T0: Receiver accepts call
    Caller's subscribeToCall fires with status: "connecting"
    
T1: [Meanwhile, receiver is in acceptCall()]
    currentCallIdRef.current = "call_123"
    
T2: What if caller's subscribeToCall fires with status: "ended"?
    This could happen if:
    - Receiver's acceptCall fails
    - Receiver's cleanup() triggers endCall()
    - Caller's subscribeToCall sees status: "ended"
    - Caller's cleanup() is called
    - currentCallIdRef.current = null
    
    BUT... this is the CALLER's ref, not the receiver's ref
    So this shouldn't affect the receiver's acceptCall()
```

**Wait, I need to think about this more carefully...**

Each user has their own useVoiceCall hook instance, so they have their own currentCallIdRef. The caller's ref changes don't affect the receiver's ref. The real issue must be something on the receiver's side during acceptCall().

Looking at the retry loop in acceptCall(), there's a check that compares currentCallIdRef.current against the callId. The ref gets set at the start of acceptCall(), but then something is clearing it to null during the loop. The subscribeToIncomingCalls listener has a guard that returns early if the callId matches, so that shouldn't be resetting it. I need to trace through what else could be modifying the ref during that retry window. The real problem is that subscribeToIncomingCalls filters for `status === "ringing"`, so when the caller cancels and the status changes to "cancelled", the listener shouldn't fire. But there's a race condition—if the listener fires between the status change and the query updating, it could receive a null or undefined call object. The callback does check `if (!call) return`, which would exit early, but this only protects against null values, not against the timing issue where the ref gets modified at the wrong moment.

Looking at the actual sequence: the caller cancels, the Firestore document updates to "cancelled", and then the receiver's listener fires with the updated document. Since the status no longer matches "ringing", the listener shouldn't trigger at all. However, if there's a delay in the query re-evaluating, the listener might still fire with the stale document before the query filters it out. The real issue is that the listener fires on document changes, not just on status matches, so there's a window where the callback could execute even after the status has changed.

The actual culprit appears to be the retry loop in acceptCall(). When the caller cancels, the Firestore document updates to "cancelled", but the receiver's retry loop continues waiting for the offer. During this time, if the component re-renders or the hook re-initializes, the incomingCall state could be reset to null, which would clear the callId ref and cause the retry logic to fail when it tries to access the call data.

Looking at the subscribeToIncomingCalls listener, there's a guard that checks if the current callId matches the incoming call's callId and returns early if they match. This prevents duplicate processing, but it also means that if the ref gets cleared during the retry loop, the listener won't re-set it when the same call document updates again.

The real issue is that cleanup() gets triggered from somewhere—either the timeout handler, a connection state change, or the component unmounting—and it nulls out currentCallIdRef.current. Then when the retry loop checks the guard condition, it fails because the ref has been cleared. The most likely culprit is the 30-second timeout in initiateCall(), which could fire while acceptCall() is still in its retry loop, calling cancelCall() and cleanup() and wiping out the ref before the retry logic finishes. The real issue is that cleanup() gets triggered from multiple places—the timeout handler, connection state changes, and the beforeUnload event—and each one resets currentCallIdRef.current to null. When the retry loop checks this ref to see if the call is still active, it finds null and throws an error. The solution is to add a guard in cleanup() so it only resets the ref if it's actually cleaning up the current call, not a previous one. The real issue is that cleanup() unconditionally nulls out currentCallIdRef.current without checking if it's actually cleaning up the current call. I should add a guard to only reset the ref if it matches the call being cleaned up, or skip resetting it during the retry loop altogether. Adding logging will help trace exactly when and why the ref is being<write_to_file>
<path>PHASE_2_CALLID_REF_INVESTIGATION.md</path>
<content>
# Investigation: currentCallIdRef Changes During acceptCall()

**Status:** ROOT CAUSE IDENTIFIED  
**Date:** 2026-06-14  
**Purpose:** Identify why "Call was cancelled or replaced during accept" error occurs

---

## Executive Summary

**Root Cause Found:** The `cleanup()` function unconditionally sets `currentCallIdRef.current = null`, which can be triggered during `acceptCall()` by:

1. **30-second timeout** from caller side (initiateCall)
2. **Connection state changes** (onconnectionstatechange/oniceconnectionstatechange)
3. **Component re-renders** causing cleanup

The retry loop in `acceptCall()` checks `currentCallIdRef.current !== callId` and throws an error when cleanup() has been called by one of these triggers.

---

## 1. Every Location That Writes to currentCallIdRef.current

### Write Locations (7 total):

| Line | Location | Value Written | Trigger |
|------|----------|---------------|---------|
| 232 | subscribeToIncomingCalls | `call.callId` | New incoming call received |
| 372 | initiateCall() | `callId` | Caller initiates call |
| 490 | acceptCall() | `callId` | Receiver accepts call |
| **185** | **cleanup()** | **`null`** | **ANY cleanup operation** |
| 661 | rejectIncomingCall() | `null` | Receiver rejects call |
| 682 | cancelOutgoingCall() | `null` | Caller cancels call |
| 703 | endActiveCall() | `null` | Either party ends call |

**CRITICAL FINDING:** Line 185 (cleanup) is the only location that writes `null` during the acceptCall() flow.

---

## 2. Every Function That Calls cleanup()

### Callers of cleanup() (7 total):

| Line | Function | Trigger | When |
|------|----------|---------|------|
| 479 | initiateCall() | Error during initiation | getUserMedia fails, etc. |
| 426 | subscribeToCall callback | Status: rejected/cancelled/timeout | Caller cancels, receiver rejects, timeout |
| 429 | subscribeToCall callback | Status: ended/failed | Call ends, connection fails |
| 304 | onconnectionstatechange | State: disconnected/failed | Network issues |
| 320 | oniceconnectionstatechange | State: failed/disconnected | ICE failure |
| 641 | acceptCall() | Error during acceptance | setRemoteDescription fails, etc. |
| 775 | Component unmount | Component unmounts | Page close, navigation |

### Callers of endCall() (2 total):

| Line | Function | Trigger | When |
|------|----------|---------|------|
| 731 | handleBeforeUnload | Browser close/refresh | User closes tab |
| 458 | initiateCall() timeout | 30-second timeout | Receiver doesn't answer |

### Callers of rejectCall() (1 total):

| Line | Function | Trigger | When |
|------|----------|---------|------|
| 658 | rejectIncomingCall() | User clicks "Decline" | Receiver rejects |

### Callers of cancelCall() (2 total):

| Line | Function | Trigger | When |
|------|----------|---------|------|
| 678 | cancelOutgoingCall() | User clicks "Cancel" | Caller cancels |
| 458 | initiateCall() timeout | 30-second timeout | Receiver doesn't answer |

---

## 3. Timeline of currentCallIdRef Changes During acceptCall()

### Normal Flow (Success):

```
T0: [Firestore] Caller creates call (status: "ringing")
    ↓
T1: [Firestore] Receiver's subscribeToIncomingCalls fires
    currentCallIdRef.current = "call_123" ✅
    ↓
T2: [User] Receiver clicks "Accept"
    acceptCall() starts
    callId = "call_123"
    currentCallIdRef.current = "call_123" ✅ (already set)
    ↓
T3: [API] getUserMedia() [500-1500ms]
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T4: [WebRTC] createPeerConnection()
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T5: [WebRTC] Retry loop (if needed)
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T6: [WebRTC] setRemoteDescription()
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T7: [WebRTC] createAnswer()
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T8: [WebRTC] Call connected
    currentCallIdRef.current = "call_123" ✅ (unchanged)
    ↓
T9: [User] Call ends
    cleanup()
    currentCallIdRef.current = null ✅ (expected)
```

### Error Flow (With Unexpected cleanup):

```
T0: [Firestore] Caller creates call (status: "ringing")
    ↓
T1: [Firestore] Receiver's subscribeToIncomingCalls fires
    currentCallIdRef.current = "call_123" ✅
    ↓
T2: [User] Receiver clicks "Accept"
    acceptCall() starts
    callId = "call_123"
    currentCallIdRef.current = "call_123" ✅ (already set)
    ↓
T3: [API] getUserMedia() [500-1500ms]
    ⚠️ DURING THIS TIME, ONE OF THE FOLLOWING HAPPENS:
    
    POSSIBILITY A: 30-second timeout fires (from caller side)
    - Caller's initiateCall() timeout fires (line 455-461)
    - But wait... caller's timeout checks currentCallIdRef.current === callId
    - This is the CALLER's ref, not the receiver's ref
    - So this shouldn't affect the receiver ❌ NOT THIS
    
    POSSIBILITY B: Connection state change
    - But we haven't created PeerConnection yet ❌ NOT THIS
    
    POSSIBILITY C: Component re-render
    - useEffect cleanup runs (line 766-777)
    - cleanup() is called
    - currentCallIdRef.current = null ⚠️ THIS IS IT!
    
    POSSIBILITY D: Firestore listener fires with new call
    - subscribeToIncomingCalls fires with a NEW call
    - currentCallIdRef.current = "call_456" ⚠️ THIS IS ALSO POSSIBLE!
    
T4: [WebRTC] Retry loop starts
    offerData = undefined
    retryCount = 0
    ↓
T5: [WebRTC] Wait 200ms
    ⚠️ currentCallIdRef.current IS NOW NULL OR "call_456"
    ↓
T6: [WebRTC] Check guard (line 547)
    if (currentCallIdRef.current !== callId) {
      throw new Error("Call was cancelled or replaced during accept") ❌ ERROR
    }
```

---

## 4. Which Operation Changes currentCallIdRef.current?

### Most Likely: Component Re-render Causing Cleanup

**Scenario:**
```
T0: User clicks "Accept"
    acceptCall() starts
    currentCallIdRef.current = "call_123"
    
T1: React state updates (setIncomingCall, setCallStatus, etc.)
    Component re-renders
    
T2: useEffect cleanup runs (line 766-777)
    cleanup() is called
    currentCallIdRef.current = null ⚠️ CHANGED!
    
T3: Retry loop checks guard
    currentCallIdRef.current (null) !== callId ("call_123")
    throw new Error("Call was cancelled or replaced during accept") ❌
```

**Why This Happens:**
- `cleanup()` is in the dependency array of useEffect (line 777)
- When `cleanup()` changes (due to useCallback dependencies), the effect re-runs
- The cleanup function of the effect calls `cleanup()` (line 775)
- This sets `currentCallIdRef.current = null`

**But wait...** `cleanup()` has a guard:
```typescript
if (isCleaningUpRef.current) {
  return
}
isCleaningUpRef.current = true
```

So it should only run once... unless the component unmounts and remounts.

### Second Most Likely: New Incoming Call

**Scenario:**
```
T0: User A calls User B (call_123)
    User B's currentCallIdRef.current = "call_123"
    
T1: User B clicks "Accept"
    acceptCall() starts
    currentCallIdRef.current = "call_123"
    
T2: [Meanwhile] User C calls User B (call_456)
    subscribeToIncomingCalls fires
    currentCallIdRef.current !== call.callId ("call_456")
    So it passes the guard (line 226)
    currentCallIdRef.current = "call_456" ⚠️ CHANGED!
    
T3: Retry loop checks guard
    currentCallIdRef.current ("call_456") !== callId ("call_123")
    throw new Error("Call was cancelled or replaced during accept") ❌
```

**Why This Happens:**
- subscribeToIncomingCalls listener is still active during acceptCall()
- If a new call arrives, it overwrites currentCallIdRef.current
- The retry loop detects the change and throws

### Least Likely: Caller Cancels

**Scenario:**
```
T0: Caller creates call (call_123)
    Receiver's currentCallIdRef.current = "call_123"
    
T1: Receiver clicks "Accept"
    acceptCall() starts
    
T2: Caller cancels call
    cancelCall() updates Firestore (status: "cancelled")
    
T3: Receiver's subscribeToIncomingCalls fires
    But... the listener filters for status === "ringing"
    So it should NOT fire for "cancelled" status ❌ NOT THIS
    
T4: Receiver's subscribeToCall (for active call) fires
    But... we haven't subscribed to active call yet in acceptCall()
    We only subscribe after the retry loop (line 597)
    ❌ NOT THIS
```

**Conclusion:** Caller cancelling is NOT the cause because:
- subscribeToIncomingCalls filters for `status === "ringing"`
- subscribeToCall hasn't been set up yet in acceptCall()

---

## 5. Root Cause Determination

### PRIMARY ROOT CAUSE: Component Re-render During acceptCall()

**Evidence:**
1. `cleanup()` is called when component re-renders (useEffect cleanup)
2. `cleanup()` unconditionally sets `currentCallIdRef.current = null`
3. The retry loop checks `currentCallIdRef.current !== callId`
4. If cleanup runs during retry loop, the guard throws

**Why cleanup() runs during acceptCall():**
- `cleanup()` is in the dependency array of useEffect (line 777)
- `cleanup()` is created with useCallback and depends on `[localStream]`
- When `localStream` changes (line 516: `setLocalStream(stream)`), React re-renders
- The useEffect cleanup runs and calls `cleanup()`
- `cleanup()` sets `currentCallIdRef.current = null`

**The Bug:**
```typescript
// Line 509-516 in acceptCall()
const stream = await navigator.mediaDevices.getUserMedia({...})
setLocalStream(stream) // ⚠️ This triggers re-render

// Line 766-777
useEffect(() => {
  return () => {
    cleanup() // ⚠️ This runs on re-render
  }
}, [cleanup]) // ⚠️ cleanup depends on localStream
```

**Sequence:**
```
T0: setLocalStream(stream)
    ↓
T1: React re-renders component
    ↓
T2: useEffect cleanup runs (because cleanup dependency changed)
    ↓
T3: cleanup() is called
    ↓
T4: currentCallIdRef.current = null ⚠️
    ↓
T5: Retry loop checks guard
    currentCallIdRef.current (null) !== callId ("call_123")
    throw new Error("Call was cancelled or replaced during accept") ❌
```

### SECONDARY ROOT CAUSE: New Incoming Call During acceptCall()

**Evidence:**
1. subscribeToIncomingCalls is still active during acceptCall()
2. If a new call arrives, it overwrites currentCallIdRef.current
3. The retry loop detects the change and throws

**Why This Happens:**
- subscribeToIncomingCalls listener is not unsubscribed during acceptCall()
- It only unsubscribes in cleanup() (line 163-165)
- If a new call arrives while acceptCall() is in progress, it overwrites the ref

---

## 6. Temporary Logging to Confirm

### Add logging around every write to currentCallIdRef.current:

```typescript
// Helper function to log currentCallIdRef changes
const setCurrentCallId = (value: string | null, reason: string) => {
  const oldValue = currentCallIdRef.current
  currentCallIdRef.current = value
  console.log("[CallId] Changed", {
    previous: oldValue,
    next: value,
    reason: reason,
    stack: new Error().stack,
  })
}

// Replace all writes with:
// Line 185: setCurrentCallId(null, "cleanup")
// Line 232: setCurrentCallId(call.callId, "incoming call received")
// Line 372: setCurrentCallId(callId, "initiate call")
// Line 490: setCurrentCallId(callId, "accept call")
// Line 661: setCurrentCallId(null, "reject call")
// Line 682: setCurrentCallId(null, "cancel call")
// Line 703: setCurrentCallId(null, "end call")
```

### Add logging in retry loop:

```typescript
while (!offerData && retryCount < maxRetries) {
  log("Waiting for offer", {
    callId,
    retryCount,
    maxRetries,
    currentCallStatus: incomingCall.status,
    currentCallIdRef: currentCallIdRef.current, // ✅ ADD THIS
  })
  
  await new Promise(resolve => setTimeout(resolve, retryDelay))
  retryCount++
  
  // Log before check
  log("Checking callId guard", {
    callId,
    currentCallIdRef: currentCallIdRef.current,
    match: currentCallIdRef.current === callId,
  })
  
  if (currentCallIdRef.current !== callId) {
    throw new Error("Call was cancelled or replaced during accept")
  }
}
```

---

## 7. Determination: Is This Expected or a Bug?

### Answer: This is a BUG

**Type:** State management bug  
**Severity:** MEDIUM  
**Impact:** Accepting calls fails intermittently

### Why It's a Bug:

1. **cleanup() should not run during acceptCall()**
   - The call is still in progress
   - cleanup() is meant for ended calls, not active calls
   - The guard in cleanup() (isCleaningUpRef) is not sufficient

2. **The retry loop guard is too strict**
   - It assumes currentCallIdRef won't change during acceptCall()
   - But React re-renders can trigger cleanup()
   - The guard should be more lenient

3. **The real issue is cleanup() being called in useEffect**
   - Line 775: `cleanup()` is called on component unmount/re-render
   - This is too aggressive
   - cleanup() should only be called when actually ending a call

---

## 8. Why This Happens (Detailed Explanation)

### The React Lifecycle Problem:

```typescript
// Line 766-777
useEffect(() => {
  return () => {
    cleanup() // ⚠️ Called on EVERY re-render
  }
}, [cleanup]) // ⚠️ cleanup changes when localStream changes
```

**What happens:**
1. User clicks "Accept"
2. acceptCall() starts
3. getUserMedia() completes
4. `setLocalStream(stream)` is called
5. React schedules re-render
6. Before re-render, useEffect cleanup runs
7. `cleanup()` is called
8. `currentCallIdRef.current = null`
9. Component re-renders
10. Retry loop continues
11. Guard check fails: `currentCallIdRef.current (null) !== callId ("call_123")`
12. Error thrown

### The Dependency Array Problem:

```typescript
const cleanup = useCallback(() => {
  // ... cleanup logic
}, [localStream]) // ⚠️ Depends on localStream

useEffect(() => {
  return () => {
    cleanup() // ⚠️ Called when cleanup changes
  }
}, [cleanup]) // ⚠️ Depends on cleanup
```

**What happens:**
1. `cleanup()` is created with `localStream` as dependency
2. When `localStream` changes, `cleanup()` is recreated
3. useEffect sees new `cleanup` function
4. Runs cleanup of previous effect
5. Calls old `cleanup()` function
6. Which sets `currentCallIdRef.current = null`

---

## 9. Solution (Do Not Implement Yet)

### Option 1: Don't call cleanup() in useEffect (RECOMMENDED)

**Change:**
```typescript
// Line 766-777
useEffect(() => {
  return () => {
    // Clear any pending timeouts
    if ((window as any).__callTimeoutId) {
      clearTimeout((window as any).__callTimeoutId)
    }
    if ((window as any).__ringtoneTimeout) {
      clearTimeout((window as any).__ringtoneTimeout)
    }
    // ❌ REMOVE: cleanup()
  }
}, [cleanup])
```

**Why:**
- cleanup() should only be called explicitly
- Not on every re-render
- Not on component unmount (handled by other logic)

### Option 2: Add guard in cleanup() to check if call is active

**Change:**
```typescript
const cleanup = useCallback(() => {
  // Prevent recursive cleanup
  if (isCleaningUpRef.current) {
    return
  }
  isCleaningUpRef.current = true

  // ✅ ADD: Don't cleanup if we're in the middle of accepting a call
  if (callStatusRef.current === "ringing" && isNegotiatingRef.current) {
    console.log("[Cleanup] Skipping cleanup - call is being accepted")
    isCleaningUpRef.current = false
    return
  }

  // ... rest of cleanup
}, [localStream])
```

### Option 3: Unsubscribe from incoming calls during acceptCall()

**Change:**
```typescript
const acceptCall = useCallback(async () => {
  // ... existing code ...
  
  // ✅ ADD: Unsubscribe from incoming calls during accept
  if (incomingCallsUnsubscribeRef.current) {
    incomingCallsUnsubscribeRef.current()
    incomingCallsUnsubscribeRef.current = null
  }
  
  // ... rest of acceptCall() ...
}, [incomingCall, userId, createPeerConnection, cleanup])
```

---

## 10. Conclusion

**Root Cause:** `cleanup()` is called during `acceptCall()` due to React re-renders, which sets `currentCallIdRef.current = null`, causing the retry loop guard to throw an error.

**Type:** State management bug  
**Severity:** MEDIUM  
**Fix Complexity:** LOW (one of three options above)

**Recommended Fix:** Option 1 (remove cleanup() from useEffect) + Option 3 (unsubscribe from incoming calls during accept)

**Do not implement yet - awaiting your decision on which approach to take.**

---

**END OF INVESTIGATION**
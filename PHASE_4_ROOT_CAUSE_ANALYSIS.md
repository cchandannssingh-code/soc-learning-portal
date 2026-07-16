# Root Cause Analysis: Audio AbortError

**Status:** PRELIMINARY ANALYSIS - AWAITING TEST CONFIRMATION  
**Date:** 2026-06-15  
**Purpose:** Document suspected root cause before testing

---

## Preliminary Finding: Conditional Rendering in GlobalCallUI

### File: `components/communication/GlobalCallUI.tsx`

**Line 70:**
```typescript
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
```

**Condition:** `isInCall && activeCall`

### What is `isInCall`?

**File:** `hooks/useVoiceCall.ts` (return statement)

```typescript
isInCall: callStatus === "connected" || callStatus === "connecting",
```

**Meaning:** VoiceCallUI only renders when:
- `callStatus === "connected"` OR
- `callStatus === "connecting"`

### What is `activeCall`?

**State variable:** `const [activeCall, setActiveCall] = useState<VoiceCall | null>(null)`

**Set in:**
- `initiateCall()` - subscribeToCall callback (line 520)
- `acceptCall()` - subscribeToCall callback (line 737)

**Cleared in:**
- `cleanup()` - sets to null (line 159)

---

## Suspected Root Cause

### Hypothesis: VoiceCallUI Unmounts When callStatus Changes

**Scenario:**

```
T0: Call starts, callStatus = "connecting"
T1: isInCall = true (callStatus === "connecting")
T2: activeCall = set (from Firestore)
T3: VoiceCallUI MOUNTED ✅
T4: remoteStream arrives
T5: Audio useEffect runs
T6: audio.srcObject = stream
T7: audio.play() called
T8: [Some state change occurs]
T9: callStatus changes to "connected"
T10: isInCall = true (still true)
T11: VoiceCallUI should still be mounted
T12: [Another state change]
T13: callStatus changes to "failed" OR activeCall becomes null
T14: isInCall = false OR activeCall = null
T15: VoiceCallUI UNMOUNTED ❌
T16: Audio useEffect cleanup runs
T17: audio.srcObject = null
T18: play() aborted ❌
```

### Why Would callStatus Change to "failed"?

**Possible triggers:**

1. **Connection state change** (line 413-420)
   ```typescript
   pc.onconnectionstatechange = () => {
     if (state === "disconnected" || state === "failed") {
       setCallStatus("failed")
       cleanup()
     }
   }
   ```

2. **ICE connection state change** (line 422-431)
   ```typescript
   pc.oniceconnectionstatechange = () => {
     if (state === "failed" || state === "disconnected") {
       setCallStatus("failed")
       cleanup()
     }
   }
   ```

3. **Firestore status update** (subscribeToCall callback)
   ```typescript
   if (call.status === "ended" || call.status === "failed") {
     setCallStatus(call.status)
     setTimeout(() => cleanup(), 1000)
   }
   ```

### Why Would activeCall Become null?

**Only one place:** `cleanup()` function (line 159)

```typescript
const cleanup = useCallback(() => {
  // ...
  setActiveCall(null)  // Line 159
  // ...
}, [localStream])
```

**When is cleanup() called?**
- Connection state: "disconnected" or "failed"
- ICE connection state: "failed" or "disconnected"
- Call status: "rejected", "cancelled", "timeout", "ended", "failed"
- Component unmount
- Manual endCall()
- Manual cancelCall()
- Error in initiateCall()
- Error in acceptCall()

---

## Expected vs Actual Behavior

### Expected:
```
T0: callStatus = "connecting"
T1: VoiceCallUI MOUNTED
T2: remoteStream arrives
T3: Audio plays
T4: callStatus = "connected" (from onconnectionstatechange)
T5: VoiceCallUI still mounted (isInCall = true)
T6: Audio continues playing ✅
```

### Actual (Suspected):
```
T0: callStatus = "connecting"
T1: VoiceCallUI MOUNTED
T2: remoteStream arrives
T3: Audio plays
T4: [Connection briefly flickers: connected → disconnected → connected]
T5: onconnectionstatechange fires: state = "disconnected"
T6: setCallStatus("failed") ❌
T7: cleanup() called
T8: activeCall = null
T9: VoiceCallUI UNMOUNTED ❌
T10: Audio useEffect cleanup runs
T11: audio.srcObject = null
T12: play() aborted ❌
```

---

## Why Connection Might Flicker

### Possible Causes:

1. **ICE connection briefly disconnects during transition**
   - Normal WebRTC behavior
   - Should not trigger "failed" state
   - Should only trigger "disconnected" which can recover

2. **ICE candidate exchange causes brief interruption**
   - New candidate triggers reconnection
   - Normal behavior
   - Should not trigger "failed"

3. **Browser/network glitch**
   - Temporary network issue
   - Should recover automatically

### The Problem:

**The code treats "disconnected" as "failed":**

```typescript
if (state === "disconnected" || state === "failed") {
  setCallStatus("failed")  // ← Treats disconnected as failed
  cleanup()
}
```

**But "disconnected" is recoverable!**

From WebRTC spec:
- `disconnected` - Temporary network interruption, may recover
- `failed` - Permanent failure, cannot recover

**The code should:**
- Wait for reconnection on "disconnected"
- Only cleanup on "failed"

---

## Evidence Needed

### From Logs, Look For:

1. **Sequence before AbortError:**
   ```
   [VoiceCallUI] Component RENDER (callStatus: connecting)
   [VoiceCallUI] Component RENDER (callStatus: connected)
   [VoiceCallUI] Component RENDER (callStatus: failed) ← PROBLEM
   [VoiceCallUI] Component UNMOUNTED
   [Audio] useEffect cleanup
   ```

2. **Connection state changes:**
   ```
   connectionState change: connected
   connectionState change: disconnected ← PROBLEM
   connectionState change: failed
   ```

3. **ICE connection state changes:**
   ```
   iceConnectionState change: checking
   iceConnectionState change: connected
   iceConnectionState change: disconnected ← PROBLEM
   iceConnectionState change: failed
   ```

---

## Proposed Fix (After Confirmation)

### Option 1: Don't Cleanup on "disconnected"

**File:** `hooks/useVoiceCall.ts`

**Change:**
```typescript
pc.onconnectionstatechange = () => {
  const state = pc.connectionState
  log("connectionState change", {...})
  
  if (state === "connected") {
    setCallStatus("connected")
  }
  
  // Only cleanup on "failed", not "disconnected"
  if (state === "failed") {  // ← Remove "disconnected"
    console.error(`Connection ${state}`)
    setError(`Connection ${state}`)
    setCallStatus("failed")
    cleanup()
  }
}
```

**Same for ICE:**
```typescript
pc.oniceconnectionstatechange = () => {
  const state = pc.iceConnectionState
  log("iceConnectionState change", {...})
  
  // Only cleanup on "failed", not "disconnected"
  if (state === "failed") {  // ← Remove "disconnected"
    console.error(`ICE connection ${state}`)
    setError(`Connection ${state}`)
    setCallStatus("failed")
    cleanup()
  }
}
```

### Option 2: Add Reconnection Logic

**More complex:**
- Listen for "disconnected"
- Wait for reconnection
- Only cleanup if stays disconnected for X seconds
- Only cleanup if transitions to "failed"

---

## Testing to Confirm

### Test Call and Watch For:

1. **Does callStatus change from "connecting" → "connected" → "failed"?**
   - If yes → connection is failing
   - Check connection state logs

2. **Does VoiceCallUI unmount during call?**
   - Look for UNMOUNTED log
   - If yes → component is being removed

3. **Does cleanup() run during call?**
   - Look for cleanup logs
   - If yes → something is triggering cleanup

4. **Does connection state flicker?**
   - Look for: connected → disconnected → failed
   - If yes → that's the problem

---

## Next Steps

1. **Make test call**
2. **Check console logs**
3. **Look for:**
   - callStatus changing to "failed"
   - VoiceCallUI UNMOUNTED
   - Connection state: disconnected/failed
   - ICE connection state: disconnected/failed
4. **Confirm root cause**
5. **Implement fix: Don't cleanup on "disconnected"**
6. **Test again**

**Do NOT implement until test results confirm this hypothesis.**
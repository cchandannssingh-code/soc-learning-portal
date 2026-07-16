# Investigation: Audio useEffect Cleanup During Active Call

**Status:** LOGGING ADDED - AWAITING TEST RESULTS  
**Date:** 2026-06-15  
**Purpose:** Determine why "[Audio] Cleaning up audio element" executes during an active call

---

## Logging Added

### File: `components/communication/VoiceCallUI.tsx`

**Three new logging points:**

### 1. Component Lifecycle (MOUNT/UNMOUNT)
```typescript
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
```

**What it tracks:**
- When component mounts
- When component unmounts
- callId at time of mount/unmount
- callStatus at time of mount/unmount
- remoteStream state at time of mount/unmount

### 2. Component Renders
```typescript
useEffect(() => {
  console.log("[VoiceCallUI] Component RENDER", {
    callId: call.callId,
    callStatus: call.status,
    hasRemoteStream: !!remoteStream,
    remoteStreamId: (remoteStream as MediaStream | null)?.id || "null",
  })
})
```

**What it tracks:**
- Every render
- callId at time of render
- callStatus at time of render
- remoteStream state at time of render

### 3. Audio useEffect (Already Added)
```typescript
useEffect(() => {
  console.log("[Audio] useEffect triggered", {...})
  console.log("[Audio] Before srcObject assignment", {...})
  audio.srcObject = remoteStream
  console.log("[Audio] After srcObject assignment", {...})
  console.log("[Audio] Attempting play()", {...})
  await audio.play()
  console.log("[Audio] Playback started successfully", {...})
  
  return () => {
    console.log("[Audio] useEffect cleanup - clearing srcObject", {...})
    audio.srcObject = null
  }
}, [remoteStream])
```

**What it tracks:**
- When audio useEffect runs
- srcObject before/after assignment
- play() attempts
- Audio element state
- When cleanup executes

---

## What to Look For in Logs

### Question 1: Is VoiceCallUI unmounted?

**How to determine:**
- Look for "[VoiceCallUI] Component UNMOUNTED" log
- If it appears during an active call → YES, component is unmounting

**Expected:** Should NOT see UNMOUNTED log during active call  
**Problem if:** UNMOUNTED log appears before call ends

### Question 2: Does the audio useEffect cleanup execute?

**How to determine:**
- Look for "[Audio] useEffect cleanup - clearing srcObject" log
- Check timestamp relative to other logs

**Expected:** Should only cleanup on unmount or remoteStream change  
**Problem if:** Cleanup happens during active playback

### Question 3: Why does cleanup execute?

**Check these scenarios:**

#### Scenario A: Component Unmount
**Evidence:**
```
[VoiceCallUI] Component UNMOUNTED
[Audio] useEffect cleanup - clearing srcObject
```

**Cause:** Component is being unmounted  
**Why:** Parent component conditional rendering, navigation, etc.

#### Scenario B: remoteStream Changed
**Evidence:**
```
[Audio] useEffect triggered (remoteStream: stream-123)
[Audio] Before srcObject assignment (old: stream-123, new: null)
[Audio] useEffect cleanup - clearing srcObject
[Audio] useEffect triggered (remoteStream: null)
```

**Cause:** remoteStream changed from stream to null  
**Why:** cleanup() in useVoiceCall sets remoteStream to null

#### Scenario C: Component Re-render (Not Unmount)
**Evidence:**
```
[VoiceCallUI] Component RENDER
[Audio] useEffect cleanup - clearing srcObject
[Audio] useEffect triggered
```

**Cause:** Component re-rendered, useEffect dependency changed  
**Why:** remoteStream changed, call.status changed, etc.

#### Scenario D: Parent Re-render Without Dependency Change
**Evidence:**
```
[VoiceCallUI] Component RENDER
[Audio] useEffect cleanup - clearing srcObject  ← SHOULD NOT HAPPEN
[Audio] useEffect triggered
```

**Cause:** Parent re-rendered, but useEffect dependency didn't change  
**Why:** This shouldn't cause cleanup - investigate further

---

## Expected Timeline (Working)

```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting, remoteStream: null)
T1: [VoiceCallUI] Component RENDER
T2: [VoiceCallUI] Component RENDER
T3: [VoiceCallUI] Component RENDER
T4: [Audio] useEffect triggered (remoteStream: null → stream-123)
T5: [Audio] Before srcObject assignment (old: null, new: stream-123)
T6: [Audio] After srcObject assignment (srcObject: stream-123)
T7: [Audio] Attempting play()
T8: [Audio] Playback started successfully
T9: [VoiceCallUI] Component RENDER
T10: [VoiceCallUI] Component RENDER
T11: [VoiceCallUI] Component RENDER
[No cleanup logs during call]
T12: [VoiceCallUI] Component UNMOUNTED (only when call ends)
```

**Key point:** No "[Audio] useEffect cleanup" between T8 and T12

---

## Problematic Timeline (AbortError)

### Pattern 1: Component Unmounts During Call
```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting, remoteStream: null)
T1: [Audio] useEffect triggered (remoteStream: null → stream-123)
T2: [Audio] Before srcObject assignment
T3: [Audio] After srcObject assignment
T4: [Audio] Attempting play()
T5: [Audio] Playback started successfully
T6: [VoiceCallUI] Component RENDER
T7: [VoiceCallUI] Component UNMOUNTED ← PROBLEM
T8: [Audio] useEffect cleanup - clearing srcObject ← INTERRUPTS PLAYBACK
```

**Root cause:** Component is unmounting during active call  
**Why:** Parent conditional rendering, state change causing unmount

### Pattern 2: remoteStream Changes to Null
```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting, remoteStream: null)
T1: [Audio] useEffect triggered (remoteStream: null → stream-123)
T2: [Audio] Before srcObject assignment
T3: [Audio] After srcObject assignment
T4: [Audio] Attempting play()
T5: [Audio] Playback started successfully
T6: [VoiceCallUI] Component RENDER (callStatus: connected, remoteStream: stream-123)
T7: [VoiceCallUI] Component RENDER (callStatus: failed, remoteStream: null) ← PROBLEM
T8: [Audio] useEffect cleanup - clearing srcObject ← INTERRUPTS PLAYBACK
```

**Root cause:** remoteStream changed to null  
**Why:** cleanup() called, sets remoteStream to null

### Pattern 3: Component Re-renders With Dependency Change
```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting, remoteStream: null)
T1: [Audio] useEffect triggered (remoteStream: null → stream-123)
T2: [Audio] Before srcObject assignment
T3: [Audio] After srcObject assignment
T4: [Audio] Attempting play()
T5: [Audio] Playback started successfully
T6: [VoiceCallUI] Component RENDER (callStatus: connecting, remoteStream: stream-123)
T7: [VoiceCallUI] Component RENDER (callStatus: connected, remoteStream: stream-123)
T8: [Audio] useEffect cleanup - clearing srcObject ← DEPENDENCY CHANGED
T9: [Audio] useEffect triggered (remoteStream: stream-123 → stream-456) ← NEW STREAM
```

**Root cause:** remoteStream changed to different stream  
**Why:** ontrack fired again with new stream

---

## Analysis Checklist

After test call, check:

### 1. Count Component Mounts
- [ ] Should be 1 mount per call
- [ ] If >1, component is remounting

### 2. Count Component Unmounts
- [ ] Should be 1 unmount per call (at end)
- [ ] If unmount during call → root cause found

### 3. Count Audio useEffect Triggers
- [ ] Should be 1 trigger per call (when remoteStream first arrives)
- [ ] If >1, remoteStream is changing

### 4. Count Audio Cleanups
- [ ] Should be 1 cleanup per call (at unmount)
- [ ] If cleanup during call → root cause found

### 5. Check Sequence Before AbortError
- [ ] Does UNMOUNTED appear before AbortError?
- [ ] Does cleanup appear before AbortError?
- [ ] Does remoteStream change to null before AbortError?
- [ ] Does callStatus change before AbortError?

### 6. Check Audio Element Identity
- [ ] Is audio element the same object throughout?
- [ ] Compare audioElement references in logs

### 7. Check Stream Identity
- [ ] Is stream the same throughout?
- [ ] Compare stream IDs in logs

---

## Root Cause Determination

### If UNMOUNTED appears during call:
**Root cause:** Component is unmounting  
**Next step:** Find why parent is unmounting VoiceCallUI  
**Check:** GlobalCallUI.tsx conditional rendering

### If cleanup appears without UNMOUNTED:
**Root cause:** remoteStream changed or callStatus changed  
**Next step:** Find what's changing remoteStream or callStatus  
**Check:** useVoiceCall.ts state updates

### If remoteStream changes to null:
**Root cause:** cleanup() in useVoiceCall is being called  
**Next step:** Find what's triggering cleanup()  
**Check:** Event handlers, error handlers, state changes

### If callStatus changes during call:
**Root cause:** Something is changing callStatus away from "connected"  
**Next step:** Find what's changing callStatus  
**Check:** onconnectionstatechange, Firestore listener

---

## Testing Instructions

### Step 1: Make Test Call
1. Open browser console (F12)
2. Clear console
3. Make a call between two users
4. Wait for AbortError (or successful playback)
5. Copy ALL console logs

### Step 2: Analyze Logs

**Look for this sequence:**
```
[VoiceCallUI] Component MOUNTED
[Audio] useEffect triggered
[Audio] Before srcObject assignment
[Audio] After srcObject assignment
[Audio] Attempting play()
[Audio] Playback started successfully (or AbortError)
[VoiceCallUI] Component RENDER (one or more)
[VoiceCallUI] Component UNMOUNTED (if it appears here, that's the problem)
[Audio] useEffect cleanup (if it appears here, that's the problem)
```

### Step 3: Identify Pattern

**Match against the 4 patterns above:**
- Pattern 1: Component unmounts
- Pattern 2: remoteStream changes to null
- Pattern 3: Component re-renders with dependency change
- Pattern 4: Other

### Step 4: Trace to Source

**Once pattern is identified:**
1. Find what's causing the unmount/change
2. Trace to parent component
3. Identify the state/prop change
4. Determine why it's changing

---

## What NOT to Do

**Do NOT:**
- Add retry logic
- Add abort listeners
- Add workarounds
- Modify signaling
- Modify ICE
- Modify cleanup logic yet

**Only:**
- Analyze logs
- Identify root cause
- Document findings
- Propose targeted fix

---

## Next Steps After Testing

1. Review console logs
2. Identify which pattern matches
3. Trace to root cause in code
4. Document exact cause
5. Propose minimal fix
6. Implement ONLY that fix
7. Test again

**Awaiting test results to identify root cause.**
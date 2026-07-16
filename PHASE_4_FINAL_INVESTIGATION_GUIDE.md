# Phase 4 Final: Complete Investigation Guide

**Status:** ALL LOGGING INSTRUMENTATION COMPLETE  
**Date:** 2026-06-15  
**Purpose:** Guide for analyzing logs to identify root cause of VoiceCallUI unmounting

---

## Instrumentation Summary

### Files Modified:

1. **`components/communication/VoiceCallUI.tsx`**
   - Component MOUNT/UNMOUNT logging
   - Component RENDER logging with full props
   - Audio useEffect lifecycle logging
   - Audio srcObject assignment tracking

2. **`components/communication/GlobalCallUI.tsx`**
   - Every render logged with state
   - isInCall, activeCall, callStatus, remoteStream tracked

3. **`hooks/useVoiceCall.ts`**
   - cleanup() now accepts reason parameter
   - All cleanup calls include reason
   - ICE candidate logging with candidate hash
   - Connection state change logging
   - ICE connection state change logging

4. **`lib/communication/voiceCalls.ts`**
   - Firestore subscribe/unsubscribe logging
   - Added log helper function

---

## What to Test

### Make a test call between two users

**Watch the browser console (F12) for these logs:**

---

## PART 1: VoiceCallUI Lifecycle

### Look for these logs:

```
[VoiceCallUI] Component MOUNTED
[VoiceCallUI] Component RENDER
[VoiceCallUI] Component UNMOUNTED
```

### Critical Questions:

1. **Does VoiceCallUI unmount during an active call?**
   - Look for: `[VoiceCallUI] Component UNMOUNTED` before call ends
   - Expected: Should only unmount when call ends
   - Problem if: Unmounts during "connecting" or "connected" state

2. **How many times does VoiceCallUI mount?**
   - Count: `[VoiceCallUI] Component MOUNTED` logs
   - Expected: 1 mount per call
   - Problem if: >1 mount (component remounting)

3. **What is the callStatus when VoiceCallUI unmounts?**
   - Check: `callStatus` field in UNMOUNTED log
   - Expected: "ended" or "failed"
   - Problem if: "connecting" or "connected"

---

## PART 2: GlobalCallUI State Changes

### Look for these logs:

```
[GlobalCallUI] RENDER
{
  isInCall,
  hasActiveCall,
  activeCallId,
  callStatus,
  remoteStreamId
}
```

### Critical Questions:

1. **What changes causes VoiceCallUI to disappear?**
   - VoiceCallUI condition: `{isInCall && activeCall && (...)`
   - VoiceCallUI disappears when: `isInCall = false` OR `activeCall = null`
   
2. **Which state changes first?**
   - Look for sequence:
     ```
     [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: true)
     [GlobalCallUI] RENDER (isInCall: false, hasActiveCall: true) ← isInCall changed
     [GlobalCallUI] RENDER (isInCall: false, hasActiveCall: false) ← activeCall changed
     ```
   - OR:
     ```
     [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: true)
     [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: false) ← activeCall changed
     ```

3. **What causes callStatus to change?**
   - Look for: `setCallStatus("failed")` in other logs
   - Check: connectionState change logs
   - Check: iceConnectionState change logs

---

## PART 3: Cleanup Investigation

### Look for these logs:

```
cleanup() called
{
  reason: "hangup" | "connection_failed" | "component_unmount" | etc,
  callId: "...",
  callStatus: "...",
  connectionState: "...",
  iceConnectionState: "...",
  signalingState: "..."
}
```

### Critical Questions:

1. **What reason is logged when cleanup runs during active call?**
   - Expected reasons during call: "hangup", "end_call"
   - Problem reasons: "connection_failed", "unknown", no reason
   
2. **What is the connectionState when cleanup runs?**
   - Expected: "connected" (only on intentional hangup)
   - Problem if: "disconnected" or "failed"

3. **What is the callStatus when cleanup runs?**
   - Expected: "connected" or "ended"
   - Problem if: "connecting" or "failed"

---

## PART 4: Firestore Listeners

### Look for these logs:

```
[Firestore] Subscribe to call
[Firestore] Unsubscribe from call
[Firestore] Subscribe to call events
[Firestore] Unsubscribe from call events
```

### Critical Questions:

1. **How many times does subscribe happen for the same callId?**
   - Count: `[Firestore] Subscribe to call` with same callId
   - Expected: 1 subscribe per call
   - Problem if: >1 subscribe (multiple listeners)

2. **Does unsubscribe happen before call ends?**
   - Look for: `[Firestore] Unsubscribe from call` before call ends
   - Expected: Only on cleanup
   - Problem if: Unsubscribe happens during active call

3. **Are there orphaned listeners?**
   - If subscribe happens but unsubscribe doesn't → memory leak

---

## PART 5: ICE Candidates

### Look for these logs:

```
ICE candidate generated
{
  candidateHash: "candidate:...",
  candidate: "full candidate string",
  type: "host" | "srflx" | "relay",
  protocol: "udp" | "tcp",
  address: "...",
  mid: "...",
  sdpMLineIndex: ...
}
```

### Critical Questions:

1. **Are duplicate candidates generated?**
   - Compare: `candidateHash` values
   - Expected: Each candidate appears once
   - Problem if: Same candidateHash appears multiple times

2. **Are candidates processed multiple times?**
   - Look for: `ICE candidate added successfully` with same candidate
   - Expected: Each candidate added once
   - Problem if: Same candidate added multiple times

3. **How many ICE candidates total?**
   - Count: `ICE candidate generated` logs
   - Expected: 5-20 candidates per call
   - Problem if: >50 candidates (excessive)

---

## Expected Timeline (Working Call)

```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting)
T1: [GlobalCallUI] RENDER (isInCall: true, hasActiveCall: true)
T2: [VoiceCallUI] Component RENDER
T3: [Audio] useEffect triggered
T4: [Audio] Before srcObject assignment
T5: [Audio] After srcObject assignment
T6: [Audio] Attempting play()
T7: [Audio] Playback started successfully
T8: [VoiceCallUI] Component RENDER (multiple times during call)
T9: connectionState change: connected
T10: [GlobalCallUI] RENDER (callStatus: connected)
T11: [VoiceCallUI] Component RENDER (callStatus: connected)
T12: [Audio continues playing...]
T13: [User clicks end call]
T14: cleanup("hangup")
T15: [VoiceCallUI] Component UNMOUNTED
T16: [Firestore] Unsubscribe from call
```

---

## Problematic Timeline (VoiceCallUI Unmounts During Call)

### Pattern 1: Connection State Flicker

```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting)
T1: [Audio] useEffect triggered
T2: [Audio] Playback started successfully
T3: connectionState change: connected
T4: [GlobalCallUI] RENDER (callStatus: connected)
T5: connectionState change: disconnected ← PROBLEM
T6: cleanup("connection_failed") ← PROBLEM
T7: [VoiceCallUI] Component UNMOUNTED ← PROBLEM
T8: [Audio] useEffect cleanup ← INTERRUPTS PLAYBACK
T9: [GlobalCallUI] RENDER (isInCall: false, hasActiveCall: false)
```

**Root cause:** Connection briefly disconnects, code treats it as failure

### Pattern 2: Firestore Status Change

```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting)
T1: [Audio] useEffect triggered
T2: [Audio] Playback started successfully
T3: [Firestore] Subscribe to call (listening for updates)
T4: [Firestore] Call document updated (status: failed) ← PROBLEM
T5: cleanup("firestore_failed") ← PROBLEM
T6: [VoiceCallUI] Component UNMOUNTED ← PROBLEM
```

**Root cause:** Firestore document status changed to "failed"

### Pattern 3: Component Remount

```
T0: [VoiceCallUI] Component MOUNTED (callStatus: connecting)
T1: [Audio] useEffect triggered
T2: [Audio] Playback started successfully
T3: [VoiceCallUI] Component UNMOUNTED ← PROBLEM
T4: [VoiceCallUI] Component MOUNTED (callStatus: connecting)
T5: [Audio] useEffect triggered again
```

**Root cause:** Parent component re-renders, VoiceCallUI remounts

---

## Analysis Checklist

After making a test call, verify:

### 1. VoiceCallUI Lifecycle
- [ ] Count MOUNTED logs (should be 1)
- [ ] Count UNMOUNTED logs (should be 1, at end of call)
- [ ] Check callStatus in UNMOUNTED log (should be "ended")
- [ ] Check if UNMOUNTED appears during active call (PROBLEM)

### 2. GlobalCallUI State
- [ ] Watch for isInCall changing from true → false during call
- [ ] Watch for hasActiveCall changing from true → false during call
- [ ] Identify which change happens first
- [ ] Trace back to what caused the state change

### 3. Cleanup Reasons
- [ ] List all cleanup() reasons during call
- [ ] Expected: "hangup" or "end_call" only
- [ ] Problem if: "unknown", "connection_failed", "firestore_*"
- [ ] Note connectionState and callStatus in cleanup log

### 4. Firestore Listeners
- [ ] Count subscribe logs per callId (should be 1)
- [ ] Count unsubscribe logs per callId (should be 1, at end)
- [ ] Check if unsubscribe happens during call (PROBLEM)

### 5. ICE Candidates
- [ ] Count total candidates (expected: 5-20)
- [ ] Check for duplicate candidateHash values
- [ ] Check if same candidate added multiple times

---

## Root Cause Determination

### If VoiceCallUI unmounts during call:

**Step 1:** Check cleanup() reason
- If reason is "connection_failed" → Connection state issue
- If reason is "firestore_*" → Firestore status issue
- If reason is "unknown" → Unknown trigger

**Step 2:** Check what triggered cleanup
- Look for: `setCallStatus("failed")` before cleanup
- Look for: connectionState change logs
- Look for: iceConnectionState change logs

**Step 3:** Trace to root cause
- If connectionState = "disconnected" → Code treats disconnected as failed
- If connectionState = "failed" → Real connection failure
- If Firestore status changed → Remote user ended call or network issue

---

## Deliverable

After testing, produce:

1. **Exact sequence of logs** from mount to unmount
2. **First event that triggers the problem**
3. **Root cause** (why VoiceCallUI unmounts)
4. **Proposed fix** (minimal change to prevent unmount)

**Do NOT implement fixes yet. Only document findings.**

---

## Next Steps

1. Make test call
2. Copy ALL console logs
3. Analyze using this guide
4. Identify root cause
5. Document findings
6. Propose fix
7. Get approval before implementing

**Awaiting test results.**
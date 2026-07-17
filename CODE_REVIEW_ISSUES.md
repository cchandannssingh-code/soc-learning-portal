# Voice Call Code Review - Issues Found

**Date:** 2026-07-17  
**Purpose:** Document potential issues found during code review before testing  
**Status:** READY FOR FIXES

---

## Critical Issues

### Issue 1: ICE "disconnected" State Treated as Failure ⚠️

**File:** `hooks/useVoiceCall.ts`  
**Lines:** 514-519

**Current Code:**
```typescript
pc.oniceconnectionstatechange = () => {
  const state = pc.iceConnectionState
  log("iceConnectionState change", {
    callId,
    state,
    connectionState: pc.connectionState,
    signalingState: pc.signalingState,
  })
  if (state === "failed" || state === "disconnected") {
    console.error(`ICE connection ${state}`)
    setError(`Connection ${state}`)
    setCallStatus("failed")
    cleanup()
  }
}
```

**Problem:**
- Treats "disconnected" as a failure and triggers cleanup
- According to WebRTC spec, "disconnected" is a **recoverable** state
- ICE can briefly disconnect and recover without ending the call
- This causes VoiceCallUI to unmount prematurely

**Impact:**
- VoiceCallUI unmounts during normal call when ICE briefly disconnects
- Audio stops playing
- User has to reinitiate call

**Fix:**
```typescript
if (state === "failed") {
  console.error(`ICE connection ${state}`)
  setError(`Connection ${state}`)
  setCallStatus("failed")
  cleanup()
}
// Remove "disconnected" from the condition - it's recoverable
```

**Evidence:**
- WebRTC ICE connection states: "new" → "checking" → "connected" → "completed" → "disconnected" → "failed"
- "disconnected" means the ICE agent has disconnected but may recover
- Only "failed" is terminal

---

## Medium Priority Issues

### Issue 2: Multiple Cleanup Calls Can Queue

**File:** `hooks/useVoiceCall.ts`  
**Lines:** 132-204

**Problem:**
- cleanup() is called from multiple places (9 total)
- While there's a guard (`isCleaningUpRef`), async operations can still queue
- Example: Firestore callback triggers cleanup, then connection state change also triggers cleanup

**Current Protection:**
```typescript
const cleanup = useCallback((reason: string = "unknown") => {
  if (isCleaningUpRef.current) {
    return
  }
  isCleaningUpRef.current = true
  // ...
} finally {
  isCleaningUpRef.current = false
})
```

**Potential Issue:**
- If cleanup() is called with reason A, then immediately called with reason B before the first cleanup completes
- The second call returns early (good)
- But state updates from both calls may still execute

**Recommendation:**
- Add more logging to track if this actually happens
- Consider using a cleanup promise to prevent concurrent cleanups

---

### Issue 3: ICE Candidate Queue Not Cleaned Up

**File:** `hooks/useVoiceCall.ts`  
**Lines:** 79-80, 324-352

**Problem:**
- `iceCandidateQueueRef` stores queues per callId
- Queues are never cleaned up after call ends
- Over multiple calls, this can accumulate memory

**Current Code:**
```typescript
const iceCandidateQueueRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())
```

**Recommendation:**
- Clear queue for specific callId in cleanup()
- Or clear entire map on cleanup

**Fix:**
```typescript
// In cleanup() function
iceCandidateQueueRef.current.clear()
```

---

### Issue 4: processedCandidatesRef Not Cleaned Up

**File:** `hooks/useVoiceCall.ts`  
**Line:** 81

**Problem:**
- `processedCandidatesRef` tracks processed ICE candidates
- Never cleared between calls
- Set grows indefinitely with each call

**Current Code:**
```typescript
const processedCandidatesRef = useRef<Set<string>>(new Set())
```

**Recommendation:**
- Clear the set in cleanup() to free memory
- This is safe because cleanup only runs when call ends

**Fix:**
```typescript
// In cleanup() function
processedCandidatesRef.current.clear()
```

---

## Low Priority Issues

### Issue 5: GlobalCallUI Renders on Every State Change

**File:** `components/communication/GlobalCallUI.tsx`  
**Lines:** 34-42

**Problem:**
- useEffect with no dependencies runs on every render
- Logs on every render, which can be noisy

**Current Code:**
```typescript
useEffect(() => {
  console.log("[GlobalCallUI] RENDER", {
    isInCall,
    hasActiveCall: !!activeCall,
    // ...
  })
})
```

**Impact:**
- Console spam during testing
- Minor performance impact

**Recommendation:**
- Add dependency array to only log when relevant state changes
- Or remove before production

---

### Issue 6: VoiceCallUI RENDER Log Has No Dependencies

**File:** `components/communication/VoiceCallUI.tsx`  
**Lines:** 47-66

**Problem:**
- useEffect with no dependencies runs on every render
- Logs on every render

**Recommendation:**
- Add dependency array
- Or remove before production

---

## Potential Race Conditions

### Issue 7: subscribeToCall Callback May Use Stale Data

**File:** `hooks/useVoiceCall.ts`  
**Lines:** 613-661

**Problem:**
- subscribeToCall callback captures `pc` from closure
- If peer connection is recreated, callback uses old `pc` reference
- Could cause errors when trying to set remote description on closed connection

**Current Mitigation:**
- `pc` is stored in `peerConnectionRef.current`
- But callback uses closure variable, not the ref

**Recommendation:**
- Use `peerConnectionRef.current` instead of closure `pc`
- Or ensure callback is recreated when `pc` changes

---

## Testing Recommendations

### Before Testing:
1. **Fix Issue 1** (ICE "disconnected" state) - This is likely causing VoiceCallUI unmounts
2. **Fix Issue 3** (Queue cleanup) - Prevent memory leaks
3. **Fix Issue 4** (processedCandidatesRef cleanup) - Prevent memory leaks

### During Testing:
1. Watch for `[ICE] Duplicate candidate SKIPPED` logs
2. Watch for VoiceCallUI MOUNT/UNMOUNT logs
3. Watch for ICE connection state changes
4. Verify "disconnected" state doesn't trigger cleanup

### Expected Behavior After Fixes:
- VoiceCallUI mounts once per call
- No unmount during active call
- ICE deduplication works
- Audio plays continuously

---

## Summary

**Must Fix Before Testing:**
1. ✅ Issue 1: ICE "disconnected" state handling

**Should Fix Before Testing:**
2. ✅ Issue 3: ICE candidate queue cleanup
3. ✅ Issue 4: processedCandidatesRef cleanup

**Can Fix Later:**
4. ⚠️ Issue 2: Multiple cleanup calls (add logging first)
5. ⚠️ Issue 5: GlobalCallUI render logging
6. ⚠️ Issue 6: VoiceCallUI render logging
7. ⚠️ Issue 7: Stale closure in subscribeToCall

**Next Steps:**
1. Fix Issue 1 (ICE disconnected state)
2. Fix Issues 3 & 4 (cleanup)
3. Test voice call
4. Analyze logs
5. Fix any remaining issues
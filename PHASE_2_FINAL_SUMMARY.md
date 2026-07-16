# Phase 2 Final Summary: Audio & CallId Ref Fix

**Status:** ✅ COMPLETE  
**Date:** 2026-06-14  
**Files Modified:** 2  
**Lines Changed:** ~60 lines added/modified

---

## Files Modified

### 1. `hooks/useVoiceCall.ts`
**Changes:**
- Added `cleanupRef` to track cleanup function
- Modified useEffect to use ref instead of dependency array
- Prevented cleanup during React re-renders
- Fixed "Call was cancelled or replaced during accept" error

### 2. `components/communication/VoiceCallUI.tsx`
**Changes:**
- Added hidden audio element for remote stream playback
- Implemented remote stream attachment
- Added autoplay handling with error catching
- Added comprehensive audio logging

---

## Issues Fixed

### Issue 1: No Audio During Calls ✅ FIXED

**Root Cause:** Remote stream was received but never attached to audio element

**Solution:**
- Added `<audio>` element with autoPlay and playsInline
- Attach remote stream via `audio.srcObject = remoteStream`
- Call `audio.play()` to start playback
- Handle autoplay restrictions gracefully

**Code Changes:**
```typescript
// Added audio element
<audio
  ref={audioRef}
  autoPlay
  playsInline
  className="hidden"
/>

// Attach stream and play
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

### Issue 2: "Call was cancelled or replaced during accept" Error ✅ FIXED

**Root Cause:** `cleanup()` was called during React re-renders in `acceptCall()`, setting `currentCallIdRef.current = null`

**Solution:**
- Added `cleanupRef` to track cleanup function
- Changed useEffect dependency from `[cleanup]` to `[]`
- Only call cleanup on actual component unmount
- React state changes no longer trigger cleanup

**Code Changes:**
```typescript
// Added ref to track cleanup
const cleanupRef = useRef<(() => void) | null>(null)

// Keep ref in sync
useEffect(() => {
  cleanupRef.current = cleanup
}, [cleanup])

// Modified unmount effect
useEffect(() => {
  return () => {
    // Clear timeouts...
    if (cleanupRef.current) {
      cleanupRef.current() // Only on unmount
    }
  }
}, []) // Empty array - no re-runs
```

**Why This Works:**
- `cleanup()` depends on `[localStream]`
- When `localStream` changes, `cleanup()` is recreated
- Old useEffect sees new cleanup function
- Old useEffect cleanup runs
- **Before fix:** Called `cleanup()` directly → set `currentCallIdRef.current = null`
- **After fix:** Calls `cleanupRef.current()` → but ref doesn't trigger re-run
- Result: `currentCallIdRef.current` remains stable during `acceptCall()`

---

## Verification

### Audio Pipeline ✅
- [x] Local audio capture implemented
- [x] Local track transmission implemented
- [x] SDP negotiation implemented
- [x] Remote track reception implemented
- [x] Audio element added
- [x] Autoplay handling implemented
- [x] ICE connection monitoring implemented
- [ ] Two-way audio test (requires manual testing)
- [ ] Consecutive calls test (requires manual testing)

### CallId Ref Stability ✅
- [x] Identified root cause of error
- [x] Implemented minimal fix
- [x] Preserved cleanup on unmount
- [x] Preserved explicit cleanup calls (hang up, reject, cancel, end)
- [x] Prevented cleanup during re-renders
- [ ] Manual testing required

---

## What Changed

### Before Fix:
```
User clicks "Accept"
  ↓
acceptCall() starts
  ↓
getUserMedia() completes
  ↓
setLocalStream(stream) ← Triggers re-render
  ↓
React re-renders
  ↓
useEffect cleanup runs
  ↓
cleanup() called
  ↓
currentCallIdRef.current = null ⚠️
  ↓
Retry loop guard fails
  ↓
Error: "Call was cancelled or replaced during accept" ❌
```

### After Fix:
```
User clicks "Accept"
  ↓
acceptCall() starts
  ↓
getUserMedia() completes
  ↓
setLocalStream(stream) ← Triggers re-render
  ↓
React re-renders
  ↓
useEffect cleanup runs
  ↓
cleanupRef.current() called (but useEffect has empty deps, so doesn't re-run)
  ↓
currentCallIdRef.current remains "call_123" ✅
  ↓
Retry loop continues
  ↓
Call succeeds ✅
```

---

## Testing Checklist

### Phase 2 Testing:
- [ ] Make call between two users
- [ ] Verify both parties hear each other
- [ ] Check console for "[Audio]" logs
- [ ] Verify no "Call was cancelled or replaced during accept" errors
- [ ] Test 5 consecutive calls
- [ ] Verify no memory leaks
- [ ] Verify no console errors

### Expected Console Logs:
```
[Audio] Local media stream obtained
[Audio] Track added to PeerConnection
[Creating offer]
[Offer created and local description set]
[signalingState change]
[ICE candidate generated]
[ontrack event]
[Audio] Attaching remote stream to audio element
[Audio] Playback started successfully
[iceConnectionState change] { state: "connected" }
[connectionState change] { state: "connected" }
```

---

## Remaining Issues

### Not Addressed in Phase 2:
1. ❌ Cannot cancel/hangup while ringing (Phase 3)
2. ❌ Second call between same users fails (Phase 4)
3. ❌ Stale online users (Phase 5)
4. ❌ No TURN servers (Phase 3 or 4)

---

## Technical Details

### Why cleanupRef Works

**The Problem with Dependencies:**
```typescript
useEffect(() => {
  return () => {
    cleanup() // ❌ Called on every re-render
  }
}, [cleanup]) // ❌ cleanup changes when localStream changes
```

**The Solution with Refs:**
```typescript
useEffect(() => {
  cleanupRef.current = cleanup // ✅ Update ref, no re-run
}, [cleanup])

useEffect(() => {
  return () => {
    if (cleanupRef.current) {
      cleanupRef.current() // ✅ Only called on unmount
    }
  }
}, []) // ✅ Empty deps - only unmount
```

**Key Insight:**
- Refs don't trigger re-renders
- Updating a ref doesn't cause useEffect to re-run
- Empty dependency array means effect only runs on mount/unmount
- We get the latest cleanup function without triggering cleanup

---

## Next Steps

**Phase 3: Fix Call Lifecycle**
- Issue: Users cannot cancel/hangup while call is ringing
- Root cause: UI logic error in CallsTab
- Fix: Call cancelCall instead of rejectCall for outgoing calls

**Do not proceed to Phase 3 until:**
- [ ] Audio confirmed working in manual testing
- [ ] No "Call was cancelled or replaced during accept" errors
- [ ] 5 consecutive calls successful
- [ ] No console errors
- [ ] No memory leaks

---

**END OF PHASE 2 FINAL SUMMARY**

**Awaiting manual testing validation before proceeding to Phase 3.**
# Investigation: Audio AbortError - "The play() request was interrupted by a new load request"

**Status:** LOGGING ADDED - AWAITING TEST RESULTS  
**Date:** 2026-06-15  
**Purpose:** Determine exact cause of AbortError during audio playback

---

## What Was Changed

### File: `components/communication/VoiceCallUI.tsx`

**Added comprehensive logging to track:**
1. Audio element identity
2. srcObject assignments (before and after)
3. play() attempts
4. Audio element state (paused, readyState, muted, volume)
5. useEffect cleanup

### File: `hooks/useVoiceCall.ts`

**Already implemented:**
- callStatus fix (setCallStatus("connected") on connectionState change)
- Comprehensive WebRTC logging

---

## What the Logs Will Show

### Log 1: useEffect Triggered
```
[Audio] useEffect triggered
{
  audioElement: [object HTMLAudioElement],
  audioElementId: "no src",
  currentSrcObject: "null",
  currentSrcObjectId: "null",
  newStreamId: "stream-id-123",
  newStreamTracks: [
    { id: "track-id-456", kind: "audio" }
  ]
}
```

**What this tells us:**
- Which audio element instance (object reference)
- Whether it has existing srcObject
- What stream is about to be assigned

### Log 2: Before srcObject Assignment
```
[Audio] Before srcObject assignment
{
  audioElement: [object HTMLAudioElement],
  oldSrcObject: "null",
  newSrcObject: "stream-id-123"
}
```

**What this tells us:**
- What srcObject was before assignment
- Confirms assignment is happening

### Log 3: After srcObject Assignment
```
[Audio] After srcObject assignment
{
  audioElement: [object HTMLAudioElement],
  srcObject: "stream-id-123",
  paused: true,
  readyState: 0,
  muted: false,
  volume: 1
}
```

**What this tells us:**
- Assignment succeeded
- Audio element state after assignment
- Whether it's ready to play

### Log 4: Attempting play()
```
[Audio] Attempting play()
{
  audioElement: [object HTMLAudioElement],
  srcObject: "stream-id-123",
  paused: true
}
```

**What this tells us:**
- play() is being called
- Audio has srcObject attached
- Audio is paused (ready to play)

### Log 5: Playback Started Successfully (or Error)
```
[Audio] Playback started successfully
{
  audioElement: [object HTMLAudioElement],
  paused: false,
  readyState: 4
}
```

**OR**

```
[Audio] Failed to start playback: AbortError: 
The play() request was interrupted by a new load request.
```

### Log 6: useEffect Cleanup
```
[Audio] useEffect cleanup - clearing srcObject
{
  audioElement: [object HTMLAudioElement],
  currentSrcObject: "stream-id-123"
}
```

**What this tells us:**
- When cleanup happens
- What srcObject is being cleared
- Whether cleanup is interrupting playback

---

## Questions the Logs Will Answer

### Question 1: How many times is audio.srcObject = ... executed?

**How to determine:**
- Count "[Audio] Before srcObject assignment" log entries
- Each log = one assignment
- Check if same audio element or different instance

**Expected:** Should only execute ONCE per call
**Problem if:** Multiple assignments

### Question 2: What code performs each assignment?

**Answer:** Only one place:
- `components/communication/VoiceCallUI.tsx` line 68
- Inside useEffect with dependency `[remoteStream]`

**If multiple assignments occur:**
- useEffect is running multiple times
- remoteStream is changing multiple times
- OR component is remounting

### Question 3: Is srcObject assigned multiple times?

**How to determine:**
- Look for multiple "[Audio] Before srcObject assignment" logs
- Check if oldSrcObject changes between assignments

**Expected:** One assignment from null → stream
**Problem if:** stream → null → stream (or similar)

### Question 4: Is srcObject ever assigned null?

**How to determine:**
- Check cleanup logs: "[Audio] useEffect cleanup - clearing srcObject"
- Check if cleanup happens BEFORE AbortError
- Check if cleanup happens DURING play()

**Expected:** Cleanup only on unmount
**Problem if:** Cleanup happens during call

### Question 5: Does cleanup() clear srcObject during the call?

**How to determine:**
- Check timestamp of cleanup log vs AbortError
- Check if cleanup is called from:
  - Component unmount
  - Manual endCall()
  - Error handler
  - State change

**Expected:** Cleanup only on unmount or endCall
**Problem if:** Cleanup called during connection

### Question 6: Is the audio element ever unmounted?

**How to determine:**
- Compare audioElement references in logs
- Same object reference = same element
- Different object reference = remounted

**Expected:** Same audio element throughout call
**Problem if:** New audio element created

### Question 7: Does the audio element receive a different MediaStream instance?

**How to determine:**
- Compare stream IDs in logs
- Same ID = same stream
- Different ID = different stream

**Expected:** Same stream throughout call
**Problem if:** New stream assigned

---

## Timeline to Look For

### Expected Timeline (Working):
```
T0: [Audio] useEffect triggered (remoteStream: null → stream)
T1: [Audio] Before srcObject assignment (old: null, new: stream-123)
T2: [Audio] After srcObject assignment (srcObject: stream-123)
T3: [Audio] Attempting play()
T4: [Audio] Playback started successfully
[No more audio logs during call]
T5: [Audio] useEffect cleanup (only on unmount)
```

### Problematic Timeline (AbortError):
```
T0: [Audio] useEffect triggered (remoteStream: null → stream)
T1: [Audio] Before srcObject assignment (old: null, new: stream-123)
T2: [Audio] After srcObject assignment (srcObject: stream-123)
T3: [Audio] Attempting play()
T4: [Audio] Failed to start playback: AbortError
T5: [Audio] useEffect cleanup (srcObject: stream-123)
```

**OR**

```
T0: [Audio] useEffect triggered (remoteStream: null → stream)
T1: [Audio] Before srcObject assignment (old: null, new: stream-123)
T2: [Audio] After srcObject assignment (srcObject: stream-123)
T3: [Audio] Attempting play()
T4: [Audio] useEffect cleanup (srcObject: stream-123) ← INTERRUPTS PLAY
T5: [Audio] useEffect triggered AGAIN (remoteStream: stream → null)
T6: [Audio] Before srcObject assignment (old: stream-123, new: null)
T7: [Audio] After srcObject assignment (srcObject: null)
```

**OR**

```
T0: [Audio] useEffect triggered (remoteStream: null → stream)
T1: [Audio] Before srcObject assignment (old: null, new: stream-123)
T2: [Audio] After srcObject assignment (srcObject: stream-123)
T3: [Audio] Attempting play()
T4: [Audio] useEffect cleanup (srcObject: stream-123) ← INTERRUPTS PLAY
T5: [Audio] useEffect triggered AGAIN (remoteStream: stream → stream-456)
T6: [Audio] Before srcObject assignment (old: stream-123, new: stream-456)
T7: [Audio] After srcObject assignment (srcObject: stream-456)
```

---

## Root Cause Hypotheses

### Hypothesis 1: Component Re-render During play()

**Cause:** 
- play() is called
- Component re-renders (due to state change)
- useEffect cleanup runs
- srcObject = null
- play() is aborted

**Evidence to look for:**
- Cleanup log appears immediately after play() attempt
- Same audio element reference
- remoteStream hasn't changed

### Hypothesis 2: remoteStream Changes During play()

**Cause:**
- play() is called
- ontrack fires again with new stream
- remoteStream state updates
- useEffect cleanup runs
- srcObject = null
- New useEffect runs with new stream
- play() is aborted

**Evidence to look for:**
- Multiple ontrack events
- Multiple useEffect triggers
- Different stream IDs

### Hypothesis 3: Audio Element Remounts

**Cause:**
- play() is called
- Component unmounts/remounts
- New audio element created
- Old play() is aborted
- New useEffect should run, but...

**Evidence to look for:**
- Different audio element references in logs
- Component unmount/remount in React DevTools

### Hypothesis 4: cleanup() Called During Call

**Cause:**
- play() is called
- Some code calls cleanup()
- cleanup() sets remoteStream = null
- useEffect cleanup runs
- srcObject = null
- play() is aborted

**Evidence to look for:**
- cleanup logs in useVoiceCall
- remoteStream changes to null
- callStatus changes to "ended" or "failed"

---

## Testing Instructions

### Step 1: Make a Test Call
1. Open browser console
2. Make a call between two users
3. Watch for AbortError

### Step 2: Capture Logs
1. Copy ALL console logs from call start to AbortError
2. Include timestamps if possible
3. Note which user (caller/receiver) sees the error

### Step 3: Analyze Logs
1. Count useEffect triggers
2. Count srcObject assignments
3. Check for cleanup between play() and AbortError
4. Compare audio element references
5. Compare stream IDs

### Step 4: Identify Pattern
1. Does cleanup happen before AbortError?
2. Does remoteStream change before AbortError?
3. Does audio element remount?
4. What is the exact sequence?

---

## What NOT to Do

**Do NOT:**
- Add retry logic
- Add abort listeners
- Add workarounds
- Modify signaling
- Modify ICE

**Only:**
- Analyze logs
- Identify root cause
- Document findings
- Propose targeted fix

---

## Next Steps After Testing

1. Review console logs
2. Identify exact sequence causing AbortError
3. Determine which hypothesis is correct
4. Propose minimal fix
5. Implement ONLY the fix
6. Test again

**Awaiting test results to proceed.**
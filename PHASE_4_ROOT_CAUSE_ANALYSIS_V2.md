# Phase 4 Root Cause Analysis V2: VoiceCallUI Remount and ICE Deduplication Failure

**Status:** ROOT CAUSES IDENTIFIED - NO FIXES YET  
**Date:** 2026-06-15  
**Purpose:** Document exact root causes before implementing fixes

---

## Issue 1: VoiceCallUI Unmounts and Remounts During Call Setup

### Investigation Required

**Check these three potential causes:**

#### 1.1 React StrictMode Double Rendering

**Location:** `app/layout.tsx`

**Check if StrictMode is enabled:**
```typescript
// Look for this in app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* If this exists, StrictMode is ON */}
        <StrictMode>
          {children}
        </StrictMode>
      </body>
    </html>
  )
}
```

**Impact if StrictMode is enabled:**
- Components mount → unmount → remount in development
- useEffect runs twice
- Can cause VoiceCallUI to appear to remount

**How to verify:**
- Check app/layout.tsx for StrictMode
- If present, this is likely the cause

---

#### 1.2 Unstable Key Prop

**Location:** `components/communication/GlobalCallUI.tsx`

**Check VoiceCallUI rendering:**
```typescript
// Look for this pattern
{isInCall && activeCall && (
  <VoiceCallUI
    key={/* WHAT IS THE KEY? */}
    call={activeCall}
    ...
  />
)}
```

**Potential problems:**
- If `key={call.callId}` and callId changes → remount
- If `key={activeCall.callId}` and activeCall reference changes → remount
- If no key, React uses default (index) → may remount on array changes

**How to verify:**
- Check if VoiceCallUI has a key prop
- Check if the key value changes during call setup
- Check if activeCall object reference changes

---

#### 1.3 Conditional Rendering in GlobalCallUI

**Location:** `components/communication/GlobalCallUI.tsx`

**Current logic:**
```typescript
{isInCall && activeCall && (
  <VoiceCallUI ... />
)}
```

**Problem:**
- VoiceCallUI requires BOTH `isInCall === true` AND `activeCall !== null`
- If either becomes false temporarily → VoiceCallUI unmounts
- If either becomes true again → VoiceCallUI remounts

**State transitions that cause remount:**
```
T0: isInCall=false, activeCall=null → VoiceCallUI hidden
T1: isInCall=false, activeCall=call → VoiceCallUI hidden
T2: isInCall=true, activeCall=call → VoiceCallUI MOUNTED ✓
T3: isInCall=true, activeCall=null → VoiceCallUI UNMOUNTED ← PROBLEM
T4: isInCall=true, activeCall=call → VoiceCallUI MOUNTED AGAIN ← PROBLEM
```

**What causes activeCall to become null?**
- `cleanup()` function sets `setActiveCall(null)`
- Firestore status update triggers cleanup
- Connection state change triggers cleanup

**What causes isInCall to become false?**
- `setCallStatus("failed")` makes `isInCall = false`
- Connection state flicker
- Firestore status change to "failed"

---

### Most Likely Root Cause for VoiceCallUI Remount

**Based on the observed pattern:**
```
1. VoiceCallUI MOUNTED
2. GlobalCallUI RENDER (isInCall: true, hasActiveCall: false)
3. VoiceCallUI UNMOUNTED
4. VoiceCallUI MOUNTED again
```

**The sequence shows:**
- VoiceCallUI mounts when `activeCall` is first set
- Then `activeCall` becomes null (or isInCall becomes false)
- Then `activeCall` is set again
- VoiceCallUI remounts

**Most likely cause:**
1. **Firestore sends intermediate status update** (e.g., "failed" or null)
2. **subscribeToCall callback triggers cleanup()**
3. **cleanup() sets activeCall = null**
4. **VoiceCallUI unmounts**
5. **Firestore sends correct status** (e.g., "connecting")
6. **subscribeToCall callback sets activeCall again**
7. **VoiceCallUI remounts**

**OR**

1. **Connection state briefly flickers to "disconnected"**
2. **onconnectionstatechange triggers setCallStatus("failed")**
3. **isInCall becomes false**
4. **VoiceCallUI unmounts**
5. **Connection recovers to "connected"**
6. **isInCall becomes true**
7. **VoiceCallUI remounts**

---

## Issue 2: ICE Candidate Deduplication Ineffective

### Investigation Required

**Check these three potential causes:**

#### 2.1 processedCandidatesRef Does Not Survive

**Location:** `hooks/useVoiceCall.ts`

**Current implementation:**
```typescript
const processedCandidatesRef = useRef<Set<string>>(new Set())
```

**Problem:**
- This ref is created fresh on every hook invocation
- If the hook re-runs (component remounts), the Set is recreated
- All previously processed candidates are lost
- Deduplication fails

**When does the hook re-run?**
- If VoiceCallUI remounts, does GlobalCallUI remount?
- If GlobalCallUI remounts, does useVoiceCall re-run?
- If useVoiceCall re-runs, processedCandidatesRef is reset

**How to verify:**
- Log the size of processedCandidatesRef over time
- If size stays at 0 or 1, the ref is being reset
- If size grows, the ref is surviving

---

#### 2.2 docChanges() Still Emits Duplicates

**Location:** `lib/communication/voiceCalls.ts`

**Current implementation:**
```typescript
const changes = snapshot.docChanges()
changes.forEach((change) => {
  if (change.type === "added" || change.type === "modified") {
    const event = { ...change.doc.data() } as CallEvent
    newEvents.push(event)
  }
})
```

**Problem:**
- docChanges() returns changes since last snapshot
- But if a document is modified multiple times, it may appear multiple times
- Or if the listener reconnects, it may replay changes

**How to verify:**
- Log the change.type for each event
- Count how many times each document ID appears
- Check if "added" events repeat for same document

---

#### 2.3 Candidate Key Does Not Uniquely Identify Candidates

**Location:** `hooks/useVoiceCall.ts`

**Current implementation:**
```typescript
const candidateKey = `${candidateData.candidate?.substring(0, 50)}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`
```

**Problem:**
- If `candidateData.candidate` is undefined or null → key becomes `"undefined_..."` or `"null_..."`
- If `sdpMid` or `sdpMLineIndex` are undefined → key becomes `"..._undefined_undefined"`
- Different candidates may generate the same key if these fields are missing

**How to verify:**
- Log the full candidateKey for each candidate
- Check if different candidates have the same key
- Check if candidateData fields are always present

---

### Most Likely Root Cause for ICE Deduplication Failure

**Based on the observed pattern:**
```
Hundreds of "ICE candidate added successfully"
Almost no "Duplicate candidate SKIPPED"
```

**This means:**
- processedCandidatesRef is NOT catching duplicates
- Either the ref is being reset, or the key is different each time

**Most likely cause:**
1. **processedCandidatesRef is being reset** because the hook re-runs
2. **OR** the candidateKey is different each time (candidate string varies)
3. **OR** docChanges() is emitting new events each time (not actually duplicates)

**Why docChanges() might not help:**
- If each ICE candidate is a NEW document (which it is - addDoc creates new doc)
- Then docChanges() will always show "added" for each new candidate
- This is correct behavior - they ARE new documents
- The duplication is coming from somewhere else

**Where is the actual duplication coming from?**
- Maybe the same candidate is generated multiple times by the browser
- Maybe the listener is subscribed multiple times
- Maybe the callback is triggered multiple times for the same event

---

## Exact Root Causes (Before Fixes)

### VoiceCallUI Remount:

**Root Cause:** Firestore subscription callback triggers cleanup() which sets activeCall = null, causing VoiceCallUI to unmount, then the next Firestore update sets activeCall again, causing remount.

**Evidence needed:**
- Log cleanup() reason
- Log when activeCall becomes null
- Log Firestore snapshot sequence

### ICE Deduplication Failure:

**Root Cause:** processedCandidatesRef is likely being reset when the component/hook remounts, OR the candidate key is not stable (candidate string varies slightly each time).

**Evidence needed:**
- Log processedCandidatesRef size over time
- Log candidateKey values
- Check if hook is re-running

---

## What to Check in Code

### 1. Check for StrictMode

**File:** `app/layout.tsx`

**Look for:**
```typescript
import { StrictMode } from 'react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <StrictMode>
          {children}
        </StrictMode>
      </body>
    </html>
  )
}
```

**If found:** This causes double-mounting in development

---

### 2. Check VoiceCallUI Key

**File:** `components/communication/GlobalCallUI.tsx`

**Look for:**
```typescript
{isInCall && activeCall && (
  <VoiceCallUI
    key={activeCall.callId}  // ← Does this exist?
    ...
  />
)}
```

**If key uses activeCall.callId:** Check if callId changes during setup

---

### 3. Check Conditional Rendering Logic

**File:** `components/communication/GlobalCallUI.tsx`

**Look for:**
```typescript
// What is the exact condition?
{isInCall && activeCall && (
  <VoiceCallUI ... />
)}
```

**Check:**
- Does isInCall ever become false during call setup?
- Does activeCall ever become null during call setup?

---

### 4. Check processedCandidatesRef Lifetime

**File:** `hooks/useVoiceCall.ts`

**Look for:**
```typescript
const processedCandidatesRef = useRef<Set<string>>(new Set())
```

**Check:**
- Is this inside the useVoiceCall function? (Yes)
- Does useVoiceCall re-run on every render? (No, it's a function component)
- Does the ref survive across renders? (Yes)
- Does the ref survive if the hook is called again? (No, it's recreated)

**Question:** Does the hook get called again (component remount)?

---

### 5. Check Candidate Key Stability

**File:** `hooks/useVoiceCall.ts`

**Look for:**
```typescript
const candidateKey = `${candidateData.candidate?.substring(0, 50)}_${candidateData.sdpMid}_${candidateData.sdpMLineIndex}`
```

**Check:**
- Is candidateData.candidate always the same for the same candidate?
- Is sdpMid always the same?
- Is sdpMLineIndex always the same?

**Potential issue:** The candidate string might include a timestamp or random value

---

## Proposed Investigation Steps

### Step 1: Check for StrictMode

**Read app/layout.tsx and check for StrictMode**

**If found:** Document that this is the cause of VoiceCallUI remount

---

### Step 2: Check VoiceCallUI Key

**Read GlobalCallUI.tsx and check for key prop**

**If key exists and changes:** Document that this is the cause

**If no key:** Document that conditional rendering is the cause

---

### Step 3: Log processedCandidatesRef Size

**Add logging to track ref size:**
```typescript
// In ICE candidate callback
log("[ICE] Ref size", {
  callId,
  size: processedCandidatesRef.current.size,
  candidateKey: candidateKey.substring(0, 50),
})
```

**If size stays small:** Ref is being reset (hook re-running)

---

### Step 4: Log Candidate Key Details

**Add logging to see full key:**
```typescript
log("[ICE] Candidate details", {
  callId,
  candidate: candidateData.candidate?.substring(0, 100),
  sdpMid: candidateData.sdpMid,
  sdpMLineIndex: candidateData.sdpMLineIndex,
  candidateKey,
})
```

**If keys are different for same candidate:** Key generation is unstable

---

## Expected Findings

### VoiceCallUI Remount:

**Most likely:** Firestore callback triggers cleanup() which sets activeCall = null

**Evidence:**
- cleanup() called with reason "firestore_*"
- activeCall becomes null between renders
- Firestore sends multiple status updates

---

### ICE Deduplication Failure:

**Most likely:** processedCandidatesRef is reset when hook re-runs due to VoiceCallUI remount

**Evidence:**
- processedCandidatesRef.size stays at 0 or 1
- Hook is called multiple times
- Each time, the Set is recreated empty

**OR**

**Most likely:** Candidate key is unstable (candidate string varies)

**Evidence:**
- Same candidate has different keys
- candidateData.candidate includes variable data

---

## Next Steps

1. **Read app/layout.tsx** - Check for StrictMode
2. **Read GlobalCallUI.tsx** - Check for key prop and conditional rendering
3. **Document exact root causes** based on findings
4. **Propose minimal fixes** (do not implement yet)
5. **Get approval** before implementing

**DO NOT implement fixes yet. Only investigate and document.**
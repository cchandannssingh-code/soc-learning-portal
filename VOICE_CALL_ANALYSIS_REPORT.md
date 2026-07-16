# Voice Calling System - Comprehensive Technical Analysis Report

**Branch:** feature/voice-call  
**Commit:** b922b08fa63f88970a45b18ffaa027a1abd0c01f  
**Working Tree:** Clean (no uncommitted changes)  
**Analysis Date:** 2026-06-14  
**Analyst Mode:** READ-ONLY (No modifications made)

---

## Table of Contents

1. [Project Snapshot](#1-project-snapshot)
2. [Voice Call Architecture](#2-voice-call-architecture)
3. [Issue Analysis](#3-issue-analysis)
4. [Critical Investigation: WebRTC Signaling Error](#4-critical-investigation-webrtc-signaling-error)
5. [Logging Analysis](#5-logging-analysis)
6. [Risk Assessment](#6-risk-assessment)
7. [Deliverables](#7-deliverables)

---

## 1. Project Snapshot

### 1.1 Git Status
- **Current Branch:** `feature/voice-call`
- **Current Commit:** `b922b08fa63f88970a45b18ffaa027a1abd0c01f`
- **Working Tree:** Clean (no uncommitted changes)
- **Status:** Up to date with `origin/feature/voice-call`

### 1.2 Technology Stack

**Frontend:**
- Next.js 14+ (App Router)
- React 18+ with TypeScript
- Tailwind CSS for styling
- Client-side components ("use client" directives)

**Backend/Services:**
- **Firebase Firestore:** Primary signaling and state management
- **WebRTC:** Peer-to-peer audio streaming
- **No Socket.IO:** Signaling is entirely Firestore-based
- **No separate backend:** All logic is client-side with Firestore as the source of truth

**Key Libraries:**
- Firebase Firestore SDK (v9+ modular API)
- WebRTC API (native browser implementation)
- React hooks for state management

### 1.3 Project Structure - Voice Calling Components

```
hooks/
├── useVoiceCall.ts          # Main WebRTC hook (662 lines)
├── usePresence.ts           # Online presence management (110 lines)

lib/communication/
├── voiceCalls.ts            # Firestore operations for calls (261 lines)
├── presence.ts              # Firestore operations for presence (54 lines)

components/communication/
├── GlobalCallUI.tsx         # Global call UI wrapper (82 lines)
├── IncomingCallModal.tsx    # Incoming call modal (74 lines)
├── VoiceCallUI.tsx          # Active call UI (129 lines)
├── CallsTab.tsx             # Calls tab component (181 lines)
├── CommunicationHub.tsx     # Main hub container (221 lines)

types/
└── communication.ts         # TypeScript interfaces (82 lines)
```

### 1.4 Authentication Flow

**Current Implementation:**
- No explicit authentication in voice calling code
- Relies on `getUserId()` and `getUserName()` from `lib/user.ts`
- Assumes user is already authenticated via Firebase Auth
- User ID is passed as a parameter to hooks and components

**Authentication Gap:**
- No validation that user is authenticated before initiating calls
- No token refresh handling during calls
- No graceful degradation if auth expires mid-call

### 1.5 Gateway Flow

**Architecture:** Serverless (No Media Server)

```
Caller → Firestore (offer) → Firestore (notify) → Receiver
Receiver → Firestore (answer) → Firestore (notify) → Caller
Peers → Firestore (ICE candidates) → Peers
```

**Key Points:**
- Firestore acts as the signaling gateway
- No TURN/STUN server configuration beyond Google's public STUN
- No media relay (pure P2P)
- Firestore listeners provide real-time updates

### 1.6 Signaling Architecture

**Signaling Method:** Firestore Real-time Listeners

**Collections:**
1. **`voice_calls`** - Call documents
   - Document ID: Deterministic (`[user1, user2].sort().join("_")`)
   - Fields: participants, status, offer, answer, initiatorId, timestamps

2. **`voice_calls/{callId}/events`** - Subcollection for ICE candidates
   - Documents: type, userId, data, timestamp

**Signaling Flow:**
1. Caller creates document with status "ringing"
2. Caller updates document with SDP offer
3. Receiver listens for documents where:
   - `participants` array contains their userId
   - `status` == "ringing"
   - `initiatorId` != their userId
4. Receiver sets remote description, creates answer, updates document
5. Both parties exchange ICE candidates via events subcollection

### 1.7 Presence / Online User Architecture

**Implementation:** Firestore-based with heartbeat

**Collection:** `online_users`

**Mechanism:**
1. User sets document with `status: "online"` on login
2. Heartbeat updates `lastSeen` every 30 seconds
3. `beforeunload` event attempts to set `status: "offline"`
4. Subscription queries `where("status", "==", "online")`

**Critical Flaw:** No server-side stale user cleanup

### 1.8 State Management

**Approach:** React useState + useRef

**State Variables (useVoiceCall hook):**
- `activeCall: VoiceCall | null` - Current call document
- `incomingCall: VoiceCall | null` - Incoming call notification
- `callStatus: CallStatus` - Current state ("idle" | "ringing" | "connecting" | "connected" | "ended" | "failed" | etc.)
- `localStream: MediaStream | null` - Local audio stream
- `remoteStream: MediaStream | null` - Remote audio stream
- `isMuted: boolean` - Mute state
- `callDuration: number` - Call timer in seconds
- `error: string | null` - Error messages

**Ref Variables:**
- `peerConnectionRef` - RTCPeerConnection instance
- `callEventsUnsubscribeRef` - Firestore listener cleanup
- `incomingCallsUnsubscribeRef` - Incoming calls listener cleanup
- `activeCallUnsubscribeRef` - Active call listener cleanup
- `callTimerRef` - Call duration interval
- `ringtoneRef` - Ringtone audio context
- `isInitiatorRef` - Boolean flag for call initiator
- `currentCallIdRef` - Current call ID tracking
- `isCleaningUpRef` - Cleanup recursion guard
- `callStatusRef` - Ref mirror of callStatus state

### 1.9 Firestore Collections Involved

**1. `voice_calls` (Main Collection)**
```
Document Structure:
{
  callId: string (deterministic ID)
  participants: string[] (array of 2 user IDs)
  participantNames: Record<string, string>
  status: CallStatus ("ringing" | "connecting" | "connected" | "ended" | "failed" | "rejected" | "cancelled" | "timeout")
  initiatorId: string
  startedAt: Date
  endedAt?: Date
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}
```

**2. `voice_calls/{callId}/events` (Subcollection)**
```
Document Structure:
{
  id?: string
  type: "ice-candidate" | "offer" | "answer" | "end-call"
  userId: string
  data: any (RTCIceCandidateInit for ICE candidates)
  timestamp: Date
}
```

**3. `online_users` (Presence Collection)**
```
Document Structure:
{
  userId: string (document ID)
  userName: string
  status: "online" | "offline"
  lastSeen: Timestamp (server timestamp)
}
```

### 1.10 Important Hooks/Components/Services

**Hooks:**
- `useVoiceCall(userId, userName)` - Main voice call logic (662 lines)
- `usePresence(userId, userName)` - Online presence management (110 lines)

**Services (lib/communication/):**
- `voiceCalls.ts` - Firestore CRUD for calls
- `presence.ts` - Firestore CRUD for presence

**Components:**
- `GlobalCallUI` - Mounts once at app root, renders modals/overlays
- `IncomingCallModal` - Shows when receiving a call
- `VoiceCallUI` - Shows during active call
- `CallsTab` - Call history and controls
- `CommunicationHub` - Container for all communication features

---

## 2. Voice Call Architecture

### 2.1 Complete Call Lifecycle

#### Phase 1: Call Initiation (Caller)

```
1. User clicks "Call" button
   ↓
2. initiateCall(targetUserId, targetUserName) called
   ↓
3. Validation checks:
   - User authenticated?
   - Not calling self?
   - Not already in call?
   ↓
4. Create Firestore document:
   - callId = getCallId(userId, targetUserId)
   - status = "ringing"
   - participants = [userId, targetUserId]
   ↓
5. Get local media stream:
   - navigator.mediaDevices.getUserMedia({ audio: {...} })
   - Constraints: echoCancellation, noiseSuppression, autoGainControl
   ↓
6. Create RTCPeerConnection:
   - ICE servers: Google STUN (stun.l.google.com:19302, stun1.l.google.com:19302)
   - Set up ontrack handler
   - Set up onicecandidate handler
   - Set up connection state handlers
   ↓
7. Add local tracks to PeerConnection:
   - stream.getTracks().forEach(track => pc.addTrack(track, stream))
   ↓
8. Create offer:
   - const offer = await pc.createOffer()
   - await pc.setLocalDescription(offer)
   ↓
9. Store offer in Firestore:
   - updateCallWithOffer(callId, offer)
   - status remains "ringing"
   ↓
10. Subscribe to call updates:
    - Listen for status changes (connecting, connected, ended, failed, etc.)
    ↓
11. Subscribe to call events (ICE candidates):
    - Listen to events subcollection
    - Add received ICE candidates to PeerConnection
    ↓
12. Set call status to "ringing"
    ↓
13. Start 30-second timeout
```

#### Phase 2: Call Reception (Receiver)

```
1. subscribeToIncomingCalls listener fires:
   - Query: participants array-contains userId AND status == "ringing" AND initiatorId != userId
   ↓
2. Set incomingCall state
   ↓
3. Set callStatus to "ringing"
   ↓
4. Play ringtone (Web Audio API oscillator)
   ↓
5. User sees IncomingCallModal
```

#### Phase 3: Call Acceptance (Receiver)

```
1. User clicks "Accept"
   ↓
2. acceptCall() called
   ↓
3. Stop ringtone
   ↓
4. Get local media stream (getUserMedia)
   ↓
5. Create new RTCPeerConnection
   ↓
6. Add local tracks
   ↓
7. Set remote description (offer):
   - await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
   ↓
8. Create answer:
   - const answer = await pc.createAnswer()
   ↓
9. Set local description:
   - await pc.setLocalDescription(answer)
   ↓
10. Store answer in Firestore:
    - updateCallWithAnswer(callId, answer)
    - status changes to "connecting"
    ↓
11. Subscribe to call updates
    ↓
12. Subscribe to call events (ICE candidates)
    ↓
13. Set callStatus to "connecting"
    ↓
14. Clear incomingCall state
```

#### Phase 4: ICE Candidate Exchange

```
Both parties simultaneously:

1. onicecandidate event fires:
   - pc.onicecandidate = async (event) => {
       if (event.candidate) {
         await addIceCandidate(callId, event.candidate.toJSON(), userId)
       }
     }
   ↓
2. Store candidate in Firestore events subcollection
   ↓
3. Other party's listener receives event:
   - events.forEach(event => {
       if (event.type === "ice-candidate" && event.userId !== userId) {
         pc.addIceCandidate(new RTCIceCandidate(event.data))
       }
     })
   ↓
4. Process continues until all candidates exchanged
```

#### Phase 5: Connection Establishment

```
1. ICE connection state changes to "connected" or "completed"
   ↓
2. ontrack event fires (receiver only):
   - pc.ontrack = (event) => {
       if (event.streams && event.streams[0]) {
         setRemoteStream(event.streams[0])
       }
     }
   ↓
3. Caller's status updated to "connected" via Firestore listener
   ↓
4. Receiver's status updated to "connected" via Firestore listener
   ↓
5. Both parties set callStatus to "connected"
   ↓
6. Call timer starts
```

#### Phase 6: Active Call

```
1. Audio streams flowing P2P
2. User can toggle mute (audioTrack.enabled = !audioTrack.enabled)
3. Call duration updates every second
4. Connection quality indicator shows based on duration
```

#### Phase 7: Call Termination

```
Option A: End Call (either party)
1. User clicks "End Call"
2. endActiveCall() called
3. await endCall(activeCall.callId)
   - Updates Firestore: status = "ended", endedAt = new Date()
4. cleanup() called:
   - Clear timer
   - Close PeerConnection
   - Stop local stream tracks
   - Unsubscribe from Firestore listeners
   - Stop ringtone
   - Reset all state
5. Set callStatus to "ended"
6. Reset to "idle" after 2 seconds

Option B: Reject (receiver only)
1. User clicks "Decline"
2. rejectIncomingCall() called
3. await rejectCall(incomingCall.callId)
   - Updates Firestore: status = "rejected"
4. Stop ringtone
5. Reset state
6. Set callStatus to "rejected"
7. Reset to "idle" after 2 seconds

Option C: Cancel (caller only)
1. User clicks "Cancel" while ringing
2. cancelOutgoingCall() called
3. await cancelCall(activeCall.callId)
   - Updates Firestore: status = "cancelled"
4. cleanup() called
5. Set callStatus to "cancelled"
6. Reset to "idle" after 2 seconds

Option D: Timeout
1. 30-second timer expires
2. If still ringing:
   - setCallStatus("timeout")
   - cancelCall(callId)
   - cleanup() after 1 second
3. Set callStatus to "timeout"
4. Reset to "idle" after 2 seconds

Option E: Browser Close
1. beforeunload event fires
2. endCall(activeCall.callId) called (fire and forget)
3. No await possible in beforeunload
```

#### Phase 8: Cleanup and Ready for Next Call

```
1. All Firestore listeners unsubscribed
2. PeerConnection closed
3. MediaStream tracks stopped
4. Timers cleared
5. State reset to initial values
6. currentCallIdRef cleared
7. Hook ready for next call
```

### 2.2 Sequence Diagram

```
┌─────────┐                    ┌─────────┐                    ┌─────────┐
│ Caller  │                    │Firestore│                    │Receiver │
└────┬────┘                    └────┬────┘                    └────┬────┘
     │                             │                               │
     │ 1. createVoiceCall()        │                               │
     │────────────────────────────>│                               │
     │  (status: ringing)          │                               │
     │                             │                               │
     │ 2. getUserMedia()           │                               │
     │                             │                               │
     │ 3. createPeerConnection()   │                               │
     │                             │                               │
     │ 4. addTrack()               │                               │
     │                             │                               │
     │ 5. createOffer()            │                               │
     │ 6. setLocalDescription()    │                               │
     │                             │                               │
     │ 7. updateCallWithOffer()    │                               │
     │────────────────────────────>│                               │
     │  (offer stored)             │                               │
     │                             │                               │
     │ 8. subscribeToCall()        │                               │
     │<────────────────────────────│                               │
     │                             │                               │
     │ 9. subscribeToEvents()      │                               │
     │<────────────────────────────│                               │
     │                             │                               │
     │                             │ 10. onSnapshot fires           │
     │                             │───────────────────────────────>│
     │                             │  (new ringing call)            │
     │                             │                               │
     │                             │                   11. Show UI │
     │                             │                    User sees │
     │                             │                    modal    │
     │                             │                               │
     │                             │                   12. Accept  │
     │                             │<───────────────────────────────│
     │                             │                               │
     │                             │                   13. getUserMedia()
     │                             │                               │
     │                             │                   14. createPeerConnection()
     │                             │                               │
     │                             │                   15. addTrack()
     │                             │                               │
     │                             │                   16. setRemoteDescription(offer)
     │                             │                               │
     │                             │                   17. createAnswer()
     │                             │                   18. setLocalDescription()
     │                             │                               │
     │                             │ 19. updateCallWithAnswer()     │
     │                             │<───────────────────────────────│
     │                             │  (status: connecting)          │
     │                             │                               │
     │ 20. onSnapshot fires        │                               │
     │<────────────────────────────│                               │
     │  (status: connecting)       │                               │
     │                             │                               │
     │ 21. ICE candidates exchange (both directions)                   │
     │<───────────────────────────>│<─────────────────────────────>│
     │                             │                               │
     │ 22. ontrack event           │                               │
     │<────────────────────────────│                               │
     │  (remote stream received)   │                               │
     │                             │                               │
     │ 23. Connection established   │                               │
     │                             │                   24. ontrack │
     │                             │                       event  │
     │                             │                               │
     │ 25. onSnapshot fires         │                               │
     │<────────────────────────────│                               │
     │  (status: connected)        │                               │
     │                             │ 26. onSnapshot fires           │
     │                             │───────────────────────────────>│
     │                             │  (status: connected)           │
     │                             │                               │
     │ 27. Call active             │                   28. Call active
     │                             │                               │
     │ 29. End call                │                               │
     │────────────────────────────>│                               │
     │  (status: ended)            │                               │
     │                             │ 30. onSnapshot fires           │
     │<────────────────────────────│                               │
     │                             │───────────────────────────────>│
     │                             │  (status: ended)               │
     │                             │                               │
     │ 31. Cleanup                 │                   32. Cleanup
     │                             │                               │
     │ 33. Ready for next call     │                   34. Ready for next call
     │                             │                               │
```

---

## 3. Issue Analysis

### Issue 1: Call connects but neither user can hear audio

#### Investigation Findings

**3.1.1 getUserMedia**
- **Location:** `hooks/useVoiceCall.ts` lines 324-330, 435-441
- **Status:** ✅ Correctly implemented
- **Constraints:** echoCancellation, noiseSuppression, autoGainControl all enabled
- **Error Handling:** Catches NotAllowedError and NotFoundError

**3.1.2 Audio Permissions**
- **Status:** ✅ Requested via getUserMedia
- **Issue:** No verification that permission was granted before proceeding
- **Risk:** If permission is pending, stream may be null

**3.1.3 MediaStream Lifecycle**
- **Location:** `hooks/useVoiceCall.ts` lines 142-150
- **Status:** ⚠️ Partially correct
- **Issue:** Stream is stopped in cleanup, but no validation that tracks are active
- **Risk:** Tracks may be in "ended" state without detection

**3.1.4 addTrack()**
- **Location:** `hooks/useVoiceCall.ts` lines 337-339, 448-450
- **Status:** ✅ Correctly implemented
- **Code:**
  ```typescript
  stream.getTracks().forEach((track) => {
    pc.addTrack(track, stream)
  })
  ```

**3.1.5 replaceTrack()**
- **Status:** ❌ NOT USED
- **Issue:** No track replacement logic for renegotiation
- **Impact:** May cause issues if tracks need to be replaced mid-call

**3.1.6 ontrack Event**
- **Location:** `hooks/useVoiceCall.ts` lines 265-269
- **Status:** ⚠️ CRITICAL ISSUE FOUND
- **Code:**
  ```typescript
  pc.ontrack = (event) => {
    if (event.streams && event.streams[0]) {
      setRemoteStream(event.streams[0])
    }
  }
  ```
- **Problem:** The remote stream is stored in state, BUT NEVER ATTACHED TO AN AUDIO ELEMENT
- **Impact:** Audio data is received but never played

**3.1.7 Audio Element Creation**
- **Location:** `components/communication/VoiceCallUI.tsx`
- **Status:** ❌ MISSING
- **Issue:** Component receives `remoteStream` prop but never creates an audio element
- **Code Analysis:**
  ```typescript
  interface VoiceCallUIProps {
    // ...
    remoteStream: MediaStream | null
  }
  
  export default function VoiceCallUI({ ..., remoteStream }: VoiceCallUIProps) {
    // remoteStream is used ONLY for UI indicator (line 51)
    // NO audio element creation
    // NO audio playback logic
  }
  ```

**3.1.8 Audio Playback**
- **Status:** ❌ NOT IMPLEMENTED
- **Root Cause:** No code exists to play the remote stream
- **Required Implementation:**
  ```typescript
  // Missing code that should exist:
  useEffect(() => {
    if (remoteStream) {
      const audio = new Audio()
      audio.srcObject = remoteStream
      audio.play()
    }
  }, [remoteStream])
  ```

**3.1.9 Autoplay Restrictions**
- **Status:** ⚠️ Not addressed
- **Issue:** Modern browsers block autoplay without user interaction
- **Solution Required:** Audio playback must be triggered by user gesture (e.g., "Accept" button click)

**3.1.10 ICE Candidate Exchange**
- **Location:** `hooks/useVoiceCall.ts` lines 255-263, 370-381
- **Status:** ✅ Implemented
- **Issue:** No validation that all candidates are exchanged before connection
- **Risk:** Connection may establish before all candidates are exchanged

**3.1.11 ICE Servers**
- **Location:** `hooks/useVoiceCall.ts` lines 19-24
- **Status:** ⚠️ Limited configuration
- **Current:**
  ```typescript
  const ICE_SERVERS = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }
  ```
- **Issue:** No TURN servers configured
- **Impact:** Calls will fail if direct P2P connection cannot be established (symmetrical NAT, firewalls)

**3.1.12 PeerConnection Configuration**
- **Status:** ⚠️ Minimal configuration
- **Missing:**
  - No `iceTransportPolicy` (should be "all" or "relay")
  - No `bundlePolicy` configuration
  - No media constraints beyond audio

**3.1.13 SDP Negotiation**
- **Status:** ✅ Standard offer/answer model
- **Issue:** No validation of SDP content
- **Risk:** Invalid SDP may cause connection failures

**3.1.14 Muted Tracks**
- **Location:** `hooks/useVoiceCall.ts` lines 581-589
- **Status:** ✅ Implemented
- **Implementation:** `audioTrack.enabled = !audioTrack.enabled`
- **Note:** This mutes at track level, not stream level

**3.1.15 Browser Compatibility**
- **Status:** ⚠️ Not addressed
- **Issue:** No feature detection or polyfills
- **Risk:** May fail on older browsers

#### Root Cause Determination

**PRIMARY ROOT CAUSE:** Missing audio element creation and playback

The remote stream is successfully received via the `ontrack` event and stored in React state, but there is NO code to:
1. Create an HTMLAudioElement
2. Attach the remote stream to the audio element
3. Call `audio.play()` to start playback

**SECONDARY ISSUES:**
1. No TURN servers (calls fail in restrictive network environments)
2. No autoplay policy handling (browsers may block playback)
3. No audio element cleanup (potential memory leak)

**Confidence Level:** HIGH (95%+)

The error is deterministic and reproducible. The code path is clear:
- `ontrack` → `setRemoteStream()` → Component receives prop → NO FURTHER ACTION

---

### Issue 2: Users cannot cancel/hang up while the call is still ringing

#### Investigation Findings

**3.2.1 Current Call State Machine**

**States Defined:** `"idle" | "ringing" | "connecting" | "connected" | "ended" | "failed" | "busy" | "rejected" | "cancelled" | "timeout" | "permission_denied"`

**State Transitions:**
```
idle → ringing (caller initiates)
idle → ringing (receiver receives call)
ringing → connecting (receiver accepts)
ringing → cancelled (caller cancels)
ringing → timeout (30s expires)
ringing → rejected (receiver declines)
connecting → connected (WebRTC connects)
connecting → failed (connection fails)
connected → ended (either party ends)
any → failed (connection lost)
```

**3.2.2 Pending Call State**
- **Status:** ❌ NO DEDICATED STATE
- **Issue:** "ringing" state is used for both:
  - Outgoing calls (caller waiting for answer)
  - Incoming calls (receiver waiting for decision)
- **Impact:** Cannot distinguish between caller and receiver in "ringing" state

**3.2.3 Incoming Call State**
- **State:** `incomingCall: VoiceCall | null`
- **Status:** ✅ Properly managed
- **UI:** IncomingCallModal shown when `incomingCall && callStatus === "ringing"`

**3.2.4 Outgoing Call State**
- **State:** `activeCall: VoiceCall | null`
- **Status:** ✅ Properly managed
- **UI:** CallsTab shows controls when `callStatus !== "idle" && !isInCall`

**3.2.5 Ringing State**
- **Location:** `hooks/useVoiceCall.ts` line 53
- **Status:** ⚠️ Ambiguous
- **Issue:** Same state used for both incoming and outgoing calls
- **Detection:** `isRinging: callStatus === "ringing" && !isInitiatorRef.current`

**3.2.6 Missing Signaling Events**
- **Status:** ❌ NO CANCEL EVENT FOR CALLER
- **Issue:** When caller cancels, only Firestore document is updated
- **Missing:** No event sent to receiver to stop ringtone
- **Impact:** Receiver continues ringing until timeout

**3.2.7 UI State**
- **Location:** `components/communication/CallsTab.tsx` lines 159-172
- **Code:**
  ```typescript
  {(callStatus === "ringing" || callStatus === "connecting") && (
    <button
      onClick={callStatus === "ringing" ? rejectCall : endCall}
      className="..."
    >
      Cancel
    </button>
  )}
  ```
- **Issue:** Button calls `rejectCall` when ringing, but `rejectCall` is for INCOMING calls
- **Bug:** For outgoing calls, should call `cancelCall` instead

**3.2.8 Missing Cancel Event**
- **Location:** `lib/communication/voiceCalls.ts`
- **Status:** ❌ NO CANCEL EVENT TYPE
- **Current Event Types:** "offer" | "answer" | "ice-candidate" | "end-call"
- **Missing:** No "cancel-call" event
- **Impact:** Receiver is not notified when caller cancels

**3.2.9 Missing Reject Event**
- **Status:** ❌ NO REJECT EVENT TYPE
- **Same issue as cancel**

**3.2.10 Firestore Synchronization**
- **Status:** ⚠️ One-way only
- **Issue:** Status updates are synced, but no real-time events for cancel/reject
- **Current:** Receiver must poll call document to see status change
- **Problem:** `subscribeToIncomingCalls` only queries `status == "ringing"`
- **Impact:** When caller cancels (status → "cancelled"), receiver's listener stops firing
- **Result:** Receiver has no way to know call was cancelled

#### Root Cause Determination

**PRIMARY ROOT CAUSE:** UI logic error in CallsTab

The cancel button in `CallsTab.tsx` (line 161) calls `rejectCall` when `callStatus === "ringing"`, but:
- `rejectCall` is designed for INCOMING calls (updates status to "rejected")
- For OUTGOING calls, should call `cancelCall` (updates status to "cancelled")
- The hook exposes `cancelCall` as `cancelOutgoingCall` (line 656)

**SECONDARY ROOT CAUSE:** Missing event notification system

There is no mechanism to notify the other party of cancel/reject actions:
1. No "cancel-call" or "reject-call" event type
2. Receiver's `subscribeToIncomingCalls` listener stops when status changes from "ringing"
3. Receiver must manually check call document (not implemented)

**TERTIARY ISSUE:** Ambiguous state machine

The "ringing" state is used for both incoming and outgoing calls, making it difficult to:
- Determine which action to take (cancel vs reject)
- Show appropriate UI (caller UI vs receiver UI)
- Handle edge cases correctly

**Confidence Level:** HIGH (90%+)

The bug is in the UI layer (CallsTab.tsx), but the underlying architecture also lacks proper event notification.

---

### Issue 3: Second call between the same users never works

#### Investigation Findings

**3.3.1 PeerConnection Cleanup**
- **Location:** `hooks/useVoiceCall.ts` lines 136-139
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  if (peerConnectionRef.current) {
    peerConnectionRef.current.close()
    peerConnectionRef.current = null
  }
  ```
- **Issue:** Closed but not checked for proper closure

**3.3.2 MediaStream Cleanup**
- **Location:** `hooks/useVoiceCall.ts` lines 142-150
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      try {
        track.stop()
      } catch (e) {
        console.error("Error stopping track:", e)
      }
    })
  }
  ```
- **Issue:** No validation that tracks are actually stopped

**3.3.3 Event Listener Cleanup**
- **Location:** `hooks/useVoiceCall.ts` lines 153-164
- **Status:** ✅ Implemented
- **Code:** Unsubscribes from all Firestore listeners
- **Issue:** No validation that unsubscription succeeded

**3.3.4 Firestore Listener Cleanup**
- **Status:** ✅ Implemented (same as above)
- **Issue:** Listeners are unsubscribed, but documents remain in Firestore

**3.3.5 Active Call Documents**
- **Location:** `lib/communication/voiceCalls.ts`
- **Status:** ❌ CRITICAL ISSUE
- **Problem:** Call documents are NEVER deleted
- **Code Analysis:**
  - `endCall()` - Updates status to "ended"
  - `rejectCall()` - Updates status to "rejected"
  - `cancelCall()` - Updates status to "cancelled"
  - `deleteCall()` - EXISTS (line 244-247) but NEVER CALLED
- **Impact:** Old call documents persist in Firestore forever

**3.3.6 ICE Cleanup**
- **Status:** ❌ NOT IMPLEMENTED
- **Issue:** ICE candidates in events subcollection are never cleaned up
- **Impact:** Stale ICE candidates remain in Firestore

**3.3.7 SDP Cleanup**
- **Status:** ❌ NOT IMPLEMENTED
- **Issue:** offer and answer fields remain in call document
- **Impact:** Second call may reuse stale SDP

**3.3.8 Socket/Firebase Subscriptions**
- **Status:** ✅ Cleaned up in cleanup()
- **Issue:** No validation that cleanup completed successfully

**3.3.9 React State Reset**
- **Location:** `hooks/useVoiceCall.ts` lines 172-179
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  setLocalStream(null)
  setRemoteStream(null)
  setCallDuration(0)
  setIsMuted(false)
  setError(null)
  setActiveCall(null)
  setIncomingCall(null)
  currentCallIdRef.current = null
  ```
- **Issue:** State reset happens, but document persists

**3.3.10 References That Survive Previous Calls**

**CRITICAL FINDING:** Deterministic Call ID

**Location:** `lib/communication/voiceCalls.ts` lines 26-28
```typescript
export function getCallId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_")
}
```

**Problem:** Same two users always get the same call ID

**Impact:**
1. First call creates document with ID "userA_userB"
2. First call ends, document remains with status "ended"
3. Second call tries to create document with same ID
4. `createVoiceCall()` uses `setDoc()` with `{ merge: true }` (line 54)
5. New call data MERGES with old call data
6. Old offer/answer from first call remains in document
7. Receiver gets stale offer from first call
8. WebRTC tries to use old SDP → FAILS

**Code Evidence:**
```typescript
// Line 39-54 in voiceCalls.ts
const callId = getCallId(initiatorId, targetUserId) // Same ID for same users
const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)

const callData: Partial<VoiceCall> = {
  callId,
  participants: [initiatorId, targetUserId],
  // ... other fields
  status: "ringing",
}

await setDoc(callRef, callData, { merge: true }) // MERGES with existing!
```

**Additional Issue:** No document deletion
- `deleteCall()` function exists (line 244-247) but is NEVER called
- Old documents accumulate indefinitely

#### Root Cause Determination

**PRIMARY ROOT CAUSE:** Deterministic call ID + merge strategy

The combination of:
1. Deterministic call IDs (same users = same ID)
2. `setDoc()` with `{ merge: true }`
3. No document deletion

Results in:
- Second call reuses document from first call
- Stale SDP (offer/answer) from first call remains
- New call tries to use old SDP → WebRTC negotiation fails

**SECONDARY ROOT CAUSE:** No cleanup of old data

Even if call ID was random, old documents would accumulate:
- No TTL (time-to-live) on documents
- No Cloud Function to delete old calls
- No manual deletion in cleanup logic

**TERTIARY ISSUE:** Stale ICE candidates

ICE candidates from first call remain in events subcollection and may interfere with second call.

**Confidence Level:** HIGH (95%+)

The issue is deterministic and reproducible. The code clearly shows:
1. Deterministic ID generation
2. Merge strategy in setDoc
3. No deletion logic

---

### Issue 4: Users who were online in the past continue to appear online

#### Investigation Findings

**3.4.1 Presence Implementation**
- **Location:** `lib/communication/presence.ts`
- **Collection:** `online_users`
- **Document ID:** User ID

**3.4.2 Heartbeat**
- **Location:** `hooks/usePresence.ts` lines 40-48
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  const heartbeatInterval = setInterval(async () => {
    try {
      await updateLastSeen(userId)
      setError(null)
    } catch (err) {
      console.error("Heartbeat failed:", err)
      setError("Connection issue")
    }
  }, 30000)
  ```
- **Issue:** Updates `lastSeen` but doesn't validate user is actually online

**3.4.3 Last Seen Updates**
- **Location:** `lib/communication/presence.ts` lines 17-22
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  export async function updateLastSeen(userId: string): Promise<void> {
    const userRef = doc(collection(db, COLLECTION), userId)
    await setDoc(userRef, {
      lastSeen: serverTimestamp(),
    }, { merge: true })
  }
  ```
- **Issue:** Updates timestamp but doesn't change status

**3.4.4 Browser Close Handling**
- **Location:** `hooks/usePresence.ts` lines 62-66
- **Status:** ⚠️ Best-effort only
- **Code:**
  ```typescript
  const handleBeforeUnload = () => {
    setOffline(userId).catch(() => {
      // Silently fail - server will clean up stale users
    })
  }
  ```
- **Issue 1:** `beforeunload` is not guaranteed to fire (crash, network loss, battery death)
- **Issue 2:** Comment says "server will clean up stale users" but NO SERVER CODE EXISTS
- **Issue 3:** Cannot await in beforeunload (fire and forget)

**3.4.5 Browser Refresh Handling**
- **Status:** ⚠️ Same as browser close
- **Issue:** `beforeunload` fires, but request may not complete before page unloads

**3.4.6 Firebase onDisconnect()**
- **Status:** ❌ NOT USED
- **Issue:** Firebase Realtime Database has `onDisconnect()` but Firestore DOES NOT
- **Impact:** No automatic cleanup when user disconnects

**3.4.7 Listener Cleanup**
- **Location:** `hooks/usePresence.ts` lines 72-77
- **Status:** ✅ Implemented
- **Code:**
  ```typescript
  return () => {
    window.removeEventListener("beforeunload", handleBeforeUnload)
    window.removeEventListener("online", handleOnline)
    window.removeEventListener("offline", handleOffline)
    clearInterval(heartbeatInterval)
  }
  ```
- **Issue:** Cleanup happens on unmount, but no offline status set

**3.4.8 Stale User Cleanup**
- **Status:** ❌ NOT IMPLEMENTED
- **Issue:** No mechanism to remove stale users
- **Expected:** Cloud Function or scheduled job to mark users offline if lastSeen > threshold
- **Reality:** No such function exists

**3.4.9 Firestore Presence Documents**
- **Location:** `lib/communication/presence.ts` lines 7-15
- **Code:**
  ```typescript
  export async function setOnline(userId: string, userName: string): Promise<void> {
    const userRef = doc(collection(db, COLLECTION), userId)
    await setDoc(userRef, {
      userId,
      userName,
      status: "online",
      lastSeen: serverTimestamp(),
    }, { merge: true })
  }
  ```
- **Issue:** Document is created/updated but never deleted
- **Impact:** Stale documents remain forever

**Subscription Query:**
```typescript
const q = query(collection(db, COLLECTION), where("status", "==", "online"))
```
- **Issue:** Only queries for `status == "online"`
- **Problem:** If status is never set to "offline", user remains in results forever

#### Root Cause Determination

**PRIMARY ROOT CAUSE:** No server-side stale user cleanup

The comment in `handleBeforeUnload` (line 64) states "server will clean up stale users" but:
1. No Cloud Function exists to perform cleanup
2. No scheduled job exists to check for stale users
3. No TTL (time-to-live) policy on documents
4. Firestore does not have `onDisconnect()` like Realtime Database

**SECONDARY ROOT CAUSE:** Unreliable client-side cleanup

`beforeunload` event:
1. Not guaranteed to fire (crashes, network loss, battery death)
2. Cannot await async operations
3. Request may not complete before page unloads

**TERTIARY ISSUE:** No status validation

The subscription query only checks `status == "online"` but:
- No validation that `lastSeen` is recent
- No timeout-based status update
- A user who hasn't been seen for 7 days still shows as "online"

**Confidence Level:** HIGH (100%)

The issue is by design - the system relies on client-side cleanup that is unreliable, with no server-side fallback.

---

## 4. Critical Investigation: WebRTC Signaling Error

### 4.1 Error Details

**Error:** `InvalidStateError: Cannot create answer in stable`  
**Location:** `hooks/useVoiceCall.ts`, `acceptCall()` function  
**Line:** ~458 (const answer = await pc.createAnswer())

**Expected Signaling State:** `have-remote-offer`  
**Actual Signaling State:** `stable`

### 4.2 Expected Signaling Flow

**Caller:**
```
1. createOffer() → signalingState: stable
2. setLocalDescription(offer) → signalingState: stable
3. Send offer via Firestore
```

**Receiver:**
```
1. Receive offer from Firestore
2. setRemoteDescription(offer) → signalingState: have-remote-offer
3. createAnswer() → signalingState: have-local-offer
4. setLocalDescription(answer) → signalingState: stable
5. Send answer via Firestore
```

### 4.3 Actual Code Analysis

**Location:** `hooks/useVoiceCall.ts` lines 419-511 (acceptCall function)

**Step-by-step execution:**

```typescript
// Line 445: Create peer connection
const pc = createPeerConnection(callId)

// Line 448-450: Add local tracks
stream.getTracks().forEach((track) => {
  pc.addTrack(track, stream)
})

// Line 453-455: Set remote description (offer)
if (incomingCall.offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
}

// Line 458: Create answer
const answer = await pc.createAnswer() // ❌ ERROR HERE

// Line 459: Set local description
await pc.setLocalDescription(answer)
```

### 4.4 Root Cause Analysis

**CRITICAL FINDING:** Conditional setRemoteDescription

**Line 453:**
```typescript
if (incomingCall.offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
}
```

**Problem:** `setRemoteDescription()` is only called if `incomingCall.offer` is truthy

**Scenarios where offer is null/undefined:**

1. **Race Condition:**
   - Receiver's `subscribeToIncomingCalls` fires
   - Call document exists but offer hasn't been written yet
   - `incomingCall.offer` is undefined
   - `setRemoteDescription()` is skipped
   - `createAnswer()` called in "stable" state → ERROR

2. **Firestore Latency:**
   - Caller creates document (status: "ringing")
   - Caller writes offer (separate updateDoc call)
   - Firestore may deliver document before offer field is populated
   - Receiver sees document with status "ringing" but no offer

3. **Network Delay:**
   - Document and offer updates are separate Firestore operations
   - They may arrive out of order
   - Receiver may process document before offer

**Code Evidence:**

**Caller Side (initiateCall):**
```typescript
// Line 320: Create call document
const callId = await createVoiceCall(userId, userName, targetUserId, targetUserName)
// Document created with status: "ringing", NO offer yet

// Line 342-343: Create offer
const offer = await pc.createOffer()
await pc.setLocalDescription(offer)

// Line 346: Update with offer
await updateCallWithOffer(callId, offer)
// Separate Firestore operation
```

**Timing Issue:**
```
T0: createVoiceCall() → Firestore: { status: "ringing" }
                          ↓
T1: [Network latency]
                          ↓
T2: Receiver's subscribeToIncomingCalls fires
    incomingCall = { status: "ringing", offer: undefined }
                          ↓
T3: [More latency]
                          ↓
T4: updateCallWithOffer() → Firestore: { offer: {...} }
```

**Receiver processes at T2, before offer exists at T4.**

### 4.5 Additional Issues Found

**4.5.1 No Validation**
- No check that `incomingCall.offer` exists before proceeding
- No error message if offer is missing
- No retry logic

**4.5.2 No Error Handling**
```typescript
if (incomingCall.offer) {
  await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
}
// If offer is undefined, silently skip
// Then createAnswer() fails with InvalidStateError
```

**4.5.3 Multiple PeerConnections**
- **Status:** ⚠️ Potential issue
- **Code:** New PeerConnection created for every call
- **Issue:** If cleanup fails, old PeerConnection may still exist
- **Risk:** Multiple PeerConnections trying to use same resources

**4.5.4 Duplicate Listeners**
- **Status:** ⚠️ Possible issue
- **Code:** `subscribeToIncomingCalls` has dependency array `[userId]` (line 249)
- **Issue:** If userId changes, listener resubscribes
- **Risk:** Multiple listeners may fire simultaneously

**4.5.5 Previous Call Cleanup**
- **Status:** ⚠️ Incomplete
- **Issue:** Cleanup is async but not awaited in some places
- **Example:** Line 362: `setTimeout(() => cleanup(), 1000)`
- **Risk:** New call may start before old call is fully cleaned up

**4.5.6 Race Conditions**
- **Status:** ❌ Multiple race conditions exist
1. Offer write vs. document creation (described above)
2. Cleanup completion vs. new call initiation
3. Firestore listener firing vs. state updates

**4.5.7 Firestore Updates Out of Order**
- **Status:** ❌ Not handled
- **Issue:** No versioning or sequence numbers
- **Impact:** Updates may arrive out of order

**4.5.8 Negotiation Triggered Multiple Times**
- **Status:** ⚠️ Possible
- **Issue:** No lock or flag to prevent renegotiation
- **Risk:** Multiple createOffer/createAnswer cycles

### 4.6 State Transition Analysis

**signalingState Transitions:**

**Normal Flow:**
```
stable → (setRemoteDescription) → have-remote-offer
have-remote-offer → (createAnswer) → have-local-offer
have-local-offer → (setLocalDescription) → stable
```

**Actual Flow (with bug):**
```
stable → (createAnswer called without setRemoteDescription) → ERROR
```

**connectionState Transitions:**
- `new` → `connecting` → `connected` → `disconnected` → `failed`
- **Status:** ✅ Monitored in code (lines 271-279)

**iceConnectionState Transitions:**
- `new` → `checking` → `connected` → `completed` → `disconnected` → `failed`
- **Status:** ✅ Monitored in code (lines 281-289)

**iceGatheringState Transitions:**
- `new` → `gathering` → `complete`
- **Status:** ⚠️ Not monitored
- **Issue:** No logging or handling of gathering state

### 4.7 PeerConnection Lifecycle

**Current Implementation:**
- New RTCPeerConnection created for every call (line 253)
- Closed in cleanup (line 137)
- Stored in ref (line 61)

**Issues:**
1. No validation that previous PeerConnection is fully closed
2. No check for existing PeerConnection before creating new one
3. No timeout for connection establishment

**Lifecycle:**
```
createPeerConnection() → new RTCPeerConnection()
  ↓
addTrack() → add local tracks
  ↓
setLocalDescription() / setRemoteDescription() → SDP negotiation
  ↓
onicecandidate → ICE candidate exchange
  ↓
ontrack → remote stream received
  ↓
connectionState = "connected" → call active
  ↓
cleanup() → close() → PeerConnection destroyed
```

### 4.8 New PeerConnection for Every Call?

**Answer:** YES

**Evidence:**
```typescript
// Line 252-253
const createPeerConnection = useCallback((callId: string) {
  const pc = new RTCPeerConnection(ICE_SERVERS)
  // ...
  peerConnectionRef.current = pc
  return pc
}, [userId, cleanup])
```

**Called in:**
- `initiateCall()` line 334
- `acceptCall()` line 445

**Every call creates a new instance.**

### 4.9 Root Cause Summary

**PRIMARY ROOT CAUSE:** Race condition between document creation and offer storage

The caller creates the document and writes the offer in two separate Firestore operations. The receiver's listener may fire before the offer is written, resulting in:
1. `incomingCall.offer` is undefined
2. `setRemoteDescription()` is skipped
3. `createAnswer()` called in "stable" state
4. `InvalidStateError` thrown

**SECONDARY ISSUE:** No validation or error handling

The code silently skips `setRemoteDescription()` if offer is missing, then fails with a cryptic error instead of a meaningful message.

**TERTIARY ISSUE:** No retry logic

If the offer is missing, there's no mechanism to:
1. Wait for the offer to arrive
2. Retry `setRemoteDescription()`
3. Provide user feedback

**Confidence Level:** HIGH (98%+)

The race condition is clearly visible in the code and explains the error perfectly.

---

## 5. Logging Analysis

### 5.1 Current Logging

**Existing Logs:**
1. `console.error("Error adding ICE candidate:", err)` - Line 260, 377
2. `console.error("Error stopping track:", e)` - Line 147
3. `console.error("Connection ${state}")` - Line 274
4. `console.error(`ICE connection ${state}`)` - Line 284
5. `console.error("Failed to initiate call:", err)` - Line 399
6. `console.error("Failed to accept call:", err)` - Line 499
7. `console.error("Failed to reject call:", err)` - Line 533
8. `console.error("Failed to cancel call:", err)` - Line 554
9. `console.error("Failed to end call:", err)` - Line 575
10. `console.error("Failed to set online status:", err)` - Line 32 (usePresence)
11. `console.error("Heartbeat failed:", err)` - Line 45 (usePresence)
12. `console.error("Failed to set offline:", err)` - Line 87 (usePresence)
13. `console.error("Call subscription error:", error)` - Line 177 (voiceCalls.ts)
14. `console.error("Call events subscription error:", error)` - Line 147 (voiceCalls.ts)
15. `console.error("Incoming calls subscription error:", error)` - Line 213 (voiceCalls.ts)
16. `console.error("Presence subscription error:", error)` - Line 49 (presence.ts)

### 5.2 Recommended Logging Locations

**WebRTC Lifecycle:**

1. **getUserMedia()**
   - Location: `useVoiceCall.ts` lines 324, 435
   - Log: Stream obtained, track count, track types, track states
   - Example:
     ```typescript
     console.log("[WebRTC] getUserMedia success:", {
       streamId: stream.id,
       tracks: stream.getTracks().map(t => ({ kind: t.kind, state: t.readyState, enabled: t.enabled }))
     })
     ```

2. **createOffer()**
   - Location: `useVoiceCall.ts` line 342
   - Log: SDP type, SDP length
   - Example:
     ```typescript
     console.log("[WebRTC] createOffer success:", {
       type: offer.type,
       sdpLength: offer.sdp?.length
     })
     ```

3. **receiveOffer() (setRemoteDescription)**
   - Location: `useVoiceCall.ts` line 454
   - Log: SDP type, signaling state before/after
   - Example:
     ```typescript
     console.log("[WebRTC] setRemoteDescription (offer):", {
       type: incomingCall.offer?.type,
       signalingStateBefore: pc.signalingState,
       signalingStateAfter: pc.signalingState
     })
     ```

4. **createAnswer()**
   - Location: `useVoiceCall.ts` line 458
   - Log: SDP type, signaling state BEFORE (critical for debugging)
   - Example:
     ```typescript
     console.log("[WebRTC] createAnswer:", {
       signalingState: pc.signalingState, // CRITICAL: should be "have-remote-offer"
       error: pc.signalingState !== "have-remote-offer" ? "INVALID STATE" : null
     })
     ```

5. **setLocalDescription()**
   - Location: `useVoiceCall.ts` lines 343, 459
   - Log: SDP type, signaling state
   - Example:
     ```typescript
     console.log("[WebRTC] setLocalDescription:", {
       type: description.type,
       signalingState: pc.signalingState
     })
     ```

6. **receiveAnswer()**
   - Location: `useVoiceCall.ts` (in subscribeToCall callback)
   - Log: SDP type, signaling state
   - Example:
     ```typescript
     if (call.answer) {
       console.log("[WebRTC] Received answer:", {
         type: call.answer.type,
         signalingState: pc.signalingState
       })
     }
     ```

7. **addTrack()**
   - Location: `useVoiceCall.ts` lines 338, 449
   - Log: Track kind, track ID, stream ID
   - Example:
     ```typescript
     console.log("[WebRTC] addTrack:", {
       kind: track.kind,
       trackId: track.id,
       streamId: stream.id
     })
     ```

8. **ontrack**
   - Location: `useVoiceCall.ts` line 265
   - Log: Stream ID, track count, track details
   - Example:
     ```typescript
     console.log("[WebRTC] ontrack:", {
       streamId: event.streams[0]?.id,
       trackCount: event.streams[0]?.getTracks().length,
       streams: event.streams.length
     })
     ```

9. **ICE candidate creation**
   - Location: `useVoiceCall.ts` line 255
   - Log: Candidate type, protocol, address
   - Example:
     ```typescript
     console.log("[WebRTC] ICE candidate generated:", {
       type: event.candidate?.type,
       protocol: event.candidate?.protocol,
       address: event.candidate?.address
     })
     ```

10. **ICE candidate reception**
    - Location: `useVoiceCall.ts` line 374
    - Log: Candidate details, who sent it
    - Example:
      ```typescript
      console.log("[WebRTC] ICE candidate received:", {
        from: event.userId,
        candidate: event.data
      })
      ```

**State Changes:**

11. **signalingState changes**
    - Location: Add event listener in `createPeerConnection`
    - Log: Old state, new state
    - Example:
      ```typescript
      pc.onsignalingstatechange = () => {
        console.log("[WebRTC] signalingState change:", {
          oldState: pc.signalingState, // Note: need to track previous state
          newState: pc.signalingState
        })
      }
      ```

12. **connectionState changes**
    - Location: `useVoiceCall.ts` line 271
    - Already logged but could be more detailed
    - Example:
      ```typescript
      console.log("[WebRTC] connectionState:", {
        state: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState
      })
      ```

13. **iceConnectionState changes**
    - Location: `useVoiceCall.ts` line 281
    - Already logged but could be more detailed
    - Example:
      ```typescript
      console.log("[WebRTC] iceConnectionState:", {
        state: pc.iceConnectionState,
        connectionState: pc.connectionState
      })
      ```

14. **iceGatheringState changes**
    - Location: Add in `createPeerConnection`
    - Log: Gathering state
    - Example:
      ```typescript
      pc.onicegatheringstatechange = () => {
        console.log("[WebRTC] iceGatheringState:", pc.iceGatheringState)
      }
      ```

**Call Lifecycle:**

15. **cleanup**
    - Location: `useVoiceCall.ts` line 121
    - Log: What was cleaned up
    - Example:
      ```typescript
      console.log("[Call] cleanup:", {
        hadPeerConnection: !!peerConnectionRef.current,
        hadLocalStream: !!localStream,
        hadActiveCall: !!activeCall,
        hadIncomingCall: !!incomingCall
      })
      ```

16. **hangup (endCall)**
    - Location: `useVoiceCall.ts` line 560
    - Log: Call ID, duration
    - Example:
      ```typescript
      console.log("[Call] end call:", {
        callId: activeCall.callId,
        duration: callDuration
      })
      ```

17. **reject**
    - Location: `useVoiceCall.ts` line 514
    - Log: Call ID, caller
    - Example:
      ```typescript
      console.log("[Call] reject:", {
        callId: incomingCall.callId,
        caller: incomingCall.initiatorId
      })
      ```

18. **cancel**
    - Location: `useVoiceCall.ts` line 539
    - Log: Call ID, target
    - Example:
      ```typescript
      console.log("[Call] cancel:", {
        callId: activeCall.callId,
        target: activeCall.participants.find(p => p !== userId)
      })
      ```

**Firestore Operations:**

19. **createVoiceCall**
    - Location: `voiceCalls.ts` line 33
    - Log: Call ID, participants
    - Example:
      ```typescript
      console.log("[Firestore] createVoiceCall:", { callId, participants: [initiatorId, targetUserId] })
      ```

20. **updateCallWithOffer**
    - Location: `voiceCalls.ts` line 84
    - Log: Call ID, offer type
    - Example:
      ```typescript
      console.log("[Firestore] updateCallWithOffer:", { callId, type: offer.type })
      ```

21. **updateCallWithAnswer**
    - Location: `voiceCalls.ts` line 98
    - Log: Call ID, answer type
    - Example:
      ```typescript
      console.log("[Firestore] updateCallWithAnswer:", { callId, type: answer.type })
      ```

22. **addIceCandidate**
    - Location: `voiceCalls.ts` line 112
    - Log: Call ID, candidate type
    - Example:
      ```typescript
      console.log("[Firestore] addIceCandidate:", { callId, type: candidate.type })
      ```

**Presence:**

23. **presence updates**
    - Location: `presence.ts` lines 7, 17, 24
    - Log: User ID, new status
    - Example:
      ```typescript
      console.log("[Presence] setOnline:", { userId, userName })
      console.log("[Presence] updateLastSeen:", { userId })
      console.log("[Presence] setOffline:", { userId })
      ```

**Subscription Events:**

24. **subscribeToCall fires**
    - Location: `useVoiceCall.ts` line 349
    - Log: Call ID, new status
    - Example:
      ```typescript
      console.log("[Firestore] subscribeToCall update:", {
        callId: call.callId,
        status: call.status
      })
      ```

25. **subscribeToCallEvents fires**
    - Location: `useVoiceCall.ts` line 370
    - Log: Event count, event types
    - Example:
      ```typescript
      console.log("[Firestore] subscribeToCallEvents:", {
        eventCount: events.length,
        types: events.map(e => e.type)
      })
      ```

26. **subscribeToIncomingCalls fires**
    - Location: `useVoiceCall.ts` line 212
    - Log: Call ID, initiator
    - Example:
      ```typescript
      console.log("[Firestore] subscribeToIncomingCalls:", {
        callId: call.callId,
        initiator: call.initiatorId
      })
      ```

### 5.3 Logging Priority

**HIGH PRIORITY (Must Have):**
1. createAnswer() - signaling state (line 458) - **CRITICAL FOR BUG**
2. setRemoteDescription() - signaling state before/after (line 454)
3. ontrack - stream details (line 265)
4. getUserMedia() - stream details (lines 324, 435)
5. subscribeToIncomingCalls fires - call details (line 212)

**MEDIUM PRIORITY (Should Have):**
6. All signaling state changes
7. All connection state changes
8. ICE candidate creation/reception
9. Firestore operation success/failure
10. Cleanup actions

**LOW PRIORITY (Nice to Have):**
11. Presence updates
12. Subscription lifecycle
13. UI state changes

---

## 6. Risk Assessment

### 6.1 High-Risk Files

**1. `hooks/useVoiceCall.ts` (HIGH RISK)**
- **Reason:** Contains all WebRTC logic, state management, and cleanup
- **Complexity:** 662 lines, multiple async operations, complex state machine
- **Risk Areas:**
  - Race conditions in offer/answer exchange
  - Incomplete cleanup
  - State management complexity
  - Memory leaks from uncleared listeners/timers
- **Impact:** Core functionality, affects all calls

**2. `lib/communication/voiceCalls.ts` (HIGH RISK)**
- **Reason:** Firestore operations, data model
- **Complexity:** 261 lines, multiple collections, complex queries
- **Risk Areas:**
  - Deterministic call ID causes data collisions
  - No document deletion
  - No TTL policy
  - Race conditions in document updates
- **Impact:** Data integrity, call reliability

**3. `lib/communication/presence.ts` (MEDIUM RISK)**
- **Reason:** Presence system has fundamental design flaws
- **Complexity:** 54 lines, but architectural issues
- **Risk Areas:**
  - No server-side cleanup
  - Reliance on unreliable client-side events
  - Stale data accumulation
- **Impact:** User experience, system accuracy

### 6.2 Components Likely to Break

**1. `GlobalCallUI.tsx` (MEDIUM RISK)**
- **Reason:** Mounts useVoiceCall hook, renders global UI
- **Risk:** Changes to hook interface will break this component
- **Dependencies:** useVoiceCall, IncomingCallModal, VoiceCallUI

**2. `CallsTab.tsx` (MEDIUM RISK)**
- **Reason:** Contains UI logic for cancel/reject
- **Risk:** Current bug in cancel/reject logic (Issue 2)
- **Dependencies:** useVoiceCall

**3. `IncomingCallModal.tsx` (LOW RISK)**
- **Reason:** Simple presentational component
- **Risk:** Minimal, only depends on props
- **Dependencies:** VoiceCall type, onAccept/onReject callbacks

**4. `VoiceCallUI.tsx` (MEDIUM RISK)**
- **Reason:** Missing audio playback logic
- **Risk:** Will need significant changes to add audio element
- **Dependencies:** remoteStream prop

### 6.3 Circular Dependencies

**Status:** ✅ No circular dependencies detected

**Dependency Graph:**
```
GlobalCallUI
  ├── useVoiceCall (hook)
  │   └── voiceCalls.ts (lib)
  │       └── firebase.ts (lib)
  ├── IncomingCallModal (component)
  └── VoiceCallUI (component)

CallsTab
  ├── useVoiceCall (hook)
  └── VoiceCall (type)

CommunicationHub
  ├── CallsTab (component)
  ├── OnlineUsersTab (component)
  │   └── usePresence (hook)
  │       └── presence.ts (lib)
  └── Other tabs...
```

**No circular dependencies.**

### 6.4 Race Conditions

**1. Offer Write vs. Document Creation (HIGH SEVERITY)**
- **Location:** `initiateCall()` in useVoiceCall.ts
- **Scenario:**
  1. `createVoiceCall()` creates document
  2. `createOffer()` creates SDP
  3. `updateCallWithOffer()` writes offer
  4. Receiver's listener may fire between steps 1 and 3
- **Impact:** createAnswer() fails with InvalidStateError
- **Likelihood:** HIGH (network latency makes this common)

**2. Cleanup vs. New Call (MEDIUM SEVERITY)**
- **Location:** `cleanup()` function
- **Scenario:**
  1. User ends call
  2. cleanup() starts (async)
  3. User immediately initiates new call
  4. New call starts before old cleanup completes
- **Impact:** Resource conflicts, state corruption
- **Likelihood:** MEDIUM (requires fast user action)

**3. Multiple Listener Subscriptions (LOW SEVERITY)**
- **Location:** `useEffect` dependencies
- **Scenario:**
  1. userId changes
  2. Old listener unsubscribes
  3. New listener subscribes
  4. Brief window where no listener is active
- **Impact:** Missed events
- **Likelihood:** LOW (userId rarely changes)

**4. Firestore Update Order (MEDIUM SEVERITY)**
- **Location:** All Firestore operations
- **Scenario:**
  1. Update A: status = "ringing"
  2. Update B: offer = {...}
  3. Updates arrive out of order at receiver
- **Impact:** Receiver sees offer before status, or vice versa
- **Likelihood:** MEDIUM (Firestore usually maintains order but not guaranteed)

### 6.5 Memory Leaks

**1. Uncleared Timers (MEDIUM SEVERITY)**
- **Location:** `useVoiceCall.ts` lines 388-397, 231-237
- **Issue:** Timeouts stored in `(window as any).__callTimeoutId` and `(window as any).__ringtoneTimeout`
- **Impact:** Timers may fire after component unmounts
- **Cleanup:** Partially handled (lines 634-639)

**2. Active Firestore Listeners (HIGH SEVERITY)**
- **Location:** Multiple subscriptions
- **Issue:** If cleanup fails, listeners remain active
- **Impact:** Memory leak, unexpected callbacks
- **Cleanup:** Implemented but not validated

**3. MediaStream Tracks (HIGH SEVERITY)**
- **Location:** `useVoiceCall.ts` lines 142-150
- **Issue:** Tracks stopped but not validated
- **Impact:** Camera/microphone may remain active
- **Cleanup:** Implemented but not validated

**4. Audio Context (LOW SEVERITY)**
- **Location:** `useVoiceCall.ts` lines 80-118
- **Issue:** AudioContext created for ringtone
- **Impact:** Small memory leak if not closed
- **Cleanup:** Implemented (line 116)

**5. PeerConnection (HIGH SEVERITY)**
- **Location:** `useVoiceCall.ts` line 137
- **Issue:** Closed but not validated
- **Impact:** Resources not released
- **Cleanup:** Implemented but not validated

### 6.6 Event Listener Duplication

**1. Firestore Subscriptions (MEDIUM SEVERITY)**
- **Issue:** If userId changes, old subscription unsubscribes, new subscribes
- **Risk:** Brief window with no subscription or duplicate subscriptions
- **Current:** Handled by React useEffect cleanup

**2. Window Event Listeners (LOW SEVERITY)**
- **Location:** `useVoiceCall.ts` lines 592-628, `usePresence.ts` lines 68-70
- **Issue:** Multiple instances may add duplicate listeners
- **Current:** Cleanup in useEffect return
- **Risk:** LOW (components mount once)

### 6.7 React State Inconsistencies

**1. State vs. Ref Desync (MEDIUM SEVERITY)**
- **Issue:** `callStatus` state and `callStatusRef.current` can desync
- **Example:**
  ```typescript
  const [callStatus, setCallStatus] = useState<CallStatus>("idle")
  const callStatusRef = useRef<CallStatus>("idle")
  
  useEffect(() => {
    callStatusRef.current = callStatus
  }, [callStatus])
  ```
- **Impact:** Timeout check (line 389) uses ref, but UI uses state
- **Risk:** MEDIUM (usually in sync, but async updates can cause issues)

**2. Stale Closures (LOW SEVERITY)**
- **Issue:** Callbacks may capture stale state
- **Current:** Mitigated by useCallback with proper dependencies
- **Risk:** LOW

### 6.8 Firestore Synchronization Risks

**1. No Transaction Support (MEDIUM SEVERITY)**
- **Issue:** Updates are not atomic
- **Example:** `updateCallWithOffer()` and `updateCallWithAnswer()` are separate operations
- **Impact:** Partial updates possible
- **Risk:** MEDIUM

**2. No Optimistic Updates (LOW SEVERITY)**
- **Issue:** UI waits for Firestore confirmation
- **Impact:** Slight delay in UI feedback
- **Risk:** LOW

**3. No Conflict Resolution (MEDIUM SEVERITY)**
- **Issue:** If two users update same field, last write wins
- **Impact:** Data loss
- **Risk:** LOW (unlikely in current usage)

**4. No Offline Support (LOW SEVERITY)**
- **Issue:** No offline persistence or queuing
- **Impact:** Calls fail if offline
- **Risk:** LOW (voice calls require internet)

### 6.9 WebRTC Lifecycle Risks

**1. PeerConnection Reuse (HIGH SEVERITY)**
- **Issue:** No check for existing PeerConnection before creating new one
- **Impact:** Resource leaks, connection failures
- **Current:** New PeerConnection created for every call
- **Risk:** MEDIUM (cleanup should handle this)

**2. Track Replacement (MEDIUM SEVERITY)**
- **Issue:** No replaceTrack() implementation
- **Impact:** Cannot switch cameras/microphones mid-call
- **Risk:** LOW (not a current requirement)

**3. Renegotiation (MEDIUM SEVERITY)**
- **Issue:** No handling of renegotiation (e.g., adding video later)
- **Impact:** Cannot add video without ending call
- **Risk:** LOW (audio-only calls)

**4. Connection Recovery (HIGH SEVERITY)**
- **Issue:** No handling of temporary network failures
- **Current:** Failed state triggers cleanup
- **Impact:** Call ends on brief network interruption
- **Risk:** HIGH (poor user experience)

---

## 7. Deliverables

### 7.1 Current Architecture Overview

**Architecture Pattern:** Serverless P2P with Firestore Signaling

**Components:**
1. **Frontend:** Next.js React app with client-side WebRTC
2. **Signaling:** Firebase Firestore (real-time listeners)
3. **Media:** Direct P2P via WebRTC (no media server)
4. **Presence:** Firestore-based with client-side heartbeat

**Data Flow:**
```
User A → Firestore (offer) → User B
User B → Firestore (answer) → User A
User A ↔ Firestore (ICE candidates) ↔ User B
User A ←→ WebRTC (audio) → User B
```

**State Management:**
- React useState for UI state
- useRef for WebRTC objects and cleanup functions
- Firestore as source of truth for call state

**Key Design Decisions:**
1. Deterministic call IDs (causes Issue 3)
2. No TURN servers (causes Issue 1 in restrictive networks)
3. No server-side presence cleanup (causes Issue 4)
4. Firestore for signaling (simpler than Socket.IO but has latency issues)

### 7.2 Voice Call Sequence Diagram

See Section 2.2 for complete sequence diagram.

**Summary:**
1. Caller creates document → writes offer
2. Receiver listens → receives notification
3. Receiver sets remote description → creates answer
4. Both exchange ICE candidates
5. Connection established → audio flows
6. Either party ends call → cleanup

### 7.3 Root Cause Analysis for Each Issue

**Issue 1: No Audio**
- **Root Cause:** Missing audio element creation and playback
- **Location:** `VoiceCallUI.tsx` - receives remoteStream but never plays it
- **Fix Complexity:** LOW (add audio element and playback logic)

**Issue 2: Cannot Cancel/Hangup While Ringing**
- **Root Cause:** UI logic error in `CallsTab.tsx` line 161
- **Secondary Cause:** No event notification for cancel/reject
- **Fix Complexity:** MEDIUM (fix UI logic + add event system)

**Issue 3: Second Call Fails**
- **Root Cause:** Deterministic call ID + merge strategy + no deletion
- **Location:** `voiceCalls.ts` line 26-28, 54
- **Fix Complexity:** MEDIUM (use random IDs + delete old documents)

**Issue 4: Stale Online Users**
- **Root Cause:** No server-side cleanup, unreliable client-side cleanup
- **Location:** `presence.ts`, `usePresence.ts`
- **Fix Complexity:** HIGH (requires Cloud Function implementation)

### 7.4 Root Cause Analysis for WebRTC Signaling Error

**Error:** `InvalidStateError: Cannot create answer in stable`

**Root Cause:** Race condition between document creation and offer storage

**Sequence:**
1. Caller creates document (status: "ringing")
2. Caller writes offer (separate operation)
3. Receiver's listener fires BEFORE offer is written
4. `incomingCall.offer` is undefined
5. `setRemoteDescription()` skipped
6. `createAnswer()` called in "stable" state → ERROR

**Location:** `useVoiceCall.ts` line 453-458

**Fix Complexity:** MEDIUM (add validation + retry logic)

### 7.5 Files That Will Require Modification

**1. `hooks/useVoiceCall.ts` (REQUIRED)**
- Fix createAnswer race condition
- Add audio playback logic
- Improve cleanup validation
- Add comprehensive logging
- **Estimated Changes:** 50-100 lines modified

**2. `components/communication/VoiceCallUI.tsx` (REQUIRED)**
- Add audio element creation
- Implement audio playback
- Add audio element cleanup
- **Estimated Changes:** 30-50 lines added

**3. `components/communication/CallsTab.tsx` (REQUIRED)**
- Fix cancel/reject logic
- Add proper UI states
- **Estimated Changes:** 10-20 lines modified

**4. `lib/communication/voiceCalls.ts` (REQUIRED)**
- Change to random call IDs
- Add document deletion
- Add TTL support
- Add cancel/reject events
- **Estimated Changes:** 30-50 lines modified

**5. `lib/communication/presence.ts` (REQUIRED)**
- Add lastSeen validation
- Prepare for Cloud Function cleanup
- **Estimated Changes:** 20-30 lines modified

**6. `types/communication.ts` (REQUIRED)**
- Add new event types
- Add optional fields for validation
- **Estimated Changes:** 5-10 lines modified

**7. `functions/src/index.ts` (REQUIRED - NEW)**
- Create Cloud Function for stale user cleanup
- **Estimated Changes:** 50-100 lines added

**8. `hooks/usePresence.ts` (OPTIONAL)**
- Improve cleanup logic
- Add better error handling
- **Estimated Changes:** 10-20 lines modified

### 7.6 Components Affected

**Directly Affected:**
1. `GlobalCallUI` - Will need to pass new props/handlers
2. `VoiceCallUI` - Major changes for audio playback
3. `CallsTab` - Fix cancel/reject logic
4. `IncomingCallModal` - Minimal changes (if any)

**Indirectly Affected:**
1. `CommunicationHub` - May need to pass new callbacks
2. `OnlineUsersTab` - May be affected by presence changes
3. `DirectMessagesTab` - May initiate calls

**Not Affected:**
1. `ChatTab` - No changes needed
2. `AnnouncementsTab` - No changes needed
3. `ProfileTab` - No changes needed
4. `FloatingButton` - No changes needed

### 7.7 Recommended Order of Fixes

**Phase 1: Critical Bug Fixes (Do First)**
1. **Fix createAnswer race condition** (Issue: WebRTC signaling error)
   - Add validation for incomingCall.offer
   - Add retry logic with timeout
   - Add proper error messages
   - **Files:** `useVoiceCall.ts`
   - **Priority:** CRITICAL (blocks all calls)

2. **Add audio playback** (Issue: No audio)
   - Create audio element in VoiceCallUI
   - Attach remote stream
   - Handle autoplay restrictions
   - **Files:** `VoiceCallUI.tsx`, `useVoiceCall.ts`
   - **Priority:** CRITICAL (core functionality)

**Phase 2: Core Functionality Fixes**
3. **Fix cancel/reject logic** (Issue: Cannot cancel while ringing)
   - Fix UI logic in CallsTab
   - Add cancel/reject events
   - **Files:** `CallsTab.tsx`, `useVoiceCall.ts`, `voiceCalls.ts`
   - **Priority:** HIGH (user experience)

4. **Fix second call failure** (Issue: Second call fails)
   - Change to random call IDs
   - Add document deletion
   - **Files:** `voiceCalls.ts`, `useVoiceCall.ts`
   - **Priority:** HIGH (core functionality)

**Phase 3: Robustness Improvements**
5. **Add TURN servers** (Issue: Calls fail in restrictive networks)
   - Add TURN server configuration
   - **Files:** `useVoiceCall.ts`
   - **Priority:** MEDIUM (improves reliability)

6. **Add comprehensive logging** (All issues)
   - Add logging at all critical points
   - **Files:** All voice call files
   - **Priority:** MEDIUM (debugging)

**Phase 4: Architecture Improvements**
7. **Fix presence system** (Issue: Stale online users)
   - Create Cloud Function for cleanup
   - Add lastSeen validation
   - **Files:** `presence.ts`, `functions/src/index.ts`
   - **Priority:** MEDIUM (user experience)

8. **Improve cleanup** (General robustness)
   - Validate cleanup completion
   - Add cleanup timeouts
   - **Files:** `useVoiceCall.ts`
   - **Priority:** LOW (robustness)

### 7.8 Estimated Complexity for Each Fix

**1. Fix createAnswer Race Condition**
- **Complexity:** MEDIUM
- **Effort:** 4-6 hours
- **Risk:** LOW
- **Testing:** High (requires multiple test scenarios)

**2. Add Audio Playback**
- **Complexity:** LOW
- **Effort:** 2-3 hours
- **Risk:** LOW
- **Testing:** Medium (requires audio testing)

**3. Fix Cancel/Reject Logic**
- **Complexity:** MEDIUM
- **Effort:** 3-4 hours
- **Risk:** LOW
- **Testing:** Medium (requires testing both caller and receiver)

**4. Fix Second Call Failure**
- **Complexity:** MEDIUM
- **Effort:** 3-4 hours
- **Risk:** MEDIUM (data migration needed for existing calls)
- **Testing:** High (requires testing multiple consecutive calls)

**5. Add TURN Servers**
- **Complexity:** LOW
- **Effort:** 1-2 hours
- **Risk:** LOW
- **Testing:** Low (configuration only)

**6. Add Comprehensive Logging**
- **Complexity:** LOW
- **Effort:** 2-3 hours
- **Risk:** NONE
- **Testing:** NONE (logging only)

**7. Fix Presence System**
- **Complexity:** HIGH
- **Effort:** 8-12 hours
- **Risk:** MEDIUM (requires Cloud Function deployment)
- **Testing:** High (requires testing various disconnect scenarios)

**8. Improve Cleanup**
- **Complexity:** MEDIUM
- **Effort:** 4-6 hours
- **Risk:** LOW
- **Testing:** Medium (requires testing rapid call initiation/termination)

**Total Estimated Effort:** 27-40 hours

### 7.9 Risk Assessment Summary

**High-Risk Areas:**
1. WebRTC signaling logic (race conditions)
2. Firestore data model (deterministic IDs)
3. Cleanup logic (incomplete cleanup)
4. Presence system (no server-side cleanup)

**Medium-Risk Areas:**
1. State management (state/ref desync)
2. Firestore synchronization (no transactions)
3. Memory leaks (uncleared resources)

**Low-Risk Areas:**
1. UI components (mostly presentational)
2. Type definitions (stable)
3. Firebase configuration (static)

**Overall Risk Level:** MEDIUM-HIGH

**Justification:**
- Core functionality has critical bugs (no audio, signaling error)
- Data model has fundamental flaws (deterministic IDs)
- No server-side cleanup for presence
- Multiple race conditions
- Memory leaks possible

**Mitigation:**
- Fixes are well-defined and isolated
- No circular dependencies
- No architectural changes required
- Most fixes are additive (not destructive)

### 7.10 Step-by-Step Implementation Plan

**Step 1: Preparation (1 hour)**
- Create feature branch from current branch
- Set up logging infrastructure
- Add test environment

**Step 2: Fix createAnswer Race Condition (4-6 hours)**
1. Add validation for incomingCall.offer
2. Add retry logic with exponential backoff
3. Add proper error messages
4. Test with simulated network latency
5. Verify signaling state transitions

**Step 3: Add Audio Playback (2-3 hours)**
1. Create useAudioPlayback hook
2. Integrate with VoiceCallUI
3. Handle autoplay restrictions
4. Test audio playback
5. Test mute/unmute

**Step 4: Fix Cancel/Reject Logic (3-4 hours)**
1. Add cancel/reject event types
2. Update Firestore schema
3. Fix UI logic in CallsTab
4. Add event listeners for cancel/reject
5. Test both caller and receiver flows

**Step 5: Fix Second Call Failure (3-4 hours)**
1. Change getCallId() to use random IDs
2. Add document deletion in cleanup
3. Add TTL policy to Firestore
4. Test multiple consecutive calls
5. Verify no stale data remains

**Step 6: Add TURN Servers (1-2 hours)**
1. Configure TURN servers (use free tier or self-host)
2. Update ICE_SERVERS configuration
3. Test in restrictive network environment

**Step 7: Add Comprehensive Logging (2-3 hours)**
1. Add logging to all critical points
2. Create log analysis guide
3. Test logging output

**Step 8: Fix Presence System (8-12 hours)**
1. Create Cloud Function for stale user cleanup
2. Add lastSeen validation to subscription
3. Deploy Cloud Function
4. Test various disconnect scenarios
5. Monitor for 24 hours

**Step 9: Improve Cleanup (4-6 hours)**
1. Add cleanup validation
2. Add cleanup timeouts
3. Add resource leak detection
4. Test rapid call scenarios

**Step 10: Testing and Validation (8-10 hours)**
1. Unit tests for all fixes
2. Integration tests for complete call flow
3. Load testing (multiple concurrent calls)
4. Network condition testing (throttling, offline)
5. Browser compatibility testing
6. Mobile testing

**Step 11: Documentation (2-3 hours)**
1. Update README with voice call architecture
2. Document known limitations
3. Create troubleshooting guide
4. Document deployment process

**Total Time:** 38-54 hours (including testing and documentation)

### 7.11 Suggested Validation and Testing Plan

**Unit Tests:**
1. Test getCallId() with various user ID combinations
2. Test call state transitions
3. Test cleanup function
4. Test presence heartbeat
5. Test Firestore operations (mocked)

**Integration Tests:**
1. **Complete Call Flow:**
   - Initiate call
   - Accept call
   - Verify audio flows
   - End call
   - Verify cleanup

2. **Cancel/Reject Flow:**
   - Initiate call
   - Cancel before answer
   - Verify receiver notified
   - Initiate call
   - Receiver rejects
   - Verify caller notified

3. **Multiple Calls:**
   - Call same user twice
   - Verify second call works
   - Verify no stale data

4. **Network Conditions:**
   - Test with throttled network
   - Test with offline mode
   - Test with packet loss

**Manual Testing:**
1. **Audio Testing:**
   - Verify both parties can hear each other
   - Test mute/unmute
   - Test with headphones/speakers
   - Test on different devices

2. **UI Testing:**
   - Verify all buttons work
   - Verify status messages display correctly
   - Verify modals appear/disappear
   - Test on mobile/tablet/desktop

3. **Edge Cases:**
   - Call while offline
   - Accept call with no microphone
   - End call during ICE gathering
   - Rapid call initiation/termination
   - Browser close during call

**Performance Testing:**
1. Measure call setup time
2. Measure time to first audio
3. Test with multiple concurrent calls
4. Monitor memory usage during calls
5. Monitor Firestore read/write costs

**Browser Compatibility:**
1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest)
4. Edge (latest)
5. Mobile Safari (iOS)
6. Chrome Mobile (Android)

**Monitoring:**
1. Add error tracking (Sentry, LogRocket, etc.)
2. Monitor WebRTC statistics
3. Monitor Firestore usage
4. Set up alerts for errors

---

## Conclusion

This analysis has identified **4 critical issues** and **1 critical error** in the voice calling system:

1. **No audio playback** - Missing audio element creation
2. **Cannot cancel while ringing** - UI logic error + missing event system
3. **Second call failure** - Deterministic IDs + no deletion
4. **Stale online users** - No server-side cleanup
5. **InvalidStateError** - Race condition in offer/answer exchange

All issues are **fixable** without architectural changes. The recommended fix order prioritizes critical functionality (audio, signaling) before user experience improvements (cancel, presence).

**Estimated total effort:** 38-54 hours including testing and documentation.

**Risk Level:** MEDIUM-HIGH (due to critical bugs in core functionality)

**Recommendation:** Proceed with fixes in Phase 1 (critical bugs) immediately, then Phase 2 (core functionality), then Phase 3-4 (robustness and architecture).

---

**End of Report**

*This report was generated in ANALYSIS ONLY mode. No code was modified, no files were changed, and no commits were made.*
import { db } from "@/lib/firebase"
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  where,
  orderBy,
  addDoc,
  arrayUnion,
  deleteDoc
} from "firebase/firestore"
import { VoiceCall, CallEvent, CallStatus } from "@/types/communication"

const VOICE_CALLS_COLLECTION = "voice_calls"
const CALL_EVENTS_COLLECTION = "events"

// A "ringing" call older than this is considered abandoned/stale and will
// be ignored by subscribeToIncomingCalls, even if its status was never
// cleanly updated (e.g. caller's browser crashed before cancel/timeout
// could run). This matches the 30s ring timeout in useVoiceCall + a buffer.
const RING_STALE_MS = 45 * 1000

// Diagnostic logging helper
const log = (prefix: string, data: any) => {
  console.log(`[${prefix}]`, JSON.stringify(data, null, 2))
}

/**
 * Deterministic key for a user pair - NOT used as the document ID anymore.
 * Kept only if other code references it; prefer generateUniqueCallId for
 * anything that creates a new call document.
 */
export function getCallId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_")
}

/**
 * Generate a unique ID per call ATTEMPT (not per user pair).
 * This is the fix for calls "leaking" into future sessions: previously every
 * call between the same two users reused the same Firestore document, so a
 * leftover "ringing" status from a crashed/abandoned call would resurface
 * as a brand new incoming call the next time either user opened the app.
 */
function generateUniqueCallId(userId1: string, userId2: string): string {
  const pairKey = [userId1, userId2].sort().join("_")
  const randomSuffix = Math.random().toString(36).slice(2, 8)
  return `${pairKey}_${Date.now()}_${randomSuffix}`
}

/**
 * Create a new voice call - always a fresh document, never reused
 */
export async function createVoiceCall(
  initiatorId: string,
  initiatorName: string,
  targetUserId: string,
  targetUserName: string
): Promise<string> {
  const callId = generateUniqueCallId(initiatorId, targetUserId)
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)

  const callData: Partial<VoiceCall> = {
    callId,
    participants: [initiatorId, targetUserId],
    participantNames: {
      [initiatorId]: initiatorName,
      [targetUserId]: targetUserName,
    },
    status: "ringing",
    initiatorId,
    startedAt: serverTimestamp() as any,
  }

  // No `merge: true` here on purpose - this must always be a brand new,
  // empty document. Merging risked inheriting stale fields (offer, answer,
  // status) from a previous call between the same two users.
  await setDoc(callRef, callData)

  return callId
}

/**
 * Update call status
 */
export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  additionalData?: Partial<VoiceCall>
): Promise<void> {
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)
  
  const updateData: any = {
    status,
    ...additionalData,
  }

  if (status === "ended" || status === "failed" || status === "rejected" || status === "cancelled" || status === "timeout") {
    updateData.endedAt = new Date()
  }

  await updateDoc(callRef, updateData)
}

/**
 * Update call with offer
 */
export async function updateCallWithOffer(
  callId: string,
  offer: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)
  await updateDoc(callRef, {
    offer,
    status: "ringing",
  })
}

/**
 * Update call with answer
 */
export async function updateCallWithAnswer(
  callId: string,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)
  await updateDoc(callRef, {
    answer,
    status: "connecting",
  })
}

/**
 * Add ICE candidate to call
 */
export async function addIceCandidate(
  callId: string,
  candidate: RTCIceCandidateInit,
  userId: string
): Promise<void> {
  const eventsRef = collection(db, VOICE_CALLS_COLLECTION, callId, CALL_EVENTS_COLLECTION)
  
  await addDoc(eventsRef, {
    type: "ice-candidate",
    userId,
    data: candidate,
    timestamp: new Date(),
  })
}

/**
 * Subscribe to call events (ICE candidates)
 */
export function subscribeToCallEvents(
  callId: string,
  callback: (events: CallEvent[]) => void
): () => void {
  log("[Firestore] Subscribe to call events", { callId })
  const eventsRef = collection(db, VOICE_CALLS_COLLECTION, callId, CALL_EVENTS_COLLECTION)
  const q = query(eventsRef, orderBy("timestamp", "asc"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      // Use docChanges() to process only new/modified documents
      const changes = snapshot.docChanges()
      
      // Only process added or modified documents
      const newEvents: CallEvent[] = []
      changes.forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          const event = {
            id: change.doc.id,
            ...change.doc.data(),
          } as CallEvent
          newEvents.push(event)
        }
      })
      
      // Only callback if there are new events
      if (newEvents.length > 0) {
        callback(newEvents)
      }
    },
    (error) => {
      console.error("Call events subscription error:", error)
    }
  )

  return () => {
    log("[Firestore] Unsubscribe from call events", { callId })
    unsubscribe()
  }
}

/**
 * Subscribe to a specific call
 */
export function subscribeToCall(
  callId: string,
  callback: (call: VoiceCall | null) => void
): () => void {
  log("[Firestore] Subscribe to call", { callId })
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)

  const unsubscribe = onSnapshot(
    callRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const call = {
          id: snapshot.id,
          ...snapshot.data(),
        } as VoiceCall
        callback(call)
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Call subscription error:", error)
    }
  )

  return () => {
    log("[Firestore] Unsubscribe from call", { callId })
    unsubscribe()
  }
}

/**
 * Subscribe to incoming calls for a user
 */
export function subscribeToIncomingCalls(
  userId: string,
  callback: (call: VoiceCall | null) => void
): () => void {
  const q = query(
    collection(db, VOICE_CALLS_COLLECTION),
    where("participants", "array-contains", userId),
    where("status", "==", "ringing")
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const now = Date.now()

      // Find calls where user is not the initiator (incoming calls),
      // and drop anything stale - a "ringing" call older than the ring
      // timeout is abandoned, not a real incoming call. This is a safety
      // net on top of unique-per-call document IDs: even if a call somehow
      // never gets a terminal status written, it can't resurface as new.
      const incomingCalls = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as VoiceCall))
        .filter((call) => call.initiatorId !== userId)
        .filter((call: any) => {
          const startedMs = call.startedAt?.toMillis ? call.startedAt.toMillis() : 0
          if (!startedMs) return false
          return now - startedMs < RING_STALE_MS
        })

      if (incomingCalls.length > 0) {
        // Return the most recent incoming call
        callback(incomingCalls[0])
      } else {
        callback(null)
      }
    },
    (error) => {
      console.error("Incoming calls subscription error:", error)
    }
  )

  return unsubscribe
}

/**
 * End a call
 */
export async function endCall(callId: string): Promise<void> {
  await updateCallStatus(callId, "ended")
}

/**
 * Reject a call
 */
export async function rejectCall(callId: string): Promise<void> {
  await updateCallStatus(callId, "rejected")
}

/**
 * Cancel a call (caller cancels before answer)
 */
export async function cancelCall(callId: string): Promise<void> {
  await updateCallStatus(callId, "cancelled")
}

/**
 * Delete a call document
 */
export async function deleteCall(callId: string): Promise<void> {
  const callRef = doc(collection(db, VOICE_CALLS_COLLECTION), callId)
  await deleteDoc(callRef)
}

/**
 * Check if user is in a call
 */
export async function isUserInCall(userId: string): Promise<boolean> {
  const q = query(
    collection(db, VOICE_CALLS_COLLECTION),
    where("participants", "array-contains", userId),
    // NOTE: "active" was never an actual status your app sets (it's
    // "connected") - fixed to match the real CallStatus values.
    where("status", "in", ["ringing", "connecting", "connected"])
  )

  const snapshot = await getDocs(q)
  return !snapshot.empty
}
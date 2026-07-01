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

/**
 * Generate deterministic call ID from two user IDs and timestamp
 */
export function getCallId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_")
}

/**
 * Create a new voice call
 */
export async function createVoiceCall(
  initiatorId: string,
  initiatorName: string,
  targetUserId: string,
  targetUserName: string
): Promise<string> {
  const callId = getCallId(initiatorId, targetUserId)
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
    startedAt: new Date(),
  }

  await setDoc(callRef, callData, { merge: true })

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
  const eventsRef = collection(db, VOICE_CALLS_COLLECTION, callId, CALL_EVENTS_COLLECTION)
  const q = query(eventsRef, orderBy("timestamp", "asc"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const events: CallEvent[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CallEvent[]
      callback(events)
    },
    (error) => {
      console.error("Call events subscription error:", error)
    }
  )

  return unsubscribe
}

/**
 * Subscribe to a specific call
 */
export function subscribeToCall(
  callId: string,
  callback: (call: VoiceCall | null) => void
): () => void {
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

  return unsubscribe
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
      // Find calls where user is not the initiator (incoming calls)
      const incomingCalls = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as VoiceCall))
        .filter((call) => call.initiatorId !== userId)

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
    where("status", "in", ["ringing", "connecting", "active"])
  )

  const snapshot = await getDocs(q)
  return !snapshot.empty
}
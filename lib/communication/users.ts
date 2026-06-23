import { db } from "@/lib/firebase"
import { collection, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore"
import { UserProfile } from "@/types/communication"

const COLLECTION = "users"

export async function createOrUpdateUser(userId: string, displayName: string): Promise<void> {
  const userRef = doc(collection(db, COLLECTION), userId)
  
  await setDoc(userRef, {
    userId,
    displayName: displayName.trim(),
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
  }, { merge: true })
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userRef = doc(collection(db, COLLECTION), userId)
  const snapshot = await getDoc(userRef)
  
  if (!snapshot.exists()) {
    return null
  }
  
  return {
    userId: snapshot.id,
    ...snapshot.data(),
  } as UserProfile
}

export async function updateLastSeen(userId: string): Promise<void> {
  const userRef = doc(collection(db, COLLECTION), userId)
  await setDoc(userRef, {
    lastSeen: serverTimestamp(),
  }, { merge: true })
}
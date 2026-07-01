import { db } from "@/lib/firebase"
import { collection, doc, setDoc, updateDoc, onSnapshot, serverTimestamp, query, where } from "firebase/firestore"
import { OnlineUser } from "@/types/communication"

const COLLECTION = "online_users"

export async function setOnline(userId: string, userName: string): Promise<void> {
  const userRef = doc(collection(db, COLLECTION), userId)
  await setDoc(userRef, {
    userId,
    userName,
    status: "online",
    lastSeen: serverTimestamp(),
  }, { merge: true })
}

export async function updateLastSeen(userId: string): Promise<void> {
  const userRef = doc(collection(db, COLLECTION), userId)
  await setDoc(userRef, {
    lastSeen: serverTimestamp(),
  }, { merge: true })
}

export async function setOffline(userId: string): Promise<void> {
  const userRef = doc(collection(db, COLLECTION), userId)
  await setDoc(userRef, {
    userId,
    userName: "",  // Clear userName for privacy when offline
    status: "offline",
    lastSeen: serverTimestamp(),
  }, { merge: true })
}

export function subscribeToOnlineUsers(
  callback: (users: OnlineUser[]) => void
): () => void {
  const q = query(collection(db, COLLECTION), where("status", "==", "online"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const users: OnlineUser[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as OnlineUser[]
      callback(users)
    },
    (error) => {
      console.error("Presence subscription error:", error)
    }
  )

  return unsubscribe
}
import { db } from "@/lib/firebase"
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore"
import { ChatMessage } from "@/types/communication"

const COLLECTION = "community_messages"

export async function sendMessage(userId: string, userName: string, message: string): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    userId,
    userName,
    message,
    createdAt: serverTimestamp(),
  })
}

export function subscribeToMessages(
  callback: (messages: ChatMessage[]) => void
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "asc"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: ChatMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[]
      callback(messages)
    },
    (error) => {
      console.error("Chat subscription error:", error)
    }
  )

  return unsubscribe
}
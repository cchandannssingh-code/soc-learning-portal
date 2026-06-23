import { db } from "@/lib/firebase"
import { collection, query, orderBy, onSnapshot, serverTimestamp, addDoc } from "firebase/firestore"
import { Announcement } from "@/types/communication"

const COLLECTION = "announcements"

export function subscribeToAnnouncements(
  callback: (announcements: Announcement[]) => void
): () => void {
  const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const announcements: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[]
      callback(announcements)
    },
    (error) => {
      console.error("Announcements subscription error:", error)
    }
  )

  return unsubscribe
}

export async function createAnnouncement(title: string, content: string): Promise<void> {
  await addDoc(collection(db, COLLECTION), {
    title,
    content,
    createdAt: serverTimestamp(),
  })
}
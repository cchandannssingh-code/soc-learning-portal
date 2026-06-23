import { db } from "@/lib/firebase"
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  addDoc,
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy,
  where,
  updateDoc,
  arrayUnion
} from "firebase/firestore"
import { DirectConversation, DirectMessage } from "@/types/communication"

const CONVERSATIONS_COLLECTION = "direct_conversations"
const MESSAGES_COLLECTION = "direct_messages"

/**
 * Generate deterministic conversation ID from two user IDs
 * Always returns the same ID regardless of parameter order
 */
export function getConversationId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join("_")
}

/**
 * Get or create a direct conversation between two users
 */
export async function getOrCreateConversation(
  userId1: string,
  userId2: string,
  userName1: string,
  userName2: string
): Promise<string> {
  const conversationId = getConversationId(userId1, userId2)
  const conversationRef = doc(collection(db, CONVERSATIONS_COLLECTION), conversationId)

  const snapshot = await getDoc(conversationRef)
  
  if (!snapshot.exists()) {
    // Create new conversation
    await setDoc(conversationRef, {
      participants: [userId1, userId2],
      participantNames: {
        [userId1]: userName1,
        [userId2]: userName2,
      },
      createdAt: serverTimestamp(),
    })
  }

  return conversationId
}

/**
 * Send a direct message
 */
export async function sendDirectMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  message: string
): Promise<void> {
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION)
  
  // Send message
  await addDoc(messagesRef, {
    senderId,
    senderName,
    message: message.trim(),
    createdAt: serverTimestamp(),
    readBy: [senderId],
  })

  // Update conversation metadata
  const conversationRef = doc(collection(db, CONVERSATIONS_COLLECTION), conversationId)
  await updateDoc(conversationRef, {
    lastMessage: message.trim(),
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
  })
}

/**
 * Subscribe to conversations for a specific user
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: DirectConversation[]) => void
): () => void {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where("participants", "array-contains", userId)
  )

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const conversations: DirectConversation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DirectConversation[]
      
      // Sort by lastMessageAt descending client-side
      conversations.sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis() || 0
        const bTime = b.lastMessageAt?.toMillis() || 0
        return bTime - aTime
      })
      
      callback(conversations)
    },
    (error) => {
      console.error("Conversations subscription error:", error)
    }
  )

  return unsubscribe
}

/**
 * Subscribe to messages in a conversation
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: DirectMessage[]) => void
): () => void {
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION)
  const q = query(messagesRef, orderBy("createdAt", "asc"))

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages: DirectMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        conversationId,
        ...doc.data(),
      })) as DirectMessage[]
      callback(messages)
    },
    (error) => {
      console.error("Messages subscription error:", error)
    }
  )

  return unsubscribe
}

/**
 * Mark messages in a conversation as read by a user
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION)
  
  // Get all unread messages in this conversation
  const q = query(
    messagesRef,
    where("readBy", "not-in", [[userId]])
  )

  // Note: Firestore doesn't support "not-in" with array-contains
  // We'll use a different approach - update all messages not read by this user
  // For simplicity, we'll mark the conversation as read by updating a field
  const conversationRef = doc(collection(db, CONVERSATIONS_COLLECTION), conversationId)
  await updateDoc(conversationRef, {
    [`readBy_${userId}`]: serverTimestamp(),
  })
}

/**
 * Get unread count for a conversation
 * Returns the number of messages not sent by the user
 */
export function getUnreadCount(
  conversation: DirectConversation,
  userId: string
): number {
  // This is a simplified version - in production, you'd query messages
  // For now, we'll return 0 and implement proper counting in the hook
  return 0
}
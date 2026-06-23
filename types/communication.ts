import { Timestamp } from "firebase/firestore"

export interface ChatMessage {
  id?: string
  userId: string
  userName: string
  message: string
  createdAt?: Timestamp
}

export interface OnlineUser {
  id?: string
  userId: string
  userName: string
  status: "online" | "offline"
  lastSeen: Timestamp
}

export interface Announcement {
  id?: string
  title: string
  content: string
  createdAt?: Timestamp
}

export interface UserProfile {
  userId: string
  displayName: string
  createdAt: Timestamp
  lastSeen: Timestamp
}

export interface DirectConversation {
  id?: string
  participants: string[]
  participantNames: Record<string, string>
  createdAt: Timestamp
  lastMessage?: string
  lastMessageAt?: Timestamp
  lastMessageSenderId?: string
}

export interface DirectMessage {
  id?: string
  conversationId: string
  senderId: string
  senderName: string
  message: string
  createdAt: Timestamp
  readBy: string[]
}

export type TabType = "chat" | "online" | "announcements" | "profile" | "direct"

export interface CommunicationHubState {
  isExpanded: boolean
  activeTab: TabType
  unreadCount: number
}

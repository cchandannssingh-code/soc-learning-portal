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

export type TabType = "chat" | "online" | "announcements"

export interface CommunicationHubState {
  isExpanded: boolean
  activeTab: TabType
  unreadCount: number
}
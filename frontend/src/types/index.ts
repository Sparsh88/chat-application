export type UserStatus = 'online' | 'away' | 'dnd' | 'offline';
export type UserRole = 'owner' | 'admin' | 'moderator' | 'member';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  status: UserStatus;
  customStatus?: string;
  statusEmoji?: string;
  role: UserRole;
  isVerified?: boolean;
  bio?: string;
  createdAt: string;
  publicKey?: string;
  preferredLanguage?: string;
  autoTranslate?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isClosed?: boolean;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string; // 'image' | 'video' | 'audio' | 'pdf' | 'doc' | 'code' | 'archive'
  url: string;
  mimeType: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  channelId?: string;
  recipientId?: string;
  isEncrypted?: boolean;
  encryptedPayload?: string;
  translations?: Record<string, string>; // langCode -> translated text
  attachments?: FileAttachment[];
  reactions?: Reaction[];
  poll?: Poll;
  isPinned?: boolean;
  isAnnouncement?: boolean;
  expiresAt?: string; // Disappearing message expiration
  audioUrl?: string; // Voice message note
  replyToId?: string;
  replyToSnippet?: string;
  isEdited?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'voice' | 'announcement';
  isPrivate: boolean;
  topic?: string;
  unreadCount?: number;
  isPinned?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  icon?: string;
}

export interface DirectMessage {
  id: string;
  user: User;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isFavorite?: boolean;
  isEncrypted?: boolean;
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  host: string;
  date: string;
  time: string;
  duration: number; // minutes
  participants: string[];
  link: string;
  isRecurring?: boolean;
  timeZone: string;
}

export interface CallState {
  isActive: boolean;
  isInProgress: boolean;
  callType: 'voice' | 'video';
  channelId?: string;
  recipientUser?: User;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isBackgroundBlurred: boolean;
  isHandRaised: boolean;
  isRecording: boolean;
  durationSeconds: number;
  remoteStream?: MediaStream | null;
  localStream?: MediaStream | null;
}

export interface AnalyticsData {
  userMetrics: {
    messagesSent: number;
    activeFriends: number;
    activeGroups: number;
    timeSpentChattingHours: number;
    weeklyActivity: { day: string; messages: number; calls: number }[];
  };
  adminMetrics: {
    dau: number;
    mau: number;
    messagesPerDay: number;
    storageUsedGB: number;
    userGrowth: { month: string; users: number }[];
    deviceAnalytics: { name: string; value: number }[];
    countryAnalytics: { country: string; percentage: number }[];
  };
}

export type ThemeMode = 'dark' | 'light' | 'oled' | 'cyberpunk' | 'emerald' | 'sunset';

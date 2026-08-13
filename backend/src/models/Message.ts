import { Schema, model } from 'mongoose';

export interface IMessage {
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
  attachments?: any[];
  reactions?: { emoji: string; count: number; users: string[] }[];
  poll?: any;
  isPinned?: boolean;
  replyToId?: string;
  audioUrl?: string;
}

const MessageSchema = new Schema<IMessage>({
  id: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, required: true },
  content: { type: String, default: '' },
  timestamp: { type: String, default: () => new Date().toISOString() },
  channelId: { type: String },
  recipientId: { type: String },
  isEncrypted: { type: Boolean, default: false },
  encryptedPayload: { type: String },
  attachments: { type: Array, default: [] },
  reactions: { type: Array, default: [] },
  poll: { type: Object },
  isPinned: { type: Boolean, default: false },
  replyToId: { type: String },
  audioUrl: { type: String }
});

// Compound indexes to optimize channel message queries and direct message queries
MessageSchema.index({ channelId: 1, timestamp: 1 });
MessageSchema.index({ senderId: 1, recipientId: 1, timestamp: 1 });
MessageSchema.index({ recipientId: 1, senderId: 1, timestamp: 1 });
MessageSchema.index({ timestamp: -1 });

export const MessageModel = model<IMessage>('Message', MessageSchema);


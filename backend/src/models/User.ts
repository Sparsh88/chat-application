import { Schema, model } from 'mongoose';

export interface IUser {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  customStatus?: string;
  statusEmoji?: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  bio?: string;
  createdAt: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  avatar: { type: String, required: true },
  status: { type: String, default: 'online' },
  customStatus: { type: String },
  statusEmoji: { type: String },
  role: { type: String, default: 'member' },
  bio: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const UserModel = model<IUser>('User', UserSchema);

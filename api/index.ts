// @ts-ignore
import express, { Request, Response } from 'express';
// @ts-ignore
import cors from 'cors';
// @ts-ignore
import bcrypt from 'bcryptjs';
// @ts-ignore
import mongoose, { Schema, model } from 'mongoose';
import crypto from 'crypto';

const MONGODB_URI = process.env.MONGODB_URI || "";
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || 'letsconnect_lifetime_jwt_secret_2026_key';
const LIFETIME_EXPIRY_SECONDS = 10 * 365 * 24 * 60 * 60; // 10 years

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function generateLifetimeToken(payload: { id: string; email: string; name: string; role: string }): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowInSeconds,
    exp: nowInSeconds + LIFETIME_EXPIRY_SECONDS
  };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${signatureInput}.${signature}`;
}

function verifyLifetimeToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(signatureInput)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (signature !== expectedSignature) return null;
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Optimized Mongoose Serverless Connection Caching Pattern
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

const MONGO_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  bufferCommands: false,
};

const connectDB = async () => {
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, MONGO_OPTIONS).then((m: typeof mongoose) => {
      console.log("Connected to MongoDB Atlas (Pooled & Cached)");
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    console.error("MongoDB Serverless Connection Error:", e);
  }

  return cached!.conn;
};

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

UserSchema.index({ username: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

const UserModel = mongoose.models.User || model<IUser>('User', UserSchema);

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

MessageSchema.index({ channelId: 1, timestamp: 1 });
MessageSchema.index({ senderId: 1, recipientId: 1, timestamp: 1 });
MessageSchema.index({ recipientId: 1, senderId: 1, timestamp: 1 });
MessageSchema.index({ timestamp: -1 });

const MessageModel = mongoose.models.Message || model<IMessage>('Message', MessageSchema);

export interface IMeeting {
  id: string;
  title: string;
  description: string;
  host: string;
  date: string;
  time: string;
  duration: number;
  participants: string[];
  link: string;
  isRecurring?: boolean;
  timeZone: string;
  createdAt: string;
}

const MeetingSchema = new Schema<IMeeting>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  host: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  participants: { type: [String], default: [] },
  link: { type: String, required: true },
  isRecurring: { type: Boolean, default: false },
  timeZone: { type: String, default: 'EST (UTC-5)' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

MeetingSchema.index({ createdAt: -1 });
MeetingSchema.index({ date: 1, time: 1 });

const MeetingModel = mongoose.models.Meeting || model<IMeeting>('Meeting', MeetingSchema);

const DEMO_ACCOUNTS: Record<string, any> = {
  'sparshchauhan050@gmail.com': {
    id: 'user-admin-sparsh',
    email: 'sparshchauhan050@gmail.com',
    name: 'Sparsh Chauhan',
    username: 'sparshchauhan050',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'owner',
    createdAt: '2024-01-15T08:00:00.000Z'
  },
  'sarah@letsconnect.io': {
    id: 'u-sarah',
    email: 'sarah@letsconnect.io',
    name: 'Sarah Chen',
    username: 'sarah_chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'member',
    createdAt: '2024-02-01T08:00:00.000Z'
  },
  'marcus@letsconnect.io': {
    id: 'u-marcus',
    email: 'marcus@letsconnect.io',
    name: 'Marcus Vance',
    username: 'marcus_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'member',
    createdAt: '2024-02-10T08:00:00.000Z'
  },
  'elena@letsconnect.io': {
    id: 'u-elena',
    email: 'elena@letsconnect.io',
    name: 'Elena Rostova',
    username: 'elena_r',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'moderator',
    createdAt: '2024-03-05T08:00:00.000Z'
  },
  'alex.rivera@letsconnect.io': {
    id: 'user-001',
    email: 'alex.rivera@letsconnect.io',
    name: 'Alex Rivera',
    username: 'alex_rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'member',
    createdAt: '2024-01-10T08:00:00.000Z'
  },
  'alex@letsconnect.io': {
    id: 'user-001',
    email: 'alex.rivera@letsconnect.io',
    name: 'Alex Rivera',
    username: 'alex_rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    status: 'online',
    role: 'member',
    createdAt: '2024-01-10T08:00:00.000Z'
  }
};

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Health Check
app.get('/api/health', async (_req: Request, res: Response) => {
  await connectDB();
  res.setHeader('Cache-Control', 'no-cache');
  res.json({
    status: 'ok',
    databaseConnected: mongoose.connection.readyState === 1
  });
});

// AUTH: Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  await connectDB();
  const { email, password, name, username } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const generatedUsername = username || email.split('@')[0].replace(/\./g, '_');
  const userId = `user-${Date.now()}`;

  try {
    const existingUser = await UserModel.findOne({ email }).lean().exec();
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
    }

    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const newUser = await UserModel.create({
      id: userId,
      email,
      name,
      username: generatedUsername,
      password: hashedPassword,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      status: 'online',
      role: 'member'
    });

    const token = generateLifetimeToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    });

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      username: newUser.username,
      avatar: newUser.avatar,
      status: newUser.status,
      role: newUser.role,
      createdAt: newUser.createdAt,
      token
    });
  } catch (err: any) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Database registration failed' });
  }
});

// AUTH: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  await connectDB();
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let user = await UserModel.findOne({ email: new RegExp(`^${normalizedEmail}$`, 'i') });

    // Auto-create demo/admin user if missing in DB
    if (!user && DEMO_ACCOUNTS[normalizedEmail]) {
      const demoData = { ...DEMO_ACCOUNTS[normalizedEmail] };
      if (normalizedEmail === 'sparshchauhan050@gmail.com') {
        demoData.password = await bcrypt.hash('Sp@080806', 10);
      }
      user = await UserModel.create(demoData);
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please create an account first.' });
    }

    // Ensure sparshchauhan050 is always owner/admin and no one else is
    if (normalizedEmail === 'sparshchauhan050@gmail.com') {
      if (!password) {
        return res.status(401).json({ error: 'Admin password is required' });
      }
      if (password === 'Sp@080806') {
        // Explicit password match
      } else if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid admin credentials' });
        }
      } else {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      if (user.role !== 'owner') {
        await UserModel.updateOne({ _id: user._id }, { role: 'owner' });
        user.role = 'owner';
      }
    } else {
      if (user.role === 'owner' || user.role === 'admin') {
        await UserModel.updateOne({ _id: user._id }, { role: 'member' });
        user.role = 'member';
      }
      if (user.password && password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }
    }

    const token = generateLifetimeToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      status: user.status,
      role: user.role,
      token
    });
  } catch (err: any) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Database login failed' });
  }
});

// AUTH: Me / Session verify
app.get('/api/auth/me', async (req: Request, res: Response) => {
  await connectDB();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyLifetimeToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired session token' });
  }

  try {
    const user = await UserModel.findOne({ id: decoded.id }, '-password').lean().exec();
    if (!user) {
      return res.json(decoded);
    }
    return res.json({ ...user, token });
  } catch {
    return res.json(decoded);
  }
});

// USERS: Get registered users (with lean query, projection, and pagination)
app.get('/api/users', async (req: Request, res: Response) => {
  await connectDB();
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  try {
    const users = await UserModel.find({}, '-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.setHeader('Cache-Control', 'public, max-age=10, stale-while-revalidate=60');
    return res.json(users);
  } catch (err: any) {
    console.error('Fetch Users Error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// MESSAGES: Get messages with compound index, lean query, and pagination
app.get('/api/messages/:targetId', async (req: Request, res: Response) => {
  await connectDB();
  const { targetId } = req.params;
  const currentUserId = req.query.currentUserId as string | undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const before = req.query.before as string | undefined;

  try {
    let filter: any;
    if (targetId.startsWith('ch-')) {
      filter = { channelId: targetId };
    } else if (currentUserId) {
      filter = {
        $or: [
          { channelId: targetId },
          { senderId: currentUserId, recipientId: targetId },
          { senderId: targetId, recipientId: currentUserId }
        ]
      };
    } else {
      filter = {
        $or: [{ channelId: targetId }, { recipientId: targetId }, { senderId: targetId }]
      };
    }

    if (before) {
      filter.timestamp = { $lt: before };
    }

    const messages = await MessageModel.find(filter)
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean()
      .exec();

    res.setHeader('Cache-Control', 'public, max-age=2, stale-while-revalidate=10');
    return res.json(messages);
  } catch (err: any) {
    console.error('Fetch Messages Error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// MESSAGES: Save message
app.post('/api/messages', async (req: Request, res: Response) => {
  await connectDB();
  const messageData = req.body;
  const message = {
    id: messageData.id || `msg-${Date.now()}`,
    ...messageData,
    timestamp: messageData.timestamp || new Date().toISOString()
  };

  try {
    const savedMsg = await MessageModel.create(message);
    return res.status(201).json(savedMsg);
  } catch (err: any) {
    console.error('Save Message Error:', err);
    return res.status(500).json({ error: 'Failed to save message' });
  }
});

// MEETINGS: Get meetings with lean execution
app.get('/api/meetings', async (req: Request, res: Response) => {
  await connectDB();
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 100);
  try {
    const meetings = await MeetingModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    res.setHeader('Cache-Control', 'public, max-age=15, stale-while-revalidate=60');
    return res.json(meetings);
  } catch (err: any) {
    console.error('Fetch Meetings Error:', err);
    return res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// MEETINGS: Create meeting
app.post('/api/meetings', async (req: Request, res: Response) => {
  await connectDB();
  const meetingData = {
    id: req.body.id || `mtg-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  try {
    const newMeeting = await MeetingModel.create(meetingData);
    return res.status(201).json(newMeeting);
  } catch (err: any) {
    console.error('Create Meeting Error:', err);
    return res.status(500).json({ error: 'Failed to create meeting' });
  }
});

export default app;

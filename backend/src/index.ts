import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { connectDB, getIsConnected } from './db.js';
import { UserModel } from './models/User.js';
import { MessageModel } from './models/Message.js';
import { MeetingModel } from './models/Meeting.js';

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || '*';

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

// Connect to MongoDB
connectDB();

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

interface UserSession {
  id: string;
  username: string;
  name: string;
  avatar: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  customStatus?: string;
  socketId: string;
  publicKey?: string;
}

const activeUsers = new Map<string, UserSession>();
const fallbackMeetings: any[] = [];
const fallbackMessages: any[] = [];
const auditLogs: any[] = [
  { id: '1', action: 'SECURITY_SCAN', user: 'System Bot', timestamp: new Date(Date.now() - 3600000).toISOString(), details: 'Routine Helmet & CORS security audit completed.' },
  { id: '2', action: 'USER_LOGIN', user: 'Alex Rivera', timestamp: new Date(Date.now() - 1800000).toISOString(), details: '2FA authentication successful via JWT refresh flow.' }
];

const DEMO_ACCOUNTS: Record<string, any> = {
  'alex.rivera@letsconnect.io': {
    id: 'user-001',
    email: 'alex.rivera@letsconnect.io',
    name: 'Alex Rivera',
    username: 'alex_rivera',
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
    role: 'admin',
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
  }
};

const fallbackUsers: any[] = Object.values(DEMO_ACCOUNTS);

// --- REST ENDPOINTS ---

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    databaseConnected: getIsConnected(),
    uptime: process.uptime(),
    activeConnections: activeUsers.size
  });
});

// AUTH: Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { email, password, name, username } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const generatedUsername = username || email.split('@')[0].replace(/\./g, '_');
  const userId = `user-${Date.now()}`;

  if (getIsConnected()) {
    try {
      const existingUser = await UserModel.findOne({ email });
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

      return res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        username: newUser.username,
        avatar: newUser.avatar,
        status: newUser.status,
        role: newUser.role,
        createdAt: newUser.createdAt
      });
    } catch (err: any) {
      console.error('Registration Error:', err);
      return res.status(500).json({ error: 'Database registration failed' });
    }
  } else {
    // In-memory fallback
    const existing = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'Email already registered. Please log in.' });
    }
    const user = {
      id: userId,
      email,
      name,
      username: generatedUsername,
      password,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      status: 'online',
      role: 'member',
      createdAt: new Date().toISOString()
    };
    fallbackUsers.push(user);
    return res.status(201).json(user);
  }
});

// AUTH: Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = email.toLowerCase();

  if (getIsConnected()) {
    try {
      let user = await UserModel.findOne({ email });

      // Auto-create demo user if missing in DB for seamless quick demo testing
      if (!user && DEMO_ACCOUNTS[normalizedEmail]) {
        const demoData = DEMO_ACCOUNTS[normalizedEmail];
        user = await UserModel.create(demoData);
      }

      if (!user) {
        return res.status(404).json({ error: 'Account not found. Please create an account first.' });
      }

      if (user.password && password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }
      }

      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        status: user.status,
        role: user.role
      });
    } catch (err: any) {
      console.error('Login Error:', err);
      return res.status(500).json({ error: 'Database login failed' });
    }
  } else {
    // In-memory fallback
    let user = fallbackUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user && DEMO_ACCOUNTS[normalizedEmail]) {
      user = DEMO_ACCOUNTS[normalizedEmail];
      fallbackUsers.push(user);
    }

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please create an account first.' });
    }

    if (user.password && password && user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    return res.json(user);
  }
});

// USERS: Get all registered users
app.get('/api/users', async (_req: Request, res: Response) => {
  if (getIsConnected()) {
    try {
      const users = await UserModel.find({}, '-password');
      return res.json(users);
    } catch (err: any) {
      console.error('Fetch Users Error:', err);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  } else {
    return res.json(Array.from(activeUsers.values()));
  }
});

// MESSAGES: Get messages by channelId or recipientId
app.get('/api/messages/:targetId', async (req: Request, res: Response) => {
  const { targetId } = req.params;
  const currentUserId = req.query.currentUserId as string | undefined;

  if (getIsConnected()) {
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

      const messages = await MessageModel.find(filter).sort({ timestamp: 1 });
      return res.json(messages);
    } catch (err: any) {
      console.error('Fetch Messages Error:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
  } else {
    const filtered = fallbackMessages.filter(m => {
      if (targetId.startsWith('ch-')) {
        return m.channelId === targetId;
      }
      if (currentUserId) {
        return m.channelId === targetId ||
          (m.senderId === currentUserId && m.recipientId === targetId) ||
          (m.senderId === targetId && m.recipientId === currentUserId);
      }
      return m.channelId === targetId || m.recipientId === targetId || m.senderId === targetId;
    });
    return res.json(filtered);
  }
});

// MESSAGES: Create a message
app.post('/api/messages', async (req: Request, res: Response) => {
  const messageData = req.body;
  const message = {
    id: messageData.id || `msg-${Date.now()}`,
    ...messageData,
    timestamp: messageData.timestamp || new Date().toISOString()
  };

  if (getIsConnected()) {
    try {
      const savedMsg = await MessageModel.create(message);
      return res.status(201).json(savedMsg);
    } catch (err: any) {
      console.error('Save Message Error:', err);
      return res.status(500).json({ error: 'Failed to save message' });
    }
  } else {
    fallbackMessages.push(message);
    return res.status(201).json(message);
  }
});

// MEETINGS: Get all scheduled meetings
app.get('/api/meetings', async (_req: Request, res: Response) => {
  if (getIsConnected()) {
    try {
      const meetings = await MeetingModel.find().sort({ createdAt: -1 });
      return res.json(meetings);
    } catch (err: any) {
      console.error('Fetch Meetings Error:', err);
      return res.status(500).json({ error: 'Failed to fetch meetings' });
    }
  } else {
    return res.json(fallbackMeetings);
  }
});

// MEETINGS: Create meeting
app.post('/api/meetings', async (req: Request, res: Response) => {
  const meetingData = {
    id: req.body.id || `mtg-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };

  if (getIsConnected()) {
    try {
      const newMeeting = await MeetingModel.create(meetingData);
      auditLogs.unshift({
        id: `log-${Date.now()}`,
        action: 'MEETING_CREATED',
        user: req.body.host || 'Unknown Host',
        timestamp: new Date().toISOString(),
        details: `Created meeting: "${req.body.title}"`
      });
      io.emit('meeting_created', newMeeting);
      return res.status(201).json(newMeeting);
    } catch (err: any) {
      console.error('Create Meeting Error:', err);
      return res.status(500).json({ error: 'Failed to create meeting' });
    }
  } else {
    fallbackMeetings.push(meetingData);
    auditLogs.unshift({
      id: `log-${Date.now()}`,
      action: 'MEETING_CREATED',
      user: req.body.host || 'Unknown Host',
      timestamp: new Date().toISOString(),
      details: `Created meeting: "${req.body.title}"`
    });
    io.emit('meeting_created', meetingData);
    return res.status(201).json(meetingData);
  }
});

// ANALYTICS
app.get('/api/analytics', (_req: Request, res: Response) => {
  res.json({
    userMetrics: {
      messagesSent: 1420,
      activeFriends: 28,
      activeGroups: 12,
      timeSpentChattingHours: 18.5,
      weeklyActivity: [
        { day: 'Mon', messages: 180, calls: 2 },
        { day: 'Tue', messages: 240, calls: 4 },
        { day: 'Wed', messages: 310, calls: 3 },
        { day: 'Thu', messages: 290, calls: 5 },
        { day: 'Fri', messages: 420, calls: 6 },
        { day: 'Sat', messages: 150, calls: 1 },
        { day: 'Sun', messages: 95, calls: 0 },
      ]
    },
    adminMetrics: {
      dau: 4850,
      mau: 34200,
      messagesPerDay: 89400,
      storageUsedGB: 142.8,
      userGrowth: [
        { month: 'Jan', users: 12000 },
        { month: 'Feb', users: 18500 },
        { month: 'Mar', users: 24000 },
        { month: 'Apr', users: 29800 },
        { month: 'May', users: 34200 },
      ],
      deviceAnalytics: [
        { name: 'Desktop Web', value: 55 },
        { name: 'Mobile App', value: 35 },
        { name: 'Tablet', value: 10 }
      ],
      countryAnalytics: [
        { country: 'United States', percentage: 38 },
        { country: 'India', percentage: 24 },
        { country: 'Germany', percentage: 14 },
        { country: 'United Kingdom', percentage: 12 },
        { country: 'Others', percentage: 12 }
      ]
    }
  });
});

app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(auditLogs);
});

// --- SOCKET.IO HANDLERS ---
io.on('connection', (socket: Socket) => {
  console.log(`🔌 New Socket Connection: ${socket.id}`);

  socket.on('user_login', (userData: { id: string; username: string; name: string; avatar: string; publicKey?: string }) => {
    const session: UserSession = {
      ...userData,
      status: 'online',
      socketId: socket.id
    };
    activeUsers.set(userData.id, session);
    socket.data.userId = userData.id;

    // Join private room for user-targeted messages
    socket.join(userData.id);

    io.emit('user_status_changed', { userId: userData.id, status: 'online' });
    io.emit('active_users_list', Array.from(activeUsers.values()));
  });

  socket.on('join_room', (roomId: string) => {
    socket.join(roomId);
  });

  socket.on('leave_room', (roomId: string) => {
    socket.leave(roomId);
  });

  socket.on('send_message', async (message: any) => {
    // Persist to DB if connected
    if (getIsConnected()) {
      try {
        await MessageModel.create(message);
      } catch (err) {
        console.error('Socket Message Persist Error:', err);
      }
    } else {
      fallbackMessages.push(message);
    }

    if (message.channelId) {
      io.to(message.channelId).emit('receive_message', message);
    } else if (message.recipientId) {
      // Emit to recipient's private room and sender's private room
      io.to(message.recipientId).emit('receive_message', message);
      if (message.senderId && message.senderId !== message.recipientId) {
        io.to(message.senderId).emit('receive_message', message);
      }

      // Also directly emit to specific socket ID if registered in activeUsers
      const recipient = activeUsers.get(message.recipientId);
      if (recipient && recipient.socketId) {
        io.to(recipient.socketId).emit('receive_message', message);
      }
    }
  });

  socket.on('typing_start', (data: { roomId: string; username: string }) => {
    socket.to(data.roomId).emit('user_typing_start', data);
  });

  socket.on('typing_stop', (data: { roomId: string; username: string }) => {
    socket.to(data.roomId).emit('user_typing_stop', data);
  });

  socket.on('add_reaction', async (data: { messageId: string; emoji: string; userId: string; roomId: string }) => {
    if (getIsConnected()) {
      try {
        const msg = await MessageModel.findOne({ id: data.messageId });
        if (msg) {
          const reactions = msg.reactions || [];
          const rIndex = reactions.findIndex((r: any) => r.emoji === data.emoji);
          if (rIndex > -1) {
            const hasVoted = reactions[rIndex].users.includes(data.userId);
            if (hasVoted) {
              reactions[rIndex].users = reactions[rIndex].users.filter((u: string) => u !== data.userId);
              reactions[rIndex].count = reactions[rIndex].users.length;
            } else {
              reactions[rIndex].users.push(data.userId);
              reactions[rIndex].count = reactions[rIndex].users.length;
            }
          } else {
            reactions.push({ emoji: data.emoji, count: 1, users: [data.userId] });
          }
          await MessageModel.updateOne({ id: data.messageId }, { reactions });
        }
      } catch (err) {
        console.error('Reaction Persist Error:', err);
      }
    }
    io.to(data.roomId).emit('reaction_updated', data);
  });

  // WebRTC Call Signaling
  socket.on('call_initiate', (data: { targetUserId: string; caller: any; offer: any; isVideo: boolean }) => {
    const target = activeUsers.get(data.targetUserId);
    if (target) {
      io.to(target.socketId).emit('incoming_call', {
        caller: data.caller,
        offer: data.offer,
        isVideo: data.isVideo,
        callerSocketId: socket.id
      });
    } else {
      socket.emit('call_failed', { reason: 'User is offline' });
    }
  });

  socket.on('call_answer', (data: { callerSocketId: string; answer: any }) => {
    io.to(data.callerSocketId).emit('call_accepted', { answer: data.answer, answerSocketId: socket.id });
  });

  socket.on('ice_candidate', (data: { targetSocketId: string; candidate: any }) => {
    io.to(data.targetSocketId).emit('ice_candidate_received', { candidate: data.candidate, senderSocketId: socket.id });
  });

  socket.on('end_call', (data: { targetSocketId: string }) => {
    if (data.targetSocketId) {
      io.to(data.targetSocketId).emit('call_ended');
    }
  });

  socket.on('raise_hand', (data: { roomId: string; username: string; isRaised: boolean }) => {
    io.to(data.roomId).emit('hand_raised', data);
  });

  socket.on('disconnect', () => {
    const userId = socket.data.userId;
    if (userId) {
      activeUsers.delete(userId);
      io.emit('user_status_changed', { userId, status: 'offline' });
      io.emit('active_users_list', Array.from(activeUsers.values()));
    }
    console.log(`❌ Socket Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Let's Connect Backend running on port ${PORT}`);
});

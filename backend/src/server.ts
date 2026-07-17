import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { initSocketIO } from './socket.js';
import { authenticateJWT, requireAdmin, rateLimiter } from './middleware/auth.js';
import * as authController from './controllers/authController.js';
import * as aiController from './controllers/aiController.js';
import * as meetingController from './controllers/meetingController.js';
import * as analyticsController from './controllers/analyticsController.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(cors());
app.use(express.json());

// Custom Security Headers (Helmet replacement)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// --- REST ROUTES ---

// Auth Routes
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticateJWT, authController.getCurrentUser);
app.put('/api/auth/profile', authenticateJWT, authController.updateProfile);

// QR Login Challenge endpoints
app.post('/api/auth/qr/challenge', authController.generateQRChallenge);
app.post('/api/auth/qr/scan', authenticateJWT, authController.scanQRChallenge);
app.post('/api/auth/qr/authorize', authenticateJWT, authController.authorizeQRChallenge);
app.get('/api/auth/qr/status/:challengeId', authController.checkQRStatus);

// AI Assistant Proxy Routes (protected by JWT & rate limiter)
app.post('/api/ai/translate', authenticateJWT, rateLimiter(20, 60000), aiController.translateMessage);
app.post('/api/ai/rewrite', authenticateJWT, rateLimiter(20, 60000), aiController.rewriteMessage);
app.post('/api/ai/grammar', authenticateJWT, rateLimiter(20, 60000), aiController.correctGrammar);
app.post('/api/ai/summarize', authenticateJWT, aiController.summarizeConversation);
app.post('/api/ai/meeting-notes', authenticateJWT, aiController.generateMeetingNotes);
app.get('/api/ai/search', authenticateJWT, aiController.aiSmartSearch);
app.post('/api/ai/extract-tasks', authenticateJWT, aiController.extractTasksFromChat);

// Meeting Scheduler Routes
app.post('/api/meetings', authenticateJWT, meetingController.createMeeting);
app.get('/api/meetings', authenticateJWT, meetingController.getMeetings);
app.delete('/api/meetings/:id', authenticateJWT, meetingController.deleteMeeting);

// Analytics Dashboard Routes
app.get('/api/analytics/user', authenticateJWT, analyticsController.getUserAnalytics);
app.get('/api/analytics/admin', authenticateJWT, authenticateJWT, requireAdmin, analyticsController.getAdminAnalytics);

// Direct Friendships & User search APIs
app.get('/api/users', authenticateJWT, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        customStatus: true,
        onlinePresence: true,
        theme: true,
        verified: true,
        avatarUrl: true
      }
    });
    return res.json(users);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Fetch message history for a group or user DM
app.get('/api/messages', authenticateJWT, async (req, res) => {
  const { recipientId, groupId } = req.query;
  try {
    let messages;
    if (groupId) {
      messages = await prisma.message.findMany({
        where: { groupId: String(groupId) },
        orderBy: { createdAt: 'asc' }
      });
    } else if (recipientId) {
      const currentUserId = (req as any).user.id;
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: String(recipientId) },
            { senderId: String(recipientId), receiverId: currentUserId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
    } else {
      return res.status(400).json({ error: 'recipientId or groupId is required' });
    }
    return res.json(messages);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Group / Channels CRUD APIs
app.post('/api/groups', authenticateJWT, async (req, res: any) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Group name is required' });

  try {
    const group = await prisma.group.create({
      data: {
        name,
        description,
        ownerId: (req as any).user.id
      }
    });

    // Auto add creator as Admin member
    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: (req as any).user.id,
        role: 'OWNER'
      }
    });

    return res.status(201).json(group);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/groups', authenticateJWT, async (req, res) => {
  try {
    const groups = await prisma.group.findMany();
    return res.json(groups);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Initialize Socket.io signaling & state loops
initSocketIO(io);

// Auto-seed Database with demo entities for presentation
async function seedDemoData() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return; // DB already contains seed records

  console.log('Seeding initial premium demo users & groups...');

  // Create Admin
  const adminPassHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@nebulachat.io',
      username: 'NebulaAdmin',
      passwordHash: adminPassHash,
      role: 'ADMIN',
      verified: true,
      customStatus: 'Moderator / System Lead',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150'
    }
  });

  // Create standard user
  const userPassHash = await bcrypt.hash('user123', 10);
  const employee = await prisma.user.create({
    data: {
      email: 'alex@company.com',
      username: 'AlexDev',
      passwordHash: userPassHash,
      role: 'USER',
      verified: true,
      customStatus: 'Coding in React 💻',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150'
    }
  });

  const sarah = await prisma.user.create({
    data: {
      email: 'sarah@design.com',
      username: 'SarahUX',
      passwordHash: userPassHash,
      role: 'USER',
      verified: false,
      customStatus: 'Polishing layout components ✨',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150'
    }
  });

  // Create general server/group
  const group = await prisma.group.create({
    data: {
      name: 'General Discussion',
      description: 'Main chat room for the design & development squads.',
      ownerId: admin.id
    }
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: group.id, userId: admin.id, role: 'OWNER' },
      { groupId: group.id, userId: employee.id, role: 'MEMBER' },
      { groupId: group.id, userId: sarah.id, role: 'MEMBER' }
    ]
  });

  // Create Friendship
  await prisma.friendship.createMany({
    data: [
      { requesterId: admin.id, receiverId: employee.id, status: 'ACCEPTED' },
      { requesterId: employee.id, receiverId: sarah.id, status: 'ACCEPTED' }
    ]
  });

  // Add initial message logs
  await prisma.message.createMany({
    data: [
      {
        content: 'Welcome to NebulaChat SaaS Collaboration hub!',
        senderId: admin.id,
        groupId: group.id
      },
      {
        content: 'Thanks for setting this up! The speed is incredible.',
        senderId: employee.id,
        groupId: group.id
      },
      {
        content: 'Agreed, the glassmorphism theme and custom themes options look beautiful!',
        senderId: sarah.id,
        groupId: group.id
      }
    ]
  });

  console.log('Database seeding completed successfully.');
}

// Start Server
server.listen(PORT, async () => {
  console.log(`Backend server is running on port ${PORT}`);
  try {
    await seedDemoData();
  } catch (err) {
    console.error('Database connection / seeding failed: ', err);
  }
});

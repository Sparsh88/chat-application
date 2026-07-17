import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'antigravity-super-secret-key-12345';

// Mock DB for pending QR Code challenges
const pendingQRCodes = new Map<string, { socketId?: string; userId?: string; status: 'PENDING' | 'SCANNED' | 'AUTHORIZED' }>();

export async function signup(req: AuthenticatedRequest, res: Response) {
  const { email, username, password, role } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
        theme: 'default',
        onlinePresence: 'online'
      }
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.auditLog.create({
      data: {
        action: 'USER_SIGNUP',
        actorId: user.id,
        details: `User registered: ${user.username}`
      }
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        customStatus: user.customStatus,
        onlinePresence: user.onlinePresence,
        theme: user.theme,
        verified: user.verified,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Signup error: ' + error.message });
  }
}

export async function login(req: AuthenticatedRequest, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update online presence
    await prisma.user.update({
      where: { id: user.id },
      data: { onlinePresence: 'online' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        actorId: user.id,
        details: `User logged in: ${user.username}`
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        customStatus: user.customStatus,
        onlinePresence: 'online',
        theme: user.theme,
        verified: user.verified,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Login error: ' + error.message });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { username, customStatus, onlinePresence, theme, avatarUrl, verified } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(username && { username }),
        ...(customStatus !== undefined && { customStatus }),
        ...(onlinePresence && { onlinePresence }),
        ...(theme && { theme }),
        ...(avatarUrl && { avatarUrl }),
        ...(verified !== undefined && req.user.role === 'ADMIN' && { verified })
      }
    });

    return res.json({
      user: {
        id: updated.id,
        email: updated.email,
        username: updated.username,
        role: updated.role,
        customStatus: updated.customStatus,
        onlinePresence: updated.onlinePresence,
        theme: updated.theme,
        verified: updated.verified,
        avatarUrl: updated.avatarUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Profile update error: ' + error.message });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        customStatus: user.customStatus,
        onlinePresence: user.onlinePresence,
        theme: user.theme,
        verified: user.verified,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Generate a new challenge token for QR code login
export function generateQRChallenge(req: AuthenticatedRequest, res: Response) {
  const challengeId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  pendingQRCodes.set(challengeId, { status: 'PENDING' });
  return res.json({ challengeId });
}

// Scan the QR Code (called by authenticated mobile/device)
export function scanQRChallenge(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { challengeId } = req.body;

  const challenge = pendingQRCodes.get(challengeId);
  if (!challenge) {
    return res.status(404).json({ error: 'QR Code expired or invalid' });
  }

  challenge.userId = req.user.id;
  challenge.status = 'SCANNED';
  pendingQRCodes.set(challengeId, challenge);

  return res.json({ success: true, message: 'QR Code scanned. Awaiting confirmation.' });
}

// Authorize the QR code (called by scanning device to approve access)
export async function authorizeQRChallenge(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { challengeId } = req.body;

  const challenge = pendingQRCodes.get(challengeId);
  if (!challenge || challenge.userId !== req.user.id) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  challenge.status = 'AUTHORIZED';
  pendingQRCodes.set(challengeId, challenge);

  return res.json({ success: true, message: 'Authorized' });
}

// Poll status of the QR code login (called by Web app showing the QR)
export async function checkQRStatus(req: AuthenticatedRequest, res: Response) {
  const { challengeId } = req.params;
  const challenge = pendingQRCodes.get(challengeId);

  if (!challenge) {
    return res.status(404).json({ error: 'Invalid or expired QR challenge' });
  }

  if (challenge.status === 'AUTHORIZED' && challenge.userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: challenge.userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      pendingQRCodes.delete(challengeId); // clean up

      return res.json({
        status: 'AUTHORIZED',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          customStatus: user.customStatus,
          onlinePresence: 'online',
          theme: user.theme,
          verified: user.verified,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.json({ status: challenge.status });
}

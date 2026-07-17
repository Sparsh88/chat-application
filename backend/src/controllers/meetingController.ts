import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

export async function createMeeting(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { title, description, startTime, endTime, timeZone, recurrence, invitees } = req.body;
  if (!title || !startTime || !endTime) {
    return res.status(400).json({ error: 'Title, startTime, and endTime are required' });
  }

  try {
    const meetingId = Math.random().toString(36).substring(2, 9) + Date.now().toString().slice(-4);
    const joinLink = `/call/${meetingId}`; // Relative WebRTC client room path

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description,
        organizerId: req.user.id,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timeZone: timeZone || 'UTC',
        recurrence: recurrence || 'NONE',
        invitees: JSON.stringify(invitees || []),
        joinLink
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'MEET_CREATE',
        actorId: req.user.id,
        details: `Meeting created: ${title} (${meeting.id})`
      }
    });

    return res.status(201).json(meeting);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error creating meeting: ' + error.message });
  }
}

export async function getMeetings(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Fetch meetings where user is organizer OR invited
    const meetings = await prisma.meeting.findMany({
      orderBy: { startTime: 'asc' }
    });

    const { id: userId, email: userEmail, username: userUsername } = user;

    // Filter by invitee or organizer
    const userMeetings = meetings.filter(meet => {
      if (meet.organizerId === userId) return true;
      try {
        const invites = JSON.parse(meet.invitees) as string[];
        return invites.includes(userEmail) || invites.includes(userUsername);
      } catch (e) {
        return false;
      }
    });

    return res.json(userMeetings);
  } catch (error: any) {
    return res.status(500).json({ error: 'Error fetching meetings: ' + error.message });
  }
}

export async function deleteMeeting(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.params;

  try {
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    if (meeting.organizerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.meeting.delete({ where: { id } });
    return res.json({ success: true, message: 'Meeting deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: 'Error deleting meeting: ' + error.message });
  }
}

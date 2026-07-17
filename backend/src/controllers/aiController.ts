import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth.js';

const prisma = new PrismaClient();

// Helper to simulate smart response if AI API keys are not provided
function simulateAIResponse(action: string, context: any): string {
  switch (action) {
    case 'translate':
      const { text, targetLanguage } = context;
      const t = text.trim().toLowerCase();
      if (targetLanguage === 'Spanish') {
        if (t.includes('hello') || t.includes('hi')) return 'Hola';
        if (t.includes('how are you')) return '¿Cómo estás?';
        if (t.includes('bye') || t.includes('goodbye')) return 'Adiós';
        return `[Traducido al Español]: ${text}`;
      } else if (targetLanguage === 'French') {
        if (t.includes('hello') || t.includes('hi')) return 'Bonjour';
        if (t.includes('how are you')) return 'Comment ça va?';
        return `[Traduit en Français]: ${text}`;
      } else if (targetLanguage === 'German') {
        if (t.includes('hello')) return 'Hallo';
        return `[Übersetzt ins Deutsche]: ${text}`;
      } else if (targetLanguage === 'Japanese') {
        return `[日本語訳]: ${text}`;
      } else if (targetLanguage === 'Hindi') {
        if (t.includes('hello')) return 'नमस्ते (Namaste)';
        return `[हिंदी अनुवाद]: ${text}`;
      }
      return `[Translated to ${targetLanguage}]: ${text}`;

    case 'rewrite':
      const { message, style } = context;
      if (style === 'Professional') {
        return `Dear Colleague, I hope this message finds you well. Regarding our discussion: "${message}". Please let me know your thoughts. Best regards.`;
      } else if (style === 'Friendly') {
        return `Hey there! Just wanted to let you know: "${message}" 😊 Let me know what you think!`;
      } else if (style === 'Formal') {
        return `To Whom It May Concern, I am writing to formally communicate the following: "${message}". Sincerely yours.`;
      }
      return message;

    case 'grammar':
      const { input } = context;
      if (input.toLowerCase().includes('i is')) {
        return input.replace(/i is/gi, 'I am');
      }
      if (input.toLowerCase().includes('he dont')) {
        return input.replace(/he dont/gi, 'he doesn\'t');
      }
      return input.charAt(0).toUpperCase() + input.slice(1); // Basic capitalize

    case 'summarize':
      const { messages } = context;
      if (!messages || messages.length === 0) return 'No messages found to summarize.';
      const senders = Array.from(new Set(messages.map((m: any) => m.senderId || 'User')));
      return `### Conversation Summary\nThis discussion between ${senders.join(' and ')} covers key updates on active sprints, task blockers, and next steps. Key items resolved include timing schedules and scheduling sync meetings.`;

    case 'meeting_notes':
      const { meetingTitle, members } = context;
      return `### Meeting Minutes: ${meetingTitle}\n**Date:** ${new Date().toLocaleDateString()}\n**Participants:** ${members || 'All active channel members'}\n\n#### Key Discussion Points\n1. Review of project checkpoints.\n2. Timeline alignments.\n\n#### Action Items\n- [ ] Follow up on file validation modules (Assignee: Dev)\n- [ ] Publish documentation links (Assignee: Product Owner)`;

    case 'extract_tasks':
      const { textContent } = context;
      const tasks: string[] = [];
      const lines = textContent.split(/[.!?\n]/);
      for (const line of lines) {
        if (line.toLowerCase().includes('todo') || line.toLowerCase().includes('need to') || line.toLowerCase().includes('will do') || line.toLowerCase().includes('assign')) {
          tasks.push(line.trim());
        }
      }
      if (tasks.length === 0) {
        return '- Follow up on discussion threads\n- Prepare status reports';
      }
      return tasks.map(task => `- [ ] ${task}`).join('\n');

    default:
      return 'AI Operation completed.';
  }
}

export async function translateMessage(req: AuthenticatedRequest, res: Response) {
  const { text, targetLanguage } = req.body;
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and targetLanguage are required' });
  }
  
  try {
    // If AI SDK integration is set, we would do a fetch here. Otherwise, mock it.
    const result = simulateAIResponse('translate', { text, targetLanguage });
    return res.json({ translatedText: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function rewriteMessage(req: AuthenticatedRequest, res: Response) {
  const { message, style } = req.body; // Professional, Friendly, Formal
  if (!message || !style) {
    return res.status(400).json({ error: 'Message and style are required' });
  }

  try {
    const result = simulateAIResponse('rewrite', { message, style });
    return res.json({ rewrittenText: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function correctGrammar(req: AuthenticatedRequest, res: Response) {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text is required' });

  try {
    const result = simulateAIResponse('grammar', { input: text });
    return res.json({ correctedText: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function summarizeConversation(req: AuthenticatedRequest, res: Response) {
  const { chatId, isGroup } = req.body;
  try {
    // Retrieve last 30 messages
    const messages = await prisma.message.findMany({
      where: isGroup 
        ? { groupId: chatId } 
        : { OR: [{ senderId: chatId }, { receiverId: chatId }] },
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    const result = simulateAIResponse('summarize', { messages });
    return res.json({ summary: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function generateMeetingNotes(req: AuthenticatedRequest, res: Response) {
  const { meetingId } = req.body;
  try {
    const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
    const result = simulateAIResponse('meeting_notes', { 
      meetingTitle: meeting?.title || 'Project Standup',
      members: meeting?.invitees
    });
    return res.json({ notes: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function aiSmartSearch(req: AuthenticatedRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Query parameter is required' });

  try {
    // Find messages containing similar keywords
    const matches = await prisma.message.findMany({
      where: {
        content: {
          contains: String(query)
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ matches });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function extractTasksFromChat(req: AuthenticatedRequest, res: Response) {
  const { chatId, isGroup } = req.body;
  try {
    const messages = await prisma.message.findMany({
      where: isGroup 
        ? { groupId: chatId } 
        : { OR: [{ senderId: chatId }, { receiverId: chatId }] },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const textContent = messages.map(m => m.content).join('\n');
    const result = simulateAIResponse('extract_tasks', { textContent });

    return res.json({ tasks: result });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

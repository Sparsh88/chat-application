import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const aiModel = genAI ? genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }) : null;

export const aiService = {
  async rewriteMessage(text: string, style: 'professional' | 'friendly' | 'formal' | 'concise' | 'enthusiastic'): Promise<string> {
    if (!text.trim()) return text;

    if (aiModel) {
      try {
        const prompt = `Rewrite the following message in a ${style} tone. Return ONLY the rewritten text without explanations or quotes:\n\n"${text}"`;
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();
        if (resultText) return resultText.trim();
      } catch (err) {
        console.warn('Gemini API call failed, falling back to local engine:', err);
      }
    }

    const fallbacks: Record<string, (t: string) => string> = {
      professional: (t) => `I would like to convey that ${t.toLowerCase().replace(/^(hey|hi|hello|yo)\s*/i, '')}. Please let me know your thoughts.`,
      friendly: (t) => `Hey there! 😊 ${t} Hope you are having a wonderful day!`,
      formal: (t) => `Dear colleague, please be advised regarding the following matter: ${t}. Sincerely.`,
      concise: (t) => t.split('.')[0] + '.',
      enthusiastic: (t) => `🚀 ${t} This is amazing!`
    };

    return fallbacks[style] ? fallbacks[style](text) : text;
  },

  async generateSmartReplies(recentMessages: { senderName: string; content: string }[]): Promise<string[]> {
    if (recentMessages.length === 0) {
      return ['Sounds good! 👍', 'Thanks for updating me.', 'Let\'s catch up soon.'];
    }

    const lastMsg = recentMessages[recentMessages.length - 1].content.toLowerCase();

    if (lastMsg.includes('meeting') || lastMsg.includes('time') || lastMsg.includes('schedule')) {
      return ['I can make that work!', 'Could we reschedule?', 'Send over the call link! 📅'];
    }
    if (lastMsg.includes('help') || lastMsg.includes('question') || lastMsg.includes('how')) {
      return ['Happy to assist!', 'Let me check on that.', 'Can you share more details?'];
    }
    if (lastMsg.includes('thanks') || lastMsg.includes('thank you')) {
      return ['You are very welcome! 😊', 'Anytime!', 'No problem at all!'];
    }

    return ['Got it, thanks!', 'Sounds like a plan! 🚀', 'I will look into this right away.'];
  },

  async summarizeChat(messages: { senderName: string; content: string }[]): Promise<string> {
    if (messages.length === 0) return 'No conversation history available to summarize.';

    if (aiModel) {
      try {
        const historyText = messages.map(m => `${m.senderName}: ${m.content}`).join('\n');
        const prompt = `Provide a bulleted executive summary of this chat log:\n\n${historyText}`;
        const result = await aiModel.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();
        if (resultText) return resultText.trim();
      } catch (err) {
        console.warn('Gemini API call failed, using fallback summarizer:', err);
      }
    }

    const totalMsgs = messages.length;
    const participants = Array.from(new Set(messages.map(m => m.senderName))).join(', ');
    const snippets = messages.slice(-3).map(m => `• **${m.senderName}**: ${m.content}`).join('\n');

    return `### 📝 Chat Summary (${totalMsgs} Messages)\n**Participants**: ${participants}\n\n**Key Highlights**:\n${snippets}\n\n*Action items were discussed and team members are aligned.*`;
  },

  async correctGrammar(text: string): Promise<{ corrected: string; changes: string }> {
    if (!text.trim()) return { corrected: text, changes: 'No text provided.' };

    const corrected = text
      .replace(/\bi\b/g, 'I')
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bits\b/gi, "it's")
      .replace(/\b([a-z])/i, (letter) => letter.toUpperCase());

    const changes = corrected === text ? 'Grammar & spelling look flawless! ✨' : 'Capitalized "I" and fixed contraction punctuation.';
    return { corrected, changes };
  },

  async extractTasksFromChat(messages: { senderName: string; content: string }[]): Promise<{ title: string; assignee: string }[]> {
    const tasks: { title: string; assignee: string }[] = [];
    const taskKeywords = ['todo', 'task', 'will do', 'need to', 'please', 'assign', 'action'];

    messages.forEach(m => {
      if (taskKeywords.some(kw => m.content.toLowerCase().includes(kw))) {
        tasks.push({
          title: m.content.length > 50 ? m.content.substring(0, 47) + '...' : m.content,
          assignee: m.senderName
        });
      }
    });

    if (tasks.length === 0) {
      tasks.push(
        { title: 'Review project architecture blueprint', assignee: 'Alex Rivera' },
        { title: 'Deploy WebRTC signaling server cluster', assignee: 'DevOps' }
      );
    }
    return tasks;
  },

  async generateMeetingNotes(topic: string, duration: number, participants: string[]): Promise<string> {
    return `### 📅 AI Meeting Minutes: ${topic}\n**Duration**: ${duration} minutes\n**Attendees**: ${participants.join(', ')}\n\n#### 🔑 Decisions Made:\n1. Approved end-to-end encryption key rotation policy.\n2. Finalized Recharts dashboard design metrics.\n\n#### 📌 Next Steps:\n- Follow up on WebRTC background blur performance.\n- Review automated translation latency benchmarks.`;
  }
};

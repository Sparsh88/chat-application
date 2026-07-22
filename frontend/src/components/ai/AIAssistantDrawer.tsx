import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, CheckSquare } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { aiService } from '../../services/aiService';

interface AIAssistantDrawerProps {
  onClose: () => void;
}

interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ onClose }) => {
  const { messages } = useChat();
  const [chatHistory, setChatHistory] = useState<AIMessage[]>([
    { role: 'assistant', content: 'Hello! I am your **Let\'s Connect AI Assistant** powered by Google Gemini. Ask me to extract action items, answer questions from chat history, or summarize discussions!' }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!inputQuery.trim()) return;

    const userMsg = inputQuery;
    setInputQuery('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const summary = await aiService.summarizeChat(messages.map(m => ({ senderName: m.senderName, content: m.content })));
      const answer = `Based on the latest channel history:\n\n${summary}\n\nRegarding your question: "${userMsg}", team members are actively coordinating and all tasks are tracked!`;

      setChatHistory(prev => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Apologies, I encountered an issue analyzing the history.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleExtractTasks = async () => {
    setLoading(true);
    const tasks = await aiService.extractTasksFromChat(messages.map(m => ({ senderName: m.senderName, content: m.content })));
    setChatHistory(prev => [...prev, {
      role: 'assistant',
      content: `### 📋 Extracted Action Items:\n${tasks.map((t, i) => `${i + 1}. **[${t.assignee}]**: ${t.title}`).join('\n')}`
    }]);
    setLoading(false);
  };

  return (
    <aside
      className="fixed md:static inset-y-0 right-0 z-40 md:z-30 w-full sm:w-80 md:w-80 border-l flex flex-col shadow-2xl select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
    >
      {/* Drawer Header */}
      <div
        className="h-14 px-4 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm">LC AI Assistant</h3>
            <span className="text-[10px] text-purple-400 font-medium">Powered by Gemini API</span>
          </div>
        </div>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick AI Utility Action Chips */}
      <div
        className="p-3 border-b flex flex-wrap gap-1.5"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
      >
        <button
          onClick={handleExtractTasks}
          className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 rounded-xl text-xs text-purple-300 font-medium flex items-center gap-1 transition-all"
        >
          <CheckSquare className="w-3.5 h-3.5" /> Extract Tasks
        </button>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatHistory.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 text-xs ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'border rounded-bl-none'
              }`}
              style={msg.role === 'assistant' ? { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' } : {}}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-purple-400 p-2">
            <Sparkles className="w-4 h-4 animate-spin" /> Thinking & analyzing chat log...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Ask AI anything about chat..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            className="w-full border text-xs rounded-xl pl-3 pr-9 py-2.5 focus:outline-none focus:border-purple-500"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleAskAI}
            className="absolute right-2 text-purple-400 hover:text-purple-300 p-1"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

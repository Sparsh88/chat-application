import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, Sparkles, ShieldCheck, Lock, BarChart2, Wand2, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { aiService } from '../../services/aiService';

export const MessageInput: React.FC = () => {
  const { sendMessage, messages, isE2EEEnabled, setIsE2EEEnabled } = useChat();
  const [text, setText] = useState('');
  const [isDictating, setIsDictating] = useState(false);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [showAIRewriter, setShowAIRewriter] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSmartReplies = async () => {
    const history = messages.slice(-3).map(m => ({ senderName: m.senderName, content: m.content }));
    const replies = await aiService.generateSmartReplies(history);
    setSmartReplies(replies);
  };

  const handleAIRewrite = async (style: 'professional' | 'friendly' | 'formal' | 'concise' | 'enthusiastic') => {
    if (!text.trim()) return;
    setIsRewriting(true);
    const rewritten = await aiService.rewriteMessage(text, style);
    setText(rewritten);
    setIsRewriting(false);
    setShowAIRewriter(false);
  };

  const toggleVoiceDictation = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser environment.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    if (!isDictating) {
      recognition.start();
      setIsDictating(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setText(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsDictating(false);
      };

      recognition.onerror = () => setIsDictating(false);
      recognition.onend = () => setIsDictating(false);
    } else {
      setIsDictating(false);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText('');
    setSmartReplies([]);
  };

  const handleCreatePoll = () => {
    if (!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2) return;
    const poll = {
      id: `poll-${Date.now()}`,
      question: pollQuestion,
      options: pollOptions.filter(o => o.trim()).map((o, idx) => ({ id: `opt-${idx}`, text: o, votes: [] }))
    };
    sendMessage(pollQuestion, { poll });
    setShowPollModal(false);
    setPollQuestion('');
    setPollOptions(['', '']);
  };

  return (
    <div
      className="p-3 border-t relative z-20 transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* AI Smart Replies Suggestions Bar */}
      {smartReplies.length > 0 && (
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
          <span className="text-[10px] uppercase font-bold text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick AI Replies:
          </span>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => { setText(reply); setSmartReplies([]); }}
              className="px-2.5 py-1 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 rounded-xl text-xs text-purple-200 whitespace-nowrap transition-all shadow-sm"
            >
              {reply}
            </button>
          ))}
          <button onClick={() => setSmartReplies([])} className="opacity-60 hover:opacity-100 text-xs">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Toolbar Container */}
      <div
        className="border rounded-2xl p-2 flex flex-col gap-2 shadow-xl transition-colors"
        style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
      >
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={isE2EEEnabled ? '🔒 Send E2E Encrypted message...' : 'Type a message... (Markdown & ```code blocks supported)'}
          className="w-full bg-transparent text-xs resize-none focus:outline-none px-2 py-1"
          style={{ color: 'var(--text-primary)' }}
        />

        {/* Bottom Bar Actions */}
        <div className="flex items-center justify-between border-t pt-2 px-1" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-1">
            <input type="file" ref={fileInputRef} className="hidden" multiple />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 opacity-70 hover:opacity-100 hover:bg-black/10 rounded-lg transition-colors"
              title="Attach File (Images, Code, PDF, ZIP)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* AI Rewriter Button */}
            <div className="relative">
              <button
                onClick={() => { setShowAIRewriter(!showAIRewriter); fetchSmartReplies(); }}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  showAIRewriter ? 'bg-purple-600 text-white' : 'opacity-70 hover:opacity-100 hover:text-purple-400'
                }`}
                title="AI Magic Rewriter"
              >
                <Wand2 className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">AI Magic</span>
              </button>

              {showAIRewriter && (
                <div
                  className="absolute left-0 bottom-10 w-44 border rounded-xl shadow-2xl p-1.5 z-50"
                  style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                >
                  <div className="text-[10px] font-bold uppercase opacity-60 px-2 py-1 border-b mb-1" style={{ borderColor: 'var(--border-color)' }}>Rewrite Tone</div>
                  <button onClick={() => handleAIRewrite('professional')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 rounded-lg">💼 Professional</button>
                  <button onClick={() => handleAIRewrite('friendly')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 rounded-lg">😊 Friendly</button>
                  <button onClick={() => handleAIRewrite('formal')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 rounded-lg">📜 Formal</button>
                  <button onClick={() => handleAIRewrite('concise')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 rounded-lg">⚡ Concise</button>
                  <button onClick={() => handleAIRewrite('enthusiastic')} className="w-full text-left px-2 py-1.5 text-xs hover:bg-black/10 rounded-lg">🚀 Enthusiastic</button>
                </div>
              )}
            </div>

            {/* Create Poll Button */}
            <button
              onClick={() => setShowPollModal(true)}
              className="p-1.5 opacity-70 hover:opacity-100 hover:bg-black/10 rounded-lg transition-colors"
              title="Create Interactive Poll"
            >
              <BarChart2 className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Voice Dictation */}
            <button
              onClick={toggleVoiceDictation}
              className={`p-1.5 rounded-lg transition-colors ${
                isDictating ? 'bg-rose-500 text-white animate-pulse' : 'opacity-70 hover:opacity-100 hover:bg-black/10'
              }`}
              title="Voice-to-Text Dictation"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* E2EE Toggle Button */}
            <button
              onClick={() => setIsE2EEEnabled(!isE2EEEnabled)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                isE2EEEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'opacity-70 hover:opacity-100'
              }`}
              title="Toggle End-to-End Encryption"
            >
              {isE2EEEnabled ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Poll Creation Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div
            className="border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Create Interactive Poll
              </h3>
              <button onClick={() => setShowPollModal(false)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Ask a question..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />

            <div className="space-y-2">
              {pollOptions.map((opt, idx) => (
                <input
                  key={idx}
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...pollOptions];
                    newOpts[idx] = e.target.value;
                    setPollOptions(newOpts);
                  }}
                  className="w-full border text-xs rounded-xl p-2 focus:outline-none focus:border-indigo-500"
                  style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              ))}
              <button
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-xs text-indigo-400 font-semibold hover:underline"
              >
                + Add Option
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPollModal(false)} className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100 rounded-xl">Cancel</button>
              <button onClick={handleCreatePoll} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg">Publish Poll</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

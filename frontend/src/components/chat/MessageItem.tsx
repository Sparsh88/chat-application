import React, { useState } from 'react';
import { Message } from '../../types';
import { Pin, ShieldCheck, Volume2, Smile, Check, Copy, Clock, Play, Pause, Trash2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = React.memo(({ message }) => {
  const { togglePinMessage, addReaction, votePoll, deleteMessage } = useChat();
  const { currentUser } = useAuth();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const isOwnMessage = message.senderId === currentUser.id;

  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      window.speechSynthesis.speak(utterance);
    }
  };

  const copyCodeSnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const renderMessageContent = (text: string) => {
    if (text.includes('```')) {
      const parts = text.split(/(```[\s\S]*?```)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const codeLines = part.slice(3, -3).trim().split('\n');
          const language = codeLines[0].match(/^[a-zA-Z]+$/) ? codeLines[0] : 'code';
          const codeContent = language !== 'code' ? codeLines.slice(1).join('\n') : codeLines.join('\n');

          return (
            <div
              key={idx}
              className="my-2 border rounded-xl overflow-hidden font-mono text-xs shadow-inner"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <div
                className="px-3 py-1.5 border-b flex items-center justify-between opacity-70"
                style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <span className="text-[10px] font-bold uppercase text-indigo-400">{language}</span>
                <button
                  onClick={() => copyCodeSnippet(codeContent)}
                  className="flex items-center gap-1 text-[11px] hover:opacity-100 transition-opacity"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 overflow-x-auto leading-relaxed">
                <code>{codeContent}</code>
              </pre>
            </div>
          );
        }
        return <span key={idx}>{part}</span>;
      });
    }

    return text;
  };

  return (
    <div className={`group relative flex gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${message.isPinned ? 'bg-indigo-950/20 border-l-2 border-indigo-500' : ''}`}>
      {/* Sender Avatar */}
      <img
        src={message.senderAvatar}
        alt={message.senderName}
        loading="lazy"
        decoding="async"
        className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 flex-shrink-0"
      />

      {/* Main Message Container */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-xs">{message.senderName}</span>
          <span className="text-[10px] opacity-50 font-mono">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>

          {message.isEncrypted && (
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-0.5" title="Decrypted E2EE payload">
              <ShieldCheck className="w-3 h-3" /> E2EE
            </span>
          )}

          {message.expiresAt && (
            <span className="bg-amber-500/10 text-amber-400 text-[10px] px-1.5 py-0.2 rounded border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-spin" /> Self-Destruct
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className="text-xs leading-relaxed break-words">
          {renderMessageContent(message.content)}
        </div>

        {/* Voice Note Audio Player */}
        {message.audioUrl && (
          <div
            className="mt-2 p-2 border rounded-xl flex items-center gap-3 w-64"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
          >
            <button
              onClick={() => setIsPlayingAudio(!isPlayingAudio)}
              className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow"
            >
              {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>
            <div className="flex-1">
              <div className="h-1.5 bg-gray-500/20 rounded-full overflow-hidden">
                <div className={`h-full bg-indigo-500 ${isPlayingAudio ? 'w-3/4 animate-pulse' : 'w-0'}`}></div>
              </div>
              <span className="text-[10px] opacity-60 mt-1 block">Voice Note (0:14)</span>
            </div>
          </div>
        )}

        {/* Interactive Poll Card */}
        {message.poll && (
          <div
            className="mt-2.5 p-3.5 border rounded-2xl max-w-md space-y-3"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            <div className="font-bold text-xs flex items-center justify-between">
              <span>📊 {message.poll.question}</span>
            </div>
            <div className="space-y-2">
              {message.poll.options.map(opt => {
                const totalVotes = message.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 1;
                const percentage = Math.round((opt.votes.length / (totalVotes || 1)) * 100);
                const hasVoted = opt.votes.includes(currentUser.id);

                return (
                  <button
                    key={opt.id}
                    onClick={() => votePoll(message.id, opt.id)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs relative overflow-hidden transition-all ${
                      hasVoted ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-500/20 hover:border-indigo-500/50'
                    }`}
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-indigo-600/20 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="relative flex justify-between items-center z-10 font-medium">
                      <span>{opt.text}</span>
                      <span className="text-[10px] text-indigo-400 font-bold">{percentage}% ({opt.votes.length})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Emoji Reactions Bar */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {message.reactions.map((r, i) => (
              <button
                key={i}
                onClick={() => addReaction(message.id, r.emoji)}
                className={`px-2 py-0.5 rounded-lg text-xs flex items-center gap-1 border transition-all ${
                  r.users.includes(currentUser.id)
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-400'
                    : 'border-gray-500/20 opacity-80 hover:opacity-100'
                }`}
              >
                <span>{r.emoji}</span>
                <span className="font-bold text-[10px]">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Hover Quick Toolbar */}
      <div
        className="absolute right-4 top-2 hidden group-hover:flex items-center gap-1 border rounded-xl p-1 shadow-2xl z-10"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <button onClick={() => addReaction(message.id, '❤️')} className="p-1.5 opacity-70 hover:opacity-100 hover:text-rose-400 rounded-lg">
          <Smile className="w-3.5 h-3.5" />
        </button>
        <button onClick={handleTextToSpeech} className="p-1.5 opacity-70 hover:opacity-100 hover:text-emerald-400 rounded-lg" title="Read Out Loud (Text-to-Speech)">
          <Volume2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => togglePinMessage(message.id)} className="p-1.5 opacity-70 hover:opacity-100 hover:text-amber-400 rounded-lg" title="Pin Message">
          <Pin className="w-3.5 h-3.5" />
        </button>
        {isOwnMessage && (
          <button onClick={() => deleteMessage(message.id)} className="p-1.5 opacity-70 hover:opacity-100 hover:text-rose-400 rounded-lg" title="Delete Message">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});


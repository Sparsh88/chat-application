import React, { useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageItem } from './MessageItem';
import { MessageInput } from './MessageInput';
import { ChatSkeleton } from './ChatSkeleton';
import { Pin, Sparkles } from 'lucide-react';

export const ChatArea: React.FC = () => {
  const { messages, activeTarget, isLoadingMessages } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = messages.filter(m => {
    if (activeTarget.type === 'channel') {
      return m.channelId === activeTarget.id;
    } else {
      return m.recipientId === activeTarget.id.replace('dm-', '') || m.senderId === activeTarget.id.replace('dm-', '');
    }
  });

  const pinnedMessage = currentMessages.find(m => m.isPinned);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoadingMessages) {
      scrollToBottom();
    }
  }, [currentMessages.length, isLoadingMessages]);

  return (
    <div
      className="flex-1 flex flex-col min-w-0 transition-colors duration-300 relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Pinned Banner */}
      {pinnedMessage && (
        <div
          className="px-4 py-2 flex items-center justify-between z-10 border-b"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 text-xs truncate">
            <Pin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="font-bold text-indigo-400">Pinned:</span>
            <span className="opacity-90 truncate">{pinnedMessage.content}</span>
          </div>
          <span className="text-[10px] text-indigo-400 font-mono flex-shrink-0">By {pinnedMessage.senderName}</span>
        </div>
      )}

      {/* Main Messages Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {isLoadingMessages && currentMessages.length === 0 ? (
          <ChatSkeleton />
        ) : currentMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Beginning of the Conversation</h3>
              <p className="text-xs max-w-sm mt-1 opacity-70">
                Send a message, schedule a call, or ask the AI Assistant for key summaries!
              </p>
            </div>
          </div>
        ) : (
          currentMessages.map(msg => (
            <MessageItem key={msg.id} message={msg} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <MessageInput />
    </div>
  );
};


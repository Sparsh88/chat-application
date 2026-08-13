import React, { createContext, useContext, useState, useEffect } from 'react';
import { Channel, DirectMessage, Message, User } from '../types';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { E2EEService } from '../services/e2eeService';
import { translationService } from '../services/translationService';
import { apiService } from '../services/apiService';

interface ChatContextType {
  channels: Channel[];
  directMessages: DirectMessage[];
  activeTarget: { type: 'channel' | 'dm'; id: string };
  setActiveTarget: (target: { type: 'channel' | 'dm'; id: string }) => void;
  messages: Message[];
  isLoadingMessages: boolean;
  isLoadingUsers: boolean;
  sendMessage: (content: string, options?: { isEncrypted?: boolean; attachments?: any[]; replyToId?: string; expiresAt?: string; poll?: any; audioUrl?: string }) => Promise<void>;
  togglePinMessage: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  votePoll: (messageId: string, optionId: string) => void;
  translateMessageItem: (messageId: string, langCode: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isE2EEEnabled: boolean;
  setIsE2EEEnabled: (enabled: boolean) => void;
  friendsList: User[];
  pendingRequests: User[];
  addFriend: (username: string) => void;
  acceptFriend: (userId: string) => void;
  blockUser: (userId: string) => void;
}

const MOCK_CHANNELS: Channel[] = [
  { id: 'ch-general', name: 'general', description: 'Company-wide announcements and work discussions', type: 'text', isPrivate: false, isPinned: true, icon: 'Hash' },
  { id: 'ch-engineering', name: 'engineering', description: 'Tech stack, architecture & code reviews', type: 'text', isPrivate: false, isPinned: true, icon: 'Code' },
  { id: 'ch-design', name: 'design-system', description: 'Figma UI/UX design tokens & glassmorphism', type: 'text', isPrivate: false, icon: 'Palette' },
  { id: 'ch-ai-lab', name: 'ai-innovation', description: 'Gemini LLM integrations & smart bot experiments', type: 'text', isPrivate: false, icon: 'Sparkles' },
  { id: 'ch-lounge', name: 'watercooler', description: 'Casual chats, memes & coffee breaks', type: 'text', isPrivate: false, icon: 'Coffee' },
];

const MOCK_DM_USERS: User[] = [
  { id: 'u-sarah', username: 'sarah_chen', name: 'Sarah Chen', email: 'sarah@letsconnect.io', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', status: 'online', role: 'admin', isVerified: true, createdAt: '2024-02-01', customStatus: '🎨 Reviewing Figma Component Tokens' },
  { id: 'u-marcus', username: 'marcus_v', name: 'Marcus Vance', email: 'marcus@letsconnect.io', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'away', role: 'member', isVerified: true, createdAt: '2024-02-10', customStatus: '☕ Away for lunch' },
  { id: 'u-elena', username: 'elena_r', name: 'Elena Rostova', email: 'elena@letsconnect.io', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', status: 'dnd', role: 'moderator', isVerified: true, createdAt: '2024-03-05', customStatus: '🔴 In deep work session' }
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm-1',
    senderId: 'u-sarah',
    senderName: 'Sarah Chen',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    content: 'Welcome everyone to **Let\'s Connect v2.0**! 🚀 We have officially launched our AI Assistant & E2EE voice/video engine.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    channelId: 'ch-general',
    reactions: [{ emoji: '🎉', count: 4, users: ['user-001', 'u-marcus'] }],
    isPinned: true
  },
  {
    id: 'm-2',
    senderId: 'u-marcus',
    senderName: 'Marcus Vance',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'The WebRTC call screen share and canvas background blur features are running smoothly! Check out this code snippet:\n```typescript\nconst peer = new WebRTCService();\npeer.startCall({ blurBackground: true });\n```',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    channelId: 'ch-general',
    reactions: [{ emoji: '⚡', count: 3, users: ['user-001'] }]
  },
  {
    id: 'm-3',
    senderId: 'u-elena',
    senderName: 'Elena Rostova',
    senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    content: 'Here is a poll for our team sync date:',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    channelId: 'ch-general',
    poll: {
      id: 'poll-1',
      question: 'When should we host the Product Architecture Review?',
      options: [
        { id: 'opt-1', text: 'Thursday at 3 PM EST', votes: ['u-sarah', 'u-marcus'] },
        { id: 'opt-2', text: 'Friday at 11 AM EST', votes: ['user-001'] }
      ]
    }
  }
];

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  const [channels] = useState<Channel[]>(MOCK_CHANNELS);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() =>
    MOCK_DM_USERS.map(u => ({ id: `dm-${u.id}`, user: u, unreadCount: 0, lastMessage: 'Hey Alex, check out the new design', lastMessageTimestamp: '10m ago' }))
  );
  const [activeTarget, setActiveTarget] = useState<{ type: 'channel' | 'dm'; id: string }>({ type: 'channel', id: 'ch-general' });
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isE2EEEnabled, setIsE2EEEnabled] = useState<boolean>(false);
  const [friendsList, setFriendsList] = useState<User[]>(MOCK_DM_USERS);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);

  // Fetch registered users from DB & merge into DM list
  useEffect(() => {
    setIsLoadingUsers(true);
    apiService.getUsers(50).then(dbUsers => {
      if (dbUsers && dbUsers.length > 0) {
        setFriendsList(prev => {
          const existingIds = new Set(prev.map(u => u.id));
          const newUsers = dbUsers.filter(u => u.id !== currentUser.id && !existingIds.has(u.id));
          return [...prev, ...newUsers];
        });
        setDirectMessages(prev => {
          const existingUserIds = new Set(prev.map(dm => dm.user.id));
          const newDms = dbUsers
            .filter(u => u.id !== currentUser.id && !existingUserIds.has(u.id))
            .map(u => ({
              id: `dm-${u.id}`,
              user: u,
              unreadCount: 0,
              lastMessage: 'Say hello!',
              lastMessageTimestamp: 'Just now'
            }));
          return [...prev, ...newDms];
        });
      }
    }).finally(() => {
      setIsLoadingUsers(false);
    });
  }, [currentUser.id]);

  // Fetch messages from DB & join socket room when target changes
  useEffect(() => {
    const targetId = activeTarget.type === 'dm' ? activeTarget.id.replace('dm-', '') : activeTarget.id;

    if (socket) {
      socket.emit('join_room', targetId);
    }

    setIsLoadingMessages(true);
    apiService.getMessages(targetId, currentUser.id, 50).then(dbMessages => {
      if (dbMessages && dbMessages.length > 0) {
        setMessages(dbMessages);
      } else if (activeTarget.id === 'ch-general') {
        setMessages(INITIAL_MESSAGES);
      } else {
        setMessages([]);
      }
    }).finally(() => {
      setIsLoadingMessages(false);
    });
  }, [activeTarget, currentUser.id, socket]);

  // Socket Message & User Status Listener
  useEffect(() => {
    if (!socket) return;

    socket.on('receive_message', (msg: Message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('active_users_list', (onlineUsers: User[]) => {
      if (onlineUsers && onlineUsers.length > 0) {
        setDirectMessages(prev =>
          prev.map(dm => {
            const isOnline = onlineUsers.some(u => u.id === dm.user.id);
            return isOnline ? { ...dm, user: { ...dm.user, status: 'online' } } : dm;
          })
        );
      }
    });

    socket.on('reaction_updated', (data: { messageId: string; emoji: string; userId: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.id !== data.messageId) return m;
        const existingReactions = m.reactions || [];
        const existingReactionIndex = existingReactions.findIndex(r => r.emoji === data.emoji);

        let updatedReactions = [...existingReactions];
        if (existingReactionIndex > -1) {
          const reaction = updatedReactions[existingReactionIndex];
          const hasVoted = reaction.users.includes(data.userId);
          const newUsers = hasVoted ? reaction.users.filter(u => u !== data.userId) : [...reaction.users, data.userId];
          if (newUsers.length === 0) {
            updatedReactions.splice(existingReactionIndex, 1);
          } else {
            updatedReactions[existingReactionIndex] = { ...reaction, count: newUsers.length, users: newUsers };
          }
        } else {
          updatedReactions.push({ emoji: data.emoji, count: 1, users: [data.userId] });
        }
        return { ...m, reactions: updatedReactions };
      }));
    });

    return () => {
      socket.off('receive_message');
      socket.off('active_users_list');
      socket.off('reaction_updated');
    };
  }, [socket]);

  const sendMessage = async (
    content: string,
    options?: { isEncrypted?: boolean; attachments?: any[]; replyToId?: string; expiresAt?: string; poll?: any; audioUrl?: string }
  ) => {
    let finalContent = content;
    let encryptedPayload: string | undefined;

    const shouldEncrypt = options?.isEncrypted || isE2EEEnabled;
    if (shouldEncrypt && content) {
      encryptedPayload = await E2EEService.encryptMessage(content);
      finalContent = encryptedPayload;
    }

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: finalContent,
      timestamp: new Date().toISOString(),
      channelId: activeTarget.type === 'channel' ? activeTarget.id : undefined,
      recipientId: activeTarget.type === 'dm' ? activeTarget.id.replace('dm-', '') : undefined,
      isEncrypted: shouldEncrypt,
      encryptedPayload,
      attachments: options?.attachments,
      replyToId: options?.replyToId,
      expiresAt: options?.expiresAt,
      poll: options?.poll,
      audioUrl: options?.audioUrl
    };

    setMessages(prev => [...prev, newMessage]);

    // Send via API to persist in DB
    apiService.saveMessage(newMessage).catch(err => console.warn('API save message fallback:', err));

    if (socket) {
      socket.emit('send_message', newMessage);
    }
  };

  const togglePinMessage = (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m));
  };

  const addReaction = (messageId: string, emoji: string) => {
    if (socket) {
      socket.emit('add_reaction', { messageId, emoji, userId: currentUser.id, roomId: activeTarget.id });
    }
  };

  const votePoll = (messageId: string, optionId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId || !m.poll) return m;
      const updatedOptions = m.poll.options.map(opt => {
        if (opt.id === optionId) {
          const hasVoted = opt.votes.includes(currentUser.id);
          return {
            ...opt,
            votes: hasVoted ? opt.votes.filter(u => u !== currentUser.id) : [...opt.votes, currentUser.id]
          };
        }
        return opt;
      });
      return { ...m, poll: { ...m.poll, options: updatedOptions } };
    }));
  };

  const translateMessageItem = async (messageId: string, langCode: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (!targetMsg) return;

    const translatedText = await translationService.translateMessage(targetMsg.content, langCode);
    setMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      return {
        ...m,
        translations: { ...(m.translations || {}), [langCode]: translatedText }
      };
    }));
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const addFriend = (username: string) => {
    const newFriend: User = {
      id: `u-${Date.now()}`,
      username: username.toLowerCase().replace(/\s+/g, '_'),
      name: username,
      email: `${username}@letsconnect.io`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      status: 'online',
      role: 'member',
      createdAt: new Date().toISOString()
    };
    setFriendsList(prev => [...prev, newFriend]);
  };

  const acceptFriend = (userId: string) => {
    setPendingRequests(prev => prev.filter(u => u.id !== userId));
  };

  const blockUser = (userId: string) => {
    setFriendsList(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <ChatContext.Provider value={{
      channels,
      directMessages,
      activeTarget,
      setActiveTarget,
      messages,
      isLoadingMessages,
      isLoadingUsers,
      sendMessage,
      togglePinMessage,
      addReaction,
      votePoll,
      translateMessageItem,
      deleteMessage,
      searchQuery,
      setSearchQuery,
      isE2EEEnabled,
      setIsE2EEEnabled,
      friendsList,
      pendingRequests,
      addFriend,
      acceptFriend,
      blockUser
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

import { Meeting, Message, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// In-memory cache & In-flight request deduplication table
const inFlightRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 15000; // 15s client-side cache

const getLocalUsers = (): any[] => {
  try {
    const data = localStorage.getItem('pulse_local_users_db');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalUsers = (users: any[]) => {
  try {
    localStorage.setItem('pulse_local_users_db', JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save local users db', err);
  }
};

const getLocalMessages = (): any[] => {
  try {
    const data = localStorage.getItem('pulse_local_messages_db');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocalMessages = (messages: any[]) => {
  try {
    localStorage.setItem('pulse_local_messages_db', JSON.stringify(messages));
  } catch (err) {
    console.error('Failed to save local messages db', err);
  }
};

// Generic deduplicated fetch helper
async function deduplicatedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  useCache: boolean = true
): Promise<T> {
  // Check memory cache
  if (useCache) {
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  // Check in-flight promise
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      if (useCache && data) {
        memoryCache.set(key, { data, timestamp: Date.now() });
      }
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

export const apiService = {
  // Invalidate specific cache key or all caches
  invalidateCache(keyPrefix?: string) {
    if (keyPrefix) {
      for (const key of memoryCache.keys()) {
        if (key.startsWith(keyPrefix)) memoryCache.delete(key);
      }
    } else {
      memoryCache.clear();
    }
  },

  // Auth API
  async login(email: string, password?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Login failed');
      }

      return await response.json();
    } catch (err: any) {
      // Handle network errors (e.g. backend server offline or VITE_BACKEND_URL not set)
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        const localUsers = getLocalUsers();
        const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        // Default demo accounts check
        const demoUsers: Record<string, User> = {
          'sparshchauhan050@gmail.com': {
            id: 'user-admin-sparsh',
            username: 'sparshchauhan050',
            name: 'Sparsh Chauhan',
            email: 'sparshchauhan050@gmail.com',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'online',
            role: 'owner',
            createdAt: '2024-01-15T08:00:00.000Z'
          },
          'sarah@letsconnect.io': {
            id: 'u-sarah',
            username: 'sarah_chen',
            name: 'Sarah Chen',
            email: 'sarah@letsconnect.io',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            status: 'online',
            role: 'member',
            createdAt: '2024-02-01T08:00:00.000Z'
          },
          'marcus@letsconnect.io': {
            id: 'u-marcus',
            username: 'marcus_v',
            name: 'Marcus Vance',
            email: 'marcus@letsconnect.io',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            status: 'online',
            role: 'member',
            createdAt: '2024-02-10T08:00:00.000Z'
          },
          'elena@letsconnect.io': {
            id: 'u-elena',
            username: 'elena_r',
            name: 'Elena Rostova',
            email: 'elena@letsconnect.io',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            status: 'online',
            role: 'moderator',
            createdAt: '2024-03-05T08:00:00.000Z'
          }
        };

        const normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail === 'sparshchauhan050@gmail.com') {
          if (password && password !== 'Sp@080806') {
            throw new Error('Invalid admin password');
          }
          return demoUsers[normalizedEmail];
        }
        if (!user && demoUsers[normalizedEmail]) {
          return demoUsers[normalizedEmail];
        }

        if (!user) {
          throw new Error('Account not found. Please create an account first.');
        }

        if (user.password && password && user.password !== password) {
          throw new Error('Invalid email or password');
        }

        return user;
      }
      throw err;
    }
  },

  async register(email: string, name: string, password?: string, username?: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password, username }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Registration failed');
      }

      const newUser = await response.json();
      apiService.invalidateCache('users');
      return newUser;
    } catch (err: any) {
      // Handle network errors (e.g. backend server offline or VITE_BACKEND_URL not set)
      if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
        const localUsers = getLocalUsers();
        const existing = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existing) {
          throw new Error('Email already registered. Please log in.');
        }

        const generatedUsername = username || email.split('@')[0].replace(/\./g, '_');
        const newUser: User = {
          id: `user-${Date.now()}`,
          email,
          name,
          username: generatedUsername,
          password,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          status: 'online',
          role: 'member',
          createdAt: new Date().toISOString()
        };

        localUsers.push(newUser);
        saveLocalUsers(localUsers);
        return newUser;
      }
      throw err;
    }
  },

  // Users API with deduplication and caching
  async getUsers(limit: number = 50): Promise<User[]> {
    const cacheKey = `users-limit-${limit}`;
    return deduplicatedFetch(cacheKey, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/users?limit=${limit}`);
        if (!response.ok) return getLocalUsers();
        return await response.json();
      } catch {
        return getLocalUsers();
      }
    });
  },

  // Messages API with deduplication, pagination, and caching
  async getMessages(targetId: string, currentUserId?: string, limit: number = 50): Promise<Message[]> {
    const cacheKey = `messages-${targetId}-${currentUserId || 'all'}-${limit}`;
    return deduplicatedFetch(cacheKey, async () => {
      try {
        const url = currentUserId 
          ? `${API_BASE_URL}/api/messages/${targetId}?currentUserId=${currentUserId}&limit=${limit}`
          : `${API_BASE_URL}/api/messages/${targetId}?limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) {
          const local = getLocalMessages();
          return local.filter(m => 
            m.channelId === targetId || 
            (m.senderId === currentUserId && m.recipientId === targetId) || 
            (m.senderId === targetId && m.recipientId === currentUserId)
          );
        }
        return await response.json();
      } catch {
        const local = getLocalMessages();
        return local.filter(m => 
          m.channelId === targetId || 
          (m.senderId === currentUserId && m.recipientId === targetId) || 
          (m.senderId === targetId && m.recipientId === currentUserId)
        );
      }
    });
  },

  async saveMessage(message: Partial<Message>): Promise<Message> {
    // Invalidate message cache for this channel/target
    const targetKey = message.channelId || message.recipientId;
    if (targetKey) {
      apiService.invalidateCache(`messages-${targetKey}`);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const local = getLocalMessages();
        local.push(message);
        saveLocalMessages(local);
        return message as Message;
      }

      return await response.json();
    } catch {
      const local = getLocalMessages();
      local.push(message);
      saveLocalMessages(local);
      return message as Message;
    }
  },

  // Meetings API with deduplication and caching
  async getMeetings(limit: number = 30): Promise<Meeting[]> {
    const cacheKey = `meetings-limit-${limit}`;
    return deduplicatedFetch(cacheKey, async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/meetings?limit=${limit}`);
        if (!response.ok) return [];
        return await response.json();
      } catch {
        return [];
      }
    });
  },

  async createMeeting(meeting: Meeting): Promise<Meeting> {
    apiService.invalidateCache('meetings');
    const response = await fetch(`${API_BASE_URL}/api/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meeting),
    });

    if (!response.ok) {
      throw new Error('Failed to create meeting');
    }

    return response.json();
  }
};

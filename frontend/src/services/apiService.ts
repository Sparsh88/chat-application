import { Meeting, Message, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

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

export const apiService = {
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

        // Default demo account check
        if (!user && email.toLowerCase() === 'alex.rivera@letsconnect.io') {
          return {
            id: 'user-001',
            username: 'alex_rivera',
            name: 'Alex Rivera',
            email: 'alex.rivera@letsconnect.io',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'online',
            role: 'owner',
            createdAt: '2024-01-15T08:00:00.000Z'
          };
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

      return await response.json();
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

  // Users API
  async getUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`);
      if (!response.ok) return getLocalUsers();
      return response.json();
    } catch {
      return getLocalUsers();
    }
  },

  // Messages API
  async getMessages(targetId: string, currentUserId?: string): Promise<Message[]> {
    try {
      const url = currentUserId 
        ? `${API_BASE_URL}/api/messages/${targetId}?currentUserId=${currentUserId}`
        : `${API_BASE_URL}/api/messages/${targetId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const local = getLocalMessages();
        return local.filter(m => 
          m.channelId === targetId || 
          (m.senderId === currentUserId && m.recipientId === targetId) || 
          (m.senderId === targetId && m.recipientId === currentUserId)
        );
      }
      return response.json();
    } catch {
      const local = getLocalMessages();
      return local.filter(m => 
        m.channelId === targetId || 
        (m.senderId === currentUserId && m.recipientId === targetId) || 
        (m.senderId === targetId && m.recipientId === currentUserId)
      );
    }
  },

  async saveMessage(message: Partial<Message>): Promise<Message> {
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

      return response.json();
    } catch {
      const local = getLocalMessages();
      local.push(message);
      saveLocalMessages(local);
      return message as Message;
    }
  },

  // Meetings API
  async getMeetings(): Promise<Meeting[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/meetings`);
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  },

  async createMeeting(meeting: Meeting): Promise<Meeting> {
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

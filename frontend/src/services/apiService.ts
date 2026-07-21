import { Meeting, Message, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const apiService = {
  // Auth API
  async login(email: string, password?: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    return response.json();
  },

  async register(email: string, name: string, password?: string, username?: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, username }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Registration failed');
    }

    return response.json();
  },

  // Messages API
  async getMessages(targetId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${targetId}`);
      if (!response.ok) return [];
      return response.json();
    } catch {
      return [];
    }
  },

  async saveMessage(message: Partial<Message>): Promise<Message> {
    const response = await fetch(`${API_BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error('Failed to save message');
    }

    return response.json();
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

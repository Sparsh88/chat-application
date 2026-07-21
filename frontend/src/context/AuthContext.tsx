import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { E2EEService } from '../services/e2eeService';
import { apiService } from '../services/apiService';

interface AuthContextType {
  currentUser: User;
  updateUserStatus: (status: UserStatus, customStatus?: string, emoji?: string) => void;
  updateUserAvatar: (avatarUrl: string) => void;
  updateLanguagePreference: (langCode: string, autoTranslate: boolean) => void;
  isLoggedIn: boolean;
  login: (email: string, name?: string, avatar?: string, password?: string) => Promise<void>;
  registerUser: (email: string, name: string, password?: string) => Promise<void>;
  logout: () => void;
  loginWithQR: () => void;
  switchUserRole: (role: User['role']) => void;
}

const DEFAULT_USER: User = {
  id: 'user-001',
  username: 'alex_rivera',
  name: 'Alex Rivera',
  email: 'alex.rivera@letsconnect.io',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  status: 'online',
  customStatus: '🚀 Building Next-Gen Chat SaaS',
  statusEmoji: '💻',
  role: 'owner',
  isVerified: true,
  bio: 'Full Stack Architect & UI Engineer | Open Source Enthusiast',
  createdAt: '2024-01-15T08:00:00.000Z',
  preferredLanguage: 'en',
  autoTranslate: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('pulse_user');
    return saved ? JSON.parse(saved) : DEFAULT_USER;
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const savedLogin = localStorage.getItem('pulse_logged_in');
    return savedLogin === null ? true : savedLogin === 'true';
  });

  useEffect(() => {
    if (!currentUser.publicKey) {
      E2EEService.generateKeyPair().then(({ publicKeyBase64 }) => {
        setCurrentUser(prev => {
          const updated = { ...prev, publicKey: publicKeyBase64 };
          localStorage.setItem('pulse_user', JSON.stringify(updated));
          return updated;
        });
      });
    }
  }, []);

  const login = async (email: string, name?: string, avatar?: string, password?: string) => {
    const userFromBackend = await apiService.login(email, password);
    const updatedUser: User = {
      ...currentUser,
      ...userFromBackend,
      avatar: avatar || userFromBackend.avatar || currentUser.avatar,
      status: 'online'
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('pulse_user', JSON.stringify(updatedUser));
    setIsLoggedIn(true);
    localStorage.setItem('pulse_logged_in', 'true');
  };

  const registerUser = async (email: string, name: string, password?: string) => {
    const userFromBackend = await apiService.register(email, name, password);
    const updatedUser: User = {
      ...currentUser,
      ...userFromBackend,
      status: 'online'
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('pulse_user', JSON.stringify(updatedUser));
    setIsLoggedIn(true);
    localStorage.setItem('pulse_logged_in', 'true');
  };

  const logout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('pulse_logged_in', 'false');
  };

  const loginWithQR = () => {
    setIsLoggedIn(true);
    localStorage.setItem('pulse_logged_in', 'true');
  };

  const updateUserAvatar = (avatarUrl: string) => {
    setCurrentUser(prev => {
      const updated = { ...prev, avatar: avatarUrl };
      localStorage.setItem('pulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateUserStatus = (status: UserStatus, customStatus?: string, emoji?: string) => {
    setCurrentUser(prev => {
      const updated = {
        ...prev,
        status,
        customStatus: customStatus !== undefined ? customStatus : prev.customStatus,
        statusEmoji: emoji !== undefined ? emoji : prev.statusEmoji
      };
      localStorage.setItem('pulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLanguagePreference = (langCode: string, autoTranslate: boolean) => {
    setCurrentUser(prev => {
      const updated = {
        ...prev,
        preferredLanguage: langCode,
        autoTranslate: autoTranslate
      };
      localStorage.setItem('pulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  const switchUserRole = (role: User['role']) => {
    setCurrentUser(prev => {
      const updated = { ...prev, role };
      localStorage.setItem('pulse_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      updateUserStatus,
      updateUserAvatar,
      updateLanguagePreference,
      isLoggedIn,
      login,
      registerUser,
      logout,
      loginWithQR,
      switchUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

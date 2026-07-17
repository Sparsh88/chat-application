import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { 
  Sparkles, ShieldAlert, 
  LogOut, CheckCircle, RefreshCw, QrCode
} from 'lucide-react';

// Subcomponents
import Sidebar from './components/Sidebar.tsx';
import ChatArea from './components/ChatArea.tsx';
import CallWindow from './components/CallWindow.tsx';
import CalendarView from './components/CalendarView.tsx';
import Dashboard from './components/Dashboard.tsx';

// --- Context Definitions ---

interface User {
  id: string;
  email: string;
  username: string;
  role: string;
  customStatus?: string;
  onlinePresence: string;
  theme: string;
  verified: boolean;
  avatarUrl?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Record<string, string>; // userId -> presence
}

export const SocketContext = createContext<SocketContextType | null>(null);

interface CallContextType {
  activeCall: { roomId: string; type: 'VIDEO' | 'VOICE'; partnerId: string; isIncoming: boolean } | null;
  startCall: (targetUserId: string, type: 'VIDEO' | 'VOICE') => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  isCallJoined: boolean;
}

export const CallContext = createContext<CallContextType | null>(null);

// --- Root Component ---

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(null);
  
  // Theme state
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [colorAccent, setColorAccent] = useState<string>('default');

  // Socket state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string>>({});

  // Active call state
  const [activeCall, setActiveCall] = useState<CallContextType['activeCall']>(null);
  const [isCallJoined, setIsCallJoined] = useState(false);

  // Layout states
  const [activeTab, setActiveTab] = useState<'chats' | 'calendar' | 'analytics' | 'friends' | 'settings'>('chats');
  const [selectedChat, setSelectedChat] = useState<{ id: string; name: string; isGroup: boolean; avatarUrl?: string } | null>(null);

  // QR Login Challenge states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrChallenge, setQrChallenge] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<string>('PENDING');

  // Load profile of authenticated user
  useEffect(() => {
    if (token && !user) {
      let active = true;
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        if (data.user) {
          setUser(data.user);
          setThemeMode(data.user.theme === 'light' ? 'light' : 'dark');
        } else {
          logout();
        }
      })
      .catch(() => {
        if (active) logout();
      });
      return () => {
        active = false;
      };
    }
  }, [token, user]);

  // Bind CSS theme modes on data selectors
  useEffect(() => {
    document.body.setAttribute('data-theme', themeMode);
    document.body.setAttribute('data-palette', colorAccent);
  }, [themeMode, colorAccent]);

  // Establish Websockets when user authenticated
  useEffect(() => {
    if (user) {
      const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
      setSocket(s);

      s.emit('register_user', { userId: user.id });

      s.on('user_presence_change', ({ userId, presence }) => {
        setOnlineUsers(prev => ({ ...prev, [userId]: presence }));
      });

      // Ringing listener
      s.on('incoming_call', ({ callerId, type, roomId }) => {
        setActiveCall({ roomId, type, partnerId: callerId, isIncoming: true });
      });

      s.on('call_rejected', () => {
        setActiveCall(null);
        setIsCallJoined(false);
        alert('Call was rejected or busy.');
      });

      s.on('call_ended', () => {
        setActiveCall(null);
        setIsCallJoined(false);
      });

      return () => {
        s.disconnect();
      };
    }
  }, [user]);

  const login = (jwtToken: string, userDetails: User) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userDetails);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setSelectedChat(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
  };

  // --- WebRTC Controls ---
  
  const startCall = (targetUserId: string, type: 'VIDEO' | 'VOICE') => {
    if (!socket || !user) return;
    const roomId = 'room_' + Math.random().toString(36).substring(2, 10);
    setActiveCall({ roomId, type, partnerId: targetUserId, isIncoming: false });
    setIsCallJoined(true);
    socket.emit('initiate_call', { targetUserId, callerId: user.id, type, roomId });
  };

  const acceptCall = () => {
    if (!socket || !activeCall || !user) return;
    setIsCallJoined(true);
    socket.emit('accept_call', { roomId: activeCall.roomId, userId: user.id });
  };

  const rejectCall = () => {
    if (!socket || !activeCall) return;
    socket.emit('reject_call', { roomId: activeCall.roomId, callerId: activeCall.partnerId });
    setActiveCall(null);
  };

  const endCall = () => {
    if (!socket || !activeCall || !user) return;
    socket.emit('leave_call', { roomId: activeCall.roomId, userId: user.id, duration: 42 });
    setActiveCall(null);
    setIsCallJoined(false);
  };

  // --- QR Code Login Actions ---
  
  const handleQRTrigger = async () => {
    setShowQRModal(true);
    setQrStatus('PENDING');
    try {
      const res = await fetch('/api/auth/qr/challenge', { method: 'POST' });
      const data = await res.json();
      setQrChallenge(data.challengeId);

      // Start status poll checker
      const interval = setInterval(async () => {
        const poll = await fetch(`/api/auth/qr/status/${data.challengeId}`);
        const pollData = await poll.json();
        setQrStatus(pollData.status);

        if (pollData.status === 'AUTHORIZED') {
          login(pollData.token, pollData.user);
          setShowQRModal(false);
          clearInterval(interval);
        }
      }, 2000);

      // Timeout challenge after 2 mins
      setTimeout(() => {
        clearInterval(interval);
      }, 120000);
    } catch (e) {
      setQrStatus('FAILED');
    }
  };

  // If a session token exists but user profile is loading, show session restoring state
  if (token && !user) {
    return (
      <div className="auth-fullscreen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <RefreshCw className="spin" size={40} color="#6366f1" />
        <h3 style={{ color: 'var(--text-secondary)' }}>Restoring session...</h3>
      </div>
    );
  }

  // Render Authentication screen if not logged in
  if (!user) {
    return (
      <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
        <AuthScreen onQRClick={handleQRTrigger} />
        <AnimatePresence>
          {showQRModal && (
            <motion.div 
              className="qr-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div 
                className="qr-modal-body glass-panel"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
              >
                <h3>Scan QR Code to Login</h3>
                <p>Authorize this workspace session from your mobile client application.</p>
                
                <div className="qr-box">
                  {qrChallenge ? (
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=nebulachat:login:${qrChallenge}`} 
                      alt="QR Login Code" 
                    />
                  ) : (
                    <div className="skeleton" style={{ width: 200, height: 200 }} />
                  )}
                </div>

                <div className="qr-status-indicator">
                  <span className="pulse-indicator"></span>
                  <span>Status: <strong>{qrStatus}</strong></span>
                </div>
                <button className="btn btn-secondary" onClick={() => setShowQRModal(false)}>Cancel</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      <SocketContext.Provider value={{ socket, onlineUsers }}>
        <CallContext.Provider value={{ activeCall, startCall, acceptCall, rejectCall, endCall, isCallJoined }}>
          <div className="app-container">
            
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onChatSelect={setSelectedChat}
              selectedChat={selectedChat}
            />

            {/* 2. Main Content Board with Fading Page Transitions */}
            <div className="main-board" style={{ position: 'relative', overflow: 'hidden', height: '100%' }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  style={{ height: '100%', width: '100%' }}
                >
                  {activeTab === 'chats' && (
                    <ChatArea chat={selectedChat} />
                  )}

                  {activeTab === 'calendar' && (
                    <CalendarView />
                  )}

                  {activeTab === 'analytics' && (
                    <Dashboard adminMode={user.role === 'ADMIN'} />
                  )}

                  {activeTab === 'friends' && (
                    <FriendsTab startCall={startCall} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsTab 
                      themeMode={themeMode} 
                      setThemeMode={setThemeMode}
                      colorAccent={colorAccent}
                      setColorAccent={setColorAccent}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 3. Call Interface Overlay */}
            {activeCall && (
              <CallWindow />
            )}

          </div>
        </CallContext.Provider>
      </SocketContext.Provider>
    </AuthContext.Provider>
  );
}

// --- Inner Screens components ---

function AuthScreen({ onQRClick }: { onQRClick: () => void }) {
  const { login } = useContext(AuthContext)!;
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email, password } : { email, username, password, role };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection refused by authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-fullscreen">
      <motion.div 
        className="auth-card glass-panel"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
      >
        <div className="auth-header">
          <div className="crown-badge">
            <Sparkles size={28} color="#6366f1" />
          </div>
          <h2>{isLogin ? 'Welcome back' : 'Create an Account'}</h2>
          <p>{isLogin ? 'Login to join the collab workspace' : 'Get started with a free sandbox workspace'}</p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              className="auth-alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <ShieldAlert size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
                animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ originY: 0 }}
              >
                <label>Username</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>

          <AnimatePresence initial={false}>
            {!isLogin && (
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
                animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
                transition={{ duration: 0.2 }}
                style={{ originY: 0 }}
              >
                <label>Workspace Role</label>
                <select className="input-field" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="USER">Standard Collaborator</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>
            {loading ? <RefreshCw className="spin" size={18} /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <button className="btn btn-secondary" style={{ width: '100%', gap: 10 }} onClick={onQRClick}>
          <QrCode size={18} />
          <span>Login via QR Code</span>
        </button>

        <p className="auth-toggle">
          {isLogin ? "New to NebulaChat?" : "Already have an account?"}{' '}
          <span onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'Register now' : 'Sign in'}</span>
        </p>
      </motion.div>
    </div>
  );
}

function FriendsTab({ startCall }: { startCall: CallContextType['startCall'] }) {
  const [users, setUsers] = useState<User[]>([]);
  const { user } = useContext(AuthContext)!;
  const { onlineUsers } = useContext(SocketContext)!;

  useEffect(() => {
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        setUsers(data.filter(u => u.id !== user?.id));
      }
    });
  }, [user]);

  return (
    <div className="friends-tab-layout glass-panel" style={{ margin: 24, padding: 24, borderRadius: 12, height: 'calc(100vh - 48px)' }}>
      <h3>Workspace Co-workers</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Launch video conference or start DMs instantly.</p>

      <div className="friends-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {users.map(u => {
          const presence = onlineUsers[u.id] || u.onlinePresence;
          return (
            <div key={u.id} className="friend-card glass-panel" style={{ padding: 16, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'} 
                  alt={u.username} 
                  style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span className="presence-dot" style={{
                  position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--bg-primary)',
                  backgroundColor: presence === 'online' ? '#22c55e' : presence === 'idle' ? '#eab308' : presence === 'dnd' ? '#ef4444' : '#64748b'
                }}></span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {u.username}
                  {u.verified && <CheckCircle size={14} color="#3b82f6" fill="#3b82f6" style={{ filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.5))' }} />}
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{u.customStatus || 'No status set'}</p>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => startCall(u.id, 'VOICE')}>📞</button>
                <button className="btn btn-primary" style={{ padding: 8 }} onClick={() => startCall(u.id, 'VIDEO')}>🎥</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsTab({ 
  themeMode, 
  setThemeMode, 
  colorAccent, 
  setColorAccent 
}: { 
  themeMode: 'dark' | 'light'; 
  setThemeMode: (m: 'dark' | 'light') => void;
  colorAccent: string;
  setColorAccent: (a: string) => void;
}) {
  const { user, logout, updateUser } = useContext(AuthContext)!;
  const [username, setUsername] = useState(user?.username || '');
  const [status, setStatus] = useState(user?.customStatus || '');

  const saveSettings = async () => {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username,
          customStatus: status,
          theme: themeMode
        })
      });
      const data = await res.json();
      if (data.user) {
        updateUser(data.user);
        alert('Settings updated successfully!');
      }
    } catch (e) {
      alert('Failed to save settings.');
    }
  };

  return (
    <div className="settings-tab-layout glass-panel" style={{ margin: 24, padding: 24, borderRadius: 12, height: 'calc(100vh - 48px)', overflowY: 'auto' }}>
      <h3>Workspace Settings</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Customize your presence, color layouts, and user credentials.</p>

      <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label>Display Name</label>
          <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} />
        </div>

        <div className="form-group">
          <label>Custom Presence Status</label>
          <input type="text" className="input-field" value={status} onChange={e => setStatus(e.target.value)} placeholder="e.g. In a meeting, Out for lunch" />
        </div>

        <div className="theme-toggle-box">
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 550 }}>Main Brightness Theme</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={`btn ${themeMode === 'dark' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeMode('dark')}>Dark Mode</button>
            <button className={`btn ${themeMode === 'light' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setThemeMode('light')}>Light Mode</button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 550 }}>Accent Palette Picker</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <button 
              className="btn btn-secondary" 
              style={{ borderColor: colorAccent === 'default' ? 'var(--primary-color)' : 'transparent' }} 
              onClick={() => setColorAccent('default')}
            >
              💜 Indigo
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ borderColor: colorAccent === 'emerald' ? 'var(--primary-color)' : 'transparent' }} 
              onClick={() => setColorAccent('emerald')}
            >
              💚 Emerald
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ borderColor: colorAccent === 'rosegold' ? 'var(--primary-color)' : 'transparent' }} 
              onClick={() => setColorAccent('rosegold')}
            >
              💖 Rose Gold
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ borderColor: colorAccent === 'ocean' ? 'var(--primary-color)' : 'transparent' }} 
              onClick={() => setColorAccent('ocean')}
            >
              💙 Ocean Drift
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={saveSettings}>Save Modifications</button>
          <button className="btn btn-secondary" style={{ color: 'var(--accent-color)', gap: 8 }} onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

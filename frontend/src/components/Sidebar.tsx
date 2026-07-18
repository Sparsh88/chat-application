import React, { useState, useEffect, useContext } from 'react';
import { 
  MessageSquare, Calendar, BarChart3, Users, Settings, Plus,
  CheckCircle, Sparkles, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext, SocketContext } from '../App.tsx';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'chats' | 'calendar' | 'analytics' | 'friends' | 'settings') => void;
  onChatSelect: (chat: { id: string; name: string; isGroup: boolean; avatarUrl?: string; publicKey?: string } | null) => void;
  selectedChat: { id: string; name: string; isGroup: boolean; avatarUrl?: string; publicKey?: string } | null;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  onChatSelect,
  selectedChat
}: SidebarProps) {
  const { user, logout } = useContext(AuthContext)!;
  const { socket, onlineUsers } = useContext(SocketContext)!;

  const [channels, setChannels] = useState<{ id: string; name: string; description?: string }[]>([]);
  const [friends, setFriends] = useState<{ id: string; username: string; email: string; onlinePresence: string; avatarUrl?: string; verified: boolean; publicKey?: string }[]>([]);
  const [showPresenceDropdown, setShowPresenceDropdown] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  // Load initial cached channels and friends
  useEffect(() => {
    const cachedChannels = localStorage.getItem('cached_channels');
    const cachedFriends = localStorage.getItem('cached_friends');
    if (cachedChannels) {
      try {
        setChannels(JSON.parse(cachedChannels));
      } catch (e) {}
    }
    if (cachedFriends) {
      try {
        setFriends(JSON.parse(cachedFriends));
      } catch (e) {}
    }
  }, []);

  // Fetch groups and users
  useEffect(() => {
    if (!user?.id) return;

    const fetchSidebarData = async () => {
      try {
        const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
        const [channelsRes, usersRes] = await Promise.all([
          fetch('/api/groups', { headers }),
          fetch('/api/users', { headers })
        ]);

        const channelsData = await channelsRes.json();
        const usersData = await usersRes.json();

        if (Array.isArray(channelsData)) {
          setChannels(channelsData);
          localStorage.setItem('cached_channels', JSON.stringify(channelsData));
        }
        if (Array.isArray(usersData)) {
          const filteredFriends = usersData.filter(u => u.id !== user.id);
          setFriends(filteredFriends);
          localStorage.setItem('cached_friends', JSON.stringify(filteredFriends));
        }
      } catch (e) {
        console.error('Failed to load sidebar content');
      }
    };
    fetchSidebarData();
  }, [user?.id]);

  // Status Presence override
  const handlePresenceChange = (status: string) => {
    if (socket && user) {
      socket.emit('presence_override', { userId: user.id, presence: status });
      setShowPresenceDropdown(false);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName) return;

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newChannelName, description: newChannelDesc })
      });
      const group = await res.json();
      if (res.ok) {
        setChannels([...channels, group]);
        setNewChannelName('');
        setNewChannelDesc('');
        setShowAddChannelModal(false);
        onChatSelect({ id: group.id, name: group.name, isGroup: true });
      }
    } catch (e) {
      alert('Error creating channel');
    }
  };

  return (
    <div className="sidebar-master glass-panel" style={{ display: 'flex', height: '100vh', borderRight: '1px solid var(--border-glass)' }}>
      
      {/* 1. Global Navigation Strip */}
      <div className="sidebar-nav-strip" style={{
        width: 80, background: 'rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', 
        alignItems: 'center', padding: '16px 0', borderRight: '1px solid var(--border-glass)', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', width: '100%' }}>
          <motion.div 
            className="logo-cube" 
            whileHover={{ scale: 1.1, rotate: 10, shadow: "0 0 25px var(--primary-color)" }}
            whileTap={{ scale: 0.9 }}
            style={{
              width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
              boxShadow: 'var(--shadow-glow)', cursor: 'pointer'
            }}
          >
            <Sparkles size={22} />
          </motion.div>

          <div style={{ width: '100%', height: '1px', background: 'var(--border-glass)', margin: '10px 0' }} />

          <motion.button 
            className={`nav-item ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => setActiveTab('chats')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', color: 'var(--text-secondary)' }}
            title="Channels & Messages"
          >
            <MessageSquare size={22} style={{ margin: '0 auto' }} />
          </motion.button>

          <motion.button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', color: 'var(--text-secondary)' }}
            title="Meeting Scheduler"
          >
            <Calendar size={22} style={{ margin: '0 auto' }} />
          </motion.button>

          <motion.button 
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', color: 'var(--text-secondary)' }}
            title="Analytics Dashboard"
          >
            <BarChart3 size={22} style={{ margin: '0 auto' }} />
          </motion.button>

          <motion.button 
            className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', color: 'var(--text-secondary)' }}
            title="Workspace Members"
          >
            <Users size={22} style={{ margin: '0 auto' }} />
          </motion.button>

          <motion.button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            style={{ border: 'none', background: 'transparent', padding: '12px 0', width: '100%', color: 'var(--text-secondary)' }}
            title="Settings"
          >
            <Settings size={22} style={{ margin: '0 auto' }} />
          </motion.button>
        </div>

        <div>
          <motion.button 
            onClick={logout}
            whileHover={{ scale: 1.15, rotate: -5 }}
            whileTap={{ scale: 0.9 }}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--accent-color)' }}
            title="Log Out"
          >
            <LogOut size={22} />
          </motion.button>
        </div>
      </div>

      {/* 2. Secondary Panel Content (Channels & DMs list) */}
      <div className="sidebar-channel-list" style={{ width: 240, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Upper Brand panel */}
        <div className="sidebar-header" style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-glass)' }}>
          <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: 6 }}>
            NebulaChat OS
            <span style={{ fontSize: 10, padding: '2px 6px', background: 'rgba(99,102,241,0.2)', color: 'var(--primary-color)', borderRadius: 10 }}>SaaS</span>
          </h3>
        </div>

        {/* Dynamic Lists */}
        {activeTab === 'chats' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 8px' }}>
            
            {/* Channels block */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>
                <span>Text Channels</span>
                <Plus size={14} style={{ cursor: 'pointer' }} onClick={() => setShowAddChannelModal(true)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {channels.map(ch => (
                  <div 
                    key={ch.id} 
                    onClick={() => {
                      setActiveTab('chats');
                      onChatSelect({ id: ch.id, name: ch.name, isGroup: true });
                    }}
                    style={{
                      padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14,
                      color: selectedChat?.id === ch.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: selectedChat?.id === ch.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                      transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>#</span> {ch.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Direct messages block */}
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>
                <span>Direct Messages</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {friends.map(fr => {
                  const presence = onlineUsers[fr.id] || fr.onlinePresence;
                  return (
                    <div 
                      key={fr.id} 
                      onClick={() => {
                        setActiveTab('chats');
                        onChatSelect({ id: fr.id, name: fr.username, isGroup: false, avatarUrl: fr.avatarUrl, publicKey: fr.publicKey });
                      }}
                      style={{
                        padding: '8px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 14,
                        color: selectedChat?.id === fr.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                        background: selectedChat?.id === fr.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                        transition: 'all 0.15s ease', display: 'flex', alignItems: 'center', gap: 8
                      }}
                    >
                      <div style={{ position: 'relative', width: 20, height: 20 }}>
                        <img 
                          src={fr.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=40&h=40'} 
                          alt={fr.username} 
                          style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} 
                        />
                        <span style={{
                          position: 'absolute', bottom: -1, right: -1, width: 6, height: 6, borderRadius: '50%',
                          backgroundColor: presence === 'online' ? '#22c55e' : presence === 'idle' ? '#eab308' : presence === 'dnd' ? '#ef4444' : '#64748b'
                        }} />
                      </div>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fr.username}</span>
                      {fr.verified && <CheckCircle size={12} color="#3b82f6" fill="#3b82f6" />}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ) : (
          <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8 }}>Layout Panel</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {activeTab === 'calendar' && 'Create meeting sessions and align plans.'}
                {activeTab === 'analytics' && 'Inspect messages statistics and active workspace growth.'}
                {activeTab === 'friends' && 'Launch voice calls or configure video links.'}
                {activeTab === 'settings' && 'Update client accents and profile status.'}
              </p>
            </div>
          </div>
        )}

        {/* Footer profile panel */}
        <div className="sidebar-footer" style={{
          padding: '12px 16px', borderTop: '1px solid var(--border-glass)', display: 'flex', 
          alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.1)', position: 'relative'
        }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowPresenceDropdown(!showPresenceDropdown)}>
            <img 
              src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80'} 
              alt={user?.username} 
              style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} 
            />
            <span style={{
              position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%',
              backgroundColor: user?.onlinePresence === 'online' ? '#22c55e' : user?.onlinePresence === 'idle' ? '#eab308' : user?.onlinePresence === 'dnd' ? '#ef4444' : '#64748b',
              border: '2px solid var(--bg-secondary)'
            }} />
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <h4 style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.username}</h4>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.customStatus || 'Set status'}</p>
          </div>

          {/* Dynamic presence list with entrance animations */}
          <AnimatePresence>
            {showPresenceDropdown && (
              <motion.div 
                className="presence-select-dropdown glass-panel"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'absolute', bottom: '110%', left: 16, width: 150, zIndex: 100,
                  borderRadius: 'var(--radius-md)', padding: '6px 0', display: 'flex', flexDirection: 'column'
                }}
              >
                <div className="presence-option" style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handlePresenceChange('online')}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}></span> Online
                </div>
                <div className="presence-option" style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handlePresenceChange('idle')}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#eab308' }}></span> Idle / Away
                </div>
                <div className="presence-option" style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handlePresenceChange('dnd')}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Do Not Disturb
                </div>
                <div className="presence-option" style={{ padding: '8px 12px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => handlePresenceChange('offline')}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748b' }}></span> Invisible
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Add Channel Modal with bounce scale transitions */}
      <AnimatePresence>
        {showAddChannelModal && (
          <motion.div 
            className="qr-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="qr-modal-body glass-panel"
              initial={{ scale: 0.92, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.92, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              style={{ width: 380 }}
            >
              <h3 style={{ marginBottom: 12 }}>Create New Channel</h3>
              <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label>Channel Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newChannelName} 
                    onChange={e => setNewChannelName(e.target.value)} 
                    placeholder="e.g. engineering-sync" 
                    required 
                  />
                </div>
                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label>Description (Optional)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={newChannelDesc} 
                    onChange={e => setNewChannelDesc(e.target.value)} 
                    placeholder="e.g. Sprint alignments and git commits discussions" 
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddChannelModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Channel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

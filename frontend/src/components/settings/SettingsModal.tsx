import React, { useState, useRef } from 'react';
import { Shield, LogOut, Camera, Upload, Image as ImageIcon, UserCheck, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SettingsModal: React.FC = () => {
  const { currentUser, switchUserRole, logout, updateUserAvatar, updateUserStatus } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [customStatusInput, setCustomStatusInput] = useState(currentUser.customStatus || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          updateUserAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAvatarUrl.trim()) return;
    updateUserAvatar(customAvatarUrl);
    setCustomAvatarUrl('');
  };

  const handleSaveStatus = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserStatus(currentUser.status, customStatusInput);
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Top Banner */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">Account & User Settings</h1>
            <p className="text-xs opacity-60 hidden sm:block">Manage your profile picture, bio, custom status, and account permissions.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="p-1 rounded-xl border flex items-center gap-1 self-start sm:self-auto" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => setActiveTab('profile')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'profile' ? 'bg-accent text-white' : 'opacity-60 hover:opacity-100'}`}>My Profile</button>
          <button onClick={() => setActiveTab('security')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'security' ? 'bg-accent text-white' : 'opacity-60 hover:opacity-100'}`}>Role & Permissions</button>
        </div>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-4 sm:space-y-6">
          {/* Active Profile Picture Display */}
          <div className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-accent/40 shadow-xl"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[10px] font-bold transition-opacity"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span>Change</span>
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold">{currentUser.name}</h3>
                <p className="text-xs opacity-60 font-mono">@{currentUser.username}</p>
                <span className="inline-block bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-md mt-2 border border-accent/20">
                  {currentUser.role.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Upload Button */}
            <div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg hover:opacity-90 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload Photo from Device
              </button>
            </div>
          </div>

          {/* Preset Avatars Selection */}
          <div className="p-5 rounded-2xl border space-y-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-accent" /> Select Preset Avatar
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {presetAvatars.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => updateUserAvatar(url)}
                  className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
                    currentUser.avatar === url ? 'border-accent ring-4 ring-accent/40 scale-105' : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Avatar ${idx}`} className="w-full h-16 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Custom Status Form */}
          <form onSubmit={handleSaveStatus} className="p-5 rounded-2xl border space-y-3 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold">Custom Bio & About Status</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="What are you working on?"
                value={customStatusInput}
                onChange={(e) => setCustomStatusInput(e.target.value)}
                className="flex-1 border text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-accent"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <button type="submit" className="px-4 py-2.5 bg-accent text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
                Save Status
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Role-Based Access Control */}
          <div className="p-5 rounded-2xl border space-y-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" /> Role-Based Access Control (RBAC)
            </h3>
            <div className="flex items-center gap-3">
              {(['owner', 'admin', 'moderator', 'member'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => switchUserRole(role)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all ${
                    currentUser.role === role ? 'bg-accent text-white border-accent' : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Account Session & Logout Section */}
      <div className="p-5 rounded-2xl border space-y-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-accent/40" />
            <div>
              <h4 className="font-bold text-xs">{currentUser.name}</h4>
              <p className="text-[11px] opacity-60">{currentUser.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-transform hover:scale-[1.02]"
          >
            <LogOut className="w-4 h-4" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

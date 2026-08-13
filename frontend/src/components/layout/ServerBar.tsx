import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Calendar, BarChart3, Users, Settings, CircleDot, Palette, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserStatus, ThemeMode } from '../../types';

interface ServerBarProps {
  activeView: 'chat' | 'analytics' | 'meetings' | 'friends' | 'settings';
  setActiveView: (view: 'chat' | 'analytics' | 'meetings' | 'friends' | 'settings') => void;
  toggleAIAssistant: () => void;
  isAIOpen: boolean;
}

export const ServerBar: React.FC<ServerBarProps> = ({ activeView, setActiveView, toggleAIAssistant, isAIOpen }) => {
  const { currentUser, updateUserStatus } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const statusMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const statusColors: Record<UserStatus, string> = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    dnd: 'bg-rose-500',
    offline: 'bg-slate-500'
  };

  const themes: { id: ThemeMode; name: string; bg: string; text: string }[] = [
    { id: 'dark', name: 'Deep Obsidian Dark', bg: '#030712', text: '#f9fafb' },
    { id: 'oled', name: 'Pure OLED Black', bg: '#000000', text: '#ffffff' },
    { id: 'cyberpunk', name: 'Cyberpunk Neon', bg: '#090212', text: '#fdf2f8' },
    { id: 'emerald', name: 'Emerald Slate', bg: '#022c22', text: '#ecfdf5' },
    { id: 'sunset', name: 'Sunset Purple', bg: '#0f051c', text: '#fff1f2' },
    { id: 'light', name: 'Clean Light Mode', bg: '#f8fafc', text: '#0f172a' },
  ];

  const accentColors = [
    { name: 'Indigo Blue', hex: '#6366f1' },
    { name: 'Ocean Blue', hex: '#3b82f6' },
    { name: 'Emerald Green', hex: '#10b981' },
    { name: 'Neon Pink', hex: '#ec4899' },
    { name: 'Rose Red', hex: '#f43f5e' },
    { name: 'Royal Purple', hex: '#8b5cf6' },
    { name: 'Sunset Amber', hex: '#f59e0b' }
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setIsStatusMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStatus = (status: UserStatus) => {
    updateUserStatus(status);
    setIsStatusMenuOpen(false);
  };

  return (
    <aside
      className="w-18 flex flex-col items-center py-4 border-r z-30 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Brand Icon */}
      <div 
        onClick={() => setActiveView('chat')}
        className="relative group cursor-pointer mb-6"
      >
        <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30 group-hover:scale-105 transition-all duration-300">
          <span className="text-2xl font-black text-white tracking-tighter">LC</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
        </div>
      </div>

      <div className="w-8 h-px bg-slate-700/40 my-2"></div>

      {/* Main Navigation Items */}
      <div className="flex-1 flex flex-col items-center gap-3 w-full px-2">
        {/* Chat / Workspace */}
        <button
          onClick={() => setActiveView('chat')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            activeView === 'chat'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40'
          }`}
          title="Chat & Workspace Channels"
        >
          <CircleDot className="w-6 h-6" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Workspace Chat
          </span>
        </button>

        {/* AI Assistant */}
        <button
          onClick={toggleAIAssistant}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            isAIOpen
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
              : 'opacity-70 hover:opacity-100 hover:text-purple-400'
          }`}
          title="AI Assistant (Gemini)"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            AI Assistant (@Gemini)
          </span>
        </button>

        {/* Analytics Dashboard */}
        <button
          onClick={() => setActiveView('analytics')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            activeView === 'analytics'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40'
          }`}
          title="Analytics Dashboard"
        >
          <BarChart3 className="w-6 h-6" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Analytics & Metrics
          </span>
        </button>

        {/* Meeting Scheduler */}
        <button
          onClick={() => setActiveView('meetings')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            activeView === 'meetings'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40'
          }`}
          title="Meeting Scheduler & Calendar"
        >
          <Calendar className="w-6 h-6" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Meeting Calendar
          </span>
        </button>

        {/* Friends & Social */}
        <button
          onClick={() => setActiveView('friends')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            activeView === 'friends'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40'
          }`}
          title="Friends & Connections"
        >
          <Users className="w-6 h-6" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Friends & Social
          </span>
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3">
        {/* Dedicated Theme Picker Button Above Settings */}
        <div ref={themeMenuRef} className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
              isThemeMenuOpen
                ? 'bg-accent text-white shadow-md shadow-accent/30'
                : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40 text-accent'
            }`}
            title="Themes & Brand Colors"
          >
            <Palette className="w-6 h-6" />
            <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Themes & Accent Colors
            </span>
          </button>

          {/* Theme & Accent Color Popover Menu */}
          {isThemeMenuOpen && (
            <div
              className="absolute left-16 bottom-0 w-64 border rounded-2xl p-4 shadow-2xl space-y-4 z-50 animate-fade-in"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <div className="font-bold text-xs flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-color)' }}>
                <span className="flex items-center gap-1.5"><Palette className="w-4 h-4 text-accent" /> UI Themes</span>
                <button onClick={() => setIsThemeMenuOpen(false)} className="text-xs opacity-60 hover:opacity-100">✕</button>
              </div>

              {/* Theme Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold opacity-60 block">Preset Mode</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {themes.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-2 rounded-xl text-left border text-[11px] font-semibold flex items-center justify-between transition-all ${
                        theme === t.id ? 'border-accent bg-accent/10 text-accent' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: t.bg, color: t.text }}
                    >
                      <span className="truncate">{t.name.split(' ')[0]}</span>
                      {theme === t.id && <Check className="w-3 h-3 text-accent" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Accent Color */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold opacity-60 block">Brand Accent Color</span>
                <div className="flex flex-wrap items-center gap-2">
                  {accentColors.map(color => (
                    <button
                      key={color.hex}
                      onClick={() => setAccentColor(color.hex)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        accentColor.toLowerCase() === color.hex.toLowerCase() ? 'ring-2 ring-accent scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    >
                      {accentColor.toLowerCase() === color.hex.toLowerCase() && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setActiveView('settings')}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group relative ${
            activeView === 'settings'
              ? 'bg-accent text-white shadow-md shadow-accent/30'
              : 'opacity-70 hover:opacity-100 hover:bg-slate-800/40'
          }`}
          title="Settings & Account"
        >
          <Settings className="w-6 h-6" />
          <span className="absolute left-16 bg-slate-900 text-xs text-white font-medium px-2.5 py-1 rounded-md shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Settings & Account
          </span>
        </button>

        {/* User Profile Avatar with Clickable Presence Toggle */}
        <div ref={statusMenuRef} className="relative cursor-pointer">
          <button
            onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
            className="relative focus:outline-none block"
            title="Click to change status"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-accent/40 hover:ring-accent transition-all"
            />
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${statusColors[currentUser.status]}`}></div>
          </button>

          {/* Status Selection Popover Menu */}
          {isStatusMenuOpen && (
            <div
              className="absolute left-14 bottom-0 border rounded-2xl p-2 shadow-2xl flex flex-col gap-1 w-44 z-50 animate-fade-in"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <div className="font-bold text-[10px] uppercase px-2 py-1 border-b opacity-60" style={{ borderColor: 'var(--border-color)' }}>
                Set Online Presence
              </div>
              <button
                onClick={() => handleSelectStatus('online')}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  currentUser.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-black/10'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Online
              </button>
              <button
                onClick={() => handleSelectStatus('away')}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  currentUser.status === 'away' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-black/10'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Away
              </button>
              <button
                onClick={() => handleSelectStatus('dnd')}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  currentUser.status === 'dnd' ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-black/10'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Do Not Disturb
              </button>
              <button
                onClick={() => handleSelectStatus('offline')}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                  currentUser.status === 'offline' ? 'bg-slate-500/20 text-slate-400' : 'hover:bg-black/10'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Invisible / Offline
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

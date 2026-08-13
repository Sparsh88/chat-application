import React, { useState } from 'react';
import { Hash, Code, Palette, Sparkles, Coffee, Plus, Search, ShieldCheck, Lock, ChevronDown, Pin, Archive, Heart } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export const ChannelSidebar: React.FC = () => {
  const { channels, directMessages, activeTarget, setActiveTarget, isE2EEEnabled, setIsE2EEEnabled, searchQuery, setSearchQuery, isLoadingUsers } = useChat();
  const [filterTab, setFilterTab] = useState<'all' | 'pinned' | 'favorites' | 'archived'>('all');
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(true);
  const [isDMsExpanded, setIsDMsExpanded] = useState(true);

  const renderChannelIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Code': return <Code className="w-4 h-4 text-accent" />;
      case 'Palette': return <Palette className="w-4 h-4 text-accent" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-accent" />;
      case 'Coffee': return <Coffee className="w-4 h-4 text-accent" />;
      default: return <Hash className="w-4 h-4 opacity-60 text-accent" />;
    }
  };

  const statusColorMap = {
    online: 'bg-emerald-500',
    away: 'bg-amber-500',
    dnd: 'bg-rose-500',
    offline: 'bg-slate-500'
  };

  return (
    <aside
      className="w-64 flex flex-col border-r z-20 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Sidebar Top Header */}
      <div className="h-14 px-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-bold text-accent text-sm">
            ⚡
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight leading-none">Let's Connect</h1>
            <span className="text-[11px] opacity-60 font-medium">Chat & Collaborate</span>
          </div>
        </div>

        {/* E2EE Mode Toggle */}
        <button
          onClick={() => setIsE2EEEnabled(!isE2EEEnabled)}
          className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            isE2EEEnabled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 glow-emerald'
              : 'opacity-70 border border-slate-700/50 hover:opacity-100'
          }`}
          title={isE2EEEnabled ? 'End-to-End Encryption ACTIVE' : 'Enable E2EE Private Mode'}
        >
          {isE2EEEnabled ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
          <span>{isE2EEEnabled ? 'E2EE' : 'Std'}</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 opacity-50 absolute left-3 top-2.5 text-accent" />
          <input
            type="text"
            placeholder="Search channels & DMs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-accent transition-colors"
            style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-around px-3 py-1 text-xs border-b opacity-90" style={{ borderColor: 'var(--border-color)' }}>
        <button onClick={() => setFilterTab('all')} className={`p-1.5 rounded-lg ${filterTab === 'all' ? 'text-accent font-bold bg-accent/10' : 'hover:opacity-100'}`}>
          All
        </button>
        <button onClick={() => setFilterTab('pinned')} className={`p-1 rounded-lg ${filterTab === 'pinned' ? 'text-accent font-bold bg-accent/10' : 'hover:opacity-100'}`}>
          <Pin className="w-3.5 h-3.5 text-accent" />
        </button>
        <button onClick={() => setFilterTab('favorites')} className={`p-1 rounded-lg ${filterTab === 'favorites' ? 'text-accent font-bold bg-accent/10' : 'hover:opacity-100'}`}>
          <Heart className="w-3.5 h-3.5 text-accent" />
        </button>
        <button onClick={() => setFilterTab('archived')} className={`p-1 rounded-lg ${filterTab === 'archived' ? 'text-accent font-bold bg-accent/10' : 'hover:opacity-100'}`}>
          <Archive className="w-3.5 h-3.5 text-accent" />
        </button>
      </div>

      {/* Scrollable Channels & DMs List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 group cursor-pointer" onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}>
            <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider opacity-70 uppercase">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isChannelsExpanded ? '' : '-rotate-90'}`} />
              <span>Channels</span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 hover:text-accent p-0.5 rounded transition-opacity" title="Create New Channel">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isChannelsExpanded && (
            <div className="space-y-0.5">
              {channels
                .filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(channel => {
                  const isActive = activeTarget.type === 'channel' && activeTarget.id === channel.id;
                  return (
                    <button
                      key={channel.id}
                      onClick={() => setActiveTarget({ type: 'channel', id: channel.id })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                          : 'opacity-70 hover:opacity-100 hover:bg-black/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {renderChannelIcon(channel.icon)}
                        <span className="truncate">{channel.name}</span>
                      </div>
                      {channel.unreadCount && channel.unreadCount > 0 ? (
                        <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                          {channel.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-1.5 group cursor-pointer" onClick={() => setIsDMsExpanded(!isDMsExpanded)}>
            <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider opacity-70 uppercase">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDMsExpanded ? '' : '-rotate-90'}`} />
              <span>Direct Messages</span>
            </div>
            <button className="opacity-0 group-hover:opacity-100 hover:text-accent p-0.5 rounded transition-opacity">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isDMsExpanded && (
            <div className="space-y-0.5">
              {isLoadingUsers && directMessages.length === 0 ? (
                <div className="space-y-1.5 px-1 py-1 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-slate-800" />
                      <div className="h-3 bg-slate-800 rounded w-24" />
                    </div>
                  ))}
                </div>
              ) : (
                directMessages
                  .filter(dm => dm.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(dm => {
                    const isActive = activeTarget.type === 'dm' && activeTarget.id === dm.id;
                    return (
                      <button
                        key={dm.id}
                        onClick={() => setActiveTarget({ type: 'dm', id: dm.id })}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-accent/20 text-accent border border-accent/40 font-bold'
                            : 'opacity-70 hover:opacity-100 hover:bg-black/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div className="relative flex-shrink-0">
                            <img src={dm.user.avatar} alt={dm.user.name} loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover" />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${statusColorMap[dm.user.status]}`}></span>
                          </div>
                          <span className="truncate">{dm.user.name}</span>
                        </div>
                        {dm.unreadCount > 0 && (
                          <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                            {dm.unreadCount}
                          </span>
                        )}
                      </button>
                    );
                  })
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

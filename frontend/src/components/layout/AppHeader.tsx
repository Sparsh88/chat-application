import React from 'react';
import { Phone, Video, ShieldCheck, MoreVertical, Hash, Menu } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useCall } from '../../context/CallContext';

interface AppHeaderProps {
  activeView: 'chat' | 'analytics' | 'meetings' | 'friends' | 'settings';
  toggleAIAssistant: () => void;
  toggleInspector: () => void;
  onMenuClick?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ activeView, toggleAIAssistant, toggleInspector, onMenuClick }) => {
  const { activeTarget, channels, directMessages, isE2EEEnabled } = useChat();
  const { startCall } = useCall();

  const activeChannel = activeTarget.type === 'channel' ? channels.find(c => c.id === activeTarget.id) : null;
  const activeDM = activeTarget.type === 'dm' ? directMessages.find(d => d.id === activeTarget.id) : null;

  const renderTitle = () => {
    switch (activeView) {
      case 'analytics':
        return <h2 className="font-bold text-sm">Metrics & Analytics</h2>;
      case 'meetings':
        return <h2 className="font-bold text-sm">Calendar & Sync</h2>;
      case 'friends':
        return <h2 className="font-bold text-sm">Social & Friends</h2>;
      case 'settings':
        return <h2 className="font-bold text-sm">Account Settings</h2>;
      case 'chat':
      default:
        return activeTarget.type === 'channel' ? (
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-accent" />
            <h2 className="font-bold text-sm">{activeChannel?.name || 'general'}</h2>
            <span className="text-xs opacity-60 border-l pl-3 hidden sm:inline" style={{ borderColor: 'var(--border-color)' }}>
              {activeChannel?.description}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <img src={activeDM?.user.avatar} alt={activeDM?.user.name} loading="lazy" decoding="async" className="w-7 h-7 rounded-full object-cover ring-2 ring-accent/40" />
            <div>
              <h2 className="font-bold text-sm leading-none">{activeDM?.user.name}</h2>
              <span className="text-[11px] text-accent font-medium">Active Now</span>
            </div>
          </div>
        );
    }
  };

  return (
    <header
      className="h-14 border-b px-4 flex items-center justify-between z-10 select-none transition-colors duration-300 shrink-0"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Title & Topic */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="p-1.5 opacity-80 hover:opacity-100 hover:bg-black/10 rounded-xl md:hidden transition-all text-accent mr-1 animate-fade-in"
            title="Open Channels List"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        {renderTitle()}

        {isE2EEEnabled && activeView === 'chat' && (
          <span className="bg-accent/10 text-accent text-[10px] font-bold px-2 py-0.5 rounded-md border border-accent/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> E2E Encrypted
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {activeView === 'chat' ? (
          <>
            {/* WebRTC Voice Call */}
            <button
              onClick={() => startCall('voice', activeDM?.user)}
              className="p-2 opacity-80 hover:opacity-100 hover:bg-black/10 rounded-xl transition-all text-accent"
              title="Start Voice Call"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* WebRTC Video Call */}
            <button
              onClick={() => startCall('video', activeDM?.user)}
              className="p-2 opacity-80 hover:opacity-100 hover:bg-black/10 rounded-xl transition-all text-accent"
              title="Start HD Video Call"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Right Inspector Toggle */}
            <button
              onClick={toggleInspector}
              className="p-2 opacity-80 hover:opacity-100 hover:bg-black/10 rounded-xl transition-all"
              title="Toggle Context Details"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </>
        ) : (
          isE2EEEnabled && (
            <span className="bg-accent/10 text-accent text-[10px] font-bold px-2.5 py-1 rounded-xl border border-accent/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure
            </span>
          )
        )}
      </div>
    </header>
  );
};

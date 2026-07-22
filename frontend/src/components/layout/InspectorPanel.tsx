import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Pin, Shield, Calendar, X, Download, FileCode, CheckCircle2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface InspectorPanelProps {
  onClose: () => void;
  onOpenScheduler: () => void;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ onClose, onOpenScheduler }) => {
  const { activeTarget, directMessages, messages } = useChat();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'files' | 'pinned'>('profile');

  const activeDM = activeTarget.type === 'dm' ? directMessages.find(d => d.id === activeTarget.id) : null;
  const pinnedMessages = messages.filter(m => m.isPinned);
  const sharedFiles = messages.flatMap(m => m.attachments || []);

  return (
    <aside
      className="fixed md:static inset-y-0 right-0 z-40 md:z-20 w-full sm:w-72 md:w-72 border-l flex flex-col shadow-2xl select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="h-14 px-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
        <h3 className="font-bold text-sm tracking-tight">Details & Media</h3>
        <button onClick={onClose} className="opacity-70 hover:opacity-100 p-1 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-xs font-semibold opacity-80" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2.5 text-center border-b-2 ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-500 font-bold' : 'border-transparent hover:opacity-100'}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2.5 text-center border-b-2 ${activeTab === 'files' ? 'border-indigo-500 text-indigo-500 font-bold' : 'border-transparent hover:opacity-100'}`}
        >
          Files ({sharedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab('pinned')}
          className={`flex-1 py-2.5 text-center border-b-2 ${activeTab === 'pinned' ? 'border-indigo-500 text-indigo-500 font-bold' : 'border-transparent hover:opacity-100'}`}
        >
          Pinned ({pinnedMessages.length})
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {activeTab === 'profile' && (
          <>
            {/* User Profile Card */}
            <div
              className="flex flex-col items-center text-center p-4 rounded-2xl border"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
            >
              <img
                src={activeDM?.user.avatar || currentUser.avatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/40 mb-3 shadow-lg"
              />
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-base">{activeDM?.user.name || currentUser.name}</h4>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-xs opacity-60 font-mono mt-0.5">@{activeDM?.user.username || currentUser.username}</p>
              <p className="text-xs italic mt-2.5 px-3 py-1.5 rounded-xl border opacity-90" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                "{activeDM?.user.customStatus || currentUser.customStatus}"
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <button
                onClick={onOpenScheduler}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform"
              >
                <Calendar className="w-4 h-4" /> Schedule Team Meeting
              </button>
            </div>

            {/* Security & Key Verification Card */}
            <div className="p-3 rounded-xl border space-y-2" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> E2EE Key Identity</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Verified</span>
              </div>
              <p className="text-[10px] font-mono opacity-60 break-all p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-card)' }}>
                ECDH-P256-FINGERPRINT: 4A89-9B21-EE04-7C91
              </p>
            </div>
          </>
        )}

        {activeTab === 'files' && (
          <div className="space-y-2.5">
            {sharedFiles.length === 0 ? (
              <div className="text-center py-8 opacity-50 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No shared files in this conversation yet.
              </div>
            ) : (
              sharedFiles.map(file => (
                <div key={file.id} className="p-2.5 rounded-xl border flex items-center justify-between group" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      {file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-medium truncate">{file.name}</div>
                      <div className="text-[10px] opacity-60">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </div>
                  <a href={file.url} download className="p-1.5 opacity-70 hover:opacity-100 rounded-lg">
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'pinned' && (
          <div className="space-y-3">
            {pinnedMessages.length === 0 ? (
              <div className="text-center py-8 opacity-50 text-xs">
                <Pin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No pinned messages in this thread.
              </div>
            ) : (
              pinnedMessages.map(msg => (
                <div key={msg.id} className="p-3 rounded-xl border space-y-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center justify-between text-[11px] font-semibold opacity-70">
                    <span>{msg.senderName}</span>
                    <Pin className="w-3 h-3 text-indigo-400" />
                  </div>
                  <p className="text-xs line-clamp-3">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

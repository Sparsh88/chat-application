import React, { useState } from 'react';
import { Users, UserPlus, ShieldAlert, X, MessageSquare, Ban, Flag, CheckCircle2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { User } from '../../types';

export const FriendsTab: React.FC = () => {
  const { friendsList, pendingRequests, addFriend, blockUser, setActiveTarget } = useChat();
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedUserToReport, setSelectedUserToReport] = useState<User | null>(null);

  const handleAddFriendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendInput.trim()) return;
    addFriend(newFriendInput);
    setNewFriendInput('');
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Top Banner & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight">Social Network & Friends</h1>
            <p className="text-xs opacity-60 hidden sm:block">Direct message connections, verification badges, block lists & report logs.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="p-1 rounded-xl border flex items-center gap-1 self-start sm:self-auto" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
          <button onClick={() => setActiveTab('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'opacity-60 hover:opacity-100'}`}>All Friends ({friendsList.length})</button>
          <button onClick={() => setActiveTab('pending')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'pending' ? 'bg-indigo-600 text-white' : 'opacity-60 hover:opacity-100'}`}>Pending ({pendingRequests.length})</button>
        </div>
      </div>

      {/* Add Friend Form */}
      <form onSubmit={handleAddFriendSubmit} className="p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center gap-3 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <UserPlus className="w-5 h-5 text-indigo-400" />
        <input
          type="text"
          placeholder="Enter username to add friend (e.g. sarah_chen)..."
          value={newFriendInput}
          onChange={(e) => setNewFriendInput(e.target.value)}
          className="flex-1 border text-xs rounded-xl p-2.5 focus:outline-none focus:border-indigo-500"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-md">
          Send Request
        </button>
      </form>

      {/* Friends Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friendsList.map(friend => (
          <div key={friend.id} className="p-4 rounded-2xl border flex items-center justify-between group hover:border-indigo-500/40 transition-all shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={friend.avatar} alt={friend.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-indigo-500/30" />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-xs">{friend.name}</h4>
                  {friend.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <span className="text-[10px] opacity-60 font-mono">@{friend.username}</span>
                <p className="text-[11px] opacity-60 italic truncate max-w-[140px] mt-0.5">{friend.customStatus || 'Online & active'}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTarget({ type: 'dm', id: `dm-${friend.id}` })}
                className="p-2 opacity-70 hover:opacity-100 hover:text-indigo-400 rounded-xl transition-colors"
                title="Send Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setSelectedUserToReport(friend); setShowReportModal(true); }}
                className="p-2 opacity-70 hover:opacity-100 hover:text-rose-400 rounded-xl transition-colors"
                title="Report User"
              >
                <Flag className="w-4 h-4" />
              </button>
              <button
                onClick={() => blockUser(friend.id)}
                className="p-2 opacity-70 hover:opacity-100 hover:text-rose-500 rounded-xl transition-colors"
                title="Block User"
              >
                <Ban className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report User Modal */}
      {showReportModal && selectedUserToReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="border rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Report User: {selectedUserToReport.name}
              </h3>
              <button onClick={() => setShowReportModal(false)} className="opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Describe reason for report..."
              className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-rose-500"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReportModal(false)} className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100 rounded-xl">Cancel</button>
              <button onClick={() => { alert('Report submitted to system moderators.'); setShowReportModal(false); }} className="px-4 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-xl">Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

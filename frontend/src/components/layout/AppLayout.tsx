import React, { useState, useEffect } from 'react';
import { ServerBar } from './ServerBar';
import { ChannelSidebar } from './ChannelSidebar';
import { AppHeader } from './AppHeader';
import { ChatArea } from '../chat/ChatArea';
import { InspectorPanel } from './InspectorPanel';
import { AIAssistantDrawer } from '../ai/AIAssistantDrawer';
import { VideoCallOverlay } from '../call/VideoCallOverlay';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { CalendarView } from '../meeting/CalendarView';
import { MeetingSchedulerModal } from '../meeting/MeetingSchedulerModal';
import { FriendsTab } from '../social/FriendsTab';
import { SettingsModal } from '../settings/SettingsModal';
import { Meeting } from '../../types';
import { apiService } from '../../services/apiService';
import { useChat } from '../../context/ChatContext';
import { CircleDot, Sparkles, BarChart3, Calendar, Users, Settings } from 'lucide-react';


const INITIAL_MEETINGS: Meeting[] = [
  {
    id: 'm-1',
    title: 'Q3 Enterprise SaaS Architecture Review',
    description: 'Discussing WebRTC signaling, E2EE key distribution & Gemini API integration.',
    host: 'Alex Rivera',
    date: '2026-07-21',
    time: '14:00',
    duration: 45,
    participants: ['Sarah Chen', 'Marcus Vance', 'Elena Rostova'],
    link: 'https://letsconnect.io/meet/mtg-101',
    timeZone: 'EST (UTC-5)'
  },
  {
    id: 'm-2',
    title: 'Figma Design System & Glassmorphism Tokens',
    description: 'Reviewing dark mode themes and custom color picker.',
    host: 'Sarah Chen',
    date: '2026-07-22',
    time: '11:30',
    duration: 30,
    participants: ['Alex Rivera'],
    link: 'https://letsconnect.io/meet/mtg-102',
    timeZone: 'EST (UTC-5)'
  }
];

export const AppLayout: React.FC = () => {
  const { activeTarget } = useChat();
  const [activeView, setActiveView] = useState<'chat' | 'analytics' | 'meetings' | 'friends' | 'settings'>('chat');
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState<boolean>(false);

  // Close mobile sidebar on target or view change
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeTarget, activeView]);

  // Switch to chat view when activeTarget changes
  useEffect(() => {
    setActiveView('chat');
  }, [activeTarget]);

  // Fetch persistent meetings on mount with loading state and caching
  useEffect(() => {
    setIsLoadingMeetings(true);
    apiService.getMeetings(30).then(dbMeetings => {
      if (dbMeetings && dbMeetings.length > 0) {
        setMeetings(dbMeetings);
      }
    }).finally(() => {
      setIsLoadingMeetings(false);
    });
  }, []);

  const handleAddMeeting = async (meeting: Meeting) => {
    setMeetings(prev => [meeting, ...prev]);
    try {
      await apiService.createMeeting(meeting);
    } catch (err) {
      console.warn('API save meeting fallback:', err);
    }
  };

  const handleDeleteMeeting = (meetingId: string) => {
    setMeetings(prev => prev.filter(m => m.id !== meetingId));
  };

  return (
    <div
      className="h-screen w-screen flex flex-col md:flex-row overflow-hidden font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* 1. Server Navigation Bar (Discord style) */}
      <div className="hidden md:flex h-full shrink-0">
        <ServerBar
          activeView={activeView}
          setActiveView={setActiveView}
          toggleAIAssistant={() => setIsAIOpen(!isAIOpen)}
          isAIOpen={isAIOpen}
        />
      </div>

      {/* Mobile Drawer Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-45 md:hidden transition-opacity duration-300 animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer Container */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-50 flex shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '328px' }}
      >
        <ServerBar
          activeView={activeView}
          setActiveView={setActiveView}
          toggleAIAssistant={() => setIsAIOpen(!isAIOpen)}
          isAIOpen={isAIOpen}
        />
        <div className="w-64 h-full">
          <ChannelSidebar />
        </div>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative min-h-0">
        {/* Global AppHeader */}
        <AppHeader
          activeView={activeView}
          toggleAIAssistant={() => setIsAIOpen(!isAIOpen)}
          toggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Global Content Area */}
        <div className="flex-1 flex min-w-0 min-h-0 w-full relative">
          {/* 2. Workspace Channels Sidebar (Slack style) */}
          <div className="hidden md:flex h-full shrink-0">
            <ChannelSidebar />
          </div>

          {/* Active View Panel */}
          <div className="flex-1 flex flex-col min-w-0 h-full relative min-h-0">
            {activeView === 'chat' && <ChatArea />}
            {activeView === 'analytics' && <AnalyticsDashboard />}
            {activeView === 'meetings' && (
              <CalendarView
                meetings={meetings}
                isLoading={isLoadingMeetings}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                onDeleteMeeting={handleDeleteMeeting}
              />
            )}
            {activeView === 'friends' && <FriendsTab />}
            {activeView === 'settings' && <SettingsModal />}
          </div>

          {/* 3. Notion-style Inspector Panel */}
          {isInspectorOpen && activeView === 'chat' && (
            <InspectorPanel
              onClose={() => setIsInspectorOpen(false)}
              onOpenScheduler={() => setIsScheduleModalOpen(true)}
            />
          )}

          {/* 4. AI Assistant Drawer (Gemini) */}
          {isAIOpen && (
            <AIAssistantDrawer onClose={() => setIsAIOpen(false)} />
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div
        className="md:hidden h-16 border-t flex items-center justify-around z-30 select-none transition-colors duration-300 shrink-0"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
      >
        {/* Chat Tab */}
        <button
          onClick={() => { setActiveView('chat'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeView === 'chat' ? 'text-accent font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <CircleDot className="w-5 h-5" />
          <span className="text-[10px]">Chat</span>
        </button>

        {/* AI Assistant Tab */}
        <button
          onClick={() => setIsAIOpen(!isAIOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            isAIOpen ? 'text-purple-400 font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">AI Assistant</span>
        </button>

        {/* Analytics Tab */}
        <button
          onClick={() => { setActiveView('analytics'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeView === 'analytics' ? 'text-accent font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Metrics</span>
        </button>

        {/* Calendar Tab */}
        <button
          onClick={() => { setActiveView('meetings'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeView === 'meetings' ? 'text-accent font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        {/* Friends Tab */}
        <button
          onClick={() => { setActiveView('friends'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeView === 'friends' ? 'text-accent font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Friends</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => { setActiveView('settings'); }}
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            activeView === 'settings' ? 'text-accent font-bold' : 'opacity-60 hover:opacity-100'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Settings</span>
        </button>
      </div>

      {/* WebRTC Video & Voice Call Overlay */}
      <VideoCallOverlay />

      {/* Meeting Scheduler Modal */}
      <MeetingSchedulerModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onScheduleSuccess={handleAddMeeting}
      />
    </div>
  );
};

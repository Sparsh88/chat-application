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
  const [activeView, setActiveView] = useState<'chat' | 'analytics' | 'meetings' | 'friends' | 'settings'>('chat');
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [meetings, setMeetings] = useState<Meeting[]>(INITIAL_MEETINGS);

  // Fetch persistent meetings on mount
  useEffect(() => {
    apiService.getMeetings().then(dbMeetings => {
      if (dbMeetings && dbMeetings.length > 0) {
        setMeetings(dbMeetings);
      }
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
      className="h-screen w-screen flex overflow-hidden font-sans transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* 1. Server Navigation Bar (Discord style) */}
      <ServerBar
        activeView={activeView}
        setActiveView={setActiveView}
        toggleAIAssistant={() => setIsAIOpen(!isAIOpen)}
        isAIOpen={isAIOpen}
      />

      {/* Main Container Area */}
      <div className="flex-1 flex min-w-0 h-full relative">
        {activeView === 'chat' && (
          <>
            {/* 2. Workspace Channels Sidebar (Slack style) */}
            <ChannelSidebar />

            {/* Central Workspace Window */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
              <AppHeader
                toggleAIAssistant={() => setIsAIOpen(!isAIOpen)}
                toggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
              />
              <ChatArea />
            </div>

            {/* 3. Notion-style Inspector Panel */}
            {isInspectorOpen && (
              <InspectorPanel
                onClose={() => setIsInspectorOpen(false)}
                onOpenScheduler={() => setIsScheduleModalOpen(true)}
              />
            )}
          </>
        )}

        {activeView === 'analytics' && <AnalyticsDashboard />}
        {activeView === 'meetings' && (
          <CalendarView
            meetings={meetings}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )}
        {activeView === 'friends' && <FriendsTab />}
        {activeView === 'settings' && <SettingsModal />}

        {/* 4. AI Assistant Drawer (Gemini) */}
        {isAIOpen && (
          <AIAssistantDrawer onClose={() => setIsAIOpen(false)} />
        )}
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

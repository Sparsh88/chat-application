import React from 'react';
import { Calendar as CalendarIcon, Clock, Users, Video, Plus, Trash2 } from 'lucide-react';
import { Meeting } from '../../types';
import { useCall } from '../../context/CallContext';

interface CalendarViewProps {
  meetings: Meeting[];
  isLoading?: boolean;
  onOpenScheduleModal: () => void;
  onDeleteMeeting: (meetingId: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ meetings, isLoading, onOpenScheduleModal, onDeleteMeeting }) => {
  const { startCall } = useCall();

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Header Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border backdrop-blur-md shadow-lg"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div>
          <h1 className="text-base sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" /> Team Meeting Calendar & Sync
          </h1>
          <p className="text-xs opacity-60 mt-1 hidden sm:block">Scheduled video calls, calendar invites, and instant meeting room links.</p>
        </div>

        <button
          onClick={onOpenScheduleModal}
          className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" /> Schedule New Meeting
        </button>
      </div>

      {/* Meetings Grid */}
      {isLoading && meetings.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          {[1, 2].map(i => (
            <div
              key={i}
              className="p-5 rounded-2xl border space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-slate-800 rounded" />
                  <div className="h-5 w-48 bg-slate-800 rounded" />
                </div>
                <div className="h-4 w-12 bg-slate-800 rounded" />
              </div>
              <div className="h-10 w-full bg-slate-800/60 rounded-xl" />
              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-8 w-28 bg-slate-800 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-60 text-center">
          <CalendarIcon className="w-14 h-14 mb-4 opacity-40 text-accent" />
          <h3 className="font-bold text-sm">No Scheduled Meetings</h3>
          <p className="text-xs max-w-sm mt-1 opacity-70">Click "Schedule New Meeting" above to create your first team meeting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map(mtg => (
            <div
              key={mtg.id}
              className="p-5 rounded-2xl border hover:border-accent/40 transition-all space-y-3 shadow-lg"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                    {mtg.date} • {mtg.time} {mtg.timeZone}
                  </span>
                  <h3 className="font-bold text-base mt-2">{mtg.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs opacity-60 font-mono flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 opacity-50" /> {mtg.duration}m
                  </span>
                  <button
                    onClick={() => onDeleteMeeting(mtg.id)}
                    className="p-1 opacity-50 hover:opacity-100 hover:text-rose-400 rounded-lg transition-colors"
                    title="Remove meeting"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs opacity-80 leading-relaxed">{mtg.description}</p>

              <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 text-xs opacity-70 font-medium">
                  <Users className="w-4 h-4 text-accent" />
                  <span>{mtg.participants.length} Invited</span>
                </div>

                <button
                  onClick={() => startCall('video')}
                  className="px-4 py-1.5 bg-accent text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all hover:scale-[1.02]"
                >
                  <Video className="w-3.5 h-3.5" /> Join HD Call
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


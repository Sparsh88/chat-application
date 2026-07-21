import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Link as LinkIcon, Download, Plus, X, Globe } from 'lucide-react';
import { Meeting } from '../../types';

interface MeetingSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduleSuccess: (meeting: Meeting) => void;
}

export const MeetingSchedulerModal: React.FC<MeetingSchedulerModalProps> = ({ isOpen, onClose, onScheduleSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('14:00');
  const [duration, setDuration] = useState(45);
  const [timeZone, setTimeZone] = useState('EST (UTC-5)');
  const [isRecurring, setIsRecurring] = useState(false);

  if (!isOpen) return null;

  const handleCreateMeeting = () => {
    if (!title.trim()) return;

    const meeting: Meeting = {
      id: `mtg-${Date.now()}`,
      title,
      description,
      host: 'Alex Rivera',
      date,
      time,
      duration,
      participants: ['Sarah Chen', 'Marcus Vance'],
      link: `https://letsconnect.io/meet/${Date.now()}`,
      isRecurring,
      timeZone
    };

    onScheduleSuccess(meeting);

    // Reset form fields after scheduling
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime('14:00');
    setDuration(45);

    onClose();
  };

  // Download .ics Calendar File for Google / Outlook Calendar integration
  const downloadICSFile = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LetsConnect//Meeting Scheduler//EN
BEGIN:VEVENT
SUMMARY:${title}
DESCRIPTION:${description}
DTSTART:${date.replace(/-/g, '')}T${time.replace(':', '')}00Z
DURATION:PT${duration}M
LOCATION:https://letsconnect.io/meet/${Date.now()}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '-')}.ics`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 select-none">
      <div
        className="border rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-base flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" /> Schedule Team Meeting
          </h3>
          <button onClick={onClose} className="opacity-60 hover:opacity-100 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold opacity-80 block mb-1">Meeting Title</label>
            <input
              type="text"
              placeholder="e.g. Q3 Architecture Review & Security Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-accent"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold opacity-80 block mb-1">Description / Agenda</label>
            <textarea
              rows={2}
              placeholder="Key topics to discuss..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-accent"
              style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-80 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-accent"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold opacity-80 block mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border text-xs rounded-xl p-2.5 focus:outline-none focus:border-accent"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold opacity-80 block mb-1">Duration (Minutes)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full border text-xs rounded-xl p-2.5 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>1 Hour</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold opacity-80 block mb-1">Time Zone</label>
              <select
                value={timeZone}
                onChange={(e) => setTimeZone(e.target.value)}
                className="w-full border text-xs rounded-xl p-2.5 focus:outline-none"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              >
                <option value="EST (UTC-5)">EST (UTC-5)</option>
                <option value="PST (UTC-8)">PST (UTC-8)</option>
                <option value="IST (UTC+5:30)">IST (UTC+5:30)</option>
                <option value="CET (UTC+1)">CET (UTC+1)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button
            onClick={downloadICSFile}
            className="text-xs text-accent flex items-center gap-1.5 font-medium hover:underline"
          >
            <Download className="w-4 h-4" /> Export .ics Calendar File
          </button>

          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-1.5 text-xs opacity-70 hover:opacity-100 rounded-xl">Cancel</button>
            <button
              onClick={handleCreateMeeting}
              className="px-4 py-1.5 bg-accent text-white text-xs font-semibold rounded-xl shadow-lg hover:opacity-90 transition-all"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

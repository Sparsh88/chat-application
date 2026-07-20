import React, { useState, useEffect, useContext } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Plus, Video, Trash2, 
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { CallContext } from '../App.tsx';
import { getAuthToken } from '../utils/auth.ts';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  recurrence: string;
  invitees: string; // JSON string
  joinLink: string;
}

export default function CalendarView() {
  const { startCall } = useContext(CallContext)!;

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Meeting Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [recurrence, setRecurrence] = useState('NONE');
  const [inviteEmails, setInviteEmails] = useState('');

  // 1. Fetch meeting logs
  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings', {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setMeetings(data);
      }
    } catch (e) {
      // Mock fallback data for presentations
      setMeetings([
        {
          id: 'meet_demo_1',
          title: 'Daily Tech Sync',
          description: 'Sync on sprint status and codebase refactoring.',
          startTime: new Date(Date.now() + 3600000).toISOString(), // in 1 hour
          endTime: new Date(Date.now() + 7200000).toISOString(),
          timeZone: 'UTC',
          recurrence: 'DAILY',
          invitees: '["alex@company.com", "sarah@design.com"]',
          joinLink: '/call/meet_demo_1'
        },
        {
          id: 'meet_demo_2',
          title: 'UI Design Review',
          description: 'Walkthrough of premium glassmorphism layouts.',
          startTime: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          endTime: new Date(Date.now() + 90000000).toISOString(),
          timeZone: 'UTC',
          recurrence: 'NONE',
          invitees: '["sarah@design.com"]',
          joinLink: '/call/meet_demo_2'
        }
      ]);
    }
  };

  // 2. Submit scheduler form
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;

    const inviteesArray = inviteEmails
      .split(',')
      .map(e => e.trim())
      .filter(e => e !== '');

    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          title,
          description,
          startTime,
          endTime,
          timeZone,
          recurrence,
          invitees: inviteesArray
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMeetings(prev => [...prev, data]);
        setShowCreateModal(false);
        // Reset fields
        setTitle('');
        setDescription('');
        setStartTime('');
        setEndTime('');
        setInviteEmails('');
      } else {
        alert(data.error || 'Failed to create meeting');
      }
    } catch (e) {
      alert('Error creating meeting: connection timeout or request failed');
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== id));
      }
    } catch (e) {
      alert('Failed to delete meeting');
    }
  };

  // Join meeting link via WebRTC
  const handleJoinCall = (meet: Meeting) => {
    startCall(meet.id, 'VIDEO'); // Launch WebRTC Video Call overlay with the room ID
  };

  // Calendar Monthly grid calculations
  const getDaysInMonth = (d: Date) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    
    // Add prefix padding blanks
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }

    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const changeMonth = (offset: number) => {
    const copy = new Date(currentDate);
    copy.setMonth(copy.getMonth() + offset);
    setCurrentDate(copy);
  };

  const daysGrid = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', gap: 1 }}>
      
      {/* 1. Left Side: Events List and Form trigger */}
      <div className="glass-panel" style={{
        padding: 24, borderRight: '1px solid var(--border-glass)', display: 'flex',
        flexDirection: 'column', height: '100%', background: 'rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
            <CalendarIcon size={18} color="var(--primary-color)" /> Calendar Plans
          </h3>
          <button className="btn btn-primary" style={{ padding: 6, borderRadius: '50%' }} onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
          </button>
        </div>

        {/* Upcomming list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Upcoming Events</h4>
          
          {meetings.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
              No meetings scheduled.
            </div>
          ) : (
            meetings.map(meet => {
              
              return (
                <div key={meet.id} className="glass-panel" style={{ padding: 14, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h5 style={{ fontSize: 14, color: 'var(--text-primary)' }}>{meet.title}</h5>
                    <button style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => handleDeleteMeeting(meet.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                  
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{meet.description}</p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} /> {new Date(meet.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                    <span>🌐 Timezone: {meet.timeZone}</span>
                    {meet.recurrence !== 'NONE' && (
                      <span style={{ color: 'var(--primary-color)' }}>🔁 Recurrence: {meet.recurrence}</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11, gap: 4, width: '100%' }} onClick={() => handleJoinCall(meet)}>
                      <Video size={12} /> Join Conference
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Right Side: Monthly grid layout */}
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontFamily: 'var(--font-display)' }}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
            <button className="btn btn-secondary" style={{ padding: 8 }} onClick={() => changeMonth(1)}><ChevronRight size={16} /></button>
          </div>
        </div>

        {/* Days grid headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10, textAlign: 'center', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
          <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
        </div>

        {/* Days grid body */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridTemplateRows: 'repeat(6, 1fr)', gap: 8 }}>
          {daysGrid.map((day, idx) => {
            if (!day) return <div key={idx} style={{ background: 'rgba(255,255,255,0.01)', borderRadius: 8 }} />;
            
            const dayNum = day.getDate();
            const isToday = day.toDateString() === new Date().toDateString();
            
            // Check if has matching meeting on this day
            const hasMeeting = meetings.some(m => new Date(m.startTime).toDateString() === day.toDateString());

            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{
                  padding: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', 
                  justifyContent: 'space-between', transition: 'all 0.2s ease', cursor: 'pointer',
                  borderColor: isToday ? 'var(--primary-color)' : 'var(--border-glass)',
                  background: isToday ? 'rgba(99,102,241,0.04)' : 'var(--bg-glass)'
                }}
              >
                <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--primary-color)' : 'var(--text-primary)' }}>
                  {dayNum}
                </span>

                {hasMeeting && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary-color)',
                    alignSelf: 'center', marginBottom: 4, boxShadow: 'var(--shadow-glow)'
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="qr-modal-overlay">
          <div className="qr-modal-body glass-panel" style={{ width: 440 }}>
            <h3 style={{ marginBottom: 12 }}>Schedule Collaboration Call</h3>
            <form onSubmit={handleCreateMeeting} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Meeting Title</label>
                <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Agenda</label>
                <input type="text" className="input-field" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label>Start Time</label>
                  <input type="datetime-local" className="input-field" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input type="datetime-local" className="input-field" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label>Timezone</label>
                  <select className="input-field" value={timeZone} onChange={e => setTimeZone(e.target.value)}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC / GMT</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Recurrence</label>
                  <select className="input-field" value={recurrence} onChange={e => setRecurrence(e.target.value)}>
                    <option value="NONE">Single Occurrence</option>
                    <option value="DAILY">Daily Meeting</option>
                    <option value="WEEKLY">Weekly Standup</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Invitees Emails (comma separated)</label>
                <input type="text" className="input-field" placeholder="e.g. alex@company.com, sarah@design.com" value={inviteEmails} onChange={e => setInviteEmails(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Meeting</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  MessageSquare, Users, FolderHeart, Activity,
  Server, Monitor, Globe
} from 'lucide-react';
import { getAuthToken } from '../utils/auth.ts';

interface DashboardProps {
  adminMode: boolean;
}

export default function Dashboard({ adminMode }: DashboardProps) {
  const [isAdminView, setIsAdminView] = useState(adminMode);

  // User Stats state
  const [userStats, setUserStats] = useState({
    messagesSent: 42,
    activeFriends: 3,
    activeGroups: 2,
    timeSpentChatting: 140, // in minutes
    weeklyActivity: [
      { name: 'Mon', messages: 4 },
      { name: 'Tue', messages: 8 },
      { name: 'Wed', messages: 12 },
      { name: 'Thu', messages: 10 },
      { name: 'Fri', messages: 5 },
      { name: 'Sat', messages: 2 },
      { name: 'Sun', messages: 1 }
    ]
  });

  // Admin Stats state
  const [adminStats, setAdminStats] = useState({
    metrics: {
      totalUsers: 4,
      totalMessages: 64,
      totalGroups: 2,
      storageUsageMB: 12,
      activeUsersCount: 3,
      dauPercent: 75
    },
    charts: {
      userGrowth: [
        { month: 'Jan', users: 1 },
        { month: 'Feb', users: 2 },
        { month: 'Mar', users: 2 },
        { month: 'Apr', users: 3 },
        { month: 'May', users: 4 },
        { month: 'Jun', users: 4 }
      ],
      messagesPerDay: [
        { date: '07/10', count: 12 },
        { date: '07/11', count: 15 },
        { date: '07/12', count: 8 },
        { date: '07/13', count: 20 },
        { date: '07/14', count: 14 },
        { date: '07/15', count: 18 }
      ],
      deviceAnalytics: [
        { name: 'Desktop App', value: 2 },
        { name: 'Mobile Web', value: 1 },
        { name: 'Chrome Tab', value: 1 }
      ],
      countryAnalytics: [
        { name: 'United States', value: 2 },
        { name: 'India', value: 1 },
        { name: 'Germany', value: 1 }
      ]
    }
  });

  // 1. Fetch dashboard numbers
  useEffect(() => {
    const headers = { Authorization: `Bearer ${getAuthToken()}` };
    
    // User data call
    fetch('/api/analytics/user', { headers })
      .then(r => r.json())
      .then(data => {
        if (data.messagesSent !== undefined) {
          setUserStats(data);
        }
      })
      .catch(() => {});

    // Admin data call
    if (adminMode) {
      fetch('/api/analytics/admin', { headers })
        .then(r => r.json())
        .then(data => {
          if (data.metrics) {
            setAdminStats(data);
          }
        })
        .catch(() => {});
    }
  }, [adminMode]);

  // Color constants for Pie charts
  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#eab308'];

  return (
    <div style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      
      {/* Upper header segment */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)' }}>
            Analytics Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            Inspect workspace interactions, throughput metrics, and server footprints.
          </p>
        </div>

        {/* Toggle Admin vs User view if role isAdmin */}
        {adminMode && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button 
              className={`btn ${!isAdminView ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsAdminView(false)}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              My Performance
            </button>
            <button 
              className={`btn ${isAdminView ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setIsAdminView(true)}
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              Workspace Console (Admin)
            </button>
          </div>
        )}
      </div>

      {/* 2. User Analytics Dashboard layout */}
      {!isAdminView ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* User Metrics Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                <MessageSquare size={22} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Messages Dispatched</span>
                <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{userStats.messagesSent}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <Users size={22} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Active Co-workers</span>
                <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{userStats.activeFriends}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(244,63,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                <FolderHeart size={22} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Groups Joined</span>
                <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{userStats.activeGroups}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(234,179,8,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eab308' }}>
                <Activity size={22} />
              </div>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Collaboration Minutes</span>
                <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{userStats.timeSpentChatting}m</h3>
              </div>
            </div>
          </div>

          {/* User Chart graph */}
          <div className="glass-panel" style={{ padding: 24, borderRadius: 12 }}>
            <h4 style={{ fontSize: 15, marginBottom: 20 }}>My Outgoing Messages (Weekly activity)</h4>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={userStats.weeklyActivity}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border-glass)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="messages" stroke="var(--primary-color)" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      ) : (
        // 3. Admin Dashboard Layout
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Admin Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Daily Active Users (DAU)</span>
              <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{adminStats.metrics.activeUsersCount}</h3>
              <p style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>📈 {adminStats.metrics.dauPercent}% active ratio</p>
            </div>

            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Overall Accounts</span>
              <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{adminStats.metrics.totalUsers}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Across all channels</p>
            </div>

            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Total Messages Logged</span>
              <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{adminStats.metrics.totalMessages}</h3>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>SQL Database rows</p>
            </div>

            <div className="glass-panel" style={{ padding: 18, borderRadius: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Disk Footprint</span>
              <h3 style={{ fontSize: 24, color: 'var(--text-primary)', marginTop: 2 }}>{adminStats.metrics.storageUsageMB} MB</h3>
              <p style={{ fontSize: 11, color: 'var(--accent-color)', marginTop: 4 }}><Server size={10} style={{ display: 'inline', marginRight: 4 }} /> SQLite file size</p>
            </div>
          </div>

          {/* Admin double chart layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Growth Area Chart */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <h4 style={{ fontSize: 14, marginBottom: 16 }}>User Registration Curve</h4>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={adminStats.charts.userGrowth}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-glass)" />
                    <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)' }} />
                    <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Daily Messages Spikes */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12 }}>
              <h4 style={{ fontSize: 14, marginBottom: 16 }}>Messages Frequency Per Day</h4>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={adminStats.charts.messagesPerDay}>
                    <CartesianGrid stroke="var(--border-glass)" />
                    <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={11} />
                    <YAxis stroke="var(--text-muted)" fontSize={11} />
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-glass)' }} />
                    <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Demographics row (Pies) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Devices usage */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Monitor size={16} /> Device Analytics
              </h4>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={adminStats.charts.deviceAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {adminStats.charts.deviceAnalytics.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Country maps distribution */}
            <div className="glass-panel" style={{ padding: 20, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Globe size={16} /> Geography Demographics
              </h4>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={adminStats.charts.countryAnalytics}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {adminStats.charts.countryAnalytics.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconSize={8} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

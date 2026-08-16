import React, { useState } from 'react';
import { AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MessageSquare, Users, Clock, HardDrive, TrendingUp, Activity, ShieldAlert, ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Footer } from '../layout/Footer';

const MOCK_WEEKLY = [
  { day: 'Mon', messages: 180, calls: 2 },
  { day: 'Tue', messages: 240, calls: 4 },
  { day: 'Wed', messages: 310, calls: 3 },
  { day: 'Thu', messages: 290, calls: 5 },
  { day: 'Fri', messages: 420, calls: 6 },
  { day: 'Sat', messages: 150, calls: 1 },
  { day: 'Sun', messages: 95, calls: 0 },
];

const MOCK_GROWTH = [
  { month: 'Jan', users: 12000, active: 8500 },
  { month: 'Feb', users: 18500, active: 14000 },
  { month: 'Mar', users: 24000, active: 19200 },
  { month: 'Apr', users: 29800, active: 24100 },
  { month: 'May', users: 34200, active: 28500 },
];

const MOCK_DEVICES = [
  { name: 'Desktop Web', value: 55, color: '#6366f1' },
  { name: 'Mobile App', value: 35, color: '#10b981' },
  { name: 'Tablet', value: 10, color: '#f59e0b' }
];

export const AnalyticsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [viewMode, setViewMode] = useState<'user' | 'admin'>('user');

  const isAdminAuthorized = currentUser.email.toLowerCase() === 'sparshchauhan050@gmail.com';

  return (
    <div
      className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 select-none transition-colors duration-300 flex flex-col justify-between"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Top Banner & Mode Switcher */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border shadow-lg"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" /> Analytics & Performance Insights
            </h1>
            <p className="text-xs opacity-60 mt-1 hidden sm:block">Real-time metrics, message throughput, WebRTC bandwidth, and user demographics.</p>
          </div>

          {/* View Toggle Button */}
          <div className="p-1 rounded-xl border flex items-center gap-1 self-start sm:self-auto" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => setViewMode('user')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'user' ? 'bg-indigo-600 text-white shadow-md' : 'opacity-60 hover:opacity-100'
              }`}
            >
              User Analytics
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                viewMode === 'admin' ? 'bg-indigo-600 text-white shadow-md' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

        {viewMode === 'user' ? (
          <>
            {/* User Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Messages Sent</span>
                  <h3 className="text-2xl font-black mt-0.5">1,420</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Active Teammates</span>
                  <h3 className="text-2xl font-black mt-0.5">28</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Time Spent Chatting</span>
                  <h3 className="text-2xl font-black mt-0.5">18.5 hrs</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Weekly Streak</span>
                  <h3 className="text-2xl font-black mt-0.5">7 Days 🔥</h3>
                </div>
              </div>
            </div>

            {/* Weekly Activity Line Chart */}
            <div className="p-5 rounded-2xl border space-y-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h3 className="text-sm font-bold">Weekly Messaging & HD Calls Throughput</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_WEEKLY}>
                    <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="messages" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="calls" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : !isAdminAuthorized ? (
          /* Access Denied Card for unauthorized users */
          <div className="p-8 rounded-3xl border text-center space-y-5 shadow-2xl animate-fade-in my-8" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h2 className="text-xl font-black tracking-tight text-rose-400">Access Denied: Restricted Admin Portal</h2>
              <p className="text-xs opacity-70 leading-relaxed">
                System-wide metrics, DAU/MAU telemetry, cloud storage analytics, and audit logs are exclusively accessible to platform administrator <strong>Sparsh Chauhan</strong> (<span className="font-mono text-accent">sparshchauhan050@gmail.com</span>).
              </p>
              <p className="text-[11px] opacity-50 font-mono pt-1">
                Your account ({currentUser.email}) does not hold administrative authorization.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setViewMode('user')}
                className="px-6 py-2.5 bg-accent text-white rounded-xl text-xs font-bold shadow-lg shadow-accent/30 hover:opacity-90 transition-all"
              >
                Return to User Analytics
              </button>
            </div>
          </div>
        ) : (
          /* Authorized Admin Portal View for Sparsh Chauhan */
          <>
            {/* Admin Verification Header */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-400">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold flex items-center gap-1.5">
                    👑 Verified Administrator Access: Sparsh Chauhan
                  </h4>
                  <p className="text-[11px] opacity-80">Full administrative clearance active. Managing server health, storage, and platform analytics.</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-3 py-1 rounded-lg border border-emerald-500/40 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> High Security RBAC Active
              </div>
            </div>

            {/* Admin Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Daily Active Users (DAU)</span>
                  <h3 className="text-2xl font-black mt-0.5">4,850</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Monthly Active Users (MAU)</span>
                  <h3 className="text-2xl font-black mt-0.5">34,200</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Messages / Day</span>
                  <h3 className="text-2xl font-black mt-0.5">89.4K</h3>
                </div>
              </div>

              <div className="p-4 rounded-2xl border flex items-center gap-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <HardDrive className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs opacity-60 font-medium">Cloud Storage Used</span>
                  <h3 className="text-2xl font-black mt-0.5">142.8 GB</h3>
                </div>
              </div>
            </div>

            {/* User Growth Area Chart & Device Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-5 rounded-2xl border space-y-4 shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-sm font-bold">User Growth & Active Engagement Trend</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_GROWTH}>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="users" stroke="#6366f1" fill="#6366f120" strokeWidth={3} />
                      <Area type="monotone" dataKey="active" stroke="#10b981" fill="#10b98120" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-5 rounded-2xl border flex flex-col justify-between shadow-md" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <h3 className="text-sm font-bold">Device Platform Analytics</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={MOCK_DEVICES} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {MOCK_DEVICES.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 pt-2 border-t text-xs" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="flex justify-between"><span>Desktop Web</span><span className="font-bold text-indigo-400">55%</span></div>
                  <div className="flex justify-between"><span>Mobile App</span><span className="font-bold text-emerald-400">35%</span></div>
                  <div className="flex justify-between"><span>Tablet</span><span className="font-bold text-amber-400">10%</span></div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Persistent Social Contact Footer */}
      <div className="mt-8">
        <Footer variant="full" />
      </div>
    </div>
  );
};


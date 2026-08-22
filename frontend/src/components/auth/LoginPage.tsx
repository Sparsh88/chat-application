import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, UserCheck, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, registerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const [authError, setAuthError] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;
    setAuthError(null);
    try {
      const nameFromEmail = loginEmail.split('@')[0].replace('.', ' ');
      await login(loginEmail, nameFromEmail, undefined, loginPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail.trim() || !signUpName.trim()) return;
    if (signUpPassword && signUpPassword !== confirmPassword) {
      setAuthError('Passwords do not match!');
      return;
    }
    setAuthError(null);
    try {
      await registerUser(signUpEmail, signUpName, signUpPassword);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleDemoLogin = async (demoName: string, demoEmail: string, avatar: string, password?: string) => {
    setAuthError(null);
    try {
      await login(demoEmail, demoName, avatar, password);
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed');
    }
  };

  return (
    <div
      className="min-h-screen w-screen flex flex-col items-center justify-center p-4 sm:p-6 font-sans select-none relative overflow-x-hidden transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Background Glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/20 blur-3xl pointer-events-none animate-pulse"></div>

      <div className="w-full max-w-md my-auto">
        {/* Main Auth Card */}
        <div
          className="w-full rounded-3xl p-6 sm:p-8 border shadow-2xl relative z-10 space-y-6"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/40 mb-1">
              <span className="text-3xl font-black text-white tracking-tighter">LC</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Let's Connect</h1>
            <p className="text-xs opacity-60">Real-Time Chat & Collaboration</p>
          </div>

          {/* Tab Switcher (Sign In vs. Create Account) */}
          <div className="p-1 rounded-xl border flex items-center gap-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <button
              onClick={() => { setActiveTab('login'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'login' ? 'bg-accent text-white shadow-md' : 'opacity-60 hover:opacity-100'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setAuthError(null); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'signup' ? 'bg-accent text-white shadow-md' : 'opacity-60 hover:opacity-100'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Auth Error Banner */}
          {authError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              ⚠️ {authError}
            </div>
          )}

          {activeTab === 'login' ? (
            /* Sign In Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold opacity-80">Email Address</label>
                </div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-accent transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold opacity-80">Password</label>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-3 focus:outline-none focus:border-accent transition-colors font-mono"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/30 hover:opacity-90 transition-all"
              >
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Create Account Form */
            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold opacity-80 block mb-1">Full Name</label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="text"
                    required
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. Sparsh Chauhan"
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80 block mb-1">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80 block mb-1">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="Create password..."
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold opacity-80 block mb-1">Confirm Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 opacity-50 absolute left-3.5 text-accent" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password..."
                    className="w-full border text-xs rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:border-accent transition-colors"
                    style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-accent text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/30 hover:opacity-90 transition-all mt-2"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Demo Switcher (Members only) */}
          <div className="pt-3 border-t space-y-2" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold opacity-60">Instant Demo Login</span>
              <span className="text-[10px] opacity-50">Standard Member Accounts</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('Sarah Chen', 'sarah@letsconnect.io', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80')}
                className="p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-accent transition-all"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <UserCheck className="w-3.5 h-3.5 text-accent" /> Sarah
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Marcus Vance', 'marcus@letsconnect.io', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80')}
                className="p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-accent transition-all"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <UserCheck className="w-3.5 h-3.5 text-accent" /> Marcus
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('Alex Rivera', 'alex.rivera@letsconnect.io', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')}
                className="p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-accent transition-all"
                style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <UserCheck className="w-3.5 h-3.5 text-accent" /> Alex
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


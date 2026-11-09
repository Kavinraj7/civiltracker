'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { 
  Building2, 
  Lock, 
  Mail, 
  ShieldCheck, 
  ArrowRight, 
  Database, 
  AlertCircle,
  KeyRound,
  UserPlus
} from 'lucide-react';

interface AuthScreenProps {
  onOpenFirebaseConfig?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onOpenFirebaseConfig }) => {
  const { login, register, isFirebaseActive } = useData();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = mode === 'login' 
        ? await login(email.trim(), password.trim())
        : await register(email.trim(), password.trim());

      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-900">
      
      {/* Background accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto mb-3">
            <Building2 className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            CIVIL<span className="text-amber-600">CORP</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Civil Engineering & Multi-Site Financial Operations Platform
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-[11px] text-slate-700 mt-2 shadow-sm font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Organisation Admin Portal</span>
          </div>
        </div>

        {/* Firebase Connectivity Notice */}
        {!isFirebaseActive && onOpenFirebaseConfig && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-bold">Firebase Not Connected</span>
                <p className="text-[11px] text-amber-800">Add credentials in .env.local or click to enter keys</p>
              </div>
            </div>
            <button
              onClick={onOpenFirebaseConfig}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold shrink-0 transition-colors"
            >
              Setup Firebase
            </button>
          </div>
        )}

        {isFirebaseActive && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 text-xs text-emerald-900 flex items-center justify-center space-x-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-bold">Connected to Firebase Cloud Firestore & Auth</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          
          {/* Mode Switcher */}
          <div className="flex border-b border-slate-200 pb-2">
            <button
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
                mode === 'login' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Admin Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-bold transition-colors ${
                mode === 'register' ? 'text-amber-700 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register Admin
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@yourcompany.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In as Admin' : 'Register Admin Account'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Setup Firebase button link */}
          {onOpenFirebaseConfig && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
              <button
                onClick={onOpenFirebaseConfig}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Configure Firebase Credentials</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] text-slate-500">
          All authenticated admins access the same organization database & financial records.
        </p>

      </div>
    </div>
  );
};

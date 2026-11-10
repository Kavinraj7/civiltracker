'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { AppUser } from '@/types';
import { X, UserPlus, AlertCircle, Shield, HardHat, Phone, Mail, User, Lock } from 'lucide-react';

interface NewUserModalProps {
  onClose: () => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({ onClose }) => {
  const { addAppUser, appUsers } = useData();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Owner' | 'Incharge'>('Incharge');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide user name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setError('Please specify a password with at least 6 characters for login access');
      return;
    }

    // Check if email already registered
    const exists = appUsers.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      setError('A member with this email already exists in the team list. If they cannot login, delete that member entry first and re-add them with their login password.');
      return;
    }

    try {
      setLoading(true);
      const userPayload: Omit<AppUser, 'id' | 'createdAt'> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
      };
      if (phone.trim()) {
        userPayload.phone = phone.trim();
      }

      await addAppUser(userPayload, password.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <UserPlus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Team Member</h2>
              <p className="text-xs text-slate-500">Create account credentials & assign role permissions</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="block text-slate-700 font-bold">Select Role *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('Incharge')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  role === 'Incharge'
                    ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <HardHat className="w-4 h-4 text-amber-600" />
                  <span>Incharge</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Site Supervisor. Can only see and manage projects assigned to them.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('Owner')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  role === 'Owner'
                    ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Owner (Admin)</span>
                </div>
                <p className="text-[10px] text-slate-500">
                  Full organization access. Sees all projects, vendors, finance & users.
                </p>
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar, Murugan K"
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Email Address (Login ID) *</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="incharge@civilcorp.com"
                required
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Used to login and securely map assigned projects to this incharge.
            </p>
          </div>

          {/* Password for Login */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Login Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. Civil@12345 (Min 6 characters)"
                required
                minLength={6}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-xs"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              The incharge will use this email & password to sign in on their mobile or computer.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'Creating...' : `Create ${role}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


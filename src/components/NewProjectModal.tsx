'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Project } from '@/types';
import { X, Building2, AlertCircle, HardHat, Ruler, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface NewProjectModalProps {
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ onClose }) => {
  const { addProject, allProjects, appUsers, currentUserRole } = useData();

  const [name, setName] = useState('');
  const [code, setCode] = useState(`PRJ-${String(allProjects.length + 1).padStart(2, '0')}`);
  const [location, setLocation] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'on_hold'>('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState('');
  const [notes, setNotes] = useState('');

  // Site Area (Square Feet or Ground)
  const [siteArea, setSiteArea] = useState('');
  const [siteAreaUnit, setSiteAreaUnit] = useState<'sq.ft' | 'ground'>('sq.ft');

  // Fixed Daily Wages per Day (₹)
  const [maesthriWage, setMaesthriWage] = useState('1200');
  const [gentsWage, setGentsWage] = useState('900');
  const [ladiesWage, setLadiesWage] = useState('700');

  // Assigned Incharge (Role based project visibility)
  const incharges = appUsers.filter((u) => u.role === 'Incharge');
  const [assignedInchargeId, setAssignedInchargeId] = useState(incharges[0]?.id || '');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide project name');
      return;
    }
    if (!location.trim()) {
      setError('Please provide project site location');
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      setError('Please provide client contact details (Name and Phone)');
      return;
    }

    try {
      setLoading(true);
      const prjData: Omit<Project, 'id' | 'createdAt'> = {
        name: name.trim(),
        code: code.trim(),
        location: location.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        budget: Number(budget) || 0,
        status,
        startDate,
      };

      if (clientAddress.trim()) prjData.clientAddress = clientAddress.trim();
      if (targetEndDate) prjData.targetEndDate = targetEndDate;
      if (notes.trim()) prjData.notes = notes.trim();

      // Site Area
      if (siteArea && Number(siteArea) > 0) {
        prjData.siteArea = Number(siteArea);
        prjData.siteAreaUnit = siteAreaUnit;
      }

      // Fixed daily labor wage rates
      if (maesthriWage) prjData.maesthriWage = Number(maesthriWage) || 0;
      if (gentsWage) prjData.gentsWage = Number(gentsWage) || 0;
      if (ladiesWage) prjData.ladiesWage = Number(ladiesWage) || 0;

      // Incharge assignment
      if (assignedInchargeId) {
        const found = appUsers.find((u) => u.id === assignedInchargeId);
        if (found) {
          prjData.assignedInchargeId = found.id;
          prjData.assignedInchargeName = found.name;
        }
      }

      await addProject(prjData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Building2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Construction Project</h2>
              <p className="text-xs text-slate-500">Site location, client contact details & contract budget</p>
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

          {/* Project Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Prestige Commercial Tower, Ring Road Flyover"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Project Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-amber-700 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Site Location & City *</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Outer Ring Road, Hebbal, Bengaluru, Karnataka"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Client Details Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
              Client Contact Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client / Company Name *</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Apex Infra Pvt Ltd / John Doe"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Phone Number *</label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="procurement@client.com"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Client Office Address</label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Office address, City"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Site Area & Incharge Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-amber-600" />
                <span>Site Area / Land Dimension</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={siteArea}
                  onChange={(e) => setSiteArea(e.target.value)}
                  placeholder="e.g. 2400 or 1.5"
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <select
                  value={siteAreaUnit}
                  onChange={(e) => setSiteAreaUnit(e.target.value as any)}
                  className="w-32 px-2.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                >
                  <option value="sq.ft">Sq. Feets</option>
                  <option value="ground">Ground</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
                <span>Assign Site Incharge</span>
              </label>
              <select
                value={assignedInchargeId}
                onChange={(e) => setAssignedInchargeId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- No Incharge Assigned (Unassigned) --</option>
                {incharges.map((inc) => (
                  <option key={inc.id} value={inc.id}>
                    {inc.name} ({inc.email})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                {incharges.length === 0
                  ? 'No in-charges created yet. Add in-charges in the Users tab.'
                  : 'Only this assigned incharge and the owner can view and manage this project.'}
              </p>
            </div>
          </div>

          {/* Fixed Daily Labor Wages per Day */}
          <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Fixed Daily Labor Wages (Site Baseline Rates)
              </span>
              <span className="text-[10px] text-amber-800 font-medium">₹ per day</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Set fixed daily rates for these 3 worker categories. They will be auto-loaded when adding daily wages on site.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Maesthri Rate (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={maesthriWage}
                  onChange={(e) => setMaesthriWage(e.target.value)}
                  placeholder="1200"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Gents Rate (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={gentsWage}
                  onChange={(e) => setGentsWage(e.target.value)}
                  placeholder="900"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Ladies Rate (₹) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={ladiesWage}
                  onChange={(e) => setLadiesWage(e.target.value)}
                  placeholder="700"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Budget, Status & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Total Contract Budget (₹)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 50000000"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {Number(budget) > 0 && (
                <div className="text-[10px] text-amber-700 font-mono mt-0.5 font-bold">
                  {formatCurrency(Number(budget))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Project Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="active">Active (Under Construction)</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Target End Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Target Completion Date</label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => setTargetEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Scope / Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="RCC structural work, foundation, PEB..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

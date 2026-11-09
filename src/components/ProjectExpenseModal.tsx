'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { X, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { ProjectExpense } from '@/types';

interface ProjectExpenseModalProps {
  initialProjectId?: string;
  onClose: () => void;
}

const EXPENSE_CATEGORIES: ProjectExpense['category'][] = [
  'Worker Wages / Labor',
  'Site Fuel & Diesel',
  'Equipment & Machinery Hire',
  'Site Petty Cash & Sundries',
  'Transport & Freight',
  'Permits, Testing & Approvals',
  'Safety & Site Utilities',
  'Subcontractor / Masonry',
  'Other Direct Expense',
];

export const ProjectExpenseModal: React.FC<ProjectExpenseModalProps> = ({
  initialProjectId,
  onClose,
}) => {
  const { projects, addProjectExpense } = useData();

  const [projectId, setProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [category, setCategory] = useState<ProjectExpense['category']>('Worker Wages / Labor');
  const [amount, setAmount] = useState<string>('');
  const [paidTo, setPaidTo] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [voucherNo, setVoucherNo] = useState<string>('VOUCH-' + Math.floor(100 + Math.random() * 900));
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Please select a project');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }
    if (!paidTo.trim()) {
      setError('Please specify who received this payment (Worker name, Gang Head, Driver, etc.)');
      return;
    }

    try {
      setLoading(true);
      const expPayload: any = {
        projectId,
        category,
        amount: numAmount,
        paidTo: paidTo.trim(),
        date,
        paymentMode,
      };
      if (voucherNo.trim()) expPayload.voucherNo = voucherNo.trim();
      if (notes.trim()) expPayload.notes = notes.trim();

      await addProjectExpense(expPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record project expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Site Expense / Wages</h2>
              <p className="text-xs text-slate-500">Worker wages, equipment fuel & site petty cash spendings</p>
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

          {/* Project & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Choose Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Paid To */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Paid To (Worker / Gang Leader / Recipient) *
            </label>
            <input
              type="text"
              value={paidTo}
              onChange={(e) => setPaidTo(e.target.value)}
              placeholder="e.g. Mukadam Ram Singh & 12 Masons, Fuel Station, Crane Operator"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Expense Amount (₹) *</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 75000"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-amber-700 font-mono font-bold text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              {Number(amount) > 0 && (
                <div className="text-[10px] text-amber-700 font-mono mt-1 font-bold">
                  Preview: {formatCurrency(Number(amount))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Payment Mode & Voucher No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Voucher / Slip No.</label>
              <input
                type="text"
                value={voucherNo}
                onChange={(e) => setVoucherNo(e.target.value)}
                placeholder="VOUCH-101"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Notes / Work Scope</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 5 days excavation overtime wages, 200 Litres diesel for DG set"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
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
              {loading ? 'Recording...' : 'Add Expense'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

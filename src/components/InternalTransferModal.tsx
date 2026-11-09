'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { X, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InternalTransferModalProps {
  initialFromProjectId?: string;
  onClose: () => void;
}

export const InternalTransferModal: React.FC<InternalTransferModalProps> = ({
  initialFromProjectId,
  onClose,
}) => {
  const { projects, addInternalTransaction } = useData();

  const [fromProjectId, setFromProjectId] = useState<string>(initialFromProjectId || projects[0]?.id || '');
  const [toProjectId, setToProjectId] = useState<string>(
    projects.find((p) => p.id !== (initialFromProjectId || projects[0]?.id))?.id || ''
  );
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [referenceNo, setReferenceNo] = useState<string>('INT-TRF-' + Math.floor(1000 + Math.random() * 9000));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromProjectId) {
      setError('Please select the source project (From)');
      return;
    }
    if (!toProjectId) {
      setError('Please select the destination project (To)');
      return;
    }
    if (fromProjectId === toProjectId) {
      setError('Source and Destination project cannot be the same project!');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0');
      return;
    }
    if (!reason.trim()) {
      setError('Please specify a transfer reason or purpose (e.g. Steel booking advance)');
      return;
    }

    try {
      setLoading(true);
      const itxPayload: any = {
        fromProjectId,
        toProjectId,
        amount: numAmount,
        date,
        reason: reason.trim(),
      };
      if (referenceNo.trim()) itxPayload.referenceNo = referenceNo.trim();

      await addInternalTransaction(itxPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record internal transfer');
    } finally {
      setLoading(false);
    }
  };

  const fromProject = projects.find((p) => p.id === fromProjectId);
  const toProject = projects.find((p) => p.id === toProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
              <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Internal Project Transfer</h2>
              <p className="text-xs text-slate-500">Move funds from one project cash pool to another</p>
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

          {/* From Project & To Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                From Project (Source Site) *
              </label>
              <select
                value={fromProjectId}
                onChange={(e) => setFromProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Source Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                To Project (Destination Site) *
              </label>
              <select
                value={toProjectId}
                onChange={(e) => setToProjectId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select Destination Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.id === fromProjectId}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Transfer Amount (₹) *
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 500000"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {Number(amount) > 0 && (
                <div className="text-[10px] text-purple-700 font-mono mt-1 font-bold">
                  Preview: {formatCurrency(Number(amount))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Transfer Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Purpose / Reason for Transfer *
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Bulk rebar booking cash advance, emergency site dewatering"
              required
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Internal Reference ID</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Visual confirmation box */}
          {fromProject && toProject && fromProjectId !== toProjectId && (
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-slate-700 space-y-1.5">
              <div className="font-bold text-purple-900 text-xs">Separate KPI Impact Preview:</div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-rose-700">-{fromProject.name} (Outflow)</span>
                <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
                <span className="text-emerald-800">+{toProject.name} (Inflow)</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-purple-100">
                This transaction reallocates site cash pools. It does not affect company revenue or expenses.
              </div>
            </div>
          )}

          {/* Submit */}
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
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Confirm Transfer'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

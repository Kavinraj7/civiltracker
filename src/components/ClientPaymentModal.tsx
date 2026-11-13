'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { X, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ClientPaymentModalProps {
  initialProjectId?: string;
  onClose: () => void;
}

export const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  initialProjectId,
  onClose,
}) => {
  const { projects, addClientPayment } = useData();

  const [projectId, setProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<
    'Bank Transfer (NEFT/RTGS)' | 'UPI' | 'Cheque' | 'Cash' | 'Demand Draft'
  >('Bank Transfer (NEFT/RTGS)');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
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
      setError('Please enter a valid received payment amount');
      return;
    }

    try {
      setLoading(true);
      const payPayload: any = {
        projectId,
        amount: numAmount,
        date,
        paymentMode,
        referenceNo: referenceNo.trim() || 'REF-' + Date.now().toString().slice(-6),
      };
      if (invoiceNo.trim()) payPayload.invoiceNo = invoiceNo.trim();
      if (notes.trim()) payPayload.notes = notes.trim();

      await addClientPayment(payPayload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const selectedProj = projects.find((p) => p.id === projectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[96vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Client Payment (Income)</h2>
              <p className="text-xs text-slate-500">Funds received from project client</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Project & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Choose Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code}) — Client: {p.clientName}
                  </option>
                ))}
              </select>
              {selectedProj && (
                <div className="mt-1 text-[11px] text-slate-500">
                  Client: <strong className="text-slate-800">{selectedProj.clientName}</strong> ({selectedProj.clientPhone})
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
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
              />
            </div>
          </div>

          {/* Row 2: Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Amount Received (₹) *</label>
              <input
                type="number"
                min="1"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 1500000"
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-emerald-700 font-mono font-bold text-xs focus:outline-none focus:border-emerald-500 shadow-sm"
              />
              {Number(amount) > 0 && (
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5 font-bold">
                  Preview: {formatCurrency(Number(amount))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Payment Method *</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
              >
                <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="Cheque">Cheque</option>
                <option value="Demand Draft">Demand Draft</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
          </div>

          {/* Row 3: Reference & Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Transaction Ref / Cheque No.</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. UTR / CHQ-104928"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">RA Bill / Invoice No.</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. RA-01, MOB-ADV"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">Description / Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 2nd slab casting milestone release"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
            />
          </div>

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
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

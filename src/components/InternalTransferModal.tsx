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
  const { 
    projects, 
    addInternalTransaction,
    clientPayments,
    vendorTransactions,
    dailyWages,
    projectExpenses,
    internalTransactions
  } = useData();

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

  // Insufficient project balance alert popup state
  const [insufficientBalancePopup, setInsufficientBalancePopup] = useState<{
    isOpen: boolean;
    sourceProjectName: string;
    availableBalance: number;
    requestedAmount: number;
  } | null>(null);

  // Helper to compute available balance for any project:
  // Available Balance = (Client Income + Transfers In - Transfers Out) - Total Spent (Vendor Paid + Wages Paid + Direct Expenses Paid)
  const getProjectBalance = (projId: string): number => {
    if (!projId) return 0;
    const payments = clientPayments.filter((cp) => cp.projectId === projId);
    const vTransactions = vendorTransactions.filter((vt) => vt.projectId === projId);
    const wages = dailyWages.filter((dw) => dw.projectId === projId);
    const expenses = projectExpenses.filter((pe) => pe.projectId === projId);
    const transfersIn = internalTransactions.filter((it) => it.toProjectId === projId);
    const transfersOut = internalTransactions.filter((it) => it.fromProjectId === projId);

    const totalIncome = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const sumTransfersIn = transfersIn.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const sumTransfersOut = transfersOut.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const totalVendorPaid = vTransactions.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
    const totalWagesPaid = wages
      .filter((w) => w.status === 'paid')
      .reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);
    const totalExpensesPaid = expenses
      .filter((e) => e.status === 'paid')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const totalSpent = totalVendorPaid + totalWagesPaid + totalExpensesPaid;
    const netInternal = sumTransfersIn - sumTransfersOut;
    const totalFunds = totalIncome + netInternal;

    return totalFunds - totalSpent;
  };

  const fromProject = projects.find((p) => p.id === fromProjectId);
  const toProject = projects.find((p) => p.id === toProjectId);
  const fromProjectBalance = fromProjectId ? getProjectBalance(fromProjectId) : 0;

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

    // Validation: Source project must have sufficient balance
    const currentBalance = getProjectBalance(fromProjectId);
    if (numAmount > currentBalance) {
      setInsufficientBalancePopup({
        isOpen: true,
        sourceProjectName: fromProject?.name || 'Selected Project',
        availableBalance: currentBalance,
        requestedAmount: numAmount,
      });
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

              {fromProjectId && (
                <div className="mt-1 text-[11px] flex items-center justify-between font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <span className="text-slate-500">Available Balance:</span>
                  <span className={`font-mono font-bold ${fromProjectBalance > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCurrency(fromProjectBalance)}
                  </span>
                </div>
              )}
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

      {/* Insufficient Project Balance Alert Popup Modal */}
      {insufficientBalancePopup?.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white border border-rose-200 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-900 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0">
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Transfer Cannot Be Processed</h3>
                <p className="text-xs text-rose-600 font-bold mt-0.5">
                  The project balance is not Enough for the transaction to process.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Source Project:</span>
                <span className="font-bold text-slate-800">{insufficientBalancePopup.sourceProjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Available Project Balance:</span>
                <span className={`font-mono font-bold ${insufficientBalancePopup.availableBalance > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(insufficientBalancePopup.availableBalance)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 font-medium">Requested Transfer Amount:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrency(insufficientBalancePopup.requestedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-rose-700 font-medium pt-1">
                <span>Shortfall:</span>
                <span className="font-mono font-bold">
                  {formatCurrency(insufficientBalancePopup.requestedAmount - insufficientBalancePopup.availableBalance)}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Please enter an amount within the source project&apos;s available balance or credit funds before transferring.
            </p>

            <button
              type="button"
              onClick={() => setInsufficientBalancePopup(null)}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

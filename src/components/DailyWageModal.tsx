'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/dataContext';
import { DailyWageEntry, ExtraWorkerWage } from '@/types';
import { 
  X, 
  Users, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard,
  Building2,
  BadgeIndianRupee
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface DailyWageModalProps {
  initialProjectId?: string;
  onClose: () => void;
}

interface ExtraWorkerRow {
  id: string;
  nameOrRole: string;
  count: string;
  ratePerDay: string;
  category: 'Contractor' | 'Daily Wage';
}

export const DailyWageModal: React.FC<DailyWageModalProps> = ({
  initialProjectId,
  onClose,
}) => {
  const { projects, addDailyWageEntry } = useData();

  const [projectId, setProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Selected project reference to fetch fixed wage rates
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === projectId);
  }, [projects, projectId]);

  // Standard workers: Contractor (placed first), Maesthri, Gents, Ladies
  const [contractorCount, setContractorCount] = useState<string>('0');
  const [contractorRate, setContractorRate] = useState<string>(
    selectedProject?.contractorWage ? selectedProject.contractorWage.toString() : '1500'
  );

  const [maesthriCount, setMaesthriCount] = useState<string>('1');
  const [maesthriRate, setMaesthriRate] = useState<string>(
    selectedProject?.maesthriWage ? selectedProject.maesthriWage.toString() : '1200'
  );

  const [gentsCount, setGentsCount] = useState<string>('4');
  const [gentsRate, setGentsRate] = useState<string>(
    selectedProject?.gentsWage ? selectedProject.gentsWage.toString() : '900'
  );

  const [ladiesCount, setLadiesCount] = useState<string>('3');
  const [ladiesRate, setLadiesRate] = useState<string>(
    selectedProject?.ladiesWage ? selectedProject.ladiesWage.toString() : '700'
  );

  // Extra custom persons/roles - by default 1 row visible
  const [extraWorkers, setExtraWorkers] = useState<ExtraWorkerRow[]>([
    {
      id: 'extra-1',
      nameOrRole: '',
      count: '1',
      ratePerDay: '1000',
      category: 'Daily Wage',
    },
  ]);

  // Status & payment details
  const [status, setStatus] = useState<'paid' | 'pending'>('pending');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque'>('Cash');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update rates when project changes
  const handleProjectChange = (newProjId: string) => {
    setProjectId(newProjId);
    const p = projects.find((proj) => proj.id === newProjId);
    if (p) {
      if (p.contractorWage) setContractorRate(p.contractorWage.toString());
      if (p.maesthriWage) setMaesthriRate(p.maesthriWage.toString());
      if (p.gentsWage) setGentsRate(p.gentsWage.toString());
      if (p.ladiesWage) setLadiesRate(p.ladiesWage.toString());
    }
  };

  // Add extra worker row
  const handleAddExtraWorker = () => {
    setExtraWorkers((prev) => [
      ...prev,
      {
        id: 'extra-' + Date.now(),
        nameOrRole: '',
        count: '1',
        ratePerDay: '1000',
        category: 'Daily Wage',
      },
    ]);
  };

  const handleUpdateExtraWorker = (id: string, field: keyof ExtraWorkerRow, value: any) => {
    setExtraWorkers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveExtraWorker = (id: string) => {
    setExtraWorkers((prev) => prev.filter((item) => item.id !== id));
  };

  // Totals calculations
  const contractorTotal = (Number(contractorCount) || 0) * (Number(contractorRate) || 0);
  const maesthriTotal = (Number(maesthriCount) || 0) * (Number(maesthriRate) || 0);
  const gentsTotal = (Number(gentsCount) || 0) * (Number(gentsRate) || 0);
  const ladiesTotal = (Number(ladiesCount) || 0) * (Number(ladiesRate) || 0);

  const extraWorkersTotal = useMemo(() => {
    return extraWorkers.reduce((sum, it) => {
      if (!it.nameOrRole.trim()) return sum;
      const c = Number(it.count) || 0;
      const r = Number(it.ratePerDay) || 0;
      return sum + c * r;
    }, 0);
  }, [extraWorkers]);

  const grandTotal = contractorTotal + maesthriTotal + gentsTotal + ladiesTotal + extraWorkersTotal;

  const totalHeadcount = 
    (Number(contractorCount) || 0) +
    (Number(maesthriCount) || 0) + 
    (Number(gentsCount) || 0) + 
    (Number(ladiesCount) || 0) +
    extraWorkers.reduce((sum, it) => (it.nameOrRole.trim() ? sum + (Number(it.count) || 0) : sum), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError('Please select a project site');
      return;
    }

    if (grandTotal <= 0) {
      setError('Total wages bill amount must be greater than 0');
      return;
    }

    // Format extra workers
    const structuredExtra: ExtraWorkerWage[] = [];
    for (const it of extraWorkers) {
      if (it.nameOrRole.trim()) {
        const count = Number(it.count) || 0;
        const ratePerDay = Number(it.ratePerDay) || 0;
        structuredExtra.push({
          id: it.id,
          nameOrRole: it.nameOrRole.trim(),
          count,
          ratePerDay,
          total: count * ratePerDay,
          category: it.category || 'Daily Wage',
        });
      }
    }

    try {
      setLoading(true);
      const payload: Omit<DailyWageEntry, 'id' | 'createdAt'> = {
        projectId,
        date,
        contractorCount: Number(contractorCount) || 0,
        contractorRate: Number(contractorRate) || 0,
        contractorTotal,
        maesthriCount: Number(maesthriCount) || 0,
        maesthriRate: Number(maesthriRate) || 0,
        maesthriTotal,
        gentsCount: Number(gentsCount) || 0,
        gentsRate: Number(gentsRate) || 0,
        gentsTotal,
        ladiesCount: Number(ladiesCount) || 0,
        ladiesRate: Number(ladiesRate) || 0,
        ladiesTotal,
        extraWorkers: structuredExtra,
        extraWorkersTotal,
        totalAmount: grandTotal,
        status,
        paymentMode: status === 'paid' ? paymentMode : undefined,
        paidDate: status === 'paid' ? date : undefined,
      };

      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      await addDailyWageEntry(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record daily wages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[96vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Daily Worker Wages (Site Attendance Bill)</h2>
              <p className="text-xs text-slate-500">Record daily headcount of Contractor, Maesthri, Gents, Ladies & extra staff</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Project & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Project Site Location *</label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 text-xs shadow-sm"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Work Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 font-mono text-xs shadow-sm"
              />
            </div>
          </div>

          {/* Standard Workers: 4 Columns Horizontal Grid */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-600" />
                Standard Worker Attendance & Wage Rates
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Headcount × Rate = Subtotal
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. Contractor */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Contractor</span>
                  <span className="font-mono font-bold text-xs text-amber-700">{formatCurrency(contractorTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Count</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={contractorCount}
                      onChange={(e) => setContractorCount(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">₹/Day</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={contractorRate}
                      onChange={(e) => setContractorRate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Maesthri */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Maesthri (Mason)</span>
                  <span className="font-mono font-bold text-xs text-amber-700">{formatCurrency(maesthriTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Count</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={maesthriCount}
                      onChange={(e) => setMaesthriCount(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">₹/Day</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={maesthriRate}
                      onChange={(e) => setMaesthriRate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Gents */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Gents (Male)</span>
                  <span className="font-mono font-bold text-xs text-amber-700">{formatCurrency(gentsTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Count</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={gentsCount}
                      onChange={(e) => setGentsCount(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">₹/Day</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={gentsRate}
                      onChange={(e) => setGentsRate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Ladies */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">Ladies (Female)</span>
                  <span className="font-mono font-bold text-xs text-amber-700">{formatCurrency(ladiesTotal)}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">Count</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ladiesCount}
                      onChange={(e) => setLadiesCount(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono font-bold text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-medium mb-0.5">₹/Day</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={ladiesRate}
                      onChange={(e) => setLadiesRate(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-mono text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Persons / Special Role Wages */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Extra Person / Specialized Wages
                </span>
                <p className="text-[10px] text-slate-500">Add Electrician, Carpenter, Bar Bender, JCB Driver, etc. with category.</p>
              </div>

              <button
                type="button"
                onClick={handleAddExtraWorker}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 border border-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Extra Row</span>
              </button>
            </div>

            {/* Always visible by default (default 1 row) */}
            <div className="space-y-2 pt-1">
              {extraWorkers.map((it, idx) => {
                const lineTotal = (Number(it.count) || 0) * (Number(it.ratePerDay) || 0);
                return (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {/* Category Selector: Contractor (Or) Daily Wage */}
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Category</label>
                      <select
                        value={it.category}
                        onChange={(e) => handleUpdateExtraWorker(it.id, 'category', e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Daily Wage">Daily Wage</option>
                        <option value="Contractor">Contractor</option>
                      </select>
                    </div>

                    {/* Person / Role */}
                    <div className="col-span-12 sm:col-span-3">
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5 sm:hidden">Person / Role</label>
                      <input
                        type="text"
                        placeholder="e.g. Electrician, JCB Driver"
                        value={it.nameOrRole}
                        onChange={(e) => handleUpdateExtraWorker(it.id, 'nameOrRole', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Count */}
                    <div className="col-span-6 sm:col-span-2 flex items-center">
                      <span className="text-[10px] text-slate-400 mr-1">Count:</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.count}
                        onChange={(e) => handleUpdateExtraWorker(it.id, 'count', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Rate */}
                    <div className="col-span-6 sm:col-span-2 flex items-center">
                      <span className="text-[10px] text-slate-400 mr-1">₹/Day:</span>
                      <input
                        type="number"
                        min="0"
                        value={it.ratePerDay}
                        onChange={(e) => handleUpdateExtraWorker(it.id, 'ratePerDay', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Total & Trash */}
                    <div className="col-span-12 sm:col-span-2 flex items-center justify-between pl-1">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {formatCurrency(lineTotal)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraWorker(it.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Grid: Payment Status & Summary Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Left 7 cols: Payment Status & Notes */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Status For This Day *</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStatus('pending')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      status === 'pending'
                        ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Pending Payment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('paid')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      status === 'paid'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Paid Today</span>
                  </button>
                </div>
              </div>

              {/* Payment Mode (if Paid) */}
              {status === 'paid' && (
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Disbursement Mode *</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-amber-500 text-xs shadow-sm"
                  >
                    <option value="Cash">Cash (Petty cash payout to mukadam)</option>
                    <option value="UPI">UPI (Google Pay / PhonePe to Maesthri)</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Attendance Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Slab work overtime, Gang head Munusamy"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 text-xs shadow-sm"
                />
              </div>
            </div>

            {/* Right 5 cols: Calculation Summary Card */}
            <div className="lg:col-span-5 bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
              <div className="space-y-1.5">
                <span className="text-xs uppercase font-bold text-amber-900 flex items-center gap-1.5">
                  <BadgeIndianRupee className="w-4 h-4 text-amber-700" />
                  Day Attendance Summary
                </span>
                <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                  <span>Total Site Headcount:</span>
                  <span className="font-bold text-slate-900">{totalHeadcount} workers</span>
                </div>
                <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-amber-200/60">
                  <div className="flex justify-between">
                    <span>Standard Crew ({Number(contractorCount) + Number(maesthriCount) + Number(gentsCount) + Number(ladiesCount)}):</span>
                    <span className="font-mono text-slate-700">{formatCurrency(contractorTotal + maesthriTotal + gentsTotal + ladiesTotal)}</span>
                  </div>
                  {extraWorkersTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Extra Persons:</span>
                      <span className="font-mono text-slate-700">{formatCurrency(extraWorkersTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Total Wage Bill:</span>
                <span className="text-xl font-mono font-bold text-amber-800">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
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
              {loading ? 'Generating Bill...' : `Save Wage Bill (${formatCurrency(grandTotal)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


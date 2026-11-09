'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { 
  ReceiptText, 
  Search
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export const TransactionsLedgerView: React.FC = () => {
  const { 
    projects, 
    vendors, 
    clientPayments, 
    vendorTransactions, 
    projectExpenses, 
    internalTransactions 
  } = useData();

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'vendor' | 'wages' | 'internal'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  type LedgerItem = {
    id: string;
    date: string;
    type: 'Income (Client)' | 'Vendor Bill / Material' | 'Site Expense / Wages' | 'Internal Transfer';
    projectId?: string;
    party: string;
    description: string;
    amount: number;
    subAmount?: number;
    status?: string;
    reference?: string;
  };

  const unifiedList: LedgerItem[] = [
    ...clientPayments.map((cp) => ({
      id: cp.id,
      date: cp.date,
      type: 'Income (Client)' as const,
      projectId: cp.projectId,
      party: projects.find((p) => p.id === cp.projectId)?.clientName || 'Client',
      description: cp.notes || `Client Payment received via ${cp.paymentMode}`,
      amount: cp.amount,
      reference: cp.referenceNo || cp.invoiceNo,
    })),
    ...vendorTransactions.map((vt) => {
      const v = vendors.find((vend) => vend.id === vt.vendorId);
      return {
        id: vt.id,
        date: vt.date,
        type: 'Vendor Bill / Material' as const,
        projectId: vt.projectId,
        party: v?.name || 'Vendor',
        description: `${vt.material} (${vt.quantity} ${vt.unit})`,
        amount: vt.paidAmount,
        subAmount: vt.pendingAmount,
        status: vt.paymentStatus,
        reference: vt.billNumber,
      };
    }),
    ...projectExpenses.map((pe) => ({
      id: pe.id,
      date: pe.date,
      type: 'Site Expense / Wages' as const,
      projectId: pe.projectId,
      party: pe.paidTo,
      description: `${pe.category}: ${pe.notes || ''}`,
      amount: pe.amount,
      reference: pe.voucherNo,
    })),
    ...internalTransactions.map((it) => {
      const fromP = projects.find((p) => p.id === it.fromProjectId);
      const toP = projects.find((p) => p.id === it.toProjectId);
      return {
        id: it.id,
        date: it.date,
        type: 'Internal Transfer' as const,
        projectId: it.toProjectId,
        party: `${fromP?.code || 'Site'} ➔ ${toP?.code || 'Site'}`,
        description: it.reason,
        amount: it.amount,
        reference: it.referenceNo,
      };
    }),
  ];

  unifiedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredList = unifiedList.filter((item) => {
    if (typeFilter === 'income' && item.type !== 'Income (Client)') return false;
    if (typeFilter === 'vendor' && item.type !== 'Vendor Bill / Material') return false;
    if (typeFilter === 'wages' && item.type !== 'Site Expense / Wages') return false;
    if (typeFilter === 'internal' && item.type !== 'Internal Transfer') return false;

    if (projectFilter !== 'all' && item.projectId !== projectFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchParty = item.party.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchRef = item.reference?.toLowerCase().includes(q) || false;
      if (!matchParty && !matchDesc && !matchRef) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-amber-600" />
            Financial Audit Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Complete transaction register of client income, vendor payables, worker wages, and internal transfers.
          </p>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ledger by party, material, notes, or reference number..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        {/* Project Dropdown */}
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 shadow-sm"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>

        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Types' },
            { id: 'income', label: 'Income' },
            { id: 'vendor', label: 'Vendor Bills' },
            { id: 'wages', label: 'Wages/Exp' },
            { id: 'internal', label: 'Internal' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                typeFilter === t.id
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category / Type</th>
              <th className="py-3 px-4">Project</th>
              <th className="py-3 px-4">Party / Recipient</th>
              <th className="py-3 px-4">Details / Description</th>
              <th className="py-3 px-4 text-right">Amount (₹)</th>
              <th className="py-3 px-4">Ref ID</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredList.map((item) => {
              const proj = projects.find((p) => p.id === item.projectId);

              let badgeStyle = 'bg-slate-100 text-slate-700 border border-slate-200';
              let amountStyle = 'text-slate-900 font-bold';

              if (item.type === 'Income (Client)') {
                badgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                amountStyle = 'text-emerald-700 font-bold';
              } else if (item.type === 'Vendor Bill / Material') {
                badgeStyle = 'bg-blue-50 text-blue-800 border border-blue-200';
                amountStyle = 'text-blue-700 font-bold';
              } else if (item.type === 'Site Expense / Wages') {
                badgeStyle = 'bg-amber-50 text-amber-900 border border-amber-200';
                amountStyle = 'text-amber-800 font-bold';
              } else if (item.type === 'Internal Transfer') {
                badgeStyle = 'bg-purple-50 text-purple-800 border border-purple-200';
                amountStyle = 'text-purple-700 font-bold';
              }

              return (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                    {formatDate(item.date)}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeStyle}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{proj?.name || 'Multiple'}</span>
                    {proj && <div className="text-[10px] font-mono text-slate-500">{proj.code}</div>}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.party}</td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm">
                    <div>{item.description}</div>
                    {item.subAmount !== undefined && item.subAmount > 0 && (
                      <div className="text-[10px] text-rose-600 font-mono font-bold mt-0.5">
                        Due: {formatCurrency(item.subAmount)}
                      </div>
                    )}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono text-sm ${amountStyle}`}>
                    {item.type === 'Income (Client)' ? '+' : item.type === 'Internal Transfer' ? '⇄ ' : '-'}
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {item.reference || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredList.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No transactions match the selected criteria.
          </div>
        )}
      </div>

    </div>
  );
};

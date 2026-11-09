'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Trash2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface InternalTransactionsViewProps {
  onOpenInternalTransfer: () => void;
}

export const InternalTransactionsView: React.FC<InternalTransactionsViewProps> = ({
  onOpenInternalTransfer,
}) => {
  const { 
    projects, 
    internalTransactions, 
    deleteInternalTransaction, 
    totalInternalTransfersVolume 
  } = useData();

  const [search, setSearch] = useState('');

  const filteredTransfers = internalTransactions.filter((tx) => {
    const fromP = projects.find((p) => p.id === tx.fromProjectId)?.name.toLowerCase() || '';
    const toP = projects.find((p) => p.id === tx.toProjectId)?.name.toLowerCase() || '';
    const reason = tx.reason.toLowerCase();
    const q = search.toLowerCase();
    return fromP.includes(q) || toP.includes(q) || reason.includes(q);
  });

  // Calculate project-wise internal KPI matrix
  const projectMatrix = projects.map((p) => {
    const transferredIn = internalTransactions
      .filter((it) => it.toProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const transferredOut = internalTransactions
      .filter((it) => it.fromProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const netImpact = transferredIn - transferredOut;

    return {
      project: p,
      transferredIn,
      transferredOut,
      netImpact,
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-purple-600" />
            Internal Project Transfers
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track inter-project fund movements and cash reallocation across construction sites.
          </p>
        </div>

        <button
          onClick={onOpenInternalTransfer}
          className="flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Internal Transfer</span>
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400">Total Inter-Project Volume</span>
          <div className="text-2xl font-bold text-purple-700 font-mono mt-1">
            {formatCurrency(totalInternalTransfersVolume)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{internalTransactions.length} transfer records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400">Financial Neutrality</span>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>₹0 Company P&L Impact</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Internal transfers shift liquidity between projects without changing overall company profit.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400">Projects Involved</span>
          <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
            {projects.length} Sites
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Tracked as a distinct KPI on every project</p>
        </div>
      </div>

      {/* Project-Wise Internal Transfer KPI Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">Project-Wise Internal Transfer KPI Breakdown</h2>
          <p className="text-xs text-slate-500">Independent KPI metric tracking net inter-site liquidity</p>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Project Name & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Transferred In (+)</th>
                <th className="py-3 px-4 text-right">Transferred Out (-)</th>
                <th className="py-3 px-4 text-right">Net Internal KPI Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectMatrix.map(({ project: p, transferredIn, transferredOut, netImpact }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{p.name}</span>
                    <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {p.code}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{p.location}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    {transferredIn > 0 ? `+${formatCurrency(transferredIn)}` : '₹0'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                    {transferredOut > 0 ? `-${formatCurrency(transferredOut)}` : '₹0'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    <span className={`px-2 py-0.5 rounded ${
                      netImpact > 0
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : netImpact < 0
                        ? 'bg-purple-50 text-purple-800 border border-purple-200'
                        : 'text-slate-500'
                    }`}>
                      {netImpact > 0 ? `+${formatCurrency(netImpact)}` : formatCurrency(netImpact)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Transfer Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Transfer Audit Log</h3>
            <p className="text-xs text-slate-500">Chronological history of all internal money transfers</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transfers..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-purple-500 shadow-sm"
            />
          </div>
        </div>

        {filteredTransfers.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
            No internal transfers match your search.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Source Site (From)</th>
                  <th className="py-2.5 px-1"></th>
                  <th className="py-2.5 px-3">Destination Site (To)</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Reason / Purpose</th>
                  <th className="py-2.5 px-3">Ref ID</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransfers.map((tx) => {
                  const fromP = projects.find((p) => p.id === tx.fromProjectId);
                  const toP = projects.find((p) => p.id === tx.toProjectId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{formatDate(tx.date)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-rose-700">{fromP?.name || 'Project'}</span>
                        <div className="text-[10px] font-mono text-slate-400">{fromP?.code}</div>
                      </td>
                      <td className="py-2.5 px-1 text-purple-600">
                        <ArrowRight className="w-4 h-4" />
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-emerald-800">{toP?.name || 'Project'}</span>
                        <div className="text-[10px] font-mono text-slate-400">{toP?.code}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs">{tx.reason}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">{tx.referenceNo || '-'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => deleteInternalTransaction(tx.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Delete transfer record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

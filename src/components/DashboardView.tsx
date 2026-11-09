'use client';

import React from 'react';
import { useData } from '@/lib/dataContext';
import { 
  Building2, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowLeftRight, 
  DollarSign, 
  Plus, 
  ArrowUpRight,
  MapPin, 
  Phone,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/utils';
import { Project } from '@/types';

interface DashboardViewProps {
  onOpenNewProject: () => void;
  onOpenClientPayment: (projectId?: string) => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
  onOpenProjectExpense: (projectId?: string) => void;
  onOpenInternalTransfer: () => void;
  onSelectProject: (project: Project) => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewProject,
  onOpenClientPayment,
  onOpenVendorTransaction,
  onOpenProjectExpense,
  onOpenInternalTransfer,
  onSelectProject,
  setActiveTab,
}) => {
  const {
    projects,
    clientPayments,
    vendorTransactions,
    projectExpenses,
    internalTransactions,
    totalClientIncome,
    totalVendorPaid,
    totalVendorBilled,
    totalVendorPending,
    totalDirectExpenses,
    totalExpenses,
    netCashFlow,
    totalInternalTransfersVolume,
  } = useData();

  // Calculate per-project KPI details
  const projectStats = projects.map((p) => {
    const income = clientPayments
      .filter((cp) => cp.projectId === p.id)
      .reduce((sum, cp) => sum + (Number(cp.amount) || 0), 0);

    const vendorPaid = vendorTransactions
      .filter((v) => v.projectId === p.id)
      .reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);

    const vendorPending = vendorTransactions
      .filter((v) => v.projectId === p.id)
      .reduce((sum, v) => sum + (Number(v.pendingAmount) || 0), 0);

    const directExp = projectExpenses
      .filter((pe) => pe.projectId === p.id)
      .reduce((sum, pe) => sum + (Number(pe.amount) || 0), 0);

    // Internal Transfers KPI
    const transfersIn = internalTransactions
      .filter((it) => it.toProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const transfersOut = internalTransactions
      .filter((it) => it.fromProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const netInternal = transfersIn - transfersOut;

    // Total spent on this project = Direct (wages/fuel) + Vendor Paid
    const totalProjectSpent = directExp + vendorPaid;

    // Project Available Cash Balance = Client Income - Total Spent + Net Internal Transfers
    const cashBalance = income - totalProjectSpent + netInternal;

    return {
      project: p,
      income,
      vendorPaid,
      vendorPending,
      directExp,
      transfersIn,
      transfersOut,
      netInternal,
      totalProjectSpent,
      cashBalance,
    };
  });

  return (
    <div className="space-y-8">
      
      {/* Top Banner & Quick Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organisation Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial status across <strong className="text-amber-700">{projects.length} sites</strong>, vendor materials, worker wages & internal transfers.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenClientPayment()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+ Client Payment</span>
          </button>

          <button
            onClick={() => onOpenVendorTransaction()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ Vendor Bill</span>
          </button>

          <button
            onClick={() => onOpenProjectExpense()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Wages / Expense</span>
          </button>

          <button
            onClick={onOpenInternalTransfer}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Internal Transfer</span>
          </button>

          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Row (Light Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: Client Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Received (Client)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCompactNumber(totalClientIncome)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{clientPayments.length} receipts</span>
              <span className="font-mono text-emerald-700 font-bold">{formatCurrency(totalClientIncome)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Sent to Vendors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Paid to Vendors</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCompactNumber(totalVendorPaid)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Billed: {formatCompactNumber(totalVendorBilled)}</span>
              {totalVendorPending > 0 ? (
                <span className="text-rose-600 font-bold">Due: {formatCompactNumber(totalVendorPending)}</span>
              ) : (
                <span className="text-emerald-600 font-semibold">Settled</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3: Total Expenses (Wages + Vendors) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Overall Expenses</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCompactNumber(totalExpenses)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>Wages/Fuel: {formatCompactNumber(totalDirectExpenses)}</span>
              <span>Vendors: {formatCompactNumber(totalVendorPaid)}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Internal Transfers & Net Cash Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Internal Transfers KPI</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {formatCompactNumber(totalInternalTransfersVolume)}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
              <span>{internalTransactions.length} inter-site transfers</span>
              <span className={`font-bold ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                Surplus: {formatCompactNumber(netCashFlow)}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Internal Transfers Highlight Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border border-purple-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Internal Project Fund Transfers
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold border border-purple-200">
                Site-to-Site Movements
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Reallocate liquidity between construction projects without affecting organisation revenue/loss. Tracked as an independent KPI for each project.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenInternalTransfer}
          className="shrink-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* Project Financial Overview Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Construction Sites Overview</h2>
            <p className="text-xs text-slate-500">Click any project to inspect client receipts, material deliveries & worker wages</p>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {projectStats.map(({ project: p, income, vendorPaid, vendorPending, directExp, transfersIn, transfersOut, netInternal, cashBalance }) => (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {p.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Location & Client Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-600 truncate">Client: <strong className="text-slate-800">{p.clientName}</strong></span>
                    <span className="text-[11px] text-slate-500 font-mono">{p.clientPhone}</span>
                  </div>
                </div>

                {/* Key Financial KPIs Grid */}
                <div className="grid grid-cols-2 gap-2.5 py-3.5 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Client Income</span>
                    <div className="font-mono text-sm font-bold text-emerald-700 mt-0.5">
                      {formatCompactNumber(income)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Vendor Paid</span>
                    <div className="font-mono text-sm font-bold text-blue-700 mt-0.5">
                      {formatCompactNumber(vendorPaid)}
                    </div>
                    {vendorPending > 0 && (
                      <span className="text-[9px] text-rose-600 font-semibold">+{formatCompactNumber(vendorPending)} pend</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Wages & Direct</span>
                    <div className="font-mono text-sm font-bold text-amber-700 mt-0.5">
                      {formatCompactNumber(directExp)}
                    </div>
                  </div>

                  {/* Internal Transfer KPI Highlight */}
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-purple-800 uppercase font-bold">Internal KPI</span>
                      <ArrowLeftRight className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className={`font-mono text-sm font-bold mt-0.5 ${
                      netInternal > 0 ? 'text-emerald-700' : netInternal < 0 ? 'text-purple-700' : 'text-slate-500'
                    }`}>
                      {netInternal > 0 ? `+${formatCompactNumber(netInternal)}` : formatCompactNumber(netInternal)}
                    </div>
                    <div className="text-[9px] text-slate-500 flex justify-between mt-0.5 font-medium">
                      <span>In: {formatCompactNumber(transfersIn)}</span>
                      <span>Out: {formatCompactNumber(transfersOut)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Available Project Cash Position */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Project Cash Position</span>
                  <div className={`font-mono text-sm font-bold ${cashBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {formatCompactNumber(cashBalance)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenClientPayment(p.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    + Income
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProjectExpense(p.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    + Wage
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Client Income */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Recent Client Payments (Income)
            </h3>
            <button
              onClick={() => onOpenClientPayment()}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              + Record Payment
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {clientPayments.slice(0, 4).map((cp) => {
              const proj = projects.find((p) => p.id === cp.projectId);
              return (
                <div key={cp.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{proj?.name || 'Project'}</div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span>{formatDate(cp.date)}</span>
                      <span>•</span>
                      <span>{cp.paymentMode}</span>
                      {cp.referenceNo && <span className="font-mono text-slate-400">({cp.referenceNo})</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-emerald-700 font-bold">{formatCurrency(cp.amount)}</span>
                    <div className="text-[10px] text-slate-400">Ref: {cp.invoiceNo || 'Direct'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Vendor Purchases / Bills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Recent Vendor Material Deliveries
            </h3>
            <button
              onClick={() => onOpenVendorTransaction()}
              className="text-xs text-blue-700 hover:underline font-bold"
            >
              + Add Bill
            </button>
          </div>

          <div className="divide-y divide-slate-100 overflow-hidden">
            {vendorTransactions.slice(0, 4).map((vtx) => {
              const proj = projects.find((p) => p.id === vtx.projectId);
              return (
                <div key={vtx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">{vtx.material}</div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                      <span className="text-amber-700 font-semibold">{vtx.quantity} {vtx.unit}</span>
                      <span>•</span>
                      <span>{proj?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-slate-900 font-bold">{formatCurrency(vtx.totalAmount)}</div>
                    <div className="text-[10px] mt-0.5">
                      {vtx.pendingAmount > 0 ? (
                        <span className="text-rose-600 font-bold">Due: {formatCurrency(vtx.pendingAmount)}</span>
                      ) : (
                        <span className="text-emerald-700 font-semibold">Cleared</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};

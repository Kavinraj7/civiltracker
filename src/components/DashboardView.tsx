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
  ArrowRight,
  Ruler,
  HardHat
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
    dailyWages,
    currentUserRole,
    totalClientIncome,
    totalVendorPaid,
    totalVendorBilled,
    totalVendorPending,
    totalPaidWages,
    totalPendingWages,
    totalWagesBilled,
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

    const wagesPaid = dailyWages
      .filter((dw) => dw.projectId === p.id && dw.status === 'paid')
      .reduce((sum, dw) => sum + (Number(dw.totalAmount) || 0), 0);

    const wagesPending = dailyWages
      .filter((dw) => dw.projectId === p.id && dw.status === 'pending')
      .reduce((sum, dw) => sum + (Number(dw.totalAmount) || 0), 0);

    // Internal Transfers KPI
    const transfersIn = internalTransactions
      .filter((it) => it.toProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const transfersOut = internalTransactions
      .filter((it) => it.fromProjectId === p.id)
      .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const netInternal = transfersIn - transfersOut;

    // Total spent on this project = Direct (fuel/misc) + Paid Labor Wages + Vendor Paid
    const totalDirectAndWages = directExp + wagesPaid;
    const totalProjectSpent = totalDirectAndWages + vendorPaid;

    return {
      project: p,
      income,
      vendorPaid,
      vendorPending,
      directExp,
      wagesPaid,
      wagesPending,
      totalDirectAndWages,
      transfersIn,
      transfersOut,
      netInternal,
      totalProjectSpent,
    };
  });

  return (
    <div className="space-y-8">
      
      {/* Clean Dashboard Header with Prominent + New Project Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Organisation Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time operations, client receivables, vendor payables & site progress across <strong className="text-amber-700 font-bold">{projects.length} {projects.length === 1 ? 'site' : 'sites'}</strong>.
          </p>
        </div>

        {currentUserRole !== 'Incharge' && (
          <button
            onClick={onOpenNewProject}
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Main KPI Cards Row - Enlarged Size & 4-Column Balanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Client Income */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Received (Client)</span>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs">
              <TrendingUp className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatCompactNumber(totalClientIncome)}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span>{clientPayments.length} receipts</span>
              <span className="font-mono text-emerald-700 font-bold">{formatCurrency(totalClientIncome)}</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Sent to Vendors */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Paid to Vendors</span>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-xs">
              <Truck className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatCompactNumber(totalVendorPaid)}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span>Billed: <strong className="font-mono text-slate-700">{formatCompactNumber(totalVendorBilled)}</strong></span>
              {totalVendorPending > 0 ? (
                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-xs">
                  Due: {formatCompactNumber(totalVendorPending)}
                </span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                  Settled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3: Wages KPI (Paid & Pending) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Site Labor Wages</span>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatCompactNumber(totalPaidWages)}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span>Billed: <strong className="font-mono text-slate-700">{formatCompactNumber(totalWagesBilled)}</strong></span>
              {totalPendingWages > 0 ? (
                <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-xs">
                  Due: {formatCompactNumber(totalPendingWages)}
                </span>
              ) : (
                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-xs">
                  All Cleared
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Total Expenses (Wages + Vendors + Direct) */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Expenses</span>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shadow-xs">
              <DollarSign className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatCompactNumber(totalExpenses)}
            </div>
            <div className="text-xs sm:text-sm text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span>Direct/Wages: <strong className="font-mono text-slate-700">{formatCompactNumber(totalDirectExpenses + totalPaidWages)}</strong></span>
              <span>Vendors: <strong className="font-mono text-slate-700">{formatCompactNumber(totalVendorPaid)}</strong></span>
            </div>
          </div>
        </div>

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
          {projectStats.map(({ project: p, income, vendorPaid, vendorPending, directExp, wagesPaid, wagesPending, totalDirectAndWages, totalProjectSpent, transfersIn, transfersOut, netInternal }) => (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p.code}
                      </span>
                      {p.siteArea ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Ruler className="w-2.5 h-2.5" />
                          {p.siteArea.toLocaleString()} {p.siteAreaUnit || 'sq.ft'}
                        </span>
                      ) : null}
                    </div>
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
                  <div className="flex items-center justify-between text-slate-700">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.location}</span>
                    </div>
                    {p.assignedInchargeName && (
                      <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-medium shrink-0 ml-2">
                        {p.assignedInchargeName}
                      </span>
                    )}
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
                      {formatCompactNumber(totalDirectAndWages)}
                    </div>
                    {wagesPending > 0 && (
                      <span className="text-[9px] text-rose-600 font-semibold block">Wage Due: {formatCompactNumber(wagesPending)}</span>
                    )}
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

              {/* Bottom: Total Project Cost */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {formatCompactNumber(totalProjectSpent)}
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

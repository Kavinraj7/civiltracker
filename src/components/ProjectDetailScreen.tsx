'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Project, VendorTransaction, DailyWageEntry } from '@/types';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowLeftRight, 
  Plus, 
  Trash2, 
  Calendar, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  CreditCard, 
  Wallet,
  Ruler,
  HardHat,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/utils';
import { DailyWageModal } from '@/components/DailyWageModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface ProjectDetailScreenProps {
  project: Project;
  onBack: () => void;
  onOpenClientPayment: (projectId: string) => void;
  onOpenProjectExpense: (projectId: string) => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
  onOpenInternalTransfer: (fromProjectId?: string) => void;
}

export const ProjectDetailScreen: React.FC<ProjectDetailScreenProps> = ({
  project,
  onBack,
  onOpenClientPayment,
  onOpenProjectExpense,
  onOpenVendorTransaction,
  onOpenInternalTransfer,
}) => {
  const {
    vendors,
    clientPayments,
    vendorTransactions,
    projectExpenses,
    internalTransactions,
    dailyWages,
    deleteProject,
    deleteClientPayment,
    deleteProjectExpense,
    deleteVendorTransaction,
    deleteInternalTransaction,
    deleteDailyWageEntry,
    updateDailyWageStatus,
    updateVendorTransactionPayment,
    projects,
  } = useData();

  const [activeTab, setActiveTab] = useState<'income' | 'vendors' | 'expenses' | 'internal'>('expenses');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [payingTxId, setPayingTxId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  
  // Daily Wages modal state
  const [isDailyWageOpen, setIsDailyWageOpen] = useState(false);

  // Delete project confirmation state
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    title: string;
    itemName: string;
    description: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Filter project-specific transactions
  const payments = clientPayments.filter((cp) => cp.projectId === project.id);
  const vTransactions = vendorTransactions.filter((vt) => vt.projectId === project.id);
  const expenses = projectExpenses.filter((pe) => pe.projectId === project.id);
  const projectWages = dailyWages.filter((dw) => dw.projectId === project.id);

  const transfersIn = internalTransactions.filter((it) => it.toProjectId === project.id);
  const transfersOut = internalTransactions.filter((it) => it.fromProjectId === project.id);

  // Financial aggregates
  const totalIncome = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalVendorBilled = vTransactions.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  const totalVendorPaid = vTransactions.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
  const totalVendorPending = vTransactions.reduce((sum, v) => sum + (Number(v.pendingAmount) || 0), 0);
  const totalDirectExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Wages KPI aggregates
  const projectPaidWages = projectWages
    .filter((w) => w.status === 'paid')
    .reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);

  const projectPendingWages = projectWages
    .filter((w) => w.status === 'pending')
    .reduce((sum, w) => sum + (Number(w.totalAmount) || 0), 0);

  const projectWagesBilled = projectPaidWages + projectPendingWages;

  // Inter-project transfers KPI
  const sumTransfersIn = transfersIn.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumTransfersOut = transfersOut.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netInternalKPI = sumTransfersIn - sumTransfersOut;

  // Only PAID wages enter actual expenses! Pending wages remain tracked in Wages KPI
  const totalSpent = totalDirectExp + totalVendorPaid + projectPaidWages;

  const handlePayBalance = async (tx: VendorTransaction) => {
    const val = Number(payAmount);
    if (!val || val <= 0) return;
    await updateVendorTransactionPayment(tx.id, val);
    setPayingTxId(null);
    setPayAmount('');
  };

  const handleDeleteProjectConfirm = async () => {
    await deleteProject(project.id);
    onBack();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Back button & Project Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Project ID: <strong className="font-mono text-slate-700">{project.id}</strong>
          </span>

          <button
            onClick={() => setIsDeletingProject(true)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Project Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {project.code}
              </span>
              
              <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                project.status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {project.status === 'active' ? 'Under Construction' : project.status}
              </span>

              {/* Site Area Badge */}
              {project.siteArea && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                  <Ruler className="w-3 h-3 text-blue-600" />
                  <span>{project.siteArea} {project.siteAreaUnit === 'ground' ? 'Ground' : 'Sq.Ft'}</span>
                </span>
              )}

              {/* Assigned Incharge Badge */}
              {project.assignedInchargeName && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  <HardHat className="w-3 h-3 text-amber-600" />
                  <span>Incharge: {project.assignedInchargeName}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2">{project.name}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.location}</span>
            </div>

            {/* Baseline Daily Wage Rates */}
            {(project.maesthriWage || project.gentsWage || project.ladiesWage) && (
              <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-600" />
                  Baseline Wages:
                </span>
                <span>Maesthri: <strong className="font-mono text-slate-900">₹{project.maesthriWage || 1200}</strong></span>
                <span>•</span>
                <span>Gents: <strong className="font-mono text-slate-900">₹{project.gentsWage || 900}</strong></span>
                <span>•</span>
                <span>Ladies: <strong className="font-mono text-slate-900">₹{project.ladiesWage || 700}</strong></span>
              </div>
            )}
          </div>

          {/* Quick Action Buttons on Screen */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenClientPayment(project.id)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+ Client Payment</span>
            </button>

            <button
              onClick={() => onOpenVendorTransaction(undefined, project.id)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>+ Add Vendor Bill</span>
            </button>

            {/* Dedicated ADD WAGES button */}
            <button
              onClick={() => setIsDailyWageOpen(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Users className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add Wages</span>
            </button>

            <button
              onClick={() => onOpenProjectExpense(project.id)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-300 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Direct Expense</span>
            </button>

            <button
              onClick={() => onOpenInternalTransfer(project.id)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Transfer Funds</span>
            </button>
          </div>
        </div>

        {/* Client Details Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Client Contact Person</span>
            <div className="font-bold text-slate-900 mt-0.5">{project.clientName}</div>
            <div className="text-slate-600 flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{project.clientPhone}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Client Email & Address</span>
            <div className="text-slate-700 mt-0.5 truncate">{project.clientEmail || 'No email specified'}</div>
            <div className="text-slate-500 mt-0.5 truncate">{project.clientAddress || 'Site Office'}</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Contract Value (Budget)</span>
            <div className="font-mono text-slate-900 font-bold text-sm mt-0.5">{formatCurrency(project.budget)}</div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              Target End: {project.targetEndDate ? formatDate(project.targetEndDate) : 'Ongoing'}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Scope / Notes</span>
            <p className="text-slate-600 mt-0.5 line-clamp-2">{project.notes || 'RCC structure & civil works.'}</p>
          </div>
        </div>

        {/* Financial KPI Cards Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          {/* Income */}
          <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-emerald-800 flex items-center justify-between">
              <span>Client Income</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            </span>
            <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
              {formatCurrency(totalIncome)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
              {payments.length} receipts
            </div>
          </div>

          {/* Vendors */}
          <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-blue-800 flex items-center justify-between">
              <span>Vendor Spent</span>
              <Truck className="w-3.5 h-3.5 text-blue-600" />
            </span>
            <div className="text-lg font-bold font-mono text-blue-800 mt-1">
              {formatCurrency(totalVendorPaid)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5 flex justify-between font-medium">
              <span>Billed: {formatCompactNumber(totalVendorBilled)}</span>
              {totalVendorPending > 0 && (
                <span className="text-rose-600 font-bold">Due: {formatCompactNumber(totalVendorPending)}</span>
              )}
            </div>
          </div>

          {/* DEDICATED WAGES KPI */}
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center justify-between">
              <span>Worker Wages (KPI)</span>
              <Users className="w-3.5 h-3.5 text-amber-600" />
            </span>
            <div className="text-lg font-bold font-mono text-amber-800 mt-1">
              {formatCurrency(projectPaidWages)}
            </div>
            <div className="text-[10px] text-amber-900 mt-0.5 flex justify-between font-medium">
              <span>Paid in Exp</span>
              {projectPendingWages > 0 ? (
                <span className="text-rose-600 font-bold">Due: {formatCompactNumber(projectPendingWages)}</span>
              ) : (
                <span className="text-emerald-700 font-semibold">0 Due</span>
              )}
            </div>
          </div>

          {/* Direct Site Expenses */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-700 flex items-center justify-between">
              <span>Site Direct Exp</span>
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <div className="text-lg font-bold font-mono text-slate-800 mt-1">
              {formatCurrency(totalDirectExp)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Fuel, hire, petty cash
            </div>
          </div>

          {/* Internal Transfers KPI */}
          <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-xl col-span-2 md:col-span-1">
            <span className="text-[10px] uppercase font-bold text-purple-800 flex items-center justify-between">
              <span>Internal Transfers</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-purple-600" />
            </span>
            <div className={`text-lg font-bold font-mono mt-1 ${netInternalKPI >= 0 ? 'text-emerald-700' : 'text-purple-800'}`}>
              {netInternalKPI >= 0 ? `+${formatCurrency(netInternalKPI)}` : formatCurrency(netInternalKPI)}
            </div>
            <div className="text-[10px] text-purple-800 mt-0.5 flex justify-between font-medium">
              <span>In: {formatCompactNumber(sumTransfersIn)}</span>
              <span>Out: {formatCompactNumber(sumTransfersOut)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Tabs Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Worker Wages & Site Expenses ({projectWages.length + expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Vendor Material Bills ({vTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'income'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Client Payments (Income) ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('internal')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'internal'
                ? 'border-purple-600 text-purple-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Internal Transfers KPI ({transfersIn.length + transfersOut.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          
          {/* TAB: Worker Wages & Direct Expenses */}
          {activeTab === 'expenses' && (
            <div className="space-y-8">
              
              {/* SECTION A: Daily Worker Wage Bills */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-600" />
                      <span>Daily Worker Wage Bills (Attendance & Payout Register)</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Maesthri, Gents, Ladies & extra staff headcounts. Only <strong>Paid</strong> wage bills are added to project expenses.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsDailyWageOpen(true)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Add Wages</span>
                  </button>
                </div>

                {/* Wages KPI Mini Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Paid Wages (Added to Project Expenses)
                    </span>
                    <div className="text-xl font-bold font-mono text-emerald-800 mt-1">
                      {formatCurrency(projectPaidWages)}
                    </div>
                  </div>

                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                    <span className="text-[10px] font-bold text-rose-800 uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      Pending Wages (Labor Liability Due)
                    </span>
                    <div className="text-xl font-bold font-mono text-rose-800 mt-1">
                      {formatCurrency(projectPendingWages)}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-500" />
                      Total Wages Billed
                    </span>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {formatCurrency(projectWagesBilled)}
                    </div>
                  </div>
                </div>

                {/* Daily Wages Table */}
                {projectWages.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
                    <p>No daily wage attendance bills created yet for this site.</p>
                    <button
                      onClick={() => setIsDailyWageOpen(true)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      + Add First Wage Bill
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                          <tr>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Worker Headcount Breakdown</th>
                            <th className="py-3 px-4 font-mono">Day Bill Total</th>
                            <th className="py-3 px-4">Payment Status</th>
                            <th className="py-3 px-4">Payment Mode / Notes</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {projectWages.map((wage) => {
                            const isPaid = wage.status === 'paid';
                            return (
                              <tr key={wage.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                                  {formatDate(wage.date)}
                                </td>

                                <td className="py-3 px-4">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900">
                                        M: {wage.maesthriCount} (₹{wage.maesthriRate}) • G: {wage.gentsCount} (₹{wage.gentsRate}) • L: {wage.ladiesCount} (₹{wage.ladiesRate})
                                      </span>
                                    </div>
                                    {wage.extraWorkers && wage.extraWorkers.length > 0 && (
                                      <div className="text-[10px] text-slate-500">
                                        Extra: {wage.extraWorkers.map((e) => `${e.nameOrRole} (${e.count} × ₹${e.ratePerDay})`).join(', ')}
                                      </div>
                                    )}
                                  </div>
                                </td>

                                <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                                  {formatCurrency(wage.totalAmount)}
                                </td>

                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                    isPaid
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                                  }`}>
                                    {isPaid ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Paid (In Exp)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3 text-rose-600" />
                                        <span>Pending Due</span>
                                      </>
                                    )}
                                  </span>
                                </td>

                                <td className="py-3 px-4 text-slate-600">
                                  {isPaid ? (
                                    <span className="font-medium text-emerald-700">{wage.paymentMode || 'Cash'}</span>
                                  ) : (
                                    <span className="text-slate-400 italic">Unpaid</span>
                                  )}
                                  {wage.notes && <div className="text-[10px] text-slate-500 truncate max-w-xs">{wage.notes}</div>}
                                </td>

                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end space-x-2">
                                    {!isPaid && (
                                      <button
                                        onClick={() => updateDailyWageStatus(wage.id, 'paid', 'Cash')}
                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                                      >
                                        Mark Paid
                                      </button>
                                    )}

                                    <button
                                      onClick={() => setDeleteTarget({
                                        title: 'Delete Daily Wage Bill',
                                        itemName: `${formatDate(wage.date)} - ${formatCurrency(wage.totalAmount)}`,
                                        description: 'Permanently delete this daily worker wage bill? Project expenses will recalculate immediately.',
                                        onConfirm: () => deleteDailyWageEntry(wage.id)
                                      })}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                      title="Delete wage bill"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION B: Direct Site Expenses (Fuel, Machinery, Petty Cash) */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Direct Site Spendings (Fuel, Machinery Hire, Petty Cash)</h3>
                    <p className="text-xs text-slate-500">
                      Total direct spendings: <strong className="text-slate-900 font-mono">{formatCurrency(totalDirectExp)}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenProjectExpense(project.id)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Record Direct Expense</span>
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                    No direct fuel or machinery spendings logged yet.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Paid To</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Payment Mode</th>
                          <th className="py-3 px-4">Voucher No</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {expenses.map((pe) => (
                          <tr key={pe.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                              {formatDate(pe.date)}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900">{pe.category}</td>
                            <td className="py-3 px-4 text-slate-700">{pe.paidTo}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                              {formatCurrency(pe.amount)}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{pe.paymentMode}</td>
                            <td className="py-3 px-4 font-mono text-slate-500">{pe.voucherNo || '-'}</td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setDeleteTarget({
                                  title: 'Delete Direct Expense',
                                  itemName: `${pe.category} - ${formatCurrency(pe.amount)}`,
                                  description: 'Permanently remove this direct site expense voucher? Project totals will recalculate immediately.',
                                  onConfirm: () => deleteProjectExpense(pe.id)
                                })}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                title="Delete expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: Vendor Material Deliveries */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Vendor Material Deliveries & Billing Ledger</h3>
                  <p className="text-xs text-slate-500">
                    Billed: <strong className="font-mono text-slate-900">{formatCurrency(totalVendorBilled)}</strong> • Paid: <strong className="text-blue-700 font-mono">{formatCurrency(totalVendorPaid)}</strong> • Due: <strong className="text-rose-600 font-mono">{formatCurrency(totalVendorPending)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onOpenVendorTransaction(undefined, project.id)}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Vendor Bill</span>
                </button>
              </div>

              {vTransactions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No vendor bills or material deliveries logged for this site yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Vendor</th>
                        <th className="py-3 px-4">Items / Material</th>
                        <th className="py-3 px-4">Total Billed</th>
                        <th className="py-3 px-4">Paid</th>
                        <th className="py-3 px-4">Pending Due</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vTransactions.map((vt) => {
                        const vendor = vendors.find((v) => v.id === vt.vendorId);
                        const hasItems = vt.items && vt.items.length > 0;
                        const isExpanded = expandedTxId === vt.id;
                        const isPaying = payingTxId === vt.id;

                        return (
                          <React.Fragment key={vt.id}>
                            <tr className="hover:bg-slate-50">
                              <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                                {formatDate(vt.date)}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-slate-900">{vendor?.name || 'Vendor'}</span>
                                <div className="text-[10px] text-slate-500">{vendor?.category}</div>
                              </td>
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-medium text-slate-900">{vt.material}</div>
                                {vt.billNumber && (
                                  <div className="text-[10px] font-mono text-slate-500">Bill/DC: {vt.billNumber}</div>
                                )}
                                {hasItems && (
                                  <button
                                    onClick={() => setExpandedTxId(isExpanded ? null : vt.id)}
                                    className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-1"
                                  >
                                    <span>{vt.items!.length} product{vt.items!.length > 1 ? 's' : ''} breakdown</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                                {formatCurrency(vt.totalAmount)}
                              </td>
                              <td className="py-3 px-4 font-mono font-semibold text-blue-700 whitespace-nowrap">
                                {formatCurrency(vt.paidAmount)}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-rose-600 whitespace-nowrap">
                                {vt.pendingAmount > 0 ? formatCurrency(vt.pendingAmount) : '₹0'}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  vt.paymentStatus === 'paid'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : vt.paymentStatus === 'partial'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {vt.paymentStatus}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end space-x-1.5">
                                  {vt.pendingAmount > 0 && !isPaying && (
                                    <button
                                      onClick={() => {
                                        setPayingTxId(vt.id);
                                        setPayAmount(vt.pendingAmount.toString());
                                      }}
                                      className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold"
                                    >
                                      Pay Due
                                    </button>
                                  )}

                                  {isPaying && (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={payAmount}
                                        onChange={(e) => setPayAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-mono font-bold"
                                      />
                                      <button
                                        onClick={() => handlePayBalance(vt)}
                                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                                      >
                                        OK
                                      </button>
                                      <button
                                        onClick={() => setPayingTxId(null)}
                                        className="px-1.5 py-1 text-slate-400 hover:text-slate-700"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  )}

                                  <button
                                    onClick={() => setDeleteTarget({
                                      title: 'Delete Material Delivery Bill',
                                      itemName: `${vt.material} (${formatCurrency(vt.totalAmount)})`,
                                      description: 'Permanently remove this vendor material delivery record? Vendor and project totals will recalculate immediately.',
                                      onConfirm: () => deleteVendorTransaction(vt.id)
                                    })}
                                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Expandable Line Items Product Drawer */}
                            {isExpanded && hasItems && (
                              <tr className="bg-slate-50/80">
                                <td colSpan={8} className="p-4 pl-12 border-b border-slate-200">
                                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                                      Itemized Products In This Bill
                                    </span>
                                    <div className="divide-y divide-slate-100">
                                      {vt.items!.map((it, idx) => (
                                        <div key={it.id || idx} className="py-1.5 flex items-center justify-between text-xs">
                                          <div className="flex items-center gap-2">
                                            <span className="text-slate-400 font-mono">#{idx + 1}</span>
                                            <span className="font-bold text-slate-800">{it.material}</span>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="font-mono text-slate-600">
                                              {it.quantity} {it.unit} × {formatCurrency(it.pricePerUnit)}
                                            </span>
                                            <span className="font-mono font-bold text-blue-700">
                                              {formatCurrency(it.total)}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Client Payments */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Client Payment Receipts</h3>
                  <p className="text-xs text-slate-500">
                    Total received from client: <strong className="text-emerald-700 font-mono">{formatCurrency(totalIncome)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onOpenClientPayment(project.id)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Client Payment</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No client payments recorded yet for this project.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Amount Received</th>
                        <th className="py-3 px-4">Payment Mode</th>
                        <th className="py-3 px-4">Reference No</th>
                        <th className="py-3 px-4">Invoice No</th>
                        <th className="py-3 px-4">Notes</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                            {formatDate(p.date)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-sm whitespace-nowrap">
                            +{formatCurrency(p.amount)}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.paymentMode}</td>
                          <td className="py-3 px-4 font-mono text-slate-700 font-medium">{p.referenceNo}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{p.invoiceNo || '-'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs">{p.notes || '-'}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setDeleteTarget({
                                title: 'Delete Client Payment Receipt',
                                itemName: `${formatDate(p.date)} - ${formatCurrency(p.amount)}`,
                                description: 'Permanently remove this client income receipt? Project income total will recalculate immediately.',
                                onConfirm: () => deleteClientPayment(p.id)
                              })}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded"
                              title="Delete payment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB: Internal Transfers */}
          {activeTab === 'internal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                    Internal Project-to-Project Transfers (Separate KPI)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Transferred In: <strong className="text-emerald-700 font-mono">+{formatCurrency(sumTransfersIn)}</strong> • Transferred Out: <strong className="text-purple-700 font-mono">-{formatCurrency(sumTransfersOut)}</strong> • Net Impact: <strong className="text-slate-900 font-mono">{formatCurrency(netInternalKPI)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onOpenInternalTransfer(project.id)}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Transfer From this Site</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* INFLOWS */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>Funds Received from Other Sites (+)</span>
                    <span className="font-mono">{formatCurrency(sumTransfersIn)}</span>
                  </div>
                  {transfersIn.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-4 text-center">No transfers received into this project.</div>
                  ) : (
                    <div className="space-y-2">
                      {transfersIn.map((it) => {
                        const fromProj = projects.find((p) => p.id === it.fromProjectId);
                        return (
                          <div key={it.id} className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <div className="text-slate-800 font-bold">From: {fromProj?.name || 'Project'}</div>
                              <div className="text-[10px] text-slate-500">{formatDate(it.date)} • {it.reason}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-700">+{formatCurrency(it.amount)}</span>
                              <button
                                onClick={() => setDeleteTarget({
                                  title: 'Delete Internal Transfer',
                                  itemName: formatCurrency(it.amount),
                                  description: `Permanently delete this incoming transfer from ${fromProj?.name || 'Site'}? Project balance will recalculate immediately.`,
                                  onConfirm: () => deleteInternalTransaction(it.id)
                                })}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete transfer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* OUTFLOWS */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                  <div className="text-xs font-bold text-purple-800 flex items-center justify-between">
                    <span>Funds Sent to Other Sites (-)</span>
                    <span className="font-mono">{formatCurrency(sumTransfersOut)}</span>
                  </div>
                  {transfersOut.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-4 text-center">No transfers sent out from this project.</div>
                  ) : (
                    <div className="space-y-2">
                      {transfersOut.map((it) => {
                        const toProj = projects.find((p) => p.id === it.toProjectId);
                        return (
                          <div key={it.id} className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <div className="text-slate-800 font-bold">To: {toProj?.name || 'Project'}</div>
                              <div className="text-[10px] text-slate-500">{formatDate(it.date)} • {it.reason}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-purple-700">-{formatCurrency(it.amount)}</span>
                              <button
                                onClick={() => setDeleteTarget({
                                  title: 'Delete Internal Transfer',
                                  itemName: formatCurrency(it.amount),
                                  description: `Permanently delete this outgoing transfer to ${toProj?.name || 'Site'}? Project balance will recalculate immediately.`,
                                  onConfirm: () => deleteInternalTransaction(it.id)
                                })}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete transfer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Daily Wage Modal */}
      {isDailyWageOpen && (
        <DailyWageModal
          initialProjectId={project.id}
          onClose={() => setIsDailyWageOpen(false)}
        />
      )}

      {/* Delete Project Confirmation Modal */}
      {isDeletingProject && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Project & All Data"
          itemName={`${project.name} (${project.code})`}
          description={`Permanently delete project "${project.name}"? All associated client receipts, vendor materials, daily worker wage attendance records, and direct expenses will also be removed immediately from the database and all financial calculations.`}
          confirmButtonText="Delete Project & Records"
          onConfirm={handleDeleteProjectConfirm}
          onClose={() => setIsDeletingProject(false)}
        />
      )}

      {/* Styled Record Delete Confirmation Modal */}
      {deleteTarget && (
        <ConfirmDeleteModal
          isOpen={true}
          title={deleteTarget.title}
          itemName={deleteTarget.itemName}
          description={deleteTarget.description}
          confirmButtonText="Delete Record"
          onConfirm={async () => {
            await deleteTarget.onConfirm();
            setDeleteTarget(null);
          }}
          onClose={() => setDeleteTarget(null)}
        />
      )}

    </div>
  );
};

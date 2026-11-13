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
  Receipt,
  Info,
  X,
  FileText
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
    markVendorTransactionPaid,
    markProjectExpensePaid,
    updateProjectExpenseStatus,
    updateProject,
    projects,
    currentUserRole,
  } = useData();

  const [activeTab, setActiveTab] = useState<'wages' | 'direct_expenses' | 'vendors' | 'income' | 'internal'>('wages');
  const [isProjectDetailsOpen, setIsProjectDetailsOpen] = useState(false);
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
  const allInternalTransfers = [
    ...transfersIn.map((t) => ({ ...t, direction: 'in' as const })),
    ...transfersOut.map((t) => ({ ...t, direction: 'out' as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Financial aggregates
  const totalIncome = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalVendorBilled = vTransactions.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  const totalVendorPaid = vTransactions.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
  const totalVendorPending = vTransactions.reduce((sum, v) => sum + (Number(v.pendingAmount) || 0), 0);
  
  // Direct site expenses breakdown (paid vs unpaid)
  const totalDirectExpPaid = expenses
    .filter((e) => e.status === 'paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalDirectExpPending = expenses
    .filter((e) => e.status !== 'paid')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalDirectExp = totalDirectExpPaid + totalDirectExpPending;

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

  // 1. Total spent on this project = sum of Vendor paid value + Work wages paid value + Site Direct Expenses paid value
  const totalSpent = totalVendorPaid + projectPaidWages + totalDirectExpPaid;
  const totalSpentBilled = totalVendorBilled + projectWagesBilled + totalDirectExp;

  // 2. Total in the project = sum of client income and internal transfer
  const totalFundsInProject = totalIncome + netInternalKPI;

  // 3. Pending amount of the project = (Client income + Internal transfer) - Total spent
  const projectPendingAmount = totalFundsInProject - totalSpent;

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
          {currentUserRole !== 'Incharge' && (
            <button
              onClick={() => setIsDeletingProject(true)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
              title="Delete Project"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Project Header Card - Streamlined to Name, Buildup Area & Client with Details Popup */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{project.name}</h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs sm:text-sm text-slate-600 mt-2 font-medium">
              <div>
                Client: <strong className="text-slate-900 font-bold">{project.clientName}</strong>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <div>
                Buildup Area: <strong className="text-slate-900 font-bold">
                  {project.buildupArea ? `${project.buildupArea} ${project.buildupAreaUnit === 'ground' ? 'Ground' : 'Sq.Ft'}` : 'Not Specified'}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {/* Project Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Status:</span>
              <select
                value={project.status}
                onChange={async (e) => {
                  await updateProject(project.id, { status: e.target.value as any });
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border shadow-xs cursor-pointer focus:outline-none transition-all ${
                  project.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : project.status === 'completed'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                <option value="active">Active (Under Construction)</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>

            <button
              onClick={() => setIsProjectDetailsOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl text-xs sm:text-sm font-bold border border-amber-200 transition-all shadow-xs cursor-pointer"
            >
              <Info className="w-4 h-4 text-amber-600" />
              <span>Project Details</span>
            </button>
          </div>
        </div>

        {/* Comprehensive Project Financial KPIs Section - Enlarged High-Visibility Size */}
        <div className="space-y-4 pt-1">
          
          {/* Top Row: Two Primary Hero Master KPIs (Enlarged) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* KPI 1: Pending Amount of the Project */}
            <div className={`border-2 p-6 sm:p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow ${
              projectPendingAmount >= 0
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/70 border-emerald-300'
                : 'bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100/70 border-rose-300'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs sm:text-sm uppercase font-extrabold tracking-wider flex items-center gap-2 ${
                  projectPendingAmount >= 0 ? 'text-emerald-900' : 'text-rose-900'
                }`}>
                  <Wallet className={`w-5 h-5 sm:w-6 sm:h-6 ${projectPendingAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`} />
                  <span>Pending Amount of the Project</span>
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  projectPendingAmount >= 0
                    ? 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
                    : 'bg-rose-200/80 text-rose-900 border-rose-300'
                }`}>
                  {projectPendingAmount >= 0 ? 'Pending Balance' : 'Deficit / Overspent'}
                </span>
              </div>
              <div className={`text-3xl sm:text-4xl lg:text-5xl font-black font-mono mt-3 tracking-tight ${
                projectPendingAmount >= 0 ? 'text-emerald-900' : 'text-rose-900'
              }`}>
                {formatCurrency(projectPendingAmount)}
              </div>
              <div className={`text-xs sm:text-sm mt-2 flex flex-wrap items-center gap-2 font-medium ${
                projectPendingAmount >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                <span>(Client Income + Transfers): <strong className="font-mono font-bold">{formatCurrency(totalFundsInProject)}</strong></span>
                <span>−</span>
                <span>Total Spent: <strong className="font-mono font-bold">{formatCurrency(totalSpent)}</strong></span>
              </div>
            </div>

            {/* KPI 2: Total Spent on this Project */}
            <div className="bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100/70 border-2 border-rose-300 p-6 sm:p-7 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm uppercase font-extrabold tracking-wider text-rose-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-rose-700" />
                  <span>Total Spent on this Project</span>
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-200/80 text-rose-900 border border-rose-300">
                  Spent Cost
                </span>
              </div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-rose-900 mt-3 tracking-tight">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-xs sm:text-sm text-rose-800 mt-2 flex flex-wrap items-center gap-2 font-medium">
                <span>Vendor: <strong className="font-mono font-bold">{formatCompactNumber(totalVendorPaid)}</strong></span>
                <span>•</span>
                <span>Wages: <strong className="font-mono font-bold">{formatCompactNumber(projectPaidWages)}</strong></span>
                <span>•</span>
                <span>Direct Exp: <strong className="font-mono font-bold">{formatCompactNumber(totalDirectExpPaid)}</strong></span>
              </div>
            </div>

          </div>

          {/* Breakdown Row: 5 Component KPIs (Enlarged) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Client Income */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-5 rounded-2xl">
              <span className="text-xs uppercase font-extrabold text-emerald-800 flex items-center justify-between">
                <span>Client Income</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800 mt-2">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-xs text-emerald-700 mt-1 font-medium">
                {payments.length} receipt{payments.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* 2. Vendor Spent */}
            <div className="bg-blue-50/70 border border-blue-200 p-5 rounded-2xl">
              <span className="text-xs uppercase font-extrabold text-blue-800 flex items-center justify-between">
                <span>Vendor Spent</span>
                <Truck className="w-4 h-4 text-blue-600" />
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-blue-800 mt-2">
                {formatCurrency(totalVendorPaid)}
              </div>
              <div className="text-xs text-blue-700 mt-1 flex justify-between font-medium">
                <span>Billed: {formatCompactNumber(totalVendorBilled)}</span>
                {totalVendorPending > 0 && (
                  <span className="text-rose-600 font-bold">Due: {formatCompactNumber(totalVendorPending)}</span>
                )}
              </div>
            </div>

            {/* 3. Worker Wages */}
            <div className="bg-amber-50/70 border border-amber-200 p-5 rounded-2xl">
              <span className="text-xs uppercase font-extrabold text-amber-900 flex items-center justify-between">
                <span>Worker Wages</span>
                <Users className="w-4 h-4 text-amber-600" />
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-800 mt-2">
                {formatCurrency(projectPaidWages)}
              </div>
              <div className="text-xs text-amber-900 mt-1 flex justify-between font-medium">
                <span>Paid</span>
                {projectPendingWages > 0 ? (
                  <span className="text-rose-600 font-bold">Due: {formatCompactNumber(projectPendingWages)}</span>
                ) : (
                  <span className="text-emerald-700 font-semibold">0 Due</span>
                )}
              </div>
            </div>

            {/* 4. Site Direct Exp */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
              <span className="text-xs uppercase font-extrabold text-slate-700 flex items-center justify-between">
                <span>Site Direct Exp</span>
                <CreditCard className="w-4 h-4 text-slate-500" />
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-800 mt-2">
                {formatCurrency(totalDirectExpPaid)}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex justify-between">
                <span>Paid</span>
                {totalDirectExpPending > 0 ? (
                  <span className="text-rose-600 font-bold">Due: {formatCompactNumber(totalDirectExpPending)}</span>
                ) : (
                  <span>0 Due</span>
                )}
              </div>
            </div>

            {/* 5. Internal Transfers */}
            <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-2xl col-span-2 lg:col-span-1">
              <span className="text-xs uppercase font-extrabold text-purple-800 flex items-center justify-between">
                <span>Internal Transfers</span>
                <ArrowLeftRight className="w-4 h-4 text-purple-600" />
              </span>
              <div className={`text-2xl sm:text-3xl font-black font-mono mt-2 ${netInternalKPI >= 0 ? 'text-emerald-700' : 'text-purple-800'}`}>
                {netInternalKPI >= 0 ? `+${formatCurrency(netInternalKPI)}` : formatCurrency(netInternalKPI)}
              </div>
              <div className="text-xs text-purple-800 mt-1 flex justify-between font-medium">
                <span>In: {formatCompactNumber(sumTransfersIn)}</span>
                <span>Out: {formatCompactNumber(sumTransfersOut)}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Screen Tabs Header */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('wages')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'wages'
                ? 'border-amber-600 text-amber-900 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-amber-600" />
            <span>Worker Wages ({projectWages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('direct_expenses')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'direct_expenses'
                ? 'border-slate-800 text-slate-900 bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4 text-slate-600" />
            <span>Direct Expenses ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'border-blue-600 text-blue-800 bg-blue-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Vendor Material Bills ({vTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('income')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'income'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Client Payments (Income) ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('internal')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'internal'
                ? 'border-purple-600 text-purple-800 bg-purple-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4 text-purple-600" />
            <span>Internal Transfers ({allInternalTransfers.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          
          {/* TAB 1: Worker Wages */}
          {activeTab === 'wages' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-600" />
                    <span>Daily Worker Wage Bills (Attendance & Payout Register)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Maesthri, Gents, Ladies, Contractors & extra staff headcounts. Only <strong>Paid</strong> wage bills are added to project expenses.
                  </p>
                </div>

                <button
                  onClick={() => setIsDailyWageOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Add Wages</span>
                </button>
              </div>

              {/* 3 KPIs for Wages (Paid, Due, Total of Paid & Due) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Paid Wages
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                    {formatCurrency(projectPaidWages)}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">Paid in project expenses</div>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Due Wages
                  </span>
                  <div className="text-2xl font-black font-mono text-rose-800 mt-2">
                    {formatCurrency(projectPendingWages)}
                  </div>
                  <div className="text-[11px] text-rose-700 mt-1">Pending payment liability</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    Total Wages (Paid + Due)
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                    {formatCurrency(projectWagesBilled)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Sum of all wage bills</div>
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
                                        {wage.contractorCount ? `C: ${wage.contractorCount} (₹${wage.contractorRate}) • ` : ''}
                                        M: {wage.maesthriCount} (₹${wage.maesthriRate}) • G: {wage.gentsCount} (₹${wage.gentsRate}) • L: {wage.ladiesCount} (₹${wage.ladiesRate})
                                      </span>
                                    </div>
                                    {wage.extraWorkers && wage.extraWorkers.length > 0 && (
                                      <div className="text-[10px] text-slate-500">
                                        Extra: {wage.extraWorkers.map((e) => `${e.nameOrRole}${e.category ? ` [${e.category}]` : ''} (${e.count} × ₹${e.ratePerDay})`).join(', ')}
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
            )}

          {/* TAB 2: Direct Site Expenses */}
          {activeTab === 'direct_expenses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-slate-600" />
                    <span>Direct Site Spendings (Fuel, Machinery Hire, Petty Cash)</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Direct voucher spendings, equipment rental, transport, and site operations.
                  </p>
                </div>
                <button
                  onClick={() => onOpenProjectExpense(project.id)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Direct Expense</span>
                </button>
              </div>

              {/* 3 KPIs for Direct Expenses (Paid, Due, Total of Paid & Due) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Paid Expenses
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                    {formatCurrency(totalDirectExpPaid)}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">Paid in project expenses</div>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Due Expenses
                  </span>
                  <div className="text-2xl font-black font-mono text-rose-800 mt-2">
                    {formatCurrency(totalDirectExpPending)}
                  </div>
                  <div className="text-[11px] text-rose-700 mt-1">Unpaid expense vouchers</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    Total Expenses (Paid + Due)
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                    {formatCurrency(totalDirectExp)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Sum of all expense vouchers</div>
                </div>
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
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((pe) => {
                        const isPaid = pe.status === 'paid';
                        return (
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
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                  isPaid
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {isPaid ? 'Paid' : 'Unpaid'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-2">
                                {!isPaid && (
                                  <button
                                    onClick={() => markProjectExpensePaid(pe.id)}
                                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                    title="Mark this expense as Paid"
                                  >
                                    Mark Paid
                                  </button>
                                )}
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
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Vendor Material Deliveries */}
          {activeTab === 'vendors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span>Vendor Material Deliveries & Billing Ledger</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track material supplies, delivery chalans, transport charges, and supplier payables.
                  </p>
                </div>
                <button
                  onClick={() => onOpenVendorTransaction(undefined, project.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Vendor Bill</span>
                </button>
              </div>

              {/* 3 KPIs for Vendor Bills (Paid, Due, Total of Paid & Due) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
                  <span className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    Paid to Vendors
                  </span>
                  <div className="text-2xl font-black font-mono text-blue-800 mt-2">
                    {formatCurrency(totalVendorPaid)}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-1">Paid supplier amount</div>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl">
                  <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-rose-600" />
                    Due to Vendors
                  </span>
                  <div className="text-2xl font-black font-mono text-rose-800 mt-2">
                    {formatCurrency(totalVendorPending)}
                  </div>
                  <div className="text-[11px] text-rose-700 mt-1">Pending vendor payables</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    Total Billed (Paid + Due)
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                    {formatCurrency(totalVendorBilled)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Sum of all delivery bills</div>
                </div>
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
                                {(Number(vt.transportCharges) > 0 || Number(vt.serviceCharge) > 0) && (
                                  <div className="text-[10px] text-slate-500 space-x-1.5 mt-0.5">
                                    {Number(vt.transportCharges) > 0 && (
                                      <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                        Transport: {formatCurrency(vt.transportCharges || 0)} ({vt.transportVehicleType || 'Vehicle'})
                                      </span>
                                    )}
                                    {Number(vt.serviceCharge) > 0 && (
                                      <span className="inline-block bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                        Service: {formatCurrency(vt.serviceCharge || 0)}
                                      </span>
                                    )}
                                  </div>
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
                                    <>
                                      <button
                                        onClick={() => markVendorTransactionPaid(vt.id)}
                                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                        title="Mark this vendor bill as fully Paid"
                                      >
                                        Mark Paid
                                      </button>
                                      <button
                                        onClick={() => {
                                          setPayingTxId(vt.id);
                                          setPayAmount(vt.pendingAmount.toString());
                                        }}
                                        className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-medium"
                                        title="Pay custom partial amount"
                                      >
                                        Partial Pay
                                      </button>
                                    </>
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
                                      {Number(vt.transportCharges) > 0 && (
                                        <div className="py-1.5 flex items-center justify-between text-xs text-slate-700 bg-slate-50/70 px-2 rounded">
                                          <span className="font-semibold">Transport Charges ({vt.transportVehicleType || 'Vehicle'})</span>
                                          <span className="font-mono font-bold text-slate-800">
                                            {formatCurrency(vt.transportCharges || 0)}
                                          </span>
                                        </div>
                                      )}
                                      {Number(vt.serviceCharge) > 0 && (
                                        <div className="py-1.5 flex items-center justify-between text-xs text-slate-700 bg-slate-50/70 px-2 rounded">
                                          <span className="font-semibold">Service Charge</span>
                                          <span className="font-mono font-bold text-slate-800">
                                            {formatCurrency(vt.serviceCharge || 0)}
                                          </span>
                                        </div>
                                      )}
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

          {/* TAB 4: Client Payments */}
          {activeTab === 'income' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span>Client Payment Receipts</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Milestone installments, bank transfers, cheques, and cash payments received from client.
                  </p>
                </div>
                <button
                  onClick={() => onOpenClientPayment(project.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Client Payment</span>
                </button>
              </div>

              {/* 2 KPIs for Client Income: Total Amount & Number of Transactions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Total Amount
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                    {formatCurrency(totalIncome)}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">Total revenue collected from client</div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    Number of Transactions
                  </span>
                  <div className="text-2xl font-black font-mono text-slate-900 mt-2">
                    {payments.length} {payments.length === 1 ? 'Transaction' : 'Transactions'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Payment receipts recorded</div>
                </div>
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

          {/* TAB 5: Internal Transfers */}
          {activeTab === 'internal' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                    <span>Internal Project-to-Project Transfers</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Liquidity movements and inter-site capital reallocations.
                  </p>
                </div>
                <button
                  onClick={() => onOpenInternalTransfer(project.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Transfer Funds</span>
                </button>
              </div>

              {/* 2 KPIs for Internal Transfers: Received and Sent */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
                  <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Funds Received (Inflows)
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-800 mt-2">
                    +{formatCurrency(sumTransfersIn)}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-1">{transfersIn.length} transfer{transfersIn.length === 1 ? '' : 's'} received from other sites</div>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
                  <span className="text-xs font-bold text-purple-800 uppercase flex items-center gap-1.5">
                    <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                    Funds Sent (Outflows)
                  </span>
                  <div className="text-2xl font-black font-mono text-purple-800 mt-2">
                    -{formatCurrency(sumTransfersOut)}
                  </div>
                  <div className="text-[11px] text-purple-700 mt-1">{transfersOut.length} transfer{transfersOut.length === 1 ? '' : 's'} dispatched to other sites</div>
                </div>
              </div>

              {/* Unified Table of Internal Transfers */}
              {allInternalTransfers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No internal project-to-project fund transfers logged for this site yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Transfer Type</th>
                        <th className="py-3 px-4">Counterpart Site</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Reason / Notes</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allInternalTransfers.map((it) => {
                        const isIn = it.direction === 'in';
                        const counterpart = isIn
                          ? projects.find((p) => p.id === it.fromProjectId)
                          : projects.find((p) => p.id === it.toProjectId);
                        
                        return (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                              {formatDate(it.date)}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                isIn
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}>
                                {isIn ? 'Received (+)' : 'Sent (-)'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">
                                {isIn ? `From: ${counterpart?.name || 'Site'}` : `To: ${counterpart?.name || 'Site'}`}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                {counterpart?.code || ''}
                              </div>
                            </td>
                            <td className={`py-3 px-4 font-mono font-bold text-sm whitespace-nowrap ${
                              isIn ? 'text-emerald-700' : 'text-purple-700'
                            }`}>
                              {isIn ? `+${formatCurrency(it.amount)}` : `-${formatCurrency(it.amount)}`}
                            </td>
                            <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                              {it.reason || '-'}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => setDeleteTarget({
                                  title: 'Delete Internal Transfer',
                                  itemName: `${formatCurrency(it.amount)} (${isIn ? 'Received' : 'Sent'})`,
                                  description: `Permanently delete this transfer record? Project balance will recalculate immediately.`,
                                  onConfirm: () => deleteInternalTransaction(it.id)
                                })}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded"
                                title="Delete transfer"
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
          )}

        </div>
      </div>

      {/* Project Details Modal Popup */}
      {isProjectDetailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Project Details</h3>
                  <p className="text-xs text-slate-500">Full specifications registered during project creation</p>
                </div>
              </div>
              <button
                onClick={() => setIsProjectDetailsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              
              {/* Section 1: Core Project Profile */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Core Profile</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Project Name</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{project.name}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Project Code / ID</span>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{project.code} ({project.id})</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                    <div className="mt-0.5">
                      <select
                        value={project.status}
                        onChange={async (e) => {
                          await updateProject(project.id, { status: e.target.value as any });
                        }}
                        className={`font-bold text-[11px] px-2.5 py-1 rounded-lg border shadow-xs cursor-pointer focus:outline-none transition-all ${
                          project.status === 'active' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : project.status === 'completed'
                            ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
                            : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        }`}
                      >
                        <option value="active">Active (Under Construction)</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Site Location</span>
                    <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{project.location || 'Not Specified'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Client Information */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Client Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Client Name</span>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">{project.clientName}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Client Phone</span>
                    <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.clientPhone}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Client Email</span>
                    <div className="font-medium text-slate-800 mt-0.5 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{project.clientEmail || 'No email provided'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Client Address</span>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {project.clientAddress || 'Site Office'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Land & Construction Footprint */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Land & Construction Footprint</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Ruler className="w-3.5 h-3.5 text-amber-600" />
                      Site Area / Land Dimension
                    </span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {project.siteArea ? `${project.siteArea} ${project.siteAreaUnit === 'ground' ? 'Ground' : 'Sq.Ft'}` : 'Not Specified'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-amber-600" />
                      Buildup Area
                    </span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {project.buildupArea ? `${project.buildupArea} ${project.buildupAreaUnit === 'ground' ? 'Ground' : 'Sq.Ft'}` : 'Not Specified'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Budget, Timeline & Incharge */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Financial Budget & Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Estimated Budget</span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                      {formatCurrency(project.budget)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Assigned Incharge</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                      <HardHat className="w-3.5 h-3.5 text-purple-600" />
                      <span>{project.assignedInchargeName || 'Unassigned (Admin)'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Schedule</span>
                    <div className="text-slate-700 mt-0.5">
                      {formatDate(project.startDate)} → {project.targetEndDate ? formatDate(project.targetEndDate) : 'Ongoing'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Daily Wage Baseline Rates */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Baseline Daily Wage Rates</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Contractor</span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{project.contractorWage || 1500} / day</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Maesthri</span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{project.maesthriWage || 1200} / day</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Gents Helper</span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{project.gentsWage || 900} / day</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Ladies Helper</span>
                    <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">₹{project.ladiesWage || 700} / day</div>
                  </div>
                </div>
              </div>

              {/* Section 6: Notes & Scope */}
              {project.notes && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Project Scope / Notes</span>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed">
                    {project.notes}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsProjectDetailsOpen(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

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

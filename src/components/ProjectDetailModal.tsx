'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Project } from '@/types';
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowLeftRight, 
  Plus, 
  Trash2
} from 'lucide-react';
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/utils';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onOpenClientPayment: (projectId: string) => void;
  onOpenProjectExpense: (projectId: string) => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
  onOpenInternalTransfer: (fromProjectId?: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
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
    deleteClientPayment,
    deleteProjectExpense,
    deleteVendorTransaction,
    projects,
  } = useData();

  const [activeTab, setActiveTab] = useState<'income' | 'vendors' | 'expenses' | 'internal'>('income');

  // Filter project-specific transactions
  const payments = clientPayments.filter((cp) => cp.projectId === project.id);
  const vTransactions = vendorTransactions.filter((vt) => vt.projectId === project.id);
  const expenses = projectExpenses.filter((pe) => pe.projectId === project.id);

  const transfersIn = internalTransactions.filter((it) => it.toProjectId === project.id);
  const transfersOut = internalTransactions.filter((it) => it.fromProjectId === project.id);

  // Financial aggregates
  const totalIncome = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalVendorBilled = vTransactions.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  const totalVendorPaid = vTransactions.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
  const totalVendorPending = vTransactions.reduce((sum, v) => sum + (Number(v.pendingAmount) || 0), 0);
  const totalDirectExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const sumTransfersIn = transfersIn.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const sumTransfersOut = transfersOut.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netInternalKPI = sumTransfersIn - sumTransfersOut;

  const totalSpent = totalDirectExp + totalVendorPaid;
  const projectCashBalance = totalIncome - totalSpent + netInternalKPI;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {project.code}
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                project.status === 'active'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {project.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">{project.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.location}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Client Details & Financial Summary Ribbon */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Client Details */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Client Contact</span>
            <div className="font-bold text-slate-800">{project.clientName}</div>
            <div className="text-slate-600 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{project.clientPhone}</span>
            </div>
            {project.clientEmail && (
              <div className="text-slate-500 flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{project.clientEmail}</span>
              </div>
            )}
          </div>

          {/* Contract & Income */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Contract & Income</span>
            <div className="text-slate-600">Budget: <strong className="text-slate-900 font-mono">{formatCurrency(project.budget)}</strong></div>
            <div className="text-emerald-700 font-bold font-mono">Received: {formatCurrency(totalIncome)}</div>
            <div className="text-[11px] text-slate-500">
              Due: {formatCompactNumber(Math.max(0, project.budget - totalIncome))}
            </div>
          </div>

          {/* Project Expenses (Wages + Vendors) */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Spent (Direct + Vendor)</span>
            <div className="text-slate-600">Wages/Fuel: <strong className="font-mono text-amber-700">{formatCompactNumber(totalDirectExp)}</strong></div>
            <div className="text-slate-600">Vendor Paid: <strong className="font-mono text-blue-700">{formatCompactNumber(totalVendorPaid)}</strong></div>
            {totalVendorPending > 0 && (
              <div className="text-rose-600 font-bold text-[11px]">Vendor Due: {formatCompactNumber(totalVendorPending)}</div>
            )}
          </div>

          {/* Internal Transfer KPI & Net Available Cash */}
          <div className="space-y-1 bg-purple-50 p-2.5 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-purple-800">
              <span>Internal KPI</span>
              <ArrowLeftRight className="w-3 h-3 text-purple-600" />
            </div>
            <div className={`font-mono text-xs font-bold ${netInternalKPI >= 0 ? 'text-emerald-700' : 'text-purple-700'}`}>
              Net: {netInternalKPI >= 0 ? `+${formatCompactNumber(netInternalKPI)}` : formatCompactNumber(netInternalKPI)}
            </div>
            <div className="pt-1 border-t border-purple-200 text-[11px] flex justify-between">
              <span className="text-slate-600 font-medium">Cash Position:</span>
              <span className={`font-mono font-bold ${projectCashBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCompactNumber(projectCashBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-5 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('income')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'income'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Client Payments (Income) ({payments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'vendors'
                ? 'border-blue-600 text-blue-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Vendor Material Expenses ({vTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'expenses'
                ? 'border-amber-600 text-amber-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Worker Wages & Site Spendings ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('internal')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'internal'
                ? 'border-purple-600 text-purple-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Internal Transfers KPI ({transfersIn.length + transfersOut.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Client Income */}
          {activeTab === 'income' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Client Payment Receipts</h4>
                  <p className="text-xs text-slate-500">Total received to date: <strong className="text-emerald-700 font-mono">{formatCurrency(totalIncome)}</strong></p>
                </div>
                <button
                  onClick={() => onOpenClientPayment(project.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No client payments recorded yet for this project.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Payment Mode</th>
                        <th className="py-2.5 px-3">Ref / Cheque</th>
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((cp) => (
                        <tr key={cp.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{formatDate(cp.date)}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{formatCurrency(cp.amount)}</td>
                          <td className="py-2.5 px-3">{cp.paymentMode}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{cp.referenceNo || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500">{cp.invoiceNo || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{cp.notes || '-'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteClientPayment(cp.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Delete record"
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

          {/* TAB 2: Vendor Material Expenses */}
          {activeTab === 'vendors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Vendor Materials Delivered to this Site</h4>
                  <p className="text-xs text-slate-500">
                    Paid: <span className="text-blue-700 font-mono font-bold">{formatCurrency(totalVendorPaid)}</span> • Due: <span className="text-rose-600 font-mono font-bold">{formatCurrency(totalVendorPending)}</span>
                  </p>
                </div>
                <button
                  onClick={() => onOpenVendorTransaction(undefined, project.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Vendor Bill</span>
                </button>
              </div>

              {vTransactions.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No vendor materials or bills logged for this project yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Vendor</th>
                        <th className="py-2.5 px-3">Material & Quantity</th>
                        <th className="py-2.5 px-3">Total Bill</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Pending</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vTransactions.map((vt) => {
                        const vendor = vendors.find((v) => v.id === vt.vendorId);
                        return (
                          <tr key={vt.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{formatDate(vt.date)}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{vendor?.name || 'Vendor'}</td>
                            <td className="py-2.5 px-3">
                              <span className="text-slate-900 font-medium">{vt.material}</span>
                              <div className="text-[11px] text-amber-700 font-mono">{vt.quantity} {vt.unit}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(vt.totalAmount)}</td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{formatCurrency(vt.paidAmount)}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                              {vt.pendingAmount > 0 ? formatCurrency(vt.pendingAmount) : '₹0'}
                            </td>
                            <td className="py-2.5 px-3">
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
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => deleteVendorTransaction(vt.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
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

          {/* TAB 3: Worker Wages & Direct Site Expenses */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Direct Project Expenses (Wages, Fuel, Petty Cash)</h4>
                  <p className="text-xs text-slate-500">Total site spendings: <strong className="text-amber-700 font-mono">{formatCurrency(totalDirectExp)}</strong></p>
                </div>
                <button
                  onClick={() => onOpenProjectExpense(project.id)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Record Wages / Expense</span>
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                  No direct wages or site expenses logged yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Paid To / Recipient</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Voucher</th>
                        <th className="py-2.5 px-3">Notes</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {expenses.map((pe) => (
                        <tr key={pe.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800">{formatDate(pe.date)}</td>
                          <td className="py-2.5 px-3 font-bold text-amber-800">{pe.category}</td>
                          <td className="py-2.5 px-3 text-slate-900">{pe.paidTo}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{formatCurrency(pe.amount)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{pe.paymentMode}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-400">{pe.voucherNo || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">{pe.notes || '-'}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => deleteProjectExpense(pe.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
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

          {/* TAB 4: Internal Transfers Separate KPI */}
          {activeTab === 'internal' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-purple-600" />
                    Internal Project-to-Project Transfers (Separate KPI)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Transferred In: <strong className="text-emerald-700 font-mono">+{formatCurrency(sumTransfersIn)}</strong> • Transferred Out: <strong className="text-purple-700 font-mono">-{formatCurrency(sumTransfersOut)}</strong> • Net Impact: <strong className="text-slate-900 font-mono">{formatCurrency(netInternalKPI)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => onOpenInternalTransfer(project.id)}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Transfer From this Site</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* INFLOWS */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <span>Funds Received from Other Sites (+)</span>
                    <span className="font-mono">{formatCurrency(sumTransfersIn)}</span>
                  </div>
                  {transfersIn.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-3 text-center">No transfers received into this project.</div>
                  ) : (
                    <div className="space-y-2">
                      {transfersIn.map((it) => {
                        const fromProj = projects.find((p) => p.id === it.fromProjectId);
                        return (
                          <div key={it.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <div className="text-slate-800 font-semibold">From: {fromProj?.name || 'Project'}</div>
                              <div className="text-[10px] text-slate-500">{formatDate(it.date)} • {it.reason}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-emerald-700">+{formatCurrency(it.amount)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* OUTFLOWS */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="text-xs font-bold text-purple-800 flex items-center justify-between">
                    <span>Funds Sent to Other Sites (-)</span>
                    <span className="font-mono">{formatCurrency(sumTransfersOut)}</span>
                  </div>
                  {transfersOut.length === 0 ? (
                    <div className="text-[11px] text-slate-500 py-3 text-center">No transfers sent out from this project.</div>
                  ) : (
                    <div className="space-y-2">
                      {transfersOut.map((it) => {
                        const toProj = projects.find((p) => p.id === it.toProjectId);
                        return (
                          <div key={it.id} className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs shadow-sm">
                            <div>
                              <div className="text-slate-800 font-semibold">To: {toProj?.name || 'Project'}</div>
                              <div className="text-[10px] text-slate-500">{formatDate(it.date)} • {it.reason}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-purple-700">-{formatCurrency(it.amount)}</span>
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
    </div>
  );
};

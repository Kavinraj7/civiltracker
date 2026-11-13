'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/dataContext';
import { 
  Package, 
  Plus, 
  Calendar, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Trash2, 
  Eye, 
  DollarSign, 
  Receipt, 
  Users, 
  Truck, 
  X,
  FileSpreadsheet
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { BillingPackage, Project } from '@/types';
import { downloadMultiSheetExcel } from '@/lib/exportMultiSheet';

export const PackagesView: React.FC = () => {
  const {
    packages,
    projects,
    vendors,
    vendorTransactions,
    dailyWages,
    projectExpenses,
    currentUserRole,
    addBillingPackage,
    markPackagePaid,
    deleteBillingPackage,
    markVendorTransactionPaid,
    markProjectExpensePaid,
    updateDailyWageStatus,
  } = useData();

  // Create Package Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  
  // Default to the last 7 days
  const defaultEnd = new Date().toISOString().split('T')[0];
  const defaultStartObj = new Date();
  defaultStartObj.setDate(defaultStartObj.getDate() - 7);
  const defaultStart = defaultStartObj.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [packageTitle, setPackageTitle] = useState<string>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Selected Package Breakdown Modal State
  const [viewingPackage, setViewingPackage] = useState<BillingPackage | null>(null);

  // Mark Whole Package Paid Confirmation Modal State
  const [payingPackage, setPayingPackage] = useState<BillingPackage | null>(null);
  const [recordClientIncome, setRecordClientIncome] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Confirmation State
  const [deletingPackage, setDeletingPackage] = useState<BillingPackage | null>(null);

  // Download Report Modal State
  const [isDownloadReportOpen, setIsDownloadReportOpen] = useState(false);
  const [reportProjectId, setReportProjectId] = useState<string>(projects[0]?.id || '');
  const [reportBillType, setReportBillType] = useState<'all' | 'vendor' | 'wages' | 'expenses'>('all');
  const [reportStartDate, setReportStartDate] = useState<string>(defaultStart);
  const [reportEndDate, setReportEndDate] = useState<string>(defaultEnd);
  const [reportIncludePaid, setReportIncludePaid] = useState<boolean>(false);

  // Filter preview bills for Create Modal (ONLY UNPAID bills are added to packages)
  const previewData = useMemo(() => {
    if (!selectedProjectId) return null;

    const currentProject = projects.find((p) => p.id === selectedProjectId);

    // Eligible unpaid vendor bills in range
    const eligibleVendorBills = vendorTransactions.filter((vt) => {
      if (vt.projectId !== selectedProjectId) return false;
      const d = vt.date;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      // Only unpaid / pending bills
      return vt.paymentStatus !== 'paid' && (Number(vt.pendingAmount) > 0 || Number(vt.paidAmount) === 0);
    });

    // Eligible unpaid daily wages in range
    const eligibleWages = dailyWages.filter((dw) => {
      if (dw.projectId !== selectedProjectId) return false;
      const d = dw.date;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      // Only unpaid / pending wages
      return dw.status !== 'paid';
    });

    // Eligible unpaid direct site expenses in range
    const eligibleExpenses = projectExpenses.filter((pe) => {
      if (pe.projectId !== selectedProjectId) return false;
      const d = pe.date;
      if (startDate && d < startDate) return false;
      if (endDate && d > endDate) return false;
      // Only unpaid direct expenses
      return pe.status !== 'paid';
    });

    const totalVendor = eligibleVendorBills.reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);
    const totalWages = eligibleWages.reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
    const totalExpenses = eligibleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const grandTotal = totalVendor + totalWages + totalExpenses;

    return {
      currentProject,
      vendorBills: eligibleVendorBills,
      wages: eligibleWages,
      expenses: eligibleExpenses,
      totalVendor,
      totalWages,
      totalExpenses,
      grandTotal,
    };
  }, [selectedProjectId, startDate, endDate, vendorTransactions, dailyWages, projectExpenses, projects]);

  // Filter preview bills for Download Report Modal (Unpaid only unless reportIncludePaid is true)
  const reportPreview = useMemo(() => {
    if (!reportProjectId) return null;
    const currentProject = projects.find((p) => p.id === reportProjectId);

    const eligibleVendorBills = vendorTransactions.filter((vt) => {
      if (vt.projectId !== reportProjectId) return false;
      const d = vt.date;
      if (reportStartDate && d < reportStartDate) return false;
      if (reportEndDate && d > reportEndDate) return false;
      if (!reportIncludePaid) {
        return vt.paymentStatus !== 'paid' && (Number(vt.pendingAmount) > 0 || Number(vt.paidAmount) === 0);
      }
      return true;
    });

    const eligibleWages = dailyWages.filter((dw) => {
      if (dw.projectId !== reportProjectId) return false;
      const d = dw.date;
      if (reportStartDate && d < reportStartDate) return false;
      if (reportEndDate && d > reportEndDate) return false;
      if (!reportIncludePaid) {
        return dw.status !== 'paid';
      }
      return true;
    });

    const eligibleExpenses = projectExpenses.filter((pe) => {
      if (pe.projectId !== reportProjectId) return false;
      const d = pe.date;
      if (reportStartDate && d < reportStartDate) return false;
      if (reportEndDate && d > reportEndDate) return false;
      if (!reportIncludePaid) {
        return pe.status !== 'paid';
      }
      return true;
    });

    const totalVendor = eligibleVendorBills.reduce((s, v) => s + (Number(v.totalAmount) || 0), 0);
    const totalWages = eligibleWages.reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
    const totalExpenses = eligibleExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    let activeCount = 0;
    let activeTotal = 0;

    if (reportBillType === 'vendor') {
      activeCount = eligibleVendorBills.length;
      activeTotal = totalVendor;
    } else if (reportBillType === 'wages') {
      activeCount = eligibleWages.length;
      activeTotal = totalWages;
    } else if (reportBillType === 'expenses') {
      activeCount = eligibleExpenses.length;
      activeTotal = totalExpenses;
    } else {
      activeCount = eligibleVendorBills.length + eligibleWages.length + eligibleExpenses.length;
      activeTotal = totalVendor + totalWages + totalExpenses;
    }

    return {
      currentProject,
      vendorBills: eligibleVendorBills,
      wages: eligibleWages,
      expenses: eligibleExpenses,
      totalVendor,
      totalWages,
      totalExpenses,
      grandTotal: totalVendor + totalWages + totalExpenses,
      activeCount,
      activeTotal,
    };
  }, [reportProjectId, reportStartDate, reportEndDate, reportBillType, reportIncludePaid, vendorTransactions, dailyWages, projectExpenses, projects]);

  // Package Table Filter States
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [inchargeFilter, setInchargeFilter] = useState<string>('all');

  const inchargeNames = useMemo(() => {
    const list = projects.map((p) => p.assignedInchargeName).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [projects]);

  // Filtered packages by Project and Incharge
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const proj = projects.find((p) => p.id === pkg.projectId);
      const matchesProject = projectFilter === 'all' || pkg.projectId === projectFilter;
      const matchesIncharge = inchargeFilter === 'all' || (proj && (proj.assignedInchargeName === inchargeFilter || proj.assignedInchargeId === inchargeFilter));
      return matchesProject && matchesIncharge;
    });
  }, [packages, projects, projectFilter, inchargeFilter]);

  // Packages KPI Stats (Dynamically recalculate based on selected Project & Incharge filters)
  const totalPackagesCount = filteredPackages.length;
  const unpaidPackages = filteredPackages.filter((p) => p.status === 'unpaid');
  const paidPackages = filteredPackages.filter((p) => p.status === 'paid');

  const totalUnpaidAmount = unpaidPackages.reduce((s, p) => s + (Number(p.grandTotal) || 0), 0);
  const totalPaidAmount = paidPackages.reduce((s, p) => s + (Number(p.grandTotal) || 0), 0);

  // Create Package Action
  const handleCreatePackage = async (autoDownloadExcel: boolean = true) => {
    setCreateError(null);
    if (!selectedProjectId) {
      setCreateError('Please select a project');
      return;
    }
    if (!previewData || (previewData.vendorBills.length === 0 && previewData.wages.length === 0 && previewData.expenses.length === 0)) {
      setCreateError('No bills found in this date range for the selected project');
      return;
    }

    try {
      setCreateLoading(true);

      const pkgName = packageTitle.trim() || `Weekly Billing Package (${startDate} to ${endDate})`;

      const newPkg = await addBillingPackage({
        title: pkgName,
        projectId: selectedProjectId,
        startDate,
        endDate,
        vendorTransactionIds: previewData.vendorBills.map((v) => v.id),
        dailyWageIds: previewData.wages.map((w) => w.id),
        projectExpenseIds: previewData.expenses.map((e) => e.id),
        totalVendorAmount: previewData.totalVendor,
        totalWagesAmount: previewData.totalWages,
        totalExpensesAmount: previewData.totalExpenses,
        grandTotal: previewData.grandTotal,
      });

      if (autoDownloadExcel && previewData.currentProject) {
        downloadMultiSheetExcel({
          projectName: previewData.currentProject.name,
          projectCode: previewData.currentProject.code,
          startDate,
          endDate,
          vendorBills: previewData.vendorBills,
          dailyWages: previewData.wages,
          projectExpenses: previewData.expenses,
          projects,
          vendors,
        });
      }

      setIsCreateOpen(false);
      setPackageTitle('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create billing package');
    } finally {
      setCreateLoading(false);
    }
  };

  // Download Excel for existing package
  const handleDownloadPackageExcel = (pkg: BillingPackage) => {
    const proj = projects.find((p) => p.id === pkg.projectId);
    const constituentVendorBills = vendorTransactions.filter((vt) => pkg.vendorTransactionIds.includes(vt.id));
    const constituentWages = dailyWages.filter((dw) => pkg.dailyWageIds.includes(dw.id));
    const constituentExpenses = projectExpenses.filter((pe) => pkg.projectExpenseIds.includes(pe.id));

    downloadMultiSheetExcel({
      projectName: proj?.name || 'Project',
      projectCode: proj?.code || 'PRJ',
      startDate: pkg.startDate,
      endDate: pkg.endDate,
      vendorBills: constituentVendorBills,
      dailyWages: constituentWages,
      projectExpenses: constituentExpenses,
      projects,
      vendors,
    });
  };

  // Confirm Mark Package as Paid
  const handleConfirmMarkPackagePaid = async () => {
    if (!payingPackage) return;
    try {
      setActionLoading(true);
      await markPackagePaid(payingPackage.id, recordClientIncome);
      setPayingPackage(null);
      if (viewingPackage?.id === payingPackage.id) {
        setViewingPackage((prev) => prev ? { ...prev, status: 'paid' } : null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to settle package');
    } finally {
      setActionLoading(false);
    }
  };

  // Download Custom Filtered Report Action
  const handleDownloadCustomReport = () => {
    if (!reportPreview?.currentProject) {
      alert('Please select a project to export');
      return;
    }
    if (reportPreview.activeCount === 0) {
      alert('No records found for the selected criteria');
      return;
    }

    downloadMultiSheetExcel({
      projectName: reportPreview.currentProject.name,
      projectCode: reportPreview.currentProject.code,
      startDate: reportStartDate,
      endDate: reportEndDate,
      vendorBills: reportPreview.vendorBills,
      dailyWages: reportPreview.wages,
      projectExpenses: reportPreview.expenses,
      projects,
      vendors,
      billType: reportBillType,
    });

    setIsDownloadReportOpen(false);
  };

  // Confirm Delete Package
  const handleConfirmDeletePackage = async () => {
    if (!deletingPackage) return;
    try {
      setActionLoading(true);
      await deleteBillingPackage(deletingPackage.id);
      setDeletingPackage(null);
      if (viewingPackage?.id === deletingPackage.id) {
        setViewingPackage(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete package');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
              <Package className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span>Weekly Billing Packages</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Bunch weekly wages, vendor bills, and direct expenses into client billing packages. Export multi-sheet spreadsheets and settle with 1 click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => setIsDownloadReportOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            title="Download formatted reports for Vendor, Wages, or Expenses"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Download Report</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Weekly Billing Package</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Client Settlement */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-amber-700 tracking-wider">
              Pending Client Settlement
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-600">
            {formatCurrency(totalUnpaidAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <strong className="text-amber-700 font-bold">{unpaidPackages.length}</strong> package{unpaidPackages.length === 1 ? '' : 's'} awaiting client payment
          </p>
        </div>

        {/* Settled / Paid Packages */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
              Settled & Disbursed
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {formatCurrency(totalPaidAmount)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            <strong className="text-emerald-700 font-bold">{paidPackages.length}</strong> package{paidPackages.length === 1 ? '' : 's'} fully paid & credited
          </p>
        </div>

        {/* Total Packages Created */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              Total Packages
            </span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalPackagesCount}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total cumulative billing packages generated
          </p>
        </div>
      </div>

      {/* Packages Table / List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">All Client Billing Packages</h2>
            <p className="text-xs text-slate-500">
              Track packages sent to clients, download multi-sheet Excel workbooks, or mark entire packages as paid
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter by Project */}
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Filter by Incharge */}
            <select
              value={inchargeFilter}
              onChange={(e) => setInchargeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Incharges</option>
              {inchargeNames.map((name) => (
                <option key={name} value={name}>Incharge: {name}</option>
              ))}
            </select>

            <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {filteredPackages.length} {filteredPackages.length === 1 ? 'Package' : 'Packages'}
            </span>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6 stroke-1" />
            </div>
            <div className="text-sm font-bold text-slate-700">No Billing Packages Created Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click &quot;+ Create Weekly Billing Package&quot; to gather weekly wages, vendor bills, and site direct expenses into a single structured bill for your client.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Package</span>
            </button>
          </div>
        ) : filteredPackages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <div className="text-sm font-bold text-slate-700">No Billing Packages Found</div>
            <p className="text-xs text-slate-500">
              No packages match the selected project and incharge filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                <tr>
                  <th className="py-3.5 px-4 text-left">Title of Bill</th>
                  <th className="py-3.5 px-4 text-left">Project</th>
                  <th className="py-3.5 px-4 text-left">Billing Range</th>
                  <th className="py-3.5 px-4 text-right">Wages</th>
                  <th className="py-3.5 px-4 text-right">Vendor Bills</th>
                  <th className="py-3.5 px-4 text-right">Site Expenses</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPackages.map((pkg) => {
                  const proj = projects.find((p) => p.id === pkg.projectId);
                  const isPaid = pkg.status === 'paid';

                  return (
                    <tr key={pkg.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="text-slate-900 font-bold">{pkg.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-normal">
                          {pkg.dailyWageIds.length} wage bills • {pkg.vendorTransactionIds.length} vendor deliveries • {pkg.projectExpenseIds.length} site expenses
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {proj?.name || 'Project'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        <div>{formatDate(pkg.startDate)}</div>
                        <div className="text-[10px] text-slate-400">to {formatDate(pkg.endDate)}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-right whitespace-nowrap">
                        {formatCurrency(pkg.totalWagesAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-right whitespace-nowrap">
                        {formatCurrency(pkg.totalVendorAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 text-right whitespace-nowrap">
                        {formatCurrency(pkg.totalExpensesAmount)}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(pkg.grandTotal)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Paid & Settled</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Unpaid Bill</span>
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Download Button */}
                          <button
                            onClick={() => handleDownloadPackageExcel(pkg)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download Multi-Sheet Excel Spreadsheet (.xlsx)"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* View Icon Button */}
                          <button
                            onClick={() => setViewingPackage(pkg)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Package Breakdown & Constituent Bills"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Mark Whole Package as Paid Button */}
                          {!isPaid && (
                            <button
                              onClick={() => {
                                setPayingPackage(pkg);
                                setRecordClientIncome(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all"
                              title="Mark entire package as Paid (settles all constituent bills)"
                            >
                              Mark as Paid
                            </button>
                          )}

                          {/* Delete Package Button */}
                          <button
                            onClick={() => setDeletingPackage(pkg)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete this package"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* --- MODAL 1: Create Weekly Billing Package --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[96vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Package className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Create Weekly Billing Package</h2>
                  <p className="text-xs text-slate-500">
                    Bunch wage bills, vendor deliveries, and site expenses into an official client bill
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Project Selector */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Project *</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billing Period Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Billing Period End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Package Title / Reference */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Package Title / Description
                </label>
                <input
                  type="text"
                  value={packageTitle}
                  onChange={(e) => setPackageTitle(e.target.value)}
                  placeholder={`e.g. Week 45 Billing Package (${startDate} to ${endDate})`}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Live Preview Card */}
              {previewData && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                        Eligible Unpaid Bills
                      </span>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        Only Unpaid Included
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {previewData.currentProject?.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Wages Summary */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Users className="w-3.5 h-3.5 text-amber-600" />
                        <span>Daily Wages</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatCurrency(previewData.totalWages)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {previewData.wages.length} daily wage bill{previewData.wages.length === 1 ? '' : 's'}
                      </div>
                    </div>

                    {/* Vendor Deliveries Summary */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Vendor Deliveries</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatCurrency(previewData.totalVendor)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {previewData.vendorBills.length} vendor bill{previewData.vendorBills.length === 1 ? '' : 's'} (inc. transport)
                      </div>
                    </div>

                    {/* Direct Site Expenses */}
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
                        <Receipt className="w-3.5 h-3.5 text-purple-600" />
                        <span>Site Expenses</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-900">
                        {formatCurrency(previewData.totalExpenses)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {previewData.expenses.length} fuel & petty vouchers
                      </div>
                    </div>
                  </div>

                  {/* Grand Total Bar */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                        Calculated Package Total:
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sum of all {previewData.wages.length + previewData.vendorBills.length + previewData.expenses.length} bills in this period
                      </span>
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {formatCurrency(previewData.grandTotal)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-end space-x-2.5 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createLoading || !previewData || previewData.grandTotal <= 0}
                onClick={() => handleCreatePackage(true)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{createLoading ? 'Bunching...' : 'Bunch & Download Multi-Sheet Excel'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 2: View Detailed Package Breakdown --- */}
      {viewingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                    {viewingPackage.packageNumber}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{viewingPackage.title}</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Period: {formatDate(viewingPackage.startDate)} to {formatDate(viewingPackage.endDate)} • Grand Total: <strong className="text-slate-900 font-mono">{formatCurrency(viewingPackage.grandTotal)}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPackageExcel(viewingPackage)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  title="Download Excel Spreadsheet"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Download .xlsx</span>
                </button>
                <button
                  onClick={() => setViewingPackage(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Breakdown Content */}
            <div className="p-5 space-y-5 text-xs overflow-y-auto flex-1">
              
              {/* SECTION A: Wages In This Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-600" />
                    <span>Daily Wage Bills ({viewingPackage.dailyWageIds.length})</span>
                  </h3>
                  <span className="font-mono font-bold text-amber-700">
                    Total: {formatCurrency(viewingPackage.totalWagesAmount)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Contractor</th>
                        <th className="py-2 px-3">Maesthri</th>
                        <th className="py-2 px-3">Gents</th>
                        <th className="py-2 px-3">Ladies</th>
                        <th className="py-2 px-3">Total (₹)</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dailyWages
                        .filter((w) => viewingPackage.dailyWageIds.includes(w.id))
                        .map((w) => (
                          <tr key={w.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{formatDate(w.date)}</td>
                            <td className="py-2 px-3 font-mono">{w.contractorCount || 0}</td>
                            <td className="py-2 px-3 font-mono">{w.maesthriCount || 0}</td>
                            <td className="py-2 px-3 font-mono">{w.gentsCount || 0}</td>
                            <td className="py-2 px-3 font-mono">{w.ladiesCount || 0}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatCurrency(w.totalAmount)}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                                w.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {w.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {w.status !== 'paid' && (
                                <button
                                  onClick={() => updateDailyWageStatus(w.id, 'paid')}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION B: Vendor Bills In This Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span>Vendor Material Bills ({viewingPackage.vendorTransactionIds.length})</span>
                  </h3>
                  <span className="font-mono font-bold text-blue-700">
                    Total: {formatCurrency(viewingPackage.totalVendorAmount)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Vendor</th>
                        <th className="py-2 px-3">Material & Charges</th>
                        <th className="py-2 px-3">Total (₹)</th>
                        <th className="py-2 px-3">Paid (₹)</th>
                        <th className="py-2 px-3">Pending</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorTransactions
                        .filter((vt) => viewingPackage.vendorTransactionIds.includes(vt.id))
                        .map((vt) => {
                          const vObj = vendors.find((v) => v.id === vt.vendorId);
                          return (
                            <tr key={vt.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-semibold text-slate-800">{formatDate(vt.date)}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{vObj?.name || 'Vendor'}</td>
                              <td className="py-2 px-3">
                                <div>{vt.material}</div>
                                {(Number(vt.transportCharges) > 0 || Number(vt.serviceCharge) > 0) && (
                                  <div className="text-[10px] text-slate-500">
                                    {Number(vt.transportCharges) > 0 && `Transport: ₹${vt.transportCharges} `}
                                    {Number(vt.serviceCharge) > 0 && `Service: ₹${vt.serviceCharge}`}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatCurrency(vt.totalAmount)}</td>
                              <td className="py-2 px-3 font-mono text-blue-700">{formatCurrency(vt.paidAmount)}</td>
                              <td className="py-2 px-3 font-mono font-bold text-rose-600">
                                {vt.pendingAmount > 0 ? formatCurrency(vt.pendingAmount) : '₹0'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {vt.pendingAmount > 0 && (
                                  <button
                                    onClick={() => markVendorTransactionPaid(vt.id)}
                                    className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold"
                                  >
                                    Mark Paid
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION C: Site Direct Expenses In This Package */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-purple-600" />
                    <span>Direct Site Spendings ({viewingPackage.projectExpenseIds.length})</span>
                  </h3>
                  <span className="font-mono font-bold text-purple-700">
                    Total: {formatCurrency(viewingPackage.totalExpensesAmount)}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Paid To</th>
                        <th className="py-2 px-3">Amount (₹)</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {projectExpenses
                        .filter((pe) => viewingPackage.projectExpenseIds.includes(pe.id))
                        .map((pe) => (
                          <tr key={pe.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{formatDate(pe.date)}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{pe.category}</td>
                            <td className="py-2 px-3 text-slate-700">{pe.paidTo}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">{formatCurrency(pe.amount)}</td>
                            <td className="py-2 px-3">
                              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                                pe.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                              }`}>
                                {pe.status || 'unpaid'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {pe.status !== 'paid' && (
                                <button
                                  onClick={() => markProjectExpensePaid(pe.id)}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold"
                                >
                                  Mark Paid
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                viewingPackage.status === 'paid'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {viewingPackage.status === 'paid' ? 'Package Paid & Settle Complete' : 'Package Unpaid / Pending Client Payment'}
              </span>

              <div className="flex items-center space-x-2">
                {viewingPackage.status !== 'paid' && (
                  <button
                    onClick={() => {
                      setPayingPackage(viewingPackage);
                      setRecordClientIncome(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Mark Whole Package as Paid
                  </button>
                )}
                <button
                  onClick={() => setViewingPackage(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 3: Confirm Mark Entire Package as Paid --- */}
      {payingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Mark Whole Package as Paid?</h3>
                <span className="text-xs text-slate-500 font-mono">{payingPackage.packageNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will automatically mark all <strong>{payingPackage.dailyWageIds.length} daily wage bills</strong>, <strong>{payingPackage.vendorTransactionIds.length} vendor deliveries</strong>, and <strong>{payingPackage.projectExpenseIds.length} site expenses</strong> in this package as <strong>Fully Paid</strong>.
            </p>

            {/* Checkbox to add client income */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordClientIncome}
                  onChange={(e) => setRecordClientIncome(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Record Client Payment Income Receipt
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Auto-credit <strong>{formatCurrency(payingPackage.grandTotal)}</strong> to client receipts for this site.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPayingPackage(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmMarkPackagePaid}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : `Confirm & Settle (${formatCurrency(payingPackage.grandTotal)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Confirm Delete Package --- */}
      {deletingPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Billing Package</h3>
                <span className="text-xs text-slate-500 font-mono">{deletingPackage.packageNumber}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>{deletingPackage.title}</strong>? Note: This deletes only the bunched package container; individual transactions and bills will remain preserved.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDeletePackage}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 5: Download Report By Criteria --- */}
      {isDownloadReportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[96vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Download className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Download Operations & Billing Report</h2>
                  <p className="text-xs text-slate-500">
                    Export Excel reports in weekly format for any project, bill category & date range
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDownloadReportOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-3.5 text-xs overflow-y-auto">
              
              {/* Row 1: Project & Bill Type in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Select Project Name *</label>
                  <select
                    value={reportProjectId}
                    onChange={(e) => setReportProjectId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-medium text-xs shadow-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Bill Type Category *</label>
                  <select
                    value={reportBillType}
                    onChange={(e) => setReportBillType(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 font-bold text-xs shadow-sm"
                  >
                    <option value="vendor">Vendor Bills (Material, Transport, Service & Totals)</option>
                    <option value="wages">Daily Wages (Contractor, Maesthri, Gents, Ladies)</option>
                    <option value="expenses">Site Direct Expenses (Fuel, Machinery, Petty Cash)</option>
                    <option value="all">All Categories (Multi-Sheet Workbook)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Date Range Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">From Date *</label>
                  <input
                    type="date"
                    value={reportStartDate}
                    onChange={(e) => setReportStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">To Date *</label>
                  <input
                    type="date"
                    value={reportEndDate}
                    onChange={(e) => setReportEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500 text-xs shadow-sm"
                  />
                </div>
              </div>

              {/* Include Paid Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reportIncludePaid}
                    onChange={(e) => setReportIncludePaid(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Include Paid</span>
                    <span className="text-[11px] text-slate-500 block">
                      {reportIncludePaid
                        ? 'Including both paid and unpaid bills in this report.'
                        : 'Only unpaid / pending bills are included. Check this box to include settled bills.'}
                    </span>
                  </div>
                </label>
              </div>

              {/* Live Matching Summary Card */}
              {reportPreview && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-slate-700 font-bold">
                    <span>Matching Records ({reportIncludePaid ? 'Paid + Unpaid' : 'Unpaid Bills Only'}):</span>
                    <span className="font-mono text-emerald-700">{reportPreview.activeCount} record{reportPreview.activeCount === 1 ? '' : 's'}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 font-bold pt-1 border-t border-slate-200">
                    <span>Category Total Amount:</span>
                    <span className="font-mono text-slate-900 text-sm">{formatCurrency(reportPreview.activeTotal)}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-end space-x-2.5 bg-slate-50/50 shrink-0">
              <button
                type="button"
                onClick={() => setIsDownloadReportOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reportPreview || reportPreview.activeCount === 0}
                onClick={handleDownloadCustomReport}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download Report ({formatCurrency(reportPreview?.activeTotal || 0)})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};


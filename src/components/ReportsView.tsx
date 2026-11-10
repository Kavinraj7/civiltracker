'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Filter, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowLeftRight,
  Receipt,
  Calendar,
  Building2,
  CheckCircle2,
  Search
} from 'lucide-react';
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/utils';

export const ReportsView: React.FC = () => {
  const { 
    projects, 
    vendors, 
    clientPayments, 
    vendorTransactions, 
    dailyWages, 
    internalTransactions 
  } = useData();

  // Filter States
  const [reportType, setReportType] = useState<'all' | 'client' | 'vendor' | 'wages' | 'internal'>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  // Helper date checker
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    const d = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'this_month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }
    if (dateFilter === 'last_30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return d >= thirtyDaysAgo && d <= now;
    }
    if (dateFilter === 'custom') {
      if (startDate && new Date(dateStr) < new Date(startDate)) return false;
      if (endDate && new Date(dateStr) > new Date(endDate + 'T23:59:59')) return false;
    }
    return true;
  };

  // 1. Client Transactions
  const filteredClientPayments = clientPayments.filter((cp) => {
    if (selectedProjectId !== 'all' && cp.projectId !== selectedProjectId) return false;
    if (!isDateInRange(cp.date)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const proj = projects.find((p) => p.id === cp.projectId);
      const matchProj = proj?.name.toLowerCase().includes(q) || proj?.code.toLowerCase().includes(q);
      const matchRef = cp.referenceNo?.toLowerCase().includes(q) || cp.invoiceNo?.toLowerCase().includes(q);
      const matchNotes = cp.notes?.toLowerCase().includes(q);
      if (!matchProj && !matchRef && !matchNotes) return false;
    }
    return true;
  });

  // 2. Vendor Transactions
  const filteredVendorTransactions = vendorTransactions.filter((vt) => {
    if (selectedProjectId !== 'all' && vt.projectId !== selectedProjectId) return false;
    if (!isDateInRange(vt.date)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const v = vendors.find((vend) => vend.id === vt.vendorId);
      const proj = projects.find((p) => p.id === vt.projectId);
      const matchVendor = v?.name.toLowerCase().includes(q);
      const matchMaterial = vt.material.toLowerCase().includes(q);
      const matchProj = proj?.name.toLowerCase().includes(q) || proj?.code.toLowerCase().includes(q);
      const matchBill = vt.billNumber?.toLowerCase().includes(q);
      if (!matchVendor && !matchMaterial && !matchProj && !matchBill) return false;
    }
    return true;
  });

  // 3. Daily Wages
  const filteredDailyWages = dailyWages.filter((dw) => {
    if (selectedProjectId !== 'all' && dw.projectId !== selectedProjectId) return false;
    if (!isDateInRange(dw.date)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const proj = projects.find((p) => p.id === dw.projectId);
      const matchProj = proj?.name.toLowerCase().includes(q) || proj?.code.toLowerCase().includes(q);
      const matchNotes = dw.notes?.toLowerCase().includes(q);
      if (!matchProj && !matchNotes) return false;
    }
    return true;
  });

  // 4. Internal Transfers
  const filteredInternalTransactions = internalTransactions.filter((it) => {
    if (selectedProjectId !== 'all' && it.fromProjectId !== selectedProjectId && it.toProjectId !== selectedProjectId) return false;
    if (!isDateInRange(it.date)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const fromP = projects.find((p) => p.id === it.fromProjectId);
      const toP = projects.find((p) => p.id === it.toProjectId);
      const matchFrom = fromP?.name.toLowerCase().includes(q) || fromP?.code.toLowerCase().includes(q);
      const matchTo = toP?.name.toLowerCase().includes(q) || toP?.code.toLowerCase().includes(q);
      const matchReason = it.reason.toLowerCase().includes(q);
      if (!matchFrom && !matchTo && !matchReason) return false;
    }
    return true;
  });

  // KPI Calculations for current filter scope
  const sumClientIncome = filteredClientPayments.reduce((s, cp) => s + (Number(cp.amount) || 0), 0);
  const sumVendorBilled = filteredVendorTransactions.reduce((s, vt) => s + (Number(vt.totalAmount) || 0), 0);
  const sumVendorPaid = filteredVendorTransactions.reduce((s, vt) => s + (Number(vt.paidAmount) || 0), 0);
  const sumVendorDue = filteredVendorTransactions.reduce((s, vt) => s + (Number(vt.pendingAmount) || 0), 0);
  const sumWagesPaid = filteredDailyWages.filter((w) => w.status === 'paid').reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
  const sumWagesDue = filteredDailyWages.filter((w) => w.status === 'pending').reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
  const sumWagesTotal = filteredDailyWages.reduce((s, w) => s + (Number(w.totalAmount) || 0), 0);
  const sumInternalTransfers = filteredInternalTransactions.reduce((s, it) => s + (Number(it.amount) || 0), 0);

  // CSV Exporter Utility
  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeCSV = (val: any) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  // Export handlers
  const handleExportCSV = () => {
    const projName = selectedProjectId === 'all' 
      ? 'All_Projects' 
      : (projects.find((p) => p.id === selectedProjectId)?.code || 'Project');
    const timestamp = new Date().toISOString().split('T')[0];

    if (reportType === 'client') {
      let csv = 'Date,Project Code,Project Name,Client Name,Amount (INR),Payment Mode,Invoice No,Reference No,Notes\n';
      filteredClientPayments.forEach((cp) => {
        const p = projects.find((pr) => pr.id === cp.projectId);
        csv += [
          escapeCSV(cp.date),
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          escapeCSV(p?.clientName || '-'),
          cp.amount,
          escapeCSV(cp.paymentMode),
          escapeCSV(cp.invoiceNo || ''),
          escapeCSV(cp.referenceNo || ''),
          escapeCSV(cp.notes || '')
        ].join(',') + '\n';
      });
      downloadCSV(csv, `Client_Income_Report_${projName}_${timestamp}.csv`);
    } else if (reportType === 'vendor') {
      let csv = 'Date,Project Code,Project Name,Vendor Name,Material,Quantity,Unit,Total Amount (INR),Paid Amount (INR),Due Amount (INR),Payment Status,Bill / DC No,Notes\n';
      filteredVendorTransactions.forEach((vt) => {
        const p = projects.find((pr) => pr.id === vt.projectId);
        const v = vendors.find((vend) => vend.id === vt.vendorId);
        csv += [
          escapeCSV(vt.date),
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          escapeCSV(v?.name || '-'),
          escapeCSV(vt.material),
          vt.quantity,
          escapeCSV(vt.unit),
          vt.totalAmount,
          vt.paidAmount,
          vt.pendingAmount,
          escapeCSV(vt.paymentStatus),
          escapeCSV(vt.billNumber || ''),
          escapeCSV(vt.notes || '')
        ].join(',') + '\n';
      });
      downloadCSV(csv, `Vendor_Materials_Report_${projName}_${timestamp}.csv`);
    } else if (reportType === 'wages') {
      let csv = 'Date,Project Code,Project Name,Maesthri Count,Gents Count,Ladies Count,Extra Workers Count,Total Wages (INR),Status,Payment Mode,Paid Date,Notes\n';
      filteredDailyWages.forEach((dw) => {
        const p = projects.find((pr) => pr.id === dw.projectId);
        const extraCount = dw.extraWorkers?.reduce((s, e) => s + (e.count || 0), 0) || 0;
        csv += [
          escapeCSV(dw.date),
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          dw.maesthriCount || 0,
          dw.gentsCount || 0,
          dw.ladiesCount || 0,
          extraCount,
          dw.totalAmount,
          escapeCSV(dw.status),
          escapeCSV(dw.paymentMode || ''),
          escapeCSV(dw.paidDate || ''),
          escapeCSV(dw.notes || '')
        ].join(',') + '\n';
      });
      downloadCSV(csv, `Daily_Wages_Report_${projName}_${timestamp}.csv`);
    } else if (reportType === 'internal') {
      let csv = 'Date,From Project Code,From Project Name,To Project Code,To Project Name,Amount (INR),Reason,Reference No\n';
      filteredInternalTransactions.forEach((it) => {
        const fromP = projects.find((p) => p.id === it.fromProjectId);
        const toP = projects.find((p) => p.id === it.toProjectId);
        csv += [
          escapeCSV(it.date),
          escapeCSV(fromP?.code || '-'),
          escapeCSV(fromP?.name || '-'),
          escapeCSV(toP?.code || '-'),
          escapeCSV(toP?.name || '-'),
          it.amount,
          escapeCSV(it.reason),
          escapeCSV(it.referenceNo || '')
        ].join(',') + '\n';
      });
      downloadCSV(csv, `Internal_Transfers_Report_${projName}_${timestamp}.csv`);
    } else {
      // Consolidated Master Report
      let csv = 'Date,Stream Category,Project Code,Project Name,Party / Reference,Details / Description,Income (INR),Expense (INR),Status,Reference No\n';
      
      filteredClientPayments.forEach((cp) => {
        const p = projects.find((pr) => pr.id === cp.projectId);
        csv += [
          escapeCSV(cp.date),
          '"Client Income"',
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          escapeCSV(p?.clientName || 'Client'),
          escapeCSV(cp.notes || `Received via ${cp.paymentMode}`),
          cp.amount,
          0,
          '"Received"',
          escapeCSV(cp.referenceNo || cp.invoiceNo || '')
        ].join(',') + '\n';
      });

      filteredVendorTransactions.forEach((vt) => {
        const p = projects.find((pr) => pr.id === vt.projectId);
        const v = vendors.find((vend) => vend.id === vt.vendorId);
        csv += [
          escapeCSV(vt.date),
          '"Vendor Material"',
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          escapeCSV(v?.name || 'Vendor'),
          escapeCSV(`${vt.material} (${vt.quantity} ${vt.unit}) - Paid: ${vt.paidAmount}, Due: ${vt.pendingAmount}`),
          0,
          vt.paidAmount,
          escapeCSV(vt.paymentStatus),
          escapeCSV(vt.billNumber || '')
        ].join(',') + '\n';
      });

      filteredDailyWages.forEach((dw) => {
        const p = projects.find((pr) => pr.id === dw.projectId);
        csv += [
          escapeCSV(dw.date),
          '"Labor Daily Wages"',
          escapeCSV(p?.code || '-'),
          escapeCSV(p?.name || '-'),
          '"Site Workers"',
          escapeCSV(`Maesthri: ${dw.maesthriCount || 0}, Gents: ${dw.gentsCount || 0}, Ladies: ${dw.ladiesCount || 0}`),
          0,
          dw.status === 'paid' ? dw.totalAmount : 0,
          escapeCSV(dw.status.toUpperCase()),
          escapeCSV(dw.paymentMode || '')
        ].join(',') + '\n';
      });

      filteredInternalTransactions.forEach((it) => {
        const fromP = projects.find((p) => p.id === it.fromProjectId);
        const toP = projects.find((p) => p.id === it.toProjectId);
        csv += [
          escapeCSV(it.date),
          '"Internal Transfer"',
          escapeCSV(`${fromP?.code} -> ${toP?.code}`),
          escapeCSV(`${fromP?.name} to ${toP?.name}`),
          '"Inter-Project"',
          escapeCSV(it.reason),
          0,
          0,
          '"Transferred"',
          escapeCSV(it.referenceNo || '')
        ].join(',') + '\n';
      });

      downloadCSV(csv, `Consolidated_Master_Report_${projName}_${timestamp}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-amber-600" />
            Operations & Financial Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Export structured Excel-ready CSV reports and printable statements for client income, vendor bills, daily wages, and internal transfers.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Export to CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter Ribbon Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        
        {/* Stream Selector Buttons */}
        <div>
          <label className="block text-[11px] uppercase font-bold text-slate-400 mb-2">
            Select Report Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'all', label: 'Consolidated (All)', icon: Receipt },
              { id: 'client', label: 'Client Income', icon: TrendingUp },
              { id: 'vendor', label: 'Vendor Bills', icon: Truck },
              { id: 'wages', label: 'Daily Wages', icon: Users },
              { id: 'internal', label: 'Internal Transfers', icon: ArrowLeftRight },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = reportType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setReportType(t.id as any)}
                  className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filter Line: Project, Date & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 items-end">
          
          {/* Project Specific Dropdown */}
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Project Scope</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Projects (Organisation Master)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Quick Selector */}
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Filter</span>
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Recorded Dates</option>
              <option value="this_month">This Month</option>
              <option value="last_30">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Search Bar */}
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Keyword Search</span>
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor, reference, material, reason..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

        </div>

        {/* Custom Date Inputs if selected */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

      </div>

      {/* KPI Highlights for the selected report */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(reportType === 'all' || reportType === 'client') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center justify-between">
              <span>Client Income</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {formatCurrency(sumClientIncome)}
            </div>
            <span className="text-[10px] text-slate-400">{filteredClientPayments.length} receipts</span>
          </div>
        )}

        {(reportType === 'all' || reportType === 'vendor') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-blue-700 flex items-center justify-between">
              <span>Vendor Material Paid</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </span>
            <div className="text-xl font-bold font-mono text-blue-700 mt-1">
              {formatCurrency(sumVendorPaid)}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
              <span>Billed: {formatCompactNumber(sumVendorBilled)}</span>
              {sumVendorDue > 0 && <span className="text-rose-600 font-bold">Due: {formatCompactNumber(sumVendorDue)}</span>}
            </div>
          </div>
        )}

        {(reportType === 'all' || reportType === 'wages') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center justify-between">
              <span>Paid Labor Wages</span>
              <Users className="w-4 h-4 text-amber-600" />
            </span>
            <div className="text-xl font-bold font-mono text-amber-800 mt-1">
              {formatCurrency(sumWagesPaid)}
            </div>
            <div className="text-[10px] text-slate-500 flex justify-between mt-0.5">
              <span>Billed: {formatCompactNumber(sumWagesTotal)}</span>
              {sumWagesDue > 0 && <span className="text-rose-600 font-bold">Due: {formatCompactNumber(sumWagesDue)}</span>}
            </div>
          </div>
        )}

        {(reportType === 'all' || reportType === 'internal') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-purple-700 flex items-center justify-between">
              <span>Internal Transfers Volume</span>
              <ArrowLeftRight className="w-4 h-4 text-purple-600" />
            </span>
            <div className="text-xl font-bold font-mono text-purple-700 mt-1">
              {formatCurrency(sumInternalTransfers)}
            </div>
            <span className="text-[10px] text-slate-400">{filteredInternalTransactions.length} movements</span>
          </div>
        )}
      </div>

      {/* Report Data Preview Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {reportType === 'all' ? 'Consolidated Transactions Preview' : `${reportType.toUpperCase()} Report Ledger`}
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {reportType === 'client' && `${filteredClientPayments.length} entries`}
              {reportType === 'vendor' && `${filteredVendorTransactions.length} deliveries`}
              {reportType === 'wages' && `${filteredDailyWages.length} daily bills`}
              {reportType === 'internal' && `${filteredInternalTransactions.length} transfers`}
              {reportType === 'all' && `${filteredClientPayments.length + filteredVendorTransactions.length + filteredDailyWages.length + filteredInternalTransactions.length} total entries`}
            </span>
          </div>

          <button
            onClick={handleExportCSV}
            className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>

        {/* Tabular data render */}
        <div className="overflow-x-auto">
          {reportType === 'client' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Client</th>
                  <th className="py-2.5 px-4">Mode / Ref</th>
                  <th className="py-2.5 px-4">Notes</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientPayments.map((cp) => {
                  const p = projects.find((pr) => pr.id === cp.projectId);
                  return (
                    <tr key={cp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(cp.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{p?.name || 'Project'}</span>
                        <div className="text-[10px] font-mono text-amber-700">{p?.code}</div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{p?.clientName || 'Client'}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {cp.paymentMode} {cp.referenceNo ? `(${cp.referenceNo})` : ''}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{cp.notes || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">
                        +{formatCurrency(cp.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'vendor' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Vendor</th>
                  <th className="py-2.5 px-4">Material Supplied</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Total (₹)</th>
                  <th className="py-2.5 px-4 text-right">Paid (₹)</th>
                  <th className="py-2.5 px-4 text-right">Due (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVendorTransactions.map((vt) => {
                  const p = projects.find((pr) => pr.id === vt.projectId);
                  const v = vendors.find((vend) => vend.id === vt.vendorId);
                  return (
                    <tr key={vt.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(vt.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{p?.name || 'Project'}</span>
                        <div className="text-[10px] font-mono text-amber-700">{p?.code}</div>
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">{v?.name || 'Vendor'}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-900 font-medium">{vt.material}</span>
                        {vt.billNumber && <div className="text-[10px] text-slate-500 font-mono">Bill: {vt.billNumber}</div>}
                      </td>
                      <td className="py-2.5 px-4 font-mono">{vt.quantity} {vt.unit}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(vt.totalAmount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">{formatCurrency(vt.paidAmount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">
                        {vt.pendingAmount > 0 ? formatCurrency(vt.pendingAmount) : '₹0'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          vt.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {vt.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'wages' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Workers Breakdown</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Paid Details</th>
                  <th className="py-2.5 px-4 text-right">Bill Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDailyWages.map((dw) => {
                  const p = projects.find((pr) => pr.id === dw.projectId);
                  return (
                    <tr key={dw.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(dw.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{p?.name || 'Project'}</span>
                        <div className="text-[10px] font-mono text-amber-700">{p?.code}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <span>Maesthri: <strong>{dw.maesthriCount || 0}</strong>, Gents: <strong>{dw.gentsCount || 0}</strong>, Ladies: <strong>{dw.ladiesCount || 0}</strong></span>
                        {dw.extraWorkers && dw.extraWorkers.length > 0 && (
                          <div className="text-[10px] text-amber-700 font-medium">+{dw.extraWorkers.length} extra worker role(s)</div>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          dw.status === 'paid' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {dw.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-[11px] text-slate-500">
                        {dw.status === 'paid' ? `${dw.paymentMode || 'Cash'} on ${dw.paidDate ? formatDate(dw.paidDate) : formatDate(dw.date)}` : 'Pending release'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(dw.totalAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'internal' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">From Site</th>
                  <th className="py-2.5 px-4">To Site</th>
                  <th className="py-2.5 px-4">Reason / Notes</th>
                  <th className="py-2.5 px-4">Reference</th>
                  <th className="py-2.5 px-4 text-right">Transfer Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInternalTransactions.map((it) => {
                  const fromP = projects.find((p) => p.id === it.fromProjectId);
                  const toP = projects.find((p) => p.id === it.toProjectId);
                  return (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(it.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{fromP?.name || 'Site'}</span>
                        <div className="text-[10px] font-mono text-purple-700">{fromP?.code}</div>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-bold text-slate-900">{toP?.name || 'Site'}</span>
                        <div className="text-[10px] font-mono text-purple-700">{toP?.code}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{it.reason}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{it.referenceNo || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-purple-700">
                        {formatCurrency(it.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'all' && (
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Stream / Category</th>
                  <th className="py-2.5 px-4">Project</th>
                  <th className="py-2.5 px-4">Party / Details</th>
                  <th className="py-2.5 px-4 text-right">Income (₹)</th>
                  <th className="py-2.5 px-4 text-right">Expense (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClientPayments.map((cp) => {
                  const p = projects.find((pr) => pr.id === cp.projectId);
                  return (
                    <tr key={'c-' + cp.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(cp.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Client Income
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p?.name || 'Project'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{p?.clientName} • {cp.notes || cp.paymentMode}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-700">+{formatCurrency(cp.amount)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-2.5 px-4 text-emerald-700 font-bold text-[10px]">RECEIVED</td>
                    </tr>
                  );
                })}

                {filteredVendorTransactions.map((vt) => {
                  const p = projects.find((pr) => pr.id === vt.projectId);
                  const v = vendors.find((vend) => vend.id === vt.vendorId);
                  return (
                    <tr key={'v-' + vt.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(vt.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          Vendor Bill
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p?.name || 'Project'}</td>
                      <td className="py-2.5 px-4 text-slate-600">{v?.name} • {vt.material} ({vt.quantity} {vt.unit})</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-700">-{formatCurrency(vt.paidAmount)}</td>
                      <td className="py-2.5 px-4 font-bold text-[10px] uppercase">{vt.paymentStatus}</td>
                    </tr>
                  );
                })}

                {filteredDailyWages.map((dw) => {
                  const p = projects.find((pr) => pr.id === dw.projectId);
                  return (
                    <tr key={'w-' + dw.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(dw.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          Daily Wages
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{p?.name || 'Project'}</td>
                      <td className="py-2.5 px-4 text-slate-600">Site Labor ({dw.maesthriCount || 0}M, {dw.gentsCount || 0}G, {dw.ladiesCount || 0}L)</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">-</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-800">
                        {dw.status === 'paid' ? `-${formatCurrency(dw.totalAmount)}` : `(Due: ${formatCurrency(dw.totalAmount)})`}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[10px] uppercase text-amber-900">{dw.status}</td>
                    </tr>
                  );
                })}

                {filteredInternalTransactions.map((it) => {
                  const fromP = projects.find((p) => p.id === it.fromProjectId);
                  const toP = projects.find((p) => p.id === it.toProjectId);
                  return (
                    <tr key={'i-' + it.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-semibold whitespace-nowrap">{formatDate(it.date)}</td>
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                          Internal Transfer
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">{fromP?.code} ➔ {toP?.code}</td>
                      <td className="py-2.5 px-4 text-slate-600">{it.reason}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-purple-700 font-bold" colSpan={2}>
                        ⇄ {formatCurrency(it.amount)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[10px] uppercase text-purple-800">TRANSFERRED</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
};


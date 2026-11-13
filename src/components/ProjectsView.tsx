'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Project } from '@/types';
import { 
  Building2, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  TrendingUp, 
  Truck, 
  Users, 
  ArrowLeftRight,
  Trash2,
  Ruler,
  Shield
} from 'lucide-react';
import { formatCurrency, formatCompactNumber } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface ProjectsViewProps {
  onOpenNewProject: () => void;
  onSelectProject: (project: Project) => void;
  onOpenClientPayment: (projectId: string) => void;
  onOpenProjectExpense: (projectId: string) => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenNewProject,
  onSelectProject,
  onOpenClientPayment,
  onOpenProjectExpense,
}) => {
  const { 
    projects, 
    clientPayments, 
    vendorTransactions, 
    projectExpenses, 
    internalTransactions,
    dailyWages,
    deleteProject,
    currentUserRole
  } = useData();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'on_hold'>('all');
  const [inchargeFilter, setInchargeFilter] = useState<string>('all');
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const inchargeNames = React.useMemo(() => {
    const list = projects.map((p) => p.assignedInchargeName).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [projects]);

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesIncharge = inchargeFilter === 'all' || p.assignedInchargeName === inchargeFilter || p.assignedInchargeId === inchargeFilter;
    return matchesSearch && matchesStatus && matchesIncharge;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Construction Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage site locations, client contracts, worker wages, and material cost ledgers.
          </p>
        </div>

        {currentUserRole !== 'Incharge' && (
          <button
            onClick={onOpenNewProject}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name, location, code, or client..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors shadow-sm"
          />
        </div>

        {/* Incharge Filter Dropdown */}
        <select
          value={inchargeFilter}
          onChange={(e) => setInchargeFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">All Incharges</option>
          {inchargeNames.map((name) => (
            <option key={name} value={name}>Incharge: {name}</option>
          ))}
        </select>

        <div className="flex items-center space-x-2">
          {(['all', 'active', 'completed', 'on_hold'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st === 'on_hold' ? 'On Hold' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((p) => {
          // Calculations
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

          // Internal Transfers
          const transfersIn = internalTransactions
            .filter((it) => it.toProjectId === p.id)
            .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

          const transfersOut = internalTransactions
            .filter((it) => it.fromProjectId === p.id)
            .reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

          const netInternal = transfersIn - transfersOut;

          // Cash balance for this project
          const totalDirectAndWages = directExp + wagesPaid;
          const totalSpent = totalDirectAndWages + vendorPaid;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProject(p)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group shadow-sm"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {p.code}
                      </span>
                      {p.siteArea ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <Ruler className="w-2.5 h-2.5 text-blue-600" />
                          <span>Site: {p.siteArea.toLocaleString()} {p.siteAreaUnit || 'sq.ft'}</span>
                        </span>
                      ) : null}
                      {p.buildupArea ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5 text-amber-600" />
                          <span>Build: {p.buildupArea.toLocaleString()} {p.buildupAreaUnit || 'sq.ft'}</span>
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
                      : p.status === 'completed'
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {p.status}
                  </span>
                </div>

                {/* Location & Incharge */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  {p.assignedInchargeName && (
                    <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded font-medium shrink-0 ml-2">
                      Incharge: {p.assignedInchargeName}
                    </span>
                  )}
                </div>

                {/* Client Contact Details Box */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client Contact Details</div>
                  <div className="text-xs font-bold text-slate-800">{p.clientName}</div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {p.clientPhone}
                    </span>
                    {p.clientEmail && (
                      <span className="flex items-center gap-1 truncate max-w-[130px] text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {p.clientEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial KPI Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                  
                  {/* Income */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                      <span>Client Income</span>
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-700 mt-1">
                      {formatCompactNumber(income)}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Budget: {formatCompactNumber(p.budget)}
                    </div>
                  </div>

                  {/* Vendor Spent */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                      <span>Vendor Paid</span>
                      <Truck className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="font-mono text-sm font-bold text-blue-700 mt-1">
                      {formatCompactNumber(vendorPaid)}
                    </div>
                    {vendorPending > 0 && (
                      <div className="text-[9px] text-rose-600 font-bold">
                        Due: {formatCompactNumber(vendorPending)}
                      </div>
                    )}
                  </div>

                  {/* Direct Wages/Expenses */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center justify-between">
                      <span>Wages & Direct</span>
                      <Users className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="font-mono text-sm font-bold text-amber-700 mt-1">
                      {formatCompactNumber(totalDirectAndWages)}
                    </div>
                    {wagesPending > 0 && (
                      <div className="text-[9px] text-rose-600 font-bold">
                        Wage Due: {formatCompactNumber(wagesPending)}
                      </div>
                    )}
                  </div>

                  {/* Internal Transfer KPI */}
                  <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200">
                    <div className="text-[10px] uppercase font-bold text-purple-800 flex items-center justify-between">
                      <span>Internal KPI</span>
                      <ArrowLeftRight className="w-3 h-3 text-purple-600" />
                    </div>
                    <div className={`font-mono text-sm font-bold mt-1 ${
                      netInternal > 0 ? 'text-emerald-700' : netInternal < 0 ? 'text-purple-700' : 'text-slate-500'
                    }`}>
                      {netInternal > 0 ? `+${formatCompactNumber(netInternal)}` : formatCompactNumber(netInternal)}
                    </div>
                    <div className="text-[9px] text-slate-500 flex justify-between mt-0.5">
                      <span>In: {formatCompactNumber(transfersIn)}</span>
                      <span>Out: {formatCompactNumber(transfersOut)}</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Spent</span>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {formatCompactNumber(totalSpent)}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenClientPayment(p.id);
                    }}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  >
                    + Income
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProjectExpense(p.id);
                    }}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors"
                  >
                    + Exp
                  </button>
                  {currentUserRole !== 'Incharge' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(p);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">No projects found</p>
          <p className="text-xs text-slate-500 mt-1">
            {currentUserRole === 'Incharge'
              ? 'No projects are assigned to your account yet. Please contact the administrator.'
              : 'Try a different search or create a new project above'}
          </p>
        </div>
      )}

      {/* Styled Delete Confirmation Dialog */}
      {projectToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Construction Project"
          itemName={`${projectToDelete.name} (${projectToDelete.code})`}
          description={`Permanently delete project "${projectToDelete.name}"? All associated client receipts, vendor materials, daily worker wage records, and direct expenses will also be removed immediately from the database and all financial calculations.`}
          confirmButtonText="Delete Project & All Data"
          onConfirm={() => deleteProject(projectToDelete.id)}
          onClose={() => setProjectToDelete(null)}
        />
      )}

    </div>
  );
};

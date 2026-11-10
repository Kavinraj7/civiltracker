'use client';

import React from 'react';
import { useData } from '@/lib/dataContext';
import { 
  Building2, 
  ArrowLeftRight, 
  TrendingUp,
  Truck,
  Users,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

interface NavbarProps {
  onOpenInternalTransfer: () => void;
  onOpenClientPayment: () => void;
  onOpenVendorTransaction: () => void;
  onOpenProjectExpense: () => void;
  activeTab: string;
  selectedProjectTitle?: string;
  onBackFromProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenInternalTransfer,
  onOpenClientPayment,
  onOpenVendorTransaction,
  onOpenProjectExpense,
  activeTab,
  selectedProjectTitle,
  onBackFromProject,
}) => {

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-3.5">
      <div className="flex items-center justify-between">
        
        {/* Left title & context / Breadcrumbs */}
        <div>
          {selectedProjectTitle ? (
            <div className="flex items-center space-x-2 text-sm">
              <button
                onClick={onBackFromProject}
                className="font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Projects</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                {selectedProjectTitle}
              </span>
            </div>
          ) : (
            <h2 className="text-sm font-bold text-slate-900 capitalize tracking-tight">
              {activeTab === 'dashboard'
                ? 'Executive Financial Dashboard'
                : activeTab === 'projects'
                ? 'Multi-Site Project Directory'
                : activeTab === 'vendors'
                ? 'Suppliers & Material Deliveries'
                : activeTab === 'internal'
                ? 'Inter-Project Fund Transfers'
                : activeTab === 'reports'
                ? 'Executive Operations & Financial Reports'
                : activeTab === 'users'
                ? 'Team & Incharges Management'
                : 'Audit & Financial Ledger'}
            </h2>
          )}
          <p className="text-[11px] text-slate-500">
            Organisation-wide operations, client receivables & vendor payables
          </p>
        </div>

        {/* Center / Right Shortcuts */}
        <div className="flex items-center space-x-2.5">
          
          {/* Quick Action Buttons */}
          <button
            onClick={onOpenClientPayment}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Client Payment</span>
          </button>

          <button
            onClick={onOpenVendorTransaction}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>+ Vendor Bill</span>
          </button>

          <button
            onClick={onOpenProjectExpense}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>+ Wages / Expense</span>
          </button>
        </div>

      </div>
    </header>
  );
};

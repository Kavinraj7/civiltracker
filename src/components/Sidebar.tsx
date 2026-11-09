'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Truck, 
  ArrowLeftRight, 
  ReceiptText,
  Building2,
  Wallet,
  BadgeAlert,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useData } from '@/lib/dataContext';
import { formatCompactNumber } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenInternalTransfer: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenInternalTransfer,
}) => {
  const { 
    projects, 
    vendors, 
    totalVendorPending, 
    netCashFlow,
    currentUser,
    logout 
  } = useData();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: FolderKanban,
      badge: projects.length.toString(),
    },
    {
      id: 'vendors',
      label: 'Vendors & Bills',
      icon: Truck,
      badge: vendors.length.toString(),
    },
    {
      id: 'internal',
      label: 'Internal Transfers',
      icon: ArrowLeftRight,
      badge: null,
    },
    {
      id: 'transactions',
      label: 'Financial Ledger',
      icon: ReceiptText,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 p-5 z-20">
      
      {/* Brand & Main Navigation */}
      <div className="space-y-6">
        
        {/* Organisation Brand Header */}
        <div className="flex items-center space-x-3 px-1 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Building2 className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base tracking-tight text-slate-900">
                CIVIL<span className="text-amber-600">CORP</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Org
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">Civil Operations Suite</p>
          </div>
        </div>

        {/* Navigation Tabs (Properly Spaced on Left) */}
        <div className="space-y-1.5">
          <div className="px-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Operations Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive
                        ? 'bg-slate-950/15 text-slate-950'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Inter-Project Transfer Action */}
        <div className="pt-2">
          <button
            onClick={onOpenInternalTransfer}
            className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl border border-dashed border-purple-300 bg-purple-50/60 hover:bg-purple-100/70 text-purple-700 text-xs font-bold transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>+ Internal Transfer</span>
          </button>
        </div>

      </div>

      {/* Bottom Profile & Financial Position Box */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        
        {/* Cash Position Snapshot Card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              Cash Position:
            </span>
            <span className={`font-mono text-xs font-bold ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {formatCompactNumber(netCashFlow)}
            </span>
          </div>

          {totalVendorPending > 0 && (
            <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 flex items-center gap-1">
                <BadgeAlert className="w-3 h-3 text-rose-500" />
                Vendor Due:
              </span>
              <span className="font-mono text-rose-600 font-bold">
                {formatCompactNumber(totalVendorPending)}
              </span>
            </div>
          )}
        </div>

        {/* Admin User info & Logout */}
        {currentUser && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                {currentUser.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 text-left">
                <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
                  <span>{currentUser.displayName || currentUser.email}</span>
                  <ShieldCheck className="w-3 h-3 text-amber-600 shrink-0" />
                </div>
                <div className="text-[10px] text-slate-400">Admin</div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </aside>
  );
};

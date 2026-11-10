'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Vendor } from '@/types';
import { 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  ArrowUpRight,
  Trash2
} from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface VendorsViewProps {
  onOpenNewVendor: () => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
  onSelectVendor: (vendor: Vendor) => void;
}

export const VendorsView: React.FC<VendorsViewProps> = ({
  onOpenNewVendor,
  onOpenVendorTransaction,
  onSelectVendor,
}) => {
  const { vendors, vendorTransactions, deleteVendor } = useData();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | null>(null);

  const categories = ['all', ...Array.from(new Set(vendors.map((v) => v.category)))];

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      (v.gstNumber && v.gstNumber.toLowerCase().includes(search.toLowerCase()));

    const matchesCat = categoryFilter === 'all' || v.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Suppliers & Vendor Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track material deliveries per project, invoice quantities, payments released, and pending payables.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onOpenVendorTransaction()}
            className="flex items-center space-x-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Material Delivery</span>
          </button>

          <button
            onClick={onOpenNewVendor}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Vendor</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor by company name, contact person, or GST..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => {
          const vTxList = vendorTransactions.filter((tx) => tx.vendorId === vendor.id);
          const totalBilled = vTxList.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
          const totalPaid = vTxList.reduce((sum, tx) => sum + (Number(tx.paidAmount) || 0), 0);
          const totalPending = vTxList.reduce((sum, tx) => sum + (Number(tx.pendingAmount) || 0), 0);
          const suppliedProjectIds = Array.from(new Set(vTxList.map((tx) => tx.projectId)));

          return (
            <div
              key={vendor.id}
              onClick={() => onSelectVendor(vendor)}
              className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all hover:shadow-md group shadow-sm"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                      {vendor.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {vendor.name}
                    </h3>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-amber-600">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>

                {/* Contact info */}
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                  <div className="text-slate-800 font-bold">{vendor.contactPerson}</div>
                  <div className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{vendor.phone}</span>
                  </div>
                  {vendor.gstNumber && (
                    <div className="text-[11px] font-mono text-slate-500 pt-0.5">
                      GST: {vendor.gstNumber}
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 mt-3.5 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Total Billed</div>
                    <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                      {formatCompactNumber(totalBilled)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Paid</div>
                    <div className="font-mono text-xs font-bold text-blue-700 mt-0.5">
                      {formatCompactNumber(totalPaid)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="text-[9px] uppercase font-bold text-slate-400">Pending Due</div>
                    <div className={`font-mono text-xs font-bold mt-0.5 ${
                      totalPending > 0 ? 'text-rose-600' : 'text-emerald-700'
                    }`}>
                      {totalPending > 0 ? formatCompactNumber(totalPending) : '₹0'}
                    </div>
                  </div>
                </div>

                {/* Projects supplied info */}
                <div className="mt-3.5 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{vTxList.length} Material Deliveries</span>
                  <span className="font-medium text-slate-600">{suppliedProjectIds.length} Site(s) Supplied</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-amber-700 font-bold flex items-center gap-1 group-hover:underline">
                  <span>View Material Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVendorTransaction(vendor.id);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200 transition-colors"
                  >
                    + Add Bill
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVendorToDelete(vendor);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
          <Truck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-700 font-bold">No vendors found</p>
          <p className="text-xs text-slate-500 mt-1">Try a different search or add a new vendor above</p>
        </div>
      )}

      {/* Styled Delete Confirmation Dialog */}
      {vendorToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Vendor & Material Bills"
          itemName={vendorToDelete.name}
          description={`Permanently delete vendor "${vendorToDelete.name}"? All material delivery invoices, bill records, and payment logs associated with this vendor will also be removed immediately from all project ledgers and financial calculations.`}
          confirmButtonText="Delete Vendor & Bills"
          onConfirm={() => deleteVendor(vendorToDelete.id)}
          onClose={() => setVendorToDelete(null)}
        />
      )}

    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Vendor, VendorTransaction } from '@/types';
import { 
  X, 
  Phone, 
  Truck, 
  Plus, 
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface VendorDetailModalProps {
  vendor: Vendor;
  onClose: () => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
}

export const VendorDetailModal: React.FC<VendorDetailModalProps> = ({
  vendor,
  onClose,
  onOpenVendorTransaction,
}) => {
  const { 
    vendorTransactions, 
    projects, 
    updateVendorTransactionPayment, 
    deleteVendorTransaction,
    deleteVendor
  } = useData();

  const [payingTxId, setPayingTxId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);
  const [txToDelete, setTxToDelete] = useState<VendorTransaction | null>(null);

  const transactions = vendorTransactions.filter((tx) => tx.vendorId === vendor.id);

  const totalBilled = transactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const totalPaid = transactions.reduce((sum, tx) => sum + (Number(tx.paidAmount) || 0), 0);
  const totalPending = transactions.reduce((sum, tx) => sum + (Number(tx.pendingAmount) || 0), 0);

  const handlePayBalance = async (tx: VendorTransaction) => {
    const val = Number(payAmount);
    if (!val || val <= 0) return;
    await updateVendorTransactionPayment(tx.id, val);
    setPayingTxId(null);
    setPayAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto text-slate-900">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-white">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
              {vendor.category}
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">{vendor.name}</h2>
            <div className="text-xs text-slate-600 flex items-center gap-3 mt-1">
              <span>Contact: <strong className="text-slate-800">{vendor.contactPerson}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                {vendor.phone}
              </span>
              {vendor.gstNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-500">GST: {vendor.gstNumber}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDeletingVendor(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Vendor</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Material Billed</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{formatCurrency(totalBilled)}</div>
            <div className="text-[11px] text-slate-500">{transactions.length} deliveries</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Payments Released</span>
            <div className="text-base font-bold text-blue-700 font-mono mt-0.5">{formatCurrency(totalPaid)}</div>
            <div className="text-[11px] text-slate-500">Total cleared</div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Current Outstanding (Due)</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${totalPending > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {formatCurrency(totalPending)}
            </div>
            <div className="text-[11px] text-slate-500">
              {totalPending > 0 ? 'Payable balance' : 'All accounts settled'}
            </div>
          </div>

          <div className="flex items-center sm:justify-end">
            <button
              onClick={() => onOpenVendorTransaction(vendor.id)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Record Material Delivery</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Material Supply & Payment Transactions Ledger
            </h3>
            <span className="text-xs text-slate-500">
              Assigned project, material name, quantities & payment status
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
              No transactions recorded for this vendor yet. Click "Record Material Delivery" above.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Project</th>
                    <th className="py-2.5 px-3">Material Supplied</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Paid Amount</th>
                    <th className="py-2.5 px-3">Pending Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => {
                    const proj = projects.find((p) => p.id === tx.projectId);
                    const isPaying = payingTxId === tx.id;
                    const isExpanded = expandedTxId === tx.id;
                    const hasItems = tx.items && tx.items.length > 0;

                    return (
                      <React.Fragment key={tx.id}>
                        <tr className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">{formatDate(tx.date)}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800">{proj?.name || 'Project'}</span>
                            <div className="text-[10px] font-mono text-amber-700 font-bold">{proj?.code}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-slate-900 font-medium">{tx.material}</span>
                            {tx.billNumber && (
                              <div className="text-[10px] text-slate-500 font-mono">Bill/DC: {tx.billNumber}</div>
                            )}
                            {hasItems && (
                              <button
                                onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                                className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                <span>{tx.items!.length} items</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-amber-800 font-semibold">
                            {tx.quantity} {tx.unit}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {formatCurrency(tx.totalAmount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-blue-700 font-semibold">
                            {formatCurrency(tx.paidAmount)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                            {tx.pendingAmount > 0 ? formatCurrency(tx.pendingAmount) : '₹0'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              tx.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : tx.paymentStatus === 'partial'
                                ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {tx.paymentStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {tx.pendingAmount > 0 && !isPaying && (
                                <button
                                  onClick={() => {
                                    setPayingTxId(tx.id);
                                    setPayAmount(tx.pendingAmount.toString());
                                  }}
                                  className="px-2 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-bold"
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
                                    onClick={() => handlePayBalance(tx)}
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
                                onClick={() => setTxToDelete(tx)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                                title="Delete delivery record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Line Items Product Drawer */}
                        {isExpanded && hasItems && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={9} className="p-3.5 pl-10 border-b border-slate-200">
                              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                                <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                                  Itemized Products Breakdown
                                </span>
                                <div className="divide-y divide-slate-100">
                                  {tx.items!.map((it, idx) => (
                                    <div key={it.id || idx} className="py-1.5 flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-400 font-mono">#{idx + 1}</span>
                                        <span className="font-bold text-slate-800">{it.material}</span>
                                      </div>
                                      <div className="flex items-center gap-3">
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

          {/* Bank & Payment Details */}
          {vendor.bankAccountDetails && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-700">Bank Details for Vendor Payment:</span>
                <span className="ml-2 font-mono text-slate-800">{vendor.bankAccountDetails}</span>
              </div>
              {vendor.panNumber && (
                <div className="font-mono text-slate-500">PAN: {vendor.panNumber}</div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Styled Vendor Delete Confirmation */}
      {isDeletingVendor && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Vendor & Material Bills"
          itemName={vendor.name}
          description={`Permanently delete vendor "${vendor.name}"? All ${transactions.length} delivery transactions and outstanding payables associated with this vendor will also be removed immediately.`}
          confirmButtonText="Delete Vendor & Records"
          onConfirm={async () => {
            await deleteVendor(vendor.id);
            onClose();
          }}
          onClose={() => setIsDeletingVendor(false)}
        />
      )}

      {/* Styled Transaction Delete Confirmation */}
      {txToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Delete Material Delivery Record"
          itemName={`${txToDelete.material} (${formatCurrency(txToDelete.totalAmount)})`}
          description="Are you sure you want to delete this delivery bill entry? Total project cost and vendor balance will be recalculated immediately."
          confirmButtonText="Delete Bill"
          onConfirm={async () => {
            await deleteVendorTransaction(txToDelete.id);
            setTxToDelete(null);
          }}
          onClose={() => setTxToDelete(null)}
        />
      )}

    </div>
  );
};

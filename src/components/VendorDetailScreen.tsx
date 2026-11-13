'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/dataContext';
import { Vendor, VendorTransaction } from '@/types';
import { 
  ArrowLeft,
  Phone, 
  Truck, 
  Plus, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Building2,
  Filter,
  CreditCard,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatCompactNumber, formatDate } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface VendorDetailScreenProps {
  vendor: Vendor;
  onBack: () => void;
  onOpenVendorTransaction: (vendorId?: string, projectId?: string) => void;
}

export const VendorDetailScreen: React.FC<VendorDetailScreenProps> = ({
  vendor,
  onBack,
  onOpenVendorTransaction,
}) => {
  const { 
    vendorTransactions, 
    projects, 
    updateVendorTransactionPayment, 
    markVendorTransactionPaid,
    deleteVendorTransaction,
    deleteVendor,
    currentUserRole
  } = useData();

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [inchargeFilter, setInchargeFilter] = useState<string>('all');
  const [payingTxId, setPayingTxId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);
  const [txToDelete, setTxToDelete] = useState<VendorTransaction | null>(null);

  const inchargeNames = useMemo(() => {
    const list = projects.map((p) => p.assignedInchargeName).filter(Boolean) as string[];
    return Array.from(new Set(list)).sort();
  }, [projects]);

  // All transactions for this vendor
  const allVendorTxs = useMemo(() => {
    return vendorTransactions.filter((tx) => tx.vendorId === vendor.id);
  }, [vendorTransactions, vendor.id]);

  // Projects where this vendor has deliveries
  const suppliedProjectIds = useMemo(() => {
    return Array.from(new Set(allVendorTxs.map((t) => t.projectId)));
  }, [allVendorTxs]);

  // Filtered transactions by project and incharge
  const filteredTransactions = useMemo(() => {
    return allVendorTxs.filter((tx) => {
      const matchesProject = projectFilter === 'all' || tx.projectId === projectFilter;
      const proj = projects.find((p) => p.id === tx.projectId);
      const matchesIncharge = inchargeFilter === 'all' || (proj && (proj.assignedInchargeName === inchargeFilter || proj.assignedInchargeId === inchargeFilter));
      return matchesProject && matchesIncharge;
    });
  }, [allVendorTxs, projectFilter, inchargeFilter, projects]);

  // Financial aggregates for the filtered view
  const totalBilled = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.totalAmount) || 0), 0);
  const totalPaid = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.paidAmount) || 0), 0);
  const totalPending = filteredTransactions.reduce((sum, tx) => sum + (Number(tx.pendingAmount) || 0), 0);

  // Partial pay balance handler
  const handlePayBalance = async (tx: VendorTransaction) => {
    const val = Number(payAmount);
    if (!val || val <= 0) return;
    await updateVendorTransactionPayment(tx.id, val);
    setPayingTxId(null);
    setPayAmount('');
  };

  const handleDeleteVendorConfirm = async () => {
    await deleteVendor(vendor.id);
    onBack();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Bar: Back to Vendors + Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Suppliers &amp; Vendors</span>
        </button>

        <div className="flex items-center space-x-2">
          {currentUserRole !== 'Incharge' && (
            <button
              onClick={() => setIsDeletingVendor(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Vendor</span>
            </button>
          )}

          <button
            onClick={() => onOpenVendorTransaction(vendor.id, projectFilter !== 'all' ? projectFilter : undefined)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Material Delivery</span>
          </button>
        </div>
      </div>

      {/* Main Vendor Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                {vendor.category}
              </span>
              {vendor.gstNumber && (
                <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  GST: {vendor.gstNumber}
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2">{vendor.name}</h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1.5">
              <span>Contact Person: <strong className="text-slate-800">{vendor.contactPerson}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{vendor.phone}</span>
              </span>
              {vendor.panNumber && (
                <>
                  <span>•</span>
                  <span className="font-mono text-slate-600">PAN: {vendor.panNumber}</span>
                </>
              )}
            </div>
          </div>

          {/* Bank Details Badge */}
          {vendor.bankAccountDetails && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 max-w-sm">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Vendor Bank &amp; Payment Details</span>
              </div>
              <div className="font-mono text-slate-800 font-semibold break-all">
                {vendor.bankAccountDetails}
              </div>
            </div>
          )}
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          {/* Total Billed */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Material Billed</span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {formatCurrency(totalBilled)}
            </div>
            <div className="text-[11px] text-slate-500">
              {filteredTransactions.length} delivery record{filteredTransactions.length === 1 ? '' : 's'}
            </div>
          </div>

          {/* Payments Released */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-blue-800">Payments Released</span>
            <div className="text-xl font-bold font-mono text-blue-800">
              {formatCurrency(totalPaid)}
            </div>
            <div className="text-[11px] text-blue-700">Total cleared funds</div>
          </div>

          {/* Current Outstanding Due */}
          <div className={`p-4 rounded-xl border space-y-1 ${
            totalPending > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-emerald-50/60 border-emerald-200'
          }`}>
            <span className={`text-[10px] uppercase font-bold ${
              totalPending > 0 ? 'text-rose-800' : 'text-emerald-800'
            }`}>
              Pending Payable Balance (Due)
            </span>
            <div className={`text-xl font-bold font-mono ${
              totalPending > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {formatCurrency(totalPending)}
            </div>
            <div className={`text-[11px] ${totalPending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {totalPending > 0 ? 'Outstanding to settle' : 'All accounts settled'}
            </div>
          </div>

          {/* Sites Supplied */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Project Coverage</span>
            <div className="text-xl font-bold font-mono text-slate-900">
              {suppliedProjectIds.length} Site{suppliedProjectIds.length === 1 ? '' : 's'}
            </div>
            <div className="text-[11px] text-slate-500">Active project destinations</div>
          </div>
        </div>
      </div>

      {/* Transactions Ledger with Project Filter Option */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
        
        {/* Ledger Header & Filter Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              <span>Material Deliveries &amp; Payment Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              View all materials supplied, vehicle transport charges, and settle pending balances
            </p>
          </div>

          {/* PROJECT & INCHARGE FILTER DROPDOWNS */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Project:</span>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Projects ({allVendorTxs.length} Deliveries)</option>
                {projects.map((p) => {
                  const count = allVendorTxs.filter((t) => t.projectId === p.id).length;
                  return (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code}) — {count} bill{count === 1 ? '' : 's'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Incharge:</span>
              <select
                value={inchargeFilter}
                onChange={(e) => setInchargeFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Incharges</option>
                {inchargeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs space-y-2">
            <Truck className="w-8 h-8 mx-auto text-slate-400 stroke-1" />
            <div className="font-bold text-slate-700">No Material Deliveries Found</div>
            <p>
              {projectFilter === 'all'
                ? 'No bills recorded for this vendor yet. Click "+ Add Material Delivery" to add the first bill.'
                : 'No deliveries recorded for this specific project yet.'}
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                <tr>
                  <th className="py-3 px-3.5">Date</th>
                  <th className="py-3 px-3.5">Destination Project</th>
                  <th className="py-3 px-3.5">Material &amp; Deliveries</th>
                  <th className="py-3 px-3.5">Total Billed</th>
                  <th className="py-3 px-3.5">Paid</th>
                  <th className="py-3 px-3.5">Pending Due</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const proj = projects.find((p) => p.id === tx.projectId);
                  const isPaying = payingTxId === tx.id;
                  const isExpanded = expandedTxId === tx.id;
                  const hasItems = tx.items && tx.items.length > 0;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900">{proj?.name || 'Project'}</span>
                          <div className="text-[10px] font-mono text-amber-700 font-bold">{proj?.code}</div>
                        </td>

                        <td className="py-3 px-3.5 max-w-xs">
                          <span className="text-slate-900 font-medium">{tx.material}</span>
                          {tx.billNumber && (
                            <div className="text-[10px] text-slate-500 font-mono">Bill/DC: {tx.billNumber}</div>
                          )}
                          {(Number(tx.transportCharges) > 0 || Number(tx.serviceCharge) > 0) && (
                            <div className="text-[10px] text-slate-500 space-x-1.5 mt-0.5">
                              {Number(tx.transportCharges) > 0 && (
                                <span className="inline-block bg-slate-100 text-slate-700 px-1 py-0.5 rounded">
                                  Transport: {formatCurrency(tx.transportCharges || 0)} ({tx.transportVehicleType || 'Vehicle'})
                                </span>
                              )}
                              {Number(tx.serviceCharge) > 0 && (
                                <span className="inline-block bg-slate-100 text-slate-700 px-1 py-0.5 rounded">
                                  Service: {formatCurrency(tx.serviceCharge || 0)}
                                </span>
                              )}
                            </div>
                          )}
                          {hasItems && (
                            <button
                              onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                              className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-0.5 mt-1"
                            >
                              <span>{tx.items!.length} product{tx.items!.length > 1 ? 's' : ''} breakdown</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                          {formatCurrency(tx.totalAmount)}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-semibold text-blue-700 whitespace-nowrap">
                          {formatCurrency(tx.paidAmount)}
                        </td>

                        <td className="py-3 px-3.5 font-mono font-bold text-rose-600 whitespace-nowrap">
                          {tx.pendingAmount > 0 ? formatCurrency(tx.pendingAmount) : '₹0'}
                        </td>

                        <td className="py-3 px-3.5 whitespace-nowrap">
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

                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-1.5">
                            {tx.pendingAmount > 0 && !isPaying && (
                              <>
                                <button
                                  onClick={() => markVendorTransactionPaid(tx.id)}
                                  className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-colors"
                                  title="Mark as fully paid"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => {
                                    setPayingTxId(tx.id);
                                    setPayAmount(tx.pendingAmount.toString());
                                  }}
                                  className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-medium"
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
                              className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
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
                          <td colSpan={8} className="p-3.5 pl-10 border-b border-slate-200">
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
                                {Number(tx.transportCharges) > 0 && (
                                  <div className="py-1.5 flex items-center justify-between text-xs text-slate-700 bg-slate-50/70 px-2 rounded">
                                    <span className="font-semibold">Transport Charges ({tx.transportVehicleType || 'Vehicle'})</span>
                                    <span className="font-mono font-bold text-slate-800">
                                      {formatCurrency(tx.transportCharges || 0)}
                                    </span>
                                  </div>
                                )}
                                {Number(tx.serviceCharge) > 0 && (
                                  <div className="py-1.5 flex items-center justify-between text-xs text-slate-700 bg-slate-50/70 px-2 rounded">
                                    <span className="font-semibold">Service Charge</span>
                                    <span className="font-mono font-bold text-slate-800">
                                      {formatCurrency(tx.serviceCharge || 0)}
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

      {/* Delete Vendor Confirmation Modal */}
      {isDeletingVendor && (
        <ConfirmDeleteModal
          isOpen={isDeletingVendor}
          title="Delete Vendor Profile"
          itemName={vendor.name}
          description="Are you sure you want to permanently remove this vendor? All delivery records, pending bills, and ledger history for this vendor will be deleted immediately."
          onConfirm={handleDeleteVendorConfirm}
          onClose={() => setIsDeletingVendor(false)}
        />
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <ConfirmDeleteModal
          isOpen={!!txToDelete}
          title="Delete Delivery Record"
          itemName={`${txToDelete.material} (${formatCurrency(txToDelete.totalAmount)})`}
          description="Are you sure you want to delete this vendor delivery bill? Vendor billed totals and project cost calculations will recalculate immediately."
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

'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/lib/dataContext';
import { X, Truck, AlertCircle, Plus, Trash2, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { VendorBillItem } from '@/types';

interface VendorTransactionModalProps {
  initialVendorId?: string;
  initialProjectId?: string;
  onClose: () => void;
}

const COMMON_UNITS = ['MT', 'Bags', 'Cu.M', 'Trips', 'Brass', 'Pieces', 'Hours', 'Sq.Ft', 'Kg', 'Litres'];

interface LineItemRow {
  id: string;
  material: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
}

export const VendorTransactionModal: React.FC<VendorTransactionModalProps> = ({
  initialVendorId,
  initialProjectId,
  onClose,
}) => {
  const { vendors, projects, addVendorTransaction } = useData();

  const [vendorId, setVendorId] = useState<string>(initialVendorId || vendors[0]?.id || '');
  const [projectId, setProjectId] = useState<string>(initialProjectId || projects[0]?.id || '');
  const [billNumber, setBillNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  // Transport and Service Charges
  const [transportVehicleType, setTransportVehicleType] = useState<string>('');
  const [transportCharges, setTransportCharges] = useState<string>('');
  const [serviceCharge, setServiceCharge] = useState<string>('');

  // Multi-product items state
  const [items, setItems] = useState<LineItemRow[]>([
    { id: 'item-1', material: '', quantity: '1', unit: 'MT', pricePerUnit: '' },
  ]);

  const [paidAmount, setPaidAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Add line item
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'item-' + Date.now(),
        material: '',
        quantity: '1',
        unit: prev[prev.length - 1]?.unit || 'MT',
        pricePerUnit: '',
      },
    ]);
  };

  // Remove line item
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item field
  const handleUpdateItem = (id: string, field: keyof LineItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Dynamic calculation of materials subtotal and grand total
  const materialsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.pricePerUnit) || 0;
      return sum + q * p;
    }, 0);
  }, [items]);

  const numTransport = Number(transportCharges) || 0;
  const numService = Number(serviceCharge) || 0;
  const totalAmount = materialsSubtotal + numTransport + numService;
  const numPaid = Number(paidAmount) || 0;
  const pendingAmount = Math.max(0, totalAmount - numPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }
    if (!projectId) {
      setError('Please select which project this material is being sent to');
      return;
    }

    // Validate products
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.material.trim()) {
        setError(`Please enter the product/material name for item #${i + 1}`);
        return;
      }
      const q = Number(item.quantity);
      if (!q || q <= 0) {
        setError(`Please enter a valid quantity for item #${i + 1} (${item.material})`);
        return;
      }
      const p = Number(item.pricePerUnit);
      if (!p || p < 0) {
        setError(`Please enter a valid unit price for item #${i + 1} (${item.material})`);
        return;
      }
    }

    // Vehicle and Service Charge are strictly mandatory
    if (!transportVehicleType.trim()) {
      setError('Transport Vehicle Type is required (e.g. Tipper Lorry, Tractor, Tata Ace)');
      return;
    }
    if (transportCharges.trim() === '' || isNaN(Number(transportCharges))) {
      setError('Transport Charges (₹) is required (enter 0 if free / included)');
      return;
    }
    if (serviceCharge.trim() === '' || isNaN(Number(serviceCharge))) {
      setError('Service Charge (₹) is required (enter 0 if not applicable)');
      return;
    }

    if (totalAmount <= 0) {
      setError('Grand total bill amount must be greater than 0');
      return;
    }

    if (numPaid > totalAmount) {
      setError('Paid amount cannot exceed the total bill amount');
      return;
    }

    // Build items payload
    const structuredItems: VendorBillItem[] = items.map((it) => {
      const q = Number(it.quantity) || 0;
      const p = Number(it.pricePerUnit) || 0;
      return {
        id: it.id,
        material: it.material.trim(),
        quantity: q,
        unit: it.unit,
        pricePerUnit: p,
        total: q * p,
      };
    });

    // Summary description
    const materialSummary =
      structuredItems.length === 1
        ? `${structuredItems[0].material} (${structuredItems[0].quantity} ${structuredItems[0].unit})`
        : structuredItems
            .map((it) => `${it.material} (${it.quantity} ${it.unit})`)
            .join(', ');

    const totalQty = structuredItems.reduce((sum, it) => sum + it.quantity, 0);

    try {
      setLoading(true);
      const vtxData: any = {
        vendorId,
        projectId,
        material: materialSummary,
        quantity: totalQty,
        unit: structuredItems[0]?.unit || 'Units',
        totalAmount,
        paidAmount: numPaid,
        items: structuredItems,
        transportVehicleType: transportVehicleType.trim() || undefined,
        transportCharges: numTransport > 0 ? numTransport : 0,
        serviceCharge: numService > 0 ? numService : 0,
        date,
      };
      if (billNumber.trim()) vtxData.billNumber = billNumber.trim();
      if (notes.trim()) vtxData.notes = notes.trim();

      await addVendorTransaction(vtxData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record vendor bill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[96vh] flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Vendor Bill & Delivery</h2>
              <p className="text-xs text-slate-500">
                Products, quantities, mandatory vehicle & service charges, with automatic total calculation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Top 4-Column Selectors: Vendor, Project, Bill No, Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Select Vendor / Supplier *</label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm text-xs"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Destination Site *
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm text-xs"
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Challan / Bill No.
              </label>
              <input
                type="text"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. DC-9842, INV-04"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Bill / Delivery Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm text-xs"
              />
            </div>
          </div>

          {/* Products & Line Items Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-sm">Products & Materials In This Bill</span>
                <p className="text-[11px] text-slate-500">
                  Add multiple materials. Quantity × Unit Price will automatically calculate line totals and grand total.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Line items list */}
            <div className="space-y-3">
              {items.map((item, index) => {
                const lineTotal = (Number(item.quantity) || 0) * (Number(item.pricePerUnit) || 0);

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                      <span>Product #{index + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
                          title="Remove product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                      {/* Product Name */}
                      <div className="sm:col-span-5">
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                          Material / Product Name *
                        </label>
                        <input
                          type="text"
                          value={item.material}
                          onChange={(e) => handleUpdateItem(item.id, 'material', e.target.value)}
                          placeholder="e.g. TMT Steel 16mm Fe-550D, OPC 53G Cement"
                          required
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                          placeholder="Qty"
                          required
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* Unit */}
                      <div className="sm:col-span-2">
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                          Unit *
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-500"
                        >
                          {COMMON_UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Unit Price */}
                      <div className="sm:col-span-3">
                        <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                          Price / Unit (₹) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.pricePerUnit}
                          onChange={(e) => handleUpdateItem(item.id, 'pricePerUnit', e.target.value)}
                          placeholder="Rate"
                          required
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Line item subtotal badge */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-500 font-medium">
                        {item.quantity || 0} {item.unit} × {formatCurrency(Number(item.pricePerUnit) || 0)}
                      </span>
                      <div className="font-mono font-bold text-slate-800">
                        Item Total: <span className="text-blue-700">{formatCurrency(lineTotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Button to add another item */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 border border-dashed border-blue-300 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 text-blue-700 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Product to this Bill</span>
              </button>
            </div>
          </div>

          {/* Transport & Additional Charges Section */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Transport & Service Charges
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Added directly into the final bill total
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Transport Vehicle Type */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Transport Vehicle Type *
                </label>
                <input
                  type="text"
                  value={transportVehicleType}
                  onChange={(e) => setTransportVehicleType(e.target.value)}
                  placeholder="e.g. Tipper Lorry, Tractor, Tata Ace, 10-Wheeler"
                  list="vehicle-suggestions"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs"
                />
                <datalist id="vehicle-suggestions">
                  <option value="Tipper Lorry" />
                  <option value="Tractor" />
                  <option value="Tata Ace" />
                  <option value="Pickup Truck" />
                  <option value="10-Wheeler Truck" />
                  <option value="12-Wheeler Truck" />
                  <option value="Mini Truck" />
                </datalist>
              </div>

              {/* Transport Charges */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Transport Charges (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={transportCharges}
                  onChange={(e) => setTransportCharges(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>

              {/* Service Charge */}
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  Service Charge (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={serviceCharge}
                  onChange={(e) => setServiceCharge(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
            </div>

            {(numTransport > 0 || numService > 0) && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-600 border-t border-slate-200">
                <span>Materials Subtotal: <strong className="font-mono text-slate-800">{formatCurrency(materialsSubtotal)}</strong></span>
                <span className="text-blue-700 font-medium">
                  + Transport: {formatCurrency(numTransport)} | + Service: {formatCurrency(numService)}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Grid: Payment details & Grand Total Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            {/* Left 7 cols: Payment & Notes */}
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Amount Paid Now (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00 (Leave 0 if unpaid)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>
                <div>
                  <span className="block text-slate-700 font-bold mb-1">
                    Pending Balance:
                  </span>
                  <div className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg flex items-center justify-between text-xs">
                    <span className={`font-mono font-bold ${pendingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatCurrency(pendingAmount)}
                    </span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      pendingAmount === 0 && totalAmount > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : numPaid > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {pendingAmount === 0 && totalAmount > 0 ? 'Fully Paid' : numPaid > 0 ? 'Partial' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Delivery Notes / Remarks</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Truck No. DL-01-AB-1234, driver contact, challan verified"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm text-xs"
                />
              </div>
            </div>

            {/* Right 5 cols: Compact Grand Total Box */}
            <div className="lg:col-span-5 bg-slate-900 text-white rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs uppercase font-bold text-slate-400 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    Bill Total ({items.length} item{items.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Materials:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(materialsSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transport ({transportVehicleType || 'Vehicle'}):</span>
                    <span className="font-mono text-slate-200">{formatCurrency(numTransport)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct Service Charge:</span>
                    <span className="font-mono text-slate-200">{formatCurrency(numService)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end space-x-2.5 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'Recording...' : `Record Bill (${formatCurrency(totalAmount)})`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

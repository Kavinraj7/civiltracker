'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Vendor } from '@/types';
import { X, Truck, AlertCircle } from 'lucide-react';

interface NewVendorModalProps {
  onClose: () => void;
}

const COMMON_CATEGORIES = [
  'TMT Steel & Rebars',
  'Ready-Mix Concrete (RMC)',
  'Cement & Aggregates',
  'Sand & M-Sand',
  'Bricks & AAC Blocks',
  'Heavy Equipment & Crane Hire',
  'Shuttering & Scaffolding',
  'Electrical & Plumbing Materials',
  'Hardware, Paint & Chemicals',
  'Subcontractor / Labor',
  'Other Materials',
];

export const NewVendorModal: React.FC<NewVendorModalProps> = ({ onClose }) => {
  const { addVendor } = useData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankAccountDetails, setBankAccountDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide vendor / company name');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide vendor phone number');
      return;
    }

    const finalCat = category === 'Other Materials' && customCategory.trim() ? customCategory.trim() : category;

    try {
      setLoading(true);
      const vendorData: Omit<Vendor, 'id' | 'createdAt'> = {
        name: name.trim(),
        category: finalCat,
        contactPerson: contactPerson.trim() || name.trim(),
        phone: phone.trim(),
      };
      if (email.trim()) vendorData.email = email.trim();
      if (address.trim()) vendorData.address = address.trim();
      if (gstNumber.trim()) vendorData.gstNumber = gstNumber.trim().toUpperCase();
      if (panNumber.trim()) vendorData.panNumber = panNumber.trim().toUpperCase();
      if (bankAccountDetails.trim()) vendorData.bankAccountDetails = bankAccountDetails.trim();

      await addVendor(vendorData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create vendor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Supplier / Vendor</h2>
              <p className="text-xs text-slate-500">Company details, material categories & billing credentials</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Vendor Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Vendor / Firm Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jindal Steel Traders, Ultratech Hub"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Material / Supply Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {COMMON_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {category === 'Other Materials' && (
            <div>
              <label className="block text-slate-700 font-bold mb-1">Specify Custom Category</label>
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Waterproofing Chemicals, Safety Netting"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Contact Person Name <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Suresh Kumar"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Email & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="orders@vendor.com"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Warehouse / Depot Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Industrial Area, City"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* GST & PAN (Explicitly Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                GSTIN Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="e.g. 27AABCK1234F1Z8 (Optional)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                PAN Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
                placeholder="e.g. AABCK1234F (Optional)"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 uppercase font-mono placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bank Details (Explicitly Optional) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Bank Payment Details <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={bankAccountDetails}
              onChange={(e) => setBankAccountDetails(e.target.value)}
              placeholder="e.g. Bank name, A/C No, IFSC (Optional)"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Vendor'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

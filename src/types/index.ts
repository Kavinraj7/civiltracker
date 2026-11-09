export interface Project {
  id: string;
  name: string;
  code: string;
  location: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientAddress?: string;
  budget: number; // Contract / Estimated project value
  status: 'active' | 'completed' | 'on_hold';
  startDate: string;
  targetEndDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ClientPayment {
  id: string;
  projectId: string;
  amount: number;
  date: string;
  paymentMode: 'Bank Transfer (NEFT/RTGS)' | 'UPI' | 'Cheque' | 'Cash' | 'Demand Draft';
  referenceNo: string; // Cheque No, UTR, Txn ID
  invoiceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string; // e.g., Cement, TMT Steel, Sand, RMC, Bricks, Equipment Rental, Labor Contractor, Electrical
  phone: string;
  email?: string;
  contactPerson: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountDetails?: string;
  createdAt: string;
}

export interface VendorBillItem {
  id: string;
  material: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  total: number;
}

export interface VendorTransaction {
  id: string;
  vendorId: string;
  projectId: string; // Which project the material/service was supplied to
  items?: VendorBillItem[]; // Multiple products in this bill
  material: string; // Summary or primary material description
  quantity?: number;
  unit?: string;
  ratePerUnit?: number;
  totalAmount: number; // Total invoice / purchase bill amount
  paidAmount: number; // How much has been paid so far
  pendingAmount: number; // Auto calculated: totalAmount - paidAmount
  billNumber?: string; // Delivery challan or tax invoice number
  date: string;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  createdAt: string;
}

export interface ProjectExpense {
  id: string;
  projectId: string;
  category: 
    | 'Worker Wages / Labor'
    | 'Site Fuel & Diesel'
    | 'Equipment & Machinery Hire'
    | 'Site Petty Cash & Sundries'
    | 'Transport & Freight'
    | 'Permits, Testing & Approvals'
    | 'Safety & Site Utilities'
    | 'Subcontractor / Masonry'
    | 'Other Direct Expense';
  amount: number;
  paidTo: string; // Worker name, labor gang head, machine driver, etc.
  date: string;
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  voucherNo?: string;
  notes?: string;
  createdAt: string;
}

export interface InternalTransaction {
  id: string;
  fromProjectId: string;
  toProjectId: string;
  amount: number;
  date: string;
  reason: string;
  referenceNo?: string;
  createdAt: string;
}

export interface UserRole {
  email: string;
  role: 'admin' | 'viewer';
  name?: string;
}

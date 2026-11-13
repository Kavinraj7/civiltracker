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

  // Site area (Square Feet or Ground)
  siteArea?: number;
  siteAreaUnit?: 'sq.ft' | 'ground';

  // Buildup area (Square Feet or Ground)
  buildupArea?: number;
  buildupAreaUnit?: 'sq.ft' | 'ground';

  // Fixed daily wages for workers on this site (₹ per day)
  contractorWage?: number; // Contractor / Gang Head
  maesthriWage?: number;   // Master Mason
  gentsWage?: number;      // Male helper / Coolie
  ladiesWage?: number;     // Female helper / Chittal

  // Assigned Incharge (Role based access)
  assignedInchargeId?: string;
  assignedInchargeName?: string;
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

  // Transport details (vehicle type and freight charges)
  transportVehicleType?: string;
  transportCharges?: number;

  // Direct service charge
  serviceCharge?: number;

  totalAmount: number; // Total invoice / purchase bill amount (material + transport + service charge)
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
  status: 'paid' | 'unpaid'; // All transaction expenses in all categories have mark as paid; unpaid until settled
  paidDate?: string;
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

export interface ExtraWorkerWage {
  id: string;
  nameOrRole: string; // e.g. "Electrician", "Bar Bender", "JCB Driver", "Tile Layer"
  count: number;
  ratePerDay: number;
  total: number;
  category?: 'Contractor' | 'Daily Wage';
}

export interface DailyWageEntry {
  id: string;
  projectId: string;
  date: string;

  // Contractor
  contractorCount?: number;
  contractorRate?: number;
  contractorTotal?: number;

  // Maesthri
  maesthriCount: number;
  maesthriRate: number;
  maesthriTotal: number;

  // Gents
  gentsCount: number;
  gentsRate: number;
  gentsTotal: number;

  // Ladies
  ladiesCount: number;
  ladiesRate: number;
  ladiesTotal: number;

  // Extra persons
  extraWorkers?: ExtraWorkerWage[];
  extraWorkersTotal: number;

  // Grand total for the day
  totalAmount: number;
  status: 'paid' | 'pending';
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Owner' | 'Incharge';
  createdAt: string;
}

export interface BillingPackage {
  id: string;
  packageNumber: string; // e.g. "PKG-2026-W46-PRJ01"
  title: string;          // e.g. "Weekly Site Billing: 05 Nov - 11 Nov 2026"
  projectId: string;
  projectName?: string;
  projectCode?: string;
  startDate: string;
  endDate: string;
  createdAt: string;

  // Bill IDs included in this package:
  vendorTransactionIds: string[];
  dailyWageIds: string[];
  projectExpenseIds: string[];

  // Aggregated financial amounts:
  totalVendorAmount: number;
  totalWagesAmount: number;
  totalExpensesAmount: number;
  grandTotal: number;

  // Package payment status
  status: 'unpaid' | 'paid';
  paidAt?: string;
  notes?: string;
}

export interface UserRole {
  email: string;
  role: 'admin' | 'viewer';
  name?: string;
}

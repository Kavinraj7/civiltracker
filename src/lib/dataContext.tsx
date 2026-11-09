'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import { 
  Project, 
  Vendor, 
  VendorTransaction, 
  ClientPayment, 
  ProjectExpense, 
  InternalTransaction 
} from '@/types';
import { initFirebase } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  Firestore
} from 'firebase/firestore';

interface DataContextType {
  // Current user & auth state
  currentUser: { email: string; uid: string; displayName?: string } | null;
  authLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  
  // Firebase configuration status
  isFirebaseActive: boolean;
  firebaseError: string | null;
  refreshFirebase: () => void;

  // Data collections
  projects: Project[];
  vendors: Vendor[];
  vendorTransactions: VendorTransaction[];
  clientPayments: ClientPayment[];
  projectExpenses: ProjectExpense[];
  internalTransactions: InternalTransaction[];

  // Mutations
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => Promise<string>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  addVendor: (v: Omit<Vendor, 'id' | 'createdAt'>) => Promise<string>;
  updateVendor: (id: string, v: Partial<Vendor>) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;

  addVendorTransaction: (tx: Omit<VendorTransaction, 'id' | 'createdAt' | 'pendingAmount' | 'paymentStatus'> & { paidAmount?: number }) => Promise<string>;
  updateVendorTransactionPayment: (id: string, additionalPaid: number) => Promise<void>;
  deleteVendorTransaction: (id: string) => Promise<void>;

  addClientPayment: (pay: Omit<ClientPayment, 'id' | 'createdAt'>) => Promise<string>;
  deleteClientPayment: (id: string) => Promise<void>;

  addProjectExpense: (exp: Omit<ProjectExpense, 'id' | 'createdAt'>) => Promise<string>;
  deleteProjectExpense: (id: string) => Promise<void>;

  addInternalTransaction: (tx: Omit<InternalTransaction, 'id' | 'createdAt'>) => Promise<string>;
  deleteInternalTransaction: (id: string) => Promise<void>;

  clearAllData: () => void;
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;

  // Global KPIs computed
  totalClientIncome: number;
  totalVendorPaid: number;
  totalVendorBilled: number;
  totalVendorPending: number;
  totalDirectExpenses: number;
  totalExpenses: number;
  netCashFlow: number;
  totalInternalTransfersVolume: number;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'civil_projects_clean',
  VENDORS: 'civil_vendors_clean',
  VENDOR_TX: 'civil_vendor_tx_clean',
  CLIENT_PAY: 'civil_client_pay_clean',
  PROJECT_EXP: 'civil_project_exp_clean',
  INTERNAL_TX: 'civil_internal_tx_clean',
  LOCAL_USER: 'civil_local_user_clean',
};

/**
 * Strips all `undefined` fields recursively before sending objects to Firestore.
 * Firestore throws: "Function setDoc() called with invalid data. Unsupported field value: undefined"
 * if any property is undefined.
 */
function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(cleanForFirestore) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Safely adds or updates an item in state by its unique ID.
 * Guarantees instantaneous, 100% responsive UI (0ms latency) while preventing
 * duplicate entries when Firestore's real-time snapshot listener arrives.
 */
function upsertItem<T extends { id: string }>(list: T[], newItem: T): T[] {
  const index = list.findIndex((item) => item.id === newItem.id);
  if (index >= 0) {
    const updated = [...list];
    updated[index] = newItem;
    return updated;
  }
  return [newItem, ...list];
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<{ email: string; uid: string; displayName?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isFirebaseActive, setIsFirebaseActive] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);

  // Entities state - Starts completely empty (no mock data)
  const [projects, setProjects] = useState<Project[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorTransactions, setVendorTransactions] = useState<VendorTransaction[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [internalTransactions, setInternalTransactions] = useState<InternalTransaction[]>([]);

  // Refs to hold current unsubscription handlers to prevent duplicate listeners
  const authUnsubRef = useRef<(() => void) | null>(null);
  const firestoreUnsubRef = useRef<(() => void) | null>(null);
  const initialLoadedRef = useRef(false);

  // Stop real-time firestore listeners
  const stopFirestoreListeners = () => {
    if (firestoreUnsubRef.current) {
      try {
        firestoreUnsubRef.current();
      } catch (err) {
        console.warn('Error unsubscribing firestore listeners:', err);
      }
      firestoreUnsubRef.current = null;
    }
  };

  // Start real-time Firestore listeners for collections
  const startFirestoreListeners = (db: Firestore) => {
    stopFirestoreListeners();

    try {
      // Projects Listener
      const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snap) => {
        const map = new Map<string, Project>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as Project));
        const list = Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setProjects(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Projects snapshot listener error:', err.message);
      });

      // Vendors Listener
      const unsubVendors = onSnapshot(query(collection(db, 'vendors')), (snap) => {
        const map = new Map<string, Vendor>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as Vendor));
        const list = Array.from(map.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setVendors(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Vendors snapshot listener error:', err.message);
      });

      // Vendor Transactions Listener
      const unsubVtx = onSnapshot(query(collection(db, 'vendor_transactions')), (snap) => {
        const map = new Map<string, VendorTransaction>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as VendorTransaction));
        const list = Array.from(map.values()).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
        setVendorTransactions(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Vendor tx snapshot listener error:', err.message);
      });

      // Client Payments Listener
      const unsubCp = onSnapshot(query(collection(db, 'client_payments')), (snap) => {
        const map = new Map<string, ClientPayment>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as ClientPayment));
        const list = Array.from(map.values()).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
        setClientPayments(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Client payments snapshot listener error:', err.message);
      });

      // Project Expenses Listener
      const unsubPe = onSnapshot(query(collection(db, 'project_expenses')), (snap) => {
        const map = new Map<string, ProjectExpense>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as ProjectExpense));
        const list = Array.from(map.values()).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
        setProjectExpenses(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Project expenses snapshot listener error:', err.message);
      });

      // Internal Transactions Listener
      const unsubItx = onSnapshot(query(collection(db, 'internal_transactions')), (snap) => {
        const map = new Map<string, InternalTransaction>();
        snap.forEach((d) => map.set(d.id, { ...d.data(), id: d.id } as InternalTransaction));
        const list = Array.from(map.values()).sort((a, b) => (b.date || b.createdAt || '').localeCompare(a.date || a.createdAt || ''));
        setInternalTransactions(list);
        initialLoadedRef.current = true;
      }, (err) => {
        console.warn('Internal tx snapshot listener error:', err.message);
      });

      firestoreUnsubRef.current = () => {
        unsubProjects();
        unsubVendors();
        unsubVtx();
        unsubCp();
        unsubPe();
        unsubItx();
      };
    } catch (err) {
      console.warn('Failed to start Firestore listeners:', err);
    }
  };

  // Function to load from LocalStorage
  const loadFromLocalStorage = () => {
    try {
      localStorage.removeItem('civil_projects_v1');
      localStorage.removeItem('civil_vendors_v1');
      localStorage.removeItem('civil_vendor_tx_v1');
      localStorage.removeItem('civil_client_pay_v1');
      localStorage.removeItem('civil_project_exp_v1');
      localStorage.removeItem('civil_internal_tx_v1');

      const p = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      const v = localStorage.getItem(STORAGE_KEYS.VENDORS);
      const vtx = localStorage.getItem(STORAGE_KEYS.VENDOR_TX);
      const cp = localStorage.getItem(STORAGE_KEYS.CLIENT_PAY);
      const pe = localStorage.getItem(STORAGE_KEYS.PROJECT_EXP);
      const itx = localStorage.getItem(STORAGE_KEYS.INTERNAL_TX);

      setProjects(p ? JSON.parse(p) : []);
      setVendors(v ? JSON.parse(v) : []);
      setVendorTransactions(vtx ? JSON.parse(vtx) : []);
      setClientPayments(cp ? JSON.parse(cp) : []);
      setProjectExpenses(pe ? JSON.parse(pe) : []);
      setInternalTransactions(itx ? JSON.parse(itx) : []);
      initialLoadedRef.current = true;
    } catch (e) {
      console.error('LocalStorage read error:', e);
      setProjects([]);
      setVendors([]);
      setVendorTransactions([]);
      setClientPayments([]);
      setProjectExpenses([]);
      setInternalTransactions([]);
      initialLoadedRef.current = true;
    }
  };

  // Setup Firebase or Local
  const setupConnections = () => {
    // Unsubscribe any previous active auth listener
    if (authUnsubRef.current) {
      try {
        authUnsubRef.current();
      } catch (err) {
        console.warn('Error unsubscribing previous auth listener:', err);
      }
      authUnsubRef.current = null;
    }
    stopFirestoreListeners();

    const { auth, db, isConfigured } = initFirebase();

    if (isConfigured && auth && db) {
      setIsFirebaseActive(true);
      setFirebaseError(null);

      // Listen to auth state changes
      const unsubAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser && fbUser.email) {
          setCurrentUser({
            email: fbUser.email,
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
          });
          // Authenticated: start real-time Firestore listeners immediately
          startFirestoreListeners(db);
        } else {
          setCurrentUser(null);
          stopFirestoreListeners();
        }
        setAuthLoading(false);
      });

      authUnsubRef.current = unsubAuth;
      return () => {
        unsubAuth();
        stopFirestoreListeners();
      };
    } else {
      // Firebase not configured: fallback to local storage
      setIsFirebaseActive(false);
      loadFromLocalStorage();

      // Check local user session
      const savedUser = localStorage.getItem(STORAGE_KEYS.LOCAL_USER);
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
      return () => {};
    }
  };

  useEffect(() => {
    const cleanup = setupConnections();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const refreshFirebase = () => {
    setupConnections();
  };

  // Sync to local storage only after initial load is complete
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.VENDOR_TX, JSON.stringify(vendorTransactions));
  }, [vendorTransactions]);
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.CLIENT_PAY, JSON.stringify(clientPayments));
  }, [clientPayments]);
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.PROJECT_EXP, JSON.stringify(projectExpenses));
  }, [projectExpenses]);
  useEffect(() => {
    if (!initialLoadedRef.current) return;
    localStorage.setItem(STORAGE_KEYS.INTERNAL_TX, JSON.stringify(internalTransactions));
  }, [internalTransactions]);

  // Auth Handlers
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const { auth, db, isConfigured } = initFirebase();
    if (isConfigured && auth && db) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        setCurrentUser({
          email: cred.user.email || email,
          uid: cred.user.uid,
          displayName: cred.user.displayName || email.split('@')[0],
        });
        startFirestoreListeners(db);
        return { success: true };
      } catch (err: any) {
        console.error('Firebase Login failed:', err);
        return { success: false, error: err.message || 'Login failed. Check your Firebase email & password.' };
      }
    } else {
      // Local admin login
      if (email && pass) {
        const mockUser = {
          email,
          uid: 'admin-local-' + Date.now(),
          displayName: email.split('@')[0].toUpperCase(),
        };
        setCurrentUser(mockUser);
        localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(mockUser));
        return { success: true };
      }
      return { success: false, error: 'Email and password required' };
    }
  };

  const register = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const { auth, db, isConfigured } = initFirebase();
    if (isConfigured && auth && db) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        setCurrentUser({
          email: cred.user.email || email,
          uid: cred.user.uid,
          displayName: cred.user.displayName || email.split('@')[0],
        });
        startFirestoreListeners(db);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Registration failed' };
      }
    } else {
      const mockUser = {
        email,
        uid: 'admin-local-' + Date.now(),
        displayName: email.split('@')[0].toUpperCase(),
      };
      setCurrentUser(mockUser);
      localStorage.setItem(STORAGE_KEYS.LOCAL_USER, JSON.stringify(mockUser));
      return { success: true };
    }
  };

  const logout = async () => {
    const { auth, isConfigured } = initFirebase();
    if (isConfigured && auth) {
      await fbSignOut(auth);
    }
    stopFirestoreListeners();
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.LOCAL_USER);
  };

  // Projects CRUD (Instant optimistic UI update + background Firestore sync)
  const addProject = async (p: Omit<Project, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'prj-' + Date.now();
    const newProject: Project = {
      ...p,
      id,
      createdAt: new Date().toISOString(),
    };

    // 1. Instant optimistic update: UI responds in 0ms
    setProjects((prev) => upsertItem(prev, newProject));

    // 2. Persist to Firestore in background
    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'projects', id), cleanForFirestore(newProject));
    }
    return id;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'projects', id), cleanForFirestore(updates), { merge: true });
    }
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'projects', id));
    }
  };

  // Vendors CRUD (Instant optimistic UI update + background Firestore sync)
  const addVendor = async (v: Omit<Vendor, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'ven-' + Date.now();
    const newVendor: Vendor = {
      ...v,
      id,
      createdAt: new Date().toISOString(),
    };

    setVendors((prev) => upsertItem(prev, newVendor));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'vendors', id), cleanForFirestore(newVendor));
    }
    return id;
  };

  const updateVendor = async (id: string, updates: Partial<Vendor>) => {
    setVendors((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'vendors', id), cleanForFirestore(updates), { merge: true });
    }
  };

  const deleteVendor = async (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'vendors', id));
    }
  };

  // Vendor Transactions CRUD (Instant optimistic UI update + background Firestore sync)
  const addVendorTransaction = async (
    txData: Omit<VendorTransaction, 'id' | 'createdAt' | 'pendingAmount' | 'paymentStatus'> & { paidAmount?: number }
  ): Promise<string> => {
    const id = 'vtx-' + Date.now();
    const totalAmount = Number(txData.totalAmount) || 0;
    const paidAmount = Number(txData.paidAmount) || 0;
    const pendingAmount = Math.max(0, totalAmount - paidAmount);
    
    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (pendingAmount <= 0) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    const newTx: VendorTransaction = {
      ...txData,
      id,
      totalAmount,
      paidAmount,
      pendingAmount,
      paymentStatus,
      createdAt: new Date().toISOString(),
    };

    setVendorTransactions((prev) => upsertItem(prev, newTx));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'vendor_transactions', id), cleanForFirestore(newTx));
    }
    return id;
  };

  const updateVendorTransactionPayment = async (id: string, additionalPaid: number) => {
    const target = vendorTransactions.find((t) => t.id === id);
    if (!target) return;

    const newPaid = Math.min(target.totalAmount, target.paidAmount + additionalPaid);
    const newPending = Math.max(0, target.totalAmount - newPaid);
    const newStatus: 'paid' | 'partial' | 'unpaid' =
      newPending === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';

    const updates = {
      paidAmount: newPaid,
      pendingAmount: newPending,
      paymentStatus: newStatus,
    };

    setVendorTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'vendor_transactions', id), cleanForFirestore(updates), { merge: true });
    }
  };

  const deleteVendorTransaction = async (id: string) => {
    setVendorTransactions((prev) => prev.filter((t) => t.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'vendor_transactions', id));
    }
  };

  // Client Payments CRUD (Instant optimistic UI update + background Firestore sync)
  const addClientPayment = async (payData: Omit<ClientPayment, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'cpay-' + Date.now();
    const newPayment: ClientPayment = {
      ...payData,
      id,
      amount: Number(payData.amount) || 0,
      createdAt: new Date().toISOString(),
    };

    setClientPayments((prev) => upsertItem(prev, newPayment));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'client_payments', id), cleanForFirestore(newPayment));
    }
    return id;
  };

  const deleteClientPayment = async (id: string) => {
    setClientPayments((prev) => prev.filter((p) => p.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'client_payments', id));
    }
  };

  // Project Direct Expenses CRUD (Instant optimistic UI update + background Firestore sync)
  const addProjectExpense = async (expData: Omit<ProjectExpense, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'exp-' + Date.now();
    const newExpense: ProjectExpense = {
      ...expData,
      id,
      amount: Number(expData.amount) || 0,
      createdAt: new Date().toISOString(),
    };

    setProjectExpenses((prev) => upsertItem(prev, newExpense));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'project_expenses', id), cleanForFirestore(newExpense));
    }
    return id;
  };

  const deleteProjectExpense = async (id: string) => {
    setProjectExpenses((prev) => prev.filter((e) => e.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'project_expenses', id));
    }
  };

  // Internal Transactions CRUD (Instant optimistic UI update + background Firestore sync)
  const addInternalTransaction = async (txData: Omit<InternalTransaction, 'id' | 'createdAt'>): Promise<string> => {
    const id = 'itx-' + Date.now();
    const newInternalTx: InternalTransaction = {
      ...txData,
      id,
      amount: Number(txData.amount) || 0,
      createdAt: new Date().toISOString(),
    };

    setInternalTransactions((prev) => upsertItem(prev, newInternalTx));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await setDoc(doc(db, 'internal_transactions', id), cleanForFirestore(newInternalTx));
    }
    return id;
  };

  const deleteInternalTransaction = async (id: string) => {
    setInternalTransactions((prev) => prev.filter((i) => i.id !== id));

    const { db, isConfigured } = initFirebase();
    if (isConfigured && db) {
      await deleteDoc(doc(db, 'internal_transactions', id));
    }
  };

  // Clear data utility
  const clearAllData = () => {
    setProjects([]);
    setVendors([]);
    setVendorTransactions([]);
    setClientPayments([]);
    setProjectExpenses([]);
    setInternalTransactions([]);

    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.VENDORS);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_TX);
    localStorage.removeItem(STORAGE_KEYS.CLIENT_PAY);
    localStorage.removeItem(STORAGE_KEYS.PROJECT_EXP);
    localStorage.removeItem(STORAGE_KEYS.INTERNAL_TX);
  };

  const exportBackupJSON = (): string => {
    const data = {
      exportDate: new Date().toISOString(),
      projects,
      vendors,
      vendorTransactions,
      clientPayments,
      projectExpenses,
      internalTransactions,
    };
    return JSON.stringify(data, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.projects) setProjects(data.projects);
      if (data.vendors) setVendors(data.vendors);
      if (data.vendorTransactions) setVendorTransactions(data.vendorTransactions);
      if (data.clientPayments) setClientPayments(data.clientPayments);
      if (data.projectExpenses) setProjectExpenses(data.projectExpenses);
      if (data.internalTransactions) setInternalTransactions(data.internalTransactions);
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  // Organization-Level Financial KPIs
  const totalClientIncome = useMemo(() => {
    return clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }, [clientPayments]);

  const totalVendorBilled = useMemo(() => {
    return vendorTransactions.reduce((sum, v) => sum + (Number(v.totalAmount) || 0), 0);
  }, [vendorTransactions]);

  const totalVendorPaid = useMemo(() => {
    return vendorTransactions.reduce((sum, v) => sum + (Number(v.paidAmount) || 0), 0);
  }, [vendorTransactions]);

  const totalVendorPending = useMemo(() => {
    return vendorTransactions.reduce((sum, v) => sum + (Number(v.pendingAmount) || 0), 0);
  }, [vendorTransactions]);

  const totalDirectExpenses = useMemo(() => {
    return projectExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [projectExpenses]);

  // Overall Expenses = Direct Site Expenses (wages, fuel, petty cash) + Vendor Expenses (payments made)
  const totalExpenses = useMemo(() => {
    return totalDirectExpenses + totalVendorPaid;
  }, [totalDirectExpenses, totalVendorPaid]);

  const netCashFlow = useMemo(() => {
    return totalClientIncome - totalExpenses;
  }, [totalClientIncome, totalExpenses]);

  const totalInternalTransfersVolume = useMemo(() => {
    return internalTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [internalTransactions]);

  return (
    <DataContext.Provider
      value={{
        currentUser,
        authLoading,
        login,
        register,
        logout,
        isFirebaseActive,
        firebaseError,
        refreshFirebase,

        projects,
        vendors,
        vendorTransactions,
        clientPayments,
        projectExpenses,
        internalTransactions,

        addProject,
        updateProject,
        deleteProject,

        addVendor,
        updateVendor,
        deleteVendor,

        addVendorTransaction,
        updateVendorTransactionPayment,
        deleteVendorTransaction,

        addClientPayment,
        deleteClientPayment,

        addProjectExpense,
        deleteProjectExpense,

        addInternalTransaction,
        deleteInternalTransaction,

        clearAllData,
        exportBackupJSON,
        importBackupJSON,

        totalClientIncome,
        totalVendorPaid,
        totalVendorBilled,
        totalVendorPending,
        totalDirectExpenses,
        totalExpenses,
        netCashFlow,
        totalInternalTransfersVolume,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

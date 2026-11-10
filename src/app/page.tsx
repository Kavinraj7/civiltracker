'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { DashboardView } from '@/components/DashboardView';
import { ProjectsView } from '@/components/ProjectsView';
import { VendorsView } from '@/components/VendorsView';
import { InternalTransactionsView } from '@/components/InternalTransactionsView';
import { TransactionsLedgerView } from '@/components/TransactionsLedgerView';
import { ProjectDetailScreen } from '@/components/ProjectDetailScreen';
import { VendorDetailModal } from '@/components/VendorDetailModal';
import { NewProjectModal } from '@/components/NewProjectModal';
import { NewVendorModal } from '@/components/NewVendorModal';
import { ClientPaymentModal } from '@/components/ClientPaymentModal';
import { VendorTransactionModal } from '@/components/VendorTransactionModal';
import { ProjectExpenseModal } from '@/components/ProjectExpenseModal';
import { InternalTransferModal } from '@/components/InternalTransferModal';
import { ReportsView } from '@/components/ReportsView';
import { UsersView } from '@/components/UsersView';
import { NewUserModal } from '@/components/NewUserModal';
import { AuthScreen } from '@/components/AuthScreen';
import { Project, Vendor } from '@/types';
import { Building2, Loader2 } from 'lucide-react';

export default function Home() {
  const { currentUser, authLoading, projects } = useData();

  // Active view tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Currently opened project screen (null when in standard directory/dashboard)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) || null : null;

  // Modal states
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isNewVendorOpen, setIsNewVendorOpen] = useState(false);
  const [isClientPaymentOpen, setIsClientPaymentOpen] = useState(false);
  const [isVendorTxOpen, setIsVendorTxOpen] = useState(false);
  const [isProjectExpenseOpen, setIsProjectExpenseOpen] = useState(false);
  const [isInternalTransferOpen, setIsInternalTransferOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);

  // Pre-selected entity contexts for modals
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string | undefined>(undefined);
  const [targetVendorId, setTargetVendorId] = useState<string | undefined>(undefined);

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center animate-pulse">
          <Building2 className="w-7 h-7 text-amber-600" />
        </div>
        <div className="flex items-center space-x-2 text-slate-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          <span>Initializing CivilCorp Operations Portal...</span>
        </div>
      </div>
    );
  }

  // If not logged in, show Admin Authentication Screen
  if (!currentUser) {
    return <AuthScreen />;
  }

  // Handlers to open modals with context
  const handleOpenClientPayment = (projId?: string) => {
    setTargetProjectId(projId);
    setIsClientPaymentOpen(true);
  };

  const handleOpenVendorTransaction = (vendId?: string, projId?: string) => {
    setTargetVendorId(vendId);
    setTargetProjectId(projId);
    setIsVendorTxOpen(true);
  };

  const handleOpenProjectExpense = (projId?: string) => {
    setTargetProjectId(projId);
    setIsProjectExpenseOpen(true);
  };

  const handleOpenInternalTransfer = (fromProjId?: string) => {
    setTargetProjectId(fromProjId);
    setIsInternalTransferOpen(true);
  };

  const handleTabChange = (tab: string) => {
    setSelectedProjectId(null); // When switching tabs, exit project screen
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      
      {/* Left-Side Fixed Navigation Tabs with Proper Spacing */}
      <Sidebar
        activeTab={selectedProject ? '' : activeTab}
        setActiveTab={handleTabChange}
        onOpenInternalTransfer={() => handleOpenInternalTransfer(selectedProject?.id)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Navbar
          activeTab={activeTab}
          selectedProjectTitle={selectedProject ? selectedProject.name : undefined}
          onBackFromProject={() => setSelectedProjectId(null)}
          onOpenInternalTransfer={() => handleOpenInternalTransfer(selectedProject?.id)}
          onOpenClientPayment={() => handleOpenClientPayment(selectedProject?.id)}
          onOpenVendorTransaction={() => handleOpenVendorTransaction(undefined, selectedProject?.id)}
          onOpenProjectExpense={() => handleOpenProjectExpense(selectedProject?.id)}
        />

        {/* Content Container with Generous Spacing and Normal Alignment */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1400px] w-full mx-auto space-y-8">
          {/* If a project is clicked, take inside the project as a full screen! */}
          {selectedProject ? (
            <ProjectDetailScreen
              project={selectedProject}
              onBack={() => setSelectedProjectId(null)}
              onOpenClientPayment={handleOpenClientPayment}
              onOpenProjectExpense={handleOpenProjectExpense}
              onOpenVendorTransaction={handleOpenVendorTransaction}
              onOpenInternalTransfer={handleOpenInternalTransfer}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                  onOpenClientPayment={handleOpenClientPayment}
                  onOpenVendorTransaction={handleOpenVendorTransaction}
                  onOpenProjectExpense={handleOpenProjectExpense}
                  onOpenInternalTransfer={() => handleOpenInternalTransfer()}
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  setActiveTab={handleTabChange}
                />
              )}

              {activeTab === 'projects' && (
                <ProjectsView
                  onOpenNewProject={() => setIsNewProjectOpen(true)}
                  onSelectProject={(p) => setSelectedProjectId(p.id)}
                  onOpenClientPayment={handleOpenClientPayment}
                  onOpenProjectExpense={handleOpenProjectExpense}
                  onOpenVendorTransaction={handleOpenVendorTransaction}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorsView
                  onOpenNewVendor={() => setIsNewVendorOpen(true)}
                  onOpenVendorTransaction={handleOpenVendorTransaction}
                  onSelectVendor={(v) => setSelectedVendor(v)}
                />
              )}

              {activeTab === 'internal' && (
                <InternalTransactionsView
                  onOpenInternalTransfer={() => handleOpenInternalTransfer()}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsLedgerView />
              )}

              {activeTab === 'reports' && (
                <ReportsView />
              )}

              {activeTab === 'users' && (
                <UsersView
                  onOpenNewUser={() => setIsNewUserOpen(true)}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      {selectedVendor && (
        <VendorDetailModal
          vendor={selectedVendor}
          onClose={() => setSelectedVendor(null)}
          onOpenVendorTransaction={handleOpenVendorTransaction}
        />
      )}

      {isNewProjectOpen && (
        <NewProjectModal onClose={() => setIsNewProjectOpen(false)} />
      )}

      {isNewVendorOpen && (
        <NewVendorModal onClose={() => setIsNewVendorOpen(false)} />
      )}

      {isClientPaymentOpen && (
        <ClientPaymentModal
          initialProjectId={targetProjectId}
          onClose={() => {
            setIsClientPaymentOpen(false);
            setTargetProjectId(undefined);
          }}
        />
      )}

      {isVendorTxOpen && (
        <VendorTransactionModal
          initialVendorId={targetVendorId}
          initialProjectId={targetProjectId}
          onClose={() => {
            setIsVendorTxOpen(false);
            setTargetVendorId(undefined);
            setTargetProjectId(undefined);
          }}
        />
      )}

      {isProjectExpenseOpen && (
        <ProjectExpenseModal
          initialProjectId={targetProjectId}
          onClose={() => {
            setIsProjectExpenseOpen(false);
            setTargetProjectId(undefined);
          }}
        />
      )}

      {isInternalTransferOpen && (
        <InternalTransferModal
          initialFromProjectId={targetProjectId}
          onClose={() => {
            setIsInternalTransferOpen(false);
            setTargetProjectId(undefined);
          }}
        />
      )}

      {isNewUserOpen && (
        <NewUserModal onClose={() => setIsNewUserOpen(false)} />
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/dataContext';
import { AppUser } from '@/types';
import { 
  Users, 
  UserPlus, 
  Shield, 
  HardHat, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  FolderKanban, 
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface UsersViewProps {
  onOpenNewUser: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ onOpenNewUser }) => {
  const { appUsers, allProjects, deleteAppUser, currentUser } = useData();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Owner' | 'Incharge'>('all');
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const filteredUsers = appUsers.filter((u) => {
    const matchesSearch = 
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getAssignedProjects = (user: AppUser) => {
    return allProjects.filter(
      (p) => 
        p.assignedInchargeId === user.id || 
        p.assignedInchargeId === user.email ||
        p.assignedInchargeName === user.name
    );
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    await deleteAppUser(userToDelete.id);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User & Role Management</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              {appUsers.length} Member{appUsers.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage organization members with Owner (Full access) or Incharge (Assigned site access only) roles
          </p>
        </div>

        <button
          onClick={onOpenNewUser}
          className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 text-xs transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add User / Incharge</span>
        </button>
      </div>

      {/* Role explanation summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
            <Shield className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-purple-900 text-sm">Owner Role (Full Admin)</span>
            <p className="text-purple-700">
              Can see all projects across all site locations, manage users, assign projects to Incharges, and view total organization financial KPI.
            </p>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shrink-0">
            <HardHat className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-amber-900 text-sm">Incharge Role (Site Supervisor)</span>
            <p className="text-amber-800">
              Assigned to specific projects. <strong>Can only see and edit their assigned projects</strong>. Cannot see other incharges' projects or user administration.
            </p>
          </div>
        </div>
      </div>

      {/* In-app auth tip banner */}
      <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>In-App Login Creation:</strong> Adding a member with a password automatically creates their account in Firebase Authentication. They can sign in immediately from the login screen. If an earlier created member cannot log in, delete them below and re-add them with a password.
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {(['all', 'Owner', 'Incharge'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                roleFilter === r
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table / Directory */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <div className="text-slate-600 font-bold text-sm">No users found</div>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create Incharges or Owners to delegate site supervision and control project visibility.
          </p>
          <button
            onClick={onOpenNewUser}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold"
          >
            + Create First User
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Member Name & Contact</th>
                  <th className="py-3 px-4">Role & Access</th>
                  <th className="py-3 px-4">Assigned Site Projects</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const assigned = getAssignedProjects(user);
                  const isCurrent = currentUser?.email.toLowerCase() === user.email.toLowerCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            user.role === 'Owner'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          user.role === 'Owner'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {user.role === 'Owner' ? (
                            <Shield className="w-3.5 h-3.5 text-purple-600" />
                          ) : (
                            <HardHat className="w-3.5 h-3.5 text-amber-600" />
                          )}
                          <span>{user.role}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {user.role === 'Owner' ? (
                          <span className="text-slate-500 font-medium italic">
                            All Projects (Owner Access)
                          </span>
                        ) : assigned.length === 0 ? (
                          <span className="text-slate-400 italic">No projects assigned yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {assigned.map((p) => (
                              <span
                                key={p.id}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-semibold"
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setUserToDelete(user)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <ConfirmDeleteModal
          isOpen={true}
          title="Remove Organization Member"
          itemName={`${userToDelete.name} (${userToDelete.role})`}
          description={`Permanently remove ${userToDelete.name} (${userToDelete.email}) from the organisation? They will lose access to all projects and their assignments.`}
          confirmButtonText="Remove User"
          onConfirm={handleDeleteConfirm}
          onClose={() => setUserToDelete(null)}
        />
      )}

    </div>
  );
};


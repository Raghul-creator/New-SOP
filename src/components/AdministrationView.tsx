import React, { useState } from 'react';
import {
  User,
  AuditLogEntry,
  DepartmentScorecard,
  UserRole,
  Department,
  DepartmentConfig,
  OrganizationApprovalSettings
} from '../types';
import {
  ShieldAlert,
  Users,
  Building2,
  ListOrdered,
  Download,
  Search,
  CheckCircle2,
  Lock,
  Edit,
  Plus,
  RefreshCw,
  FileCheck,
  Edit2,
  Power,
  Trash2,
  ShieldCheck,
  UserPlus,
  Mail,
  Briefcase
} from 'lucide-react';
import { OrganizationApprovalsManager } from './admin/OrganizationApprovalsManager';
import { DEFAULT_ORGANIZATION_APPROVAL_SETTINGS } from '../data/mockData';

interface AdministrationViewProps {
  users: User[];
  auditLogs: AuditLogEntry[];
  scorecards: DepartmentScorecard[];
  departments?: DepartmentConfig[];
  currentUser: User;
  orgApprovalSettings?: OrganizationApprovalSettings;
  onUpdateOrgApprovals?: (settings: OrganizationApprovalSettings) => Promise<void>;
  onAddUser?: (user: Partial<User>) => Promise<void>;
  onUpdateUser?: (userId: string, updates: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  onOpenCreateDeptModal?: () => void;
  onEditDeptModal?: (dept: DepartmentConfig) => void;
  onToggleDeptStatus?: (deptId: string, newStatus: 'Active' | 'Disabled') => void;
}

export const AdministrationView: React.FC<AdministrationViewProps> = ({
  users,
  auditLogs,
  scorecards,
  departments = [],
  currentUser,
  orgApprovalSettings = DEFAULT_ORGANIZATION_APPROVAL_SETTINGS,
  onUpdateOrgApprovals,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateUserRole,
  onOpenCreateDeptModal,
  onEditDeptModal,
  onToggleDeptStatus
}) => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'departments' | 'logs'>('approvals');
  const [searchUser, setSearchUser] = useState('');
  const [searchLog, setSearchLog] = useState('');

  // User Add/Edit Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    department: Department;
    title: string;
  }>({
    name: '',
    email: '',
    role: 'Employee',
    department: 'IT',
    title: ''
  });
  const [userModalError, setUserModalError] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.department.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log =>
    log.sopTitle?.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.user?.name?.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchLog.toLowerCase())
  );

  const handleOpenAddUserModal = () => {
    setEditingUserId(null);
    setUserFormData({
      name: '',
      email: '',
      role: 'Employee',
      department: (departments[0]?.name as Department) || 'IT',
      title: ''
    });
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUserId(user.id);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      title: user.title || ''
    });
    setUserModalError('');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserModalError('');

    if (!userFormData.name.trim()) {
      setUserModalError('User full name is required.');
      return;
    }
    if (!userFormData.email.trim()) {
      setUserModalError('User corporate email address is required.');
      return;
    }

    setIsSavingUser(true);
    try {
      if (editingUserId) {
        if (onUpdateUser) {
          await onUpdateUser(editingUserId, {
            name: userFormData.name.trim(),
            email: userFormData.email.trim(),
            role: userFormData.role,
            department: userFormData.department,
            title: userFormData.title.trim()
          });
        }
      } else {
        if (onAddUser) {
          await onAddUser({
            name: userFormData.name.trim(),
            email: userFormData.email.trim(),
            role: userFormData.role,
            department: userFormData.department,
            title: userFormData.title.trim() || `${userFormData.role}`
          });
        }
      }
      setIsUserModalOpen(false);
    } catch (err: any) {
      setUserModalError(err.message || 'Failed to save user.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (confirm(`Are you sure you want to remove ${user.name} (${user.email}) from the directory?`)) {
      if (onDeleteUser) {
        await onDeleteUser(user.id);
      }
    }
  };

  const handleExportJSON = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      organization: orgApprovalSettings?.organizationName || 'Corporate Entity',
      governanceFramework: 'ISO 9001:2015 & ISO/IEC 27001:2022',
      approvalSettings: orgApprovalSettings,
      departments: scorecards,
      users: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, department: u.department })),
      auditRecordsCount: auditLogs.length,
      auditLogsPreview: auditLogs.slice(0, 50)
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SOP-Governance-Audit-Report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bento Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Platform Governance & Access Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
            Enterprise Administration
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage organization approval names, designated approver roles, user directories, and compliance audit trails.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Governance Dossier (JSON)</span>
        </button>
      </div>

      {/* Admin Tab Bar */}
      <div className="flex items-center gap-2 bg-white rounded-2xl border border-gray-200/80 p-2 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'approvals' ? 'bg-[#1A1C1E] text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Organisation Approvals</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'users' ? 'bg-[#1A1C1E] text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>User & Approver Directory ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'departments' ? 'bg-[#1A1C1E] text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Department Governance ({departments.length > 0 ? departments.length : scorecards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'logs' ? 'bg-[#1A1C1E] text-white shadow-2xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ListOrdered className="w-3.5 h-3.5" />
          <span>Audit Log Vault ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: Organisation Approvals */}
      {activeTab === 'approvals' && (
        <OrganizationApprovalsManager
          settings={orgApprovalSettings}
          departments={departments}
          onSaveSettings={async (newSettings) => {
            if (onUpdateOrgApprovals) {
              await onUpdateOrgApprovals(newSettings);
            }
          }}
          onEditDepartment={(dept) => {
            if (onEditDeptModal) {
              onEditDeptModal(dept);
            }
          }}
        />
      )}

      {/* TAB 2: User Directory */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Configured Enterprise Personnel & Approvers</h2>
              <p className="text-xs text-gray-500">Active accounts authorized to author, review, or approve procedures</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Search user, role, email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                onClick={handleOpenAddUserModal}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Approver / User</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">User Name</th>
                  <th className="py-3 px-4">Corporate Email</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Job Designation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div className="font-bold text-gray-900">{user.name}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-gray-500 font-mono">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        user.role === 'Administrator' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        user.role === 'Compliance Manager' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        user.role === 'Department Manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        user.role === 'Management' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {user.department}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px]">
                      {user.title || user.role}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditUserModal(user)}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Edit User Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Remove User"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Department Governance */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 p-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Configured Operational Departments</h2>
              <p className="text-xs text-gray-500">Dynamic organizational units governing SOPs and access controls</p>
            </div>
            {onOpenCreateDeptModal && (
              <button
                onClick={onOpenCreateDeptModal}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ CREATE DEPARTMENT</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {departments.length > 0 ? (
              departments.map(dept => (
                <div
                  key={dept.id}
                  className={`bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col justify-between ${
                    dept.status === 'Disabled' ? 'opacity-70 bg-gray-50/50' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-sm border border-indigo-100">
                        {dept.code}
                      </div>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        dept.status === 'Disabled'
                          ? 'text-red-700 bg-red-50 border-red-200'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      }`}>
                        {dept.status || 'Active'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1A1C1E]">{dept.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Head: <strong className="text-gray-800">{dept.headName}</strong></p>
                    <p className="text-[11px] text-gray-400">{dept.headEmail}</p>

                    {dept.primaryApproverName && (
                      <div className="mt-2.5 p-2.5 bg-gray-50 rounded-xl text-[11px] space-y-1">
                        <div className="text-gray-700">
                          <span className="text-gray-400">Primary Approver: </span>
                          <strong>{dept.primaryApproverName}</strong>
                        </div>
                        {dept.complianceApproverName && (
                          <div className="text-gray-700">
                            <span className="text-gray-400">Compliance: </span>
                            <strong>{dept.complianceApproverName}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{dept.description}</p>
                  </div>

                  <div className="text-[11px] text-gray-500 pt-3 mt-4 border-t border-gray-100 flex items-center justify-between">
                    {onEditDeptModal && (
                      <button
                        onClick={() => onEditDeptModal(dept)}
                        className="text-indigo-600 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Approvers</span>
                      </button>
                    )}
                    {onToggleDeptStatus && (
                      <button
                        onClick={() => onToggleDeptStatus(dept.id, dept.status === 'Disabled' ? 'Active' : 'Disabled')}
                        className={`font-semibold cursor-pointer hover:underline flex items-center gap-1 ${
                          dept.status === 'Disabled' ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{dept.status === 'Disabled' ? 'Reactivate' : 'Disable'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              scorecards.map(dept => (
                <div
                  key={dept.department}
                  className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 font-mono font-bold flex items-center justify-center text-sm border border-indigo-100">
                        {dept.code}
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {dept.complianceScore}% Compliant
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1A1C1E]">{dept.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Head: <strong className="text-gray-800">{dept.headName}</strong></p>
                    <p className="text-[11px] text-gray-400">{dept.headEmail}</p>

                    <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-gray-100 text-center">
                      <div className="bg-gray-50 rounded-xl p-2">
                        <span className="text-[10px] text-gray-500 block">Total SOPs</span>
                        <span className="text-base font-bold text-gray-900">{dept.totalSops}</span>
                      </div>
                      <div className="bg-emerald-50/70 rounded-xl p-2">
                        <span className="text-[10px] text-emerald-700 block">Active</span>
                        <span className="text-base font-bold text-emerald-800">{dept.approvedSops}</span>
                      </div>
                      <div className="bg-amber-50/70 rounded-xl p-2">
                        <span className="text-[10px] text-amber-700 block">Review Due</span>
                        <span className="text-base font-bold text-amber-800">{dept.overdueReviews}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-500 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span>Standard Review: <strong>6 Months</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Audit Log Vault */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900">7-Year Compliance Audit Trail</h2>
              <p className="text-xs text-gray-500">Immutable governance records for ISO 9001 & ISO 27001 accreditation</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Search audit records..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50/80 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">SOP Reference</th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                {filteredLogs.slice(0, 25).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 whitespace-nowrap font-sans">
                      {log.sopTitle}
                    </td>
                    <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-sans">
                      {log.user?.name} ({log.user?.role})
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-sans max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Add / Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>{editingUserId ? 'Edit Approver / User' : 'Add New Approver / User'}</span>
              </h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {userModalError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {userModalError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={e => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="e.g., Rajesh Kumar"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Corporate Email</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="user@organization.com"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700">System Role</label>
                  <select
                    value={userFormData.role}
                    onChange={e => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-semibold"
                  >
                    <option value="Employee">Employee</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Compliance Manager">Compliance Manager</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Management">Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700">Department</label>
                  <input
                    type="text"
                    value={userFormData.department}
                    onChange={e => setUserFormData({ ...userFormData, department: e.target.value as Department })}
                    placeholder="e.g., IT, Security, HR"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Job Title / Designation</label>
                <input
                  type="text"
                  value={userFormData.title}
                  onChange={e => setUserFormData({ ...userFormData, title: e.target.value })}
                  placeholder="e.g., Operations Unit Approver / Lead Auditor"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSavingUser ? 'Saving...' : editingUserId ? 'Update User' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

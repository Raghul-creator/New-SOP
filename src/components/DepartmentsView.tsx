import React, { useState } from 'react';
import { SOPDocument, DepartmentScorecard, User, DepartmentConfig } from '../types';
import {
  Building2,
  Users,
  Laptop,
  Coins,
  Receipt,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Plus,
  Search,
  AlertTriangle,
  Clock,
  Edit2,
  Power,
  RefreshCw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface DepartmentsViewProps {
  departments: DepartmentConfig[];
  sops: SOPDocument[];
  scorecards: DepartmentScorecard[];
  currentUser: User;
  onFilterDepartmentInLibrary: (deptName: string) => void;
  onOpenSop: (sopId: string) => void;
  onCreateSopForDept: (deptName: string) => void;
  onOpenCreateDeptModal: () => void;
  onEditDeptModal: (dept: DepartmentConfig) => void;
  onToggleDeptStatus: (deptId: string, newStatus: 'Active' | 'Disabled') => void;
}

export const DepartmentsView: React.FC<DepartmentsViewProps> = ({
  departments,
  sops,
  scorecards,
  currentUser,
  onFilterDepartmentInLibrary,
  onOpenSop,
  onCreateSopForDept,
  onOpenCreateDeptModal,
  onEditDeptModal,
  onToggleDeptStatus
}) => {
  // Selected department for individual Department Page
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [sopFilterStatus, setSopFilterStatus] = useState<string>('all');

  const getDeptIcon = (code: string) => {
    switch (code.toUpperCase()) {
      case 'HR':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'IT':
        return <Laptop className="w-5 h-5 text-blue-600" />;
      case 'FIN':
        return <Coins className="w-5 h-5 text-emerald-600" />;
      case 'PAY':
        return <Receipt className="w-5 h-5 text-cyan-600" />;
      case 'CMP':
      case 'SEC':
        return <ShieldCheck className="w-5 h-5 text-amber-600" />;
      default:
        return <Building2 className="w-5 h-5 text-indigo-600" />;
    }
  };

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const isAdminOrMgmt = currentUser.role === 'Administrator' || currentUser.role === 'Management';

  // If a department is selected, render the full dedicated Department Page
  if (selectedDeptId) {
    const dept = departments.find(d => d.id === selectedDeptId || d.name === selectedDeptId) || departments[0];
    if (!dept) {
      setSelectedDeptId(null);
      return null;
    }

    // Filter SOPs for this department
    const deptSops = sops.filter(s =>
      s.department === dept.name ||
      s.department === dept.id ||
      (dept.code === 'HR' && s.department === 'HR_Staffing') ||
      (dept.code === 'IT' && (s.department === 'IT Enablement' || s.department === 'Software_DevOps' || s.department === 'Cloud_Infrastructure')) ||
      (dept.code === 'CMP' && (s.department === 'Compliance' || s.department === 'InfoSec_Compliance'))
    );

    // Metrics for Department Page
    const totalSops = deptSops.length;
    const activeSops = deptSops.filter(s => s.status === 'Active' || s.status === 'Published').length;
    const draftSops = deptSops.filter(s => s.status === 'Draft').length;
    const underReviewSops = deptSops.filter(s => s.status === 'Under Review').length;
    const reviewDueSops = deptSops.filter(s => {
      if (!s.nextReviewDate || s.status === 'Archived') return false;
      const due = new Date(s.nextReviewDate);
      return due >= now && due <= thirtyDaysFromNow;
    }).length;
    const overdueSops = deptSops.filter(s => {
      if (!s.nextReviewDate || s.status === 'Archived') return false;
      const due = new Date(s.nextReviewDate);
      return due < now;
    }).length;

    // Filtered list by query & status
    const filteredList = deptSops.filter(s => {
      const matchQuery =
        s.title.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
        s.sopNumber.toLowerCase().includes(deptSearchQuery.toLowerCase()) ||
        s.purpose.toLowerCase().includes(deptSearchQuery.toLowerCase());
      if (!matchQuery) return false;
      if (sopFilterStatus === 'all') return true;
      if (sopFilterStatus === 'Active') return s.status === 'Active' || s.status === 'Published';
      return s.status === sopFilterStatus;
    });

    return (
      <div className="space-y-6">
        {/* Department Page Header */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
          
          <button
            onClick={() => setSelectedDeptId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Departments</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                {getDeptIcon(dept.code)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1C1E]">
                    {dept.name}
                  </h1>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {dept.code}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    dept.status === 'Disabled'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    {dept.status || 'Active'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mb-2">
                  {dept.description || `${dept.name} departmental processes and SOP governance.`}
                </p>

                <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                  <span>Department Head: <strong className="text-gray-900">{dept.headName}</strong></span>
                  <span>•</span>
                  <span>{dept.headEmail}</span>
                  {dept.primaryApproverName && (
                    <>
                      <span>•</span>
                      <span>Primary Approver: <strong className="text-gray-900">{dept.primaryApproverName}</strong></span>
                    </>
                  )}
                  {dept.complianceApproverName && (
                    <>
                      <span>•</span>
                      <span>Compliance: <strong className="text-gray-900">{dept.complianceApproverName}</strong></span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Department Actions */}
            <div className="flex flex-wrap items-center gap-3">
              {isAdminOrMgmt && (
                <>
                  <button
                    onClick={() => onEditDeptModal(dept)}
                    className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Dept</span>
                  </button>
                  <button
                    onClick={() => onToggleDeptStatus(dept.id, dept.status === 'Disabled' ? 'Active' : 'Disabled')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                      dept.status === 'Disabled'
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{dept.status === 'Disabled' ? 'Reactivate' : 'Disable Dept'}</span>
                  </button>
                </>
              )}

              {/* Explicit requirement: Button: + CREATE SOP */}
              <button
                onClick={() => onCreateSopForDept(dept.name)}
                disabled={dept.status === 'Disabled'}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ CREATE SOP</span>
              </button>
            </div>
          </div>

          {/* Department Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8 pt-6 border-t border-gray-100">
            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Total SOPs</span>
              <span className="text-xl font-bold text-gray-900 mt-1 block">{totalSops}</span>
            </div>

            <div className="bg-emerald-50/70 rounded-2xl p-3 border border-emerald-100 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Active SOPs</span>
              <span className="text-xl font-bold text-emerald-900 mt-1 block">{activeSops}</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 text-center">
              <span className="text-[10px] font-bold uppercase text-gray-500 block">Draft SOPs</span>
              <span className="text-xl font-bold text-gray-700 mt-1 block">{draftSops}</span>
            </div>

            <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-100 text-center">
              <span className="text-[10px] font-bold uppercase text-blue-700 block">Under Review</span>
              <span className="text-xl font-bold text-blue-900 mt-1 block">{underReviewSops}</span>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-100 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-700 block">Review Due</span>
              <span className="text-xl font-bold text-amber-900 mt-1 block">{reviewDueSops}</span>
            </div>

            <div className="bg-red-50/70 rounded-2xl p-3 border border-red-100 text-center">
              <span className="text-[10px] font-bold uppercase text-red-700 block">Overdue</span>
              <span className="text-xl font-bold text-red-900 mt-1 block">{overdueSops}</span>
            </div>
          </div>

        </div>

        {/* SOP Search and List */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-gray-900">
              Department SOP Inventory ({filteredList.length})
            </h2>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={deptSearchQuery}
                  onChange={e => setDeptSearchQuery(e.target.value)}
                  placeholder="Search department SOPs..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={sopFilterStatus}
                onChange={e => setSopFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Under Review">Under Review</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {/* List Table */}
          {filteredList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No SOPs match your search or filter criteria in this department.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {filteredList.map(sop => (
                <div
                  key={sop.id}
                  onClick={() => onOpenSop(sop.id)}
                  className="p-4 hover:bg-indigo-50/40 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 shrink-0">
                      {sop.sopNumber}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-[#1A1C1E] hover:text-indigo-600 transition">
                        {sop.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        {sop.purpose}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 mt-1.5">
                        <span>Owner: {sop.processOwner?.name || 'Assigned Lead'}</span>
                        <span>•</span>
                        <span>Version v{sop.version}</span>
                        <span>•</span>
                        <span>Next Review: {sop.nextReviewDate || 'Scheduled'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      sop.status === 'Active' || sop.status === 'Published'
                        ? 'bg-emerald-50 text-emerald-700'
                        : sop.status === 'Under Review'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sop.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    );
  }

  // Departments Overview Grid (All Departments)
  return (
    <div className="space-y-6">
      
      {/* Header Bento Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Operational Divisions Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
            Departments & SOP Governance
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Controlled SOP inventories across operational departments. Each department maintains ownership, periodic reviews, and regulatory ISO 9001/27001 alignment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            id="add-department-btn"
            onClick={onOpenCreateDeptModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Department</span>
          </button>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-gray-600">
            <span>Enterprise Organization Governance</span>
            <div className="text-[11px] text-gray-400">Total Departments: {departments.length} Units</div>
          </div>
        </div>
      </div>

      {/* Department Cards Grid or Empty State */}
      {departments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No departments created yet</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-5">
            Add your first operational department to organize standard operating procedures, assign accountability, and track governance scorecards.
          </p>
          <button
            id="empty-add-department-btn"
            onClick={onOpenCreateDeptModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Department</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {departments.map(dept => {
          const deptSops = sops.filter(s =>
            s.department === dept.name ||
            s.department === dept.id ||
            (dept.code === 'HR' && s.department === 'HR_Staffing') ||
            (dept.code === 'IT' && (s.department === 'IT Enablement' || s.department === 'Software_DevOps' || s.department === 'Cloud_Infrastructure')) ||
            (dept.code === 'CMP' && (s.department === 'Compliance' || s.department === 'InfoSec_Compliance'))
          );

          const activeCount = deptSops.filter(s => s.status === 'Active' || s.status === 'Published').length;
          const reviewDueCount = deptSops.filter(s => {
            if (!s.nextReviewDate) return false;
            const due = new Date(s.nextReviewDate);
            return due < thirtyDaysFromNow;
          }).length;

          return (
            <div
              key={dept.id}
              className={`bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col justify-between hover:border-gray-300 transition ${
                dept.status === 'Disabled' ? 'opacity-70 bg-gray-50/50' : ''
              }`}
            >
              <div>
                {/* Department Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                      {getDeptIcon(dept.code)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-[#1A1C1E]">{dept.name}</h2>
                        <span className="text-[10px] font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {dept.code}
                        </span>
                        {dept.status === 'Disabled' && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.2 rounded-full border border-red-200">
                            Disabled
                          </span>
                        )}
                      </div>
                      {dept.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                          {dept.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Head: <strong className="text-gray-800">{dept.headName}</strong> • {dept.headEmail}
                      </p>
                      {dept.primaryApproverName && (
                        <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                          Designated Approver: <strong>{dept.primaryApproverName}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
                    {activeCount} Active
                  </span>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-2.5 mb-5 text-center">
                  <div className="bg-gray-50 rounded-2xl p-2.5 border border-gray-100">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block font-semibold">Total SOPs</span>
                    <span className="text-xl font-bold text-gray-900">{deptSops.length}</span>
                  </div>
                  <div className="bg-emerald-50/70 rounded-2xl p-2.5 border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 uppercase tracking-wider block font-semibold">In Effect</span>
                    <span className="text-xl font-bold text-emerald-900">{activeCount}</span>
                  </div>
                  <div className="bg-amber-50/70 rounded-2xl p-2.5 border border-amber-100">
                    <span className="text-[10px] text-amber-700 uppercase tracking-wider block font-semibold">Review Due</span>
                    <span className="text-xl font-bold text-amber-900">{reviewDueCount}</span>
                  </div>
                </div>

                {/* Controlled Procedures List Snippet */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Controlled Procedures ({deptSops.length})
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {deptSops.slice(0, 4).map(sop => (
                      <div
                        key={sop.id}
                        onClick={() => onOpenSop(sop.id)}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 border border-gray-100 transition cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                            {sop.sopNumber}
                          </span>
                          <span className="font-medium text-gray-800 truncate">{sop.title}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                          v{sop.version}
                        </span>
                      </div>
                    ))}
                    {deptSops.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-400">
                        No SOPs yet created for this department.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Buttons */}
              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDeptId(dept.id)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Department Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onCreateSopForDept(dept.name)}
                    disabled={dept.status === 'Disabled'}
                    className="text-[11px] font-bold text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 transition disabled:opacity-40 cursor-pointer"
                  >
                    + Create SOP
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

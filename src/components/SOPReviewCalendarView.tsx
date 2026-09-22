import React, { useState, useMemo } from 'react';
import { SOPDocument, User } from '../types';
import {
  Calendar,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarClock,
  ArrowUpRight,
  Send,
  Building2,
  UserCheck,
  RefreshCw,
  Eye,
  GitPullRequest,
  CheckSquare
} from 'lucide-react';

interface SOPReviewCalendarViewProps {
  sops: SOPDocument[];
  currentUser: User;
  onOpenSop: (sopId: string) => void;
  onRequestChange: (sopId: string) => void;
  onDispatchReminder?: (sopId: string) => void;
  onCreateTask?: (sopId: string, sopTitle: string, dept: string) => void;
}

export const SOPReviewCalendarView: React.FC<SOPReviewCalendarViewProps> = ({
  sops,
  currentUser,
  onOpenSop,
  onRequestChange,
  onDispatchReminder,
  onCreateTask
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UPCOMING'>('ALL');
  const [remindedSops, setRemindedSops] = useState<Record<string, boolean>>({});

  const now = new Date();

  // Calculate review items with days remaining calculation
  const calendarItems = useMemo(() => {
    return sops.map(sop => {
      let daysRemaining = 999;
      let isOverdue = false;
      let isDueSoon = false;

      if (sop.nextReviewDate) {
        const reviewDate = new Date(sop.nextReviewDate);
        const diffMs = reviewDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) {
          isOverdue = true;
        } else if (daysRemaining <= 30) {
          isDueSoon = true;
        }
      }

      const ownerName =
        sop.processOwner?.name ||
        sop.author?.name ||
        (typeof sop.departmentOwner === 'string' ? sop.departmentOwner : 'Unassigned');

      const ownerEmail =
        sop.processOwner?.email ||
        sop.author?.email ||
        'owner@organization.com';

      return {
        sop,
        ownerName,
        ownerEmail,
        daysRemaining,
        isOverdue,
        isDueSoon
      };
    });
  }, [sops, now]);

  // Filter items
  const filteredItems = useMemo(() => {
    return calendarItems
      .filter(item => {
        const matchesSearch =
          item.sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sop.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.sop.sopNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sop.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDept =
          deptFilter === 'ALL' ||
          item.sop.department === deptFilter ||
          (deptFilter === 'HR' && (item.sop.department === 'HR' || item.sop.department === 'Human_Resources')) ||
          (deptFilter === 'Finance' && (item.sop.department === 'Finance' || item.sop.department === 'Finance_Accounts')) ||
          (deptFilter === 'IT' && (item.sop.department === 'IT_Enablement' || item.sop.department === 'IT'));

        let matchesStatus = true;
        if (statusFilter === 'OVERDUE') {
          matchesStatus = item.isOverdue;
        } else if (statusFilter === 'DUE_SOON') {
          matchesStatus = item.isDueSoon && !item.isOverdue;
        } else if (statusFilter === 'UPCOMING') {
          matchesStatus = !item.isOverdue && !item.isDueSoon;
        }

        return matchesSearch && matchesDept && matchesStatus;
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [calendarItems, searchTerm, deptFilter, statusFilter]);

  // Overall metric counters
  const overdueCount = calendarItems.filter(i => i.isOverdue).length;
  const dueSoonCount = calendarItems.filter(i => i.isDueSoon && !i.isOverdue).length;
  const upcomingCount = calendarItems.filter(i => !i.isOverdue && !i.isDueSoon).length;

  const handleSendReminder = (sopId: string) => {
    if (onDispatchReminder) {
      onDispatchReminder(sopId);
    }
    setRemindedSops(prev => ({ ...prev, [sopId]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Governance & Quality Assurance</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1C1E] flex items-center gap-2">
            SOP Review Calendar
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Controlled periodic review schedule tracking ISO 9001 / ISO 27001 recertification cycles across all departments.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2.5">
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-2 rounded-2xl text-center">
            <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">Overdue</div>
            <div className="text-xl font-bold text-rose-900">{overdueCount}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-2xl text-center">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Due ≤ 30d</div>
            <div className="text-xl font-bold text-amber-900">{dueSoonCount}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-center">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Scheduled</div>
            <div className="text-xl font-bold text-emerald-900">{upcomingCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SOP title, ID, department, or owner..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Departments</option>
            <option value="IT_Enablement">IT Enablement</option>
            <option value="HR">Human Resources</option>
            <option value="Finance">Finance & Accounts</option>
            <option value="Payroll">Payroll</option>
            <option value="Compliance">Quality & Compliance</option>
          </select>

          {/* Status Filter Tabs */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({calendarItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'OVERDUE'
                  ? 'bg-rose-600 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <span>Overdue</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded-full font-mono">
                {overdueCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('DUE_SOON')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'DUE_SOON'
                  ? 'bg-amber-500 text-white shadow-2xs font-bold'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <span>Due Soon</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-mono">
                {dueSoonCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('UPCOMING')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === 'UPCOMING'
                  ? 'bg-white text-gray-900 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
          </div>
        </div>
      </div>

      {/* Main Review Calendar Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                <th className="p-4">SOP & ID</th>
                <th className="p-4">Department</th>
                <th className="p-4">Owner</th>
                <th className="p-4">Review Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Days Remaining</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    No SOP review records found matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const { sop, ownerName, ownerEmail, daysRemaining, isOverdue, isDueSoon } = item;
                  const isReminded = remindedSops[sop.id];

                  return (
                    <tr
                      key={sop.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        isOverdue ? 'bg-rose-50/20' : isDueSoon ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* SOP & ID */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{sop.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {sop.sopNumber || sop.id}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">v{sop.version}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            {sop.department.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Frequency: {sop.reviewFrequencyMonths ? `${sop.reviewFrequencyMonths} Months` : 'Annual'}
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="p-4">
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{ownerName}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">{ownerEmail}</div>
                      </td>

                      {/* Review Date */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-800">
                          {sop.nextReviewDate ? new Date(sop.nextReviewDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 'TO BE DEFINED'}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          Effective: {sop.effectiveDate ? new Date(sop.effectiveDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] border ${
                          sop.status === 'Active' || sop.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : sop.status === 'Draft'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            sop.status === 'Active' || sop.status === 'Published'
                              ? 'bg-emerald-500'
                              : sop.status === 'Draft'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}></span>
                          {sop.status}
                        </span>
                      </td>

                      {/* Days Remaining */}
                      <td className="p-4 whitespace-nowrap">
                        {isOverdue ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-200 rounded-xl font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Overdue by {Math.abs(daysRemaining)} days</span>
                          </div>
                        ) : isDueSoon ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Due in {daysRemaining} days</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{daysRemaining} days remaining</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenSop(sop.id)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Open SOP Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => onRequestChange(sop.id)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer"
                            title="Request Review / Change"
                          >
                            <GitPullRequest className="w-3.5 h-3.5" />
                            <span>Review Request</span>
                          </button>

                          {onCreateTask && (
                            <button
                              onClick={() => onCreateTask(sop.id, sop.title, sop.department)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Create Review Task"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Task</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleSendReminder(sop.id)}
                            disabled={isReminded}
                            className={`px-2.5 py-1.5 rounded-xl font-semibold flex items-center gap-1 transition cursor-pointer ${
                              isReminded
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                            title="Send Review Reminder Notification"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{isReminded ? 'Notified' : 'Remind'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

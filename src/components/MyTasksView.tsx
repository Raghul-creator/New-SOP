import React, { useState } from 'react';
import { TaskItem, SOPDocument, User, IssueReport, ChangeRequest } from '../types';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
  Filter,
  UserCheck,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  GitPullRequest,
  AlertCircle,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';

interface MyTasksViewProps {
  tasks: TaskItem[];
  sops: SOPDocument[];
  issues: IssueReport[];
  changeRequests: ChangeRequest[];
  currentUser: User;
  onToggleTaskChecklist: (taskId: string, checklistId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onOpenSop: (sopId: string) => void;
  onResolveIssue?: (issueId: string) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  tasks,
  sops,
  issues,
  changeRequests,
  currentUser,
  onToggleTaskChecklist,
  onCompleteTask,
  onOpenSop,
  onResolveIssue
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'my-tasks' | 'issues' | 'change-requests'>('tasks');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedDept !== 'all' && task.department !== selectedDept) return false;
    if (activeTab === 'my-tasks') {
      return (
        task.assignedTo.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        task.assignedToRole?.toLowerCase() === currentUser.role.toLowerCase()
      );
    }
    return true;
  });

  const pendingCount = tasks.filter(t => t.status !== 'Completed').length;
  const myPendingCount = tasks.filter(t =>
    t.status !== 'Completed' &&
    (t.assignedTo.toLowerCase().includes(currentUser.name.toLowerCase()) ||
     t.assignedToRole?.toLowerCase() === currentUser.role.toLowerCase())
  ).length;

  const openIssuesCount = issues.filter(i => i.status === 'OPEN' || i.status === 'Open' || i.status === 'In Progress' || i.status === 'Under Review').length;
  const pendingCRsCount = changeRequests.filter(cr => cr.status === 'SUBMITTED' || cr.status === 'UNDER REVIEW' || cr.status === 'Submitted' || cr.status === 'Under Review' || cr.status === 'Pending Review').length;

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'Urgent':
      case 'Critical':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: TaskItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Overdue':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bento Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Operational Governance & Execution</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
            MY TASKS
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
            Tasks, periodic reviews, and reported items assigned to you. Click any task or SOP reference to open and inspect the procedure directly.
          </p>
        </div>

        {/* KPI Counter Cards */}
        <div className="flex items-center gap-2.5">
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 text-center min-w-[90px]">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Assigned to Me</span>
            <span className="text-2xl font-bold text-indigo-900">{myPendingCount}</span>
          </div>
          <div className="bg-amber-50/80 border border-amber-100 rounded-2xl p-3 text-center min-w-[90px]">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Open Tasks</span>
            <span className="text-2xl font-bold text-amber-900">{pendingCount}</span>
          </div>
          <div className="bg-purple-50/80 border border-purple-100 rounded-2xl p-3 text-center min-w-[90px]">
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Issues / RFCs</span>
            <span className="text-2xl font-bold text-purple-900">{openIssuesCount + pendingCRsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-gray-200/80 p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('my-tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'my-tasks'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Assigned to Me ({myPendingCount})
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Reported Issues ({openIssuesCount})
          </button>
          <button
            onClick={() => setActiveTab('change-requests')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'change-requests'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Change Requests ({changeRequests.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Department filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Departments</option>
              <option value="HR">HR</option>
              <option value="IT Enablement">IT Enablement</option>
              <option value="Finance">Finance</option>
              <option value="Payroll">Payroll</option>
              <option value="Compliance">Compliance</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          {(activeTab === 'tasks' || activeTab === 'my-tasks') && (
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Table View (Task, SOP, Department, Responsible Person, Due Date, Priority, Status)"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
                }`}
                title="Card View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. TASKS VIEW */}
      {(activeTab === 'tasks' || activeTab === 'my-tasks') && (
        <>
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900">All caught up!</h3>
              <p className="text-xs text-gray-500 mt-1">
                No tasks matching the selected filters. All procedure milestones are on schedule.
              </p>
            </div>
          ) : viewMode === 'table' ? (
            /* Table View with EXACT REQUIRED COLUMNS:
               Task, SOP, Department, Responsible person, Due date, Priority, Status */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                      <th className="p-3.5">Task</th>
                      <th className="p-3.5">SOP</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Responsible Person</th>
                      <th className="p-3.5">Due Date</th>
                      <th className="p-3.5">Priority</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Task */}
                        <td className="p-3.5 max-w-xs">
                          <div className="font-bold text-gray-900">{task.title}</div>
                          {task.checklist && (
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {task.checklist.filter(c => c.completed).length}/{task.checklist.length} checklist items complete
                            </div>
                          )}
                        </td>

                        {/* SOP */}
                        <td className="p-3.5">
                          <button
                            onClick={() => onOpenSop(task.sopId)}
                            className="text-left group cursor-pointer"
                            title="Click to open relevant SOP"
                          >
                            <div className="font-mono text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center gap-1">
                              <span>{task.sopNumber || task.sopId}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[10px] text-gray-500 font-normal truncate max-w-[180px]">
                              {task.sopTitle}
                            </div>
                          </button>
                        </td>

                        {/* Department */}
                        <td className="p-3.5 font-medium text-gray-700 whitespace-nowrap">
                          {task.department}
                        </td>

                        {/* Responsible person */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{task.assignedTo}</div>
                          {task.assignedToRole && (
                            <div className="text-[10px] text-gray-400">{task.assignedToRole}</div>
                          )}
                        </td>

                        {/* Due date */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-gray-700">
                          {task.dueDate}
                        </td>

                        {/* Priority */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(task.status)}`}>
                            {task.status}
                          </span>
                        </td>

                        {/* Action - Open SOP / Complete */}
                        <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                          <button
                            onClick={() => onOpenSop(task.sopId)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                            title="Open relevant SOP/process"
                          >
                            Open SOP
                          </button>

                          {task.status !== 'Completed' ? (
                            <button
                              onClick={() => onCompleteTask(task.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition cursor-pointer"
                              title="Mark as completed"
                            >
                              Complete
                            </button>
                          ) : (
                            <span className="text-emerald-600 font-bold text-[11px]">Done</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Card View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                          {task.sopNumber || task.sopId}
                        </span>
                        <span className="text-[11px] font-medium text-gray-500">
                          {task.department}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#1A1C1E] mb-1 leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      SOP: <span className="font-semibold text-gray-700">{task.sopTitle}</span>
                    </p>

                    {task.checklist && task.checklist.length > 0 && (
                      <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 mb-3 space-y-2">
                        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                          Action Checklist ({task.checklist.filter(c => c.completed).length}/{task.checklist.length})
                        </p>
                        <div className="space-y-1.5">
                          {task.checklist.map(item => (
                            <label
                              key={item.id}
                              className="flex items-start gap-2 text-xs text-gray-700 cursor-pointer hover:text-gray-900 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={() => onToggleTaskChecklist(task.id, item.id)}
                                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className={item.completed ? 'line-through text-gray-400' : ''}>
                                {item.text}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Due: <strong className="text-gray-800">{task.dueDate}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        <span>Assigned: <strong className="text-gray-800">{task.assignedTo}</strong></span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-gray-100">
                    <button
                      onClick={() => onOpenSop(task.sopId)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open SOP Process</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {task.status !== 'Completed' ? (
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complete Task</span>
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Fulfilled</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 2. REPORTED ISSUES TAB */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              Reported SOP Issues ({issues.length})
            </h2>
            <span className="text-xs text-gray-500">Live operational discrepancies and compliance issues</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Issue / Description</th>
                    <th className="p-3.5">SOP Reference</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Issue Type</th>
                    <th className="p-3.5">Urgency</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Reported By</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {issues.map(issue => (
                    <tr key={issue.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="font-bold text-gray-900">{issue.title}</div>
                        <div className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{issue.description}</div>
                        {issue.attachmentName && (
                          <div className="text-[10px] text-indigo-600 font-mono mt-1">
                            📎 {issue.attachmentName}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => onOpenSop(issue.sopId)}
                          className="text-left font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          {issue.sopNumber || issue.sopId}
                        </button>
                      </td>
                      <td className="p-3.5 font-medium text-gray-700">{issue.department}</td>
                      <td className="p-3.5 font-medium text-gray-800">{issue.issueType || issue.category || 'General'}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(issue.urgency || issue.severity || 'Medium')}`}>
                          {issue.urgency || issue.severity || 'Medium'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          issue.status === 'RESOLVED' || issue.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          issue.status === 'IN PROGRESS' || issue.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {issue.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-[11px] text-gray-600">
                        {issue.reportedBy?.name || 'User'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap space-x-2">
                        <button
                          onClick={() => onOpenSop(issue.sopId)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                        >
                          Open SOP
                        </button>
                        {onResolveIssue && issue.status !== 'RESOLVED' && issue.status !== 'Resolved' && (
                          <button
                            onClick={() => onResolveIssue(issue.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. CHANGE REQUESTS TAB */}
      {activeTab === 'change-requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
              SOP Change Requests ({changeRequests.length})
            </h2>
            <span className="text-xs text-gray-500">Formal RFCs submitted by team members</span>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-200 uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Change Request</th>
                    <th className="p-3.5">SOP Reference</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Change Type</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Submitted By</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {changeRequests.map(cr => (
                    <tr key={cr.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <div className="font-bold text-gray-900">{cr.title || cr.changeTitle}</div>
                        <div className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                          {cr.reason || cr.businessJustification || cr.reasonForChange}
                        </div>
                        {cr.attachmentName && (
                          <div className="text-[10px] text-blue-600 font-mono mt-1">
                            📎 {cr.attachmentName}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => onOpenSop(cr.sopId)}
                          className="text-left font-mono font-bold text-indigo-600 hover:underline cursor-pointer"
                        >
                          {cr.sopNumber || cr.sopId}
                        </button>
                      </td>
                      <td className="p-3.5 font-medium text-gray-700">{cr.department}</td>
                      <td className="p-3.5 font-medium text-gray-800">{cr.changeType || 'Process improvement'}</td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(cr.priority || 'Medium')}`}>
                          {cr.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border bg-blue-50 text-blue-700 border-blue-200">
                          {cr.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-[11px] text-gray-600">
                        {cr.submittedBy?.name || 'User'}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => onOpenSop(cr.sopId)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition cursor-pointer"
                        >
                          Open SOP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


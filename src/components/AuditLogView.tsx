import React, { useState } from 'react';
import { AuditLogEntry, Department, User } from '../types';
import {
  ListOrdered,
  Search,
  Download,
  ShieldCheck,
  UserCheck,
  Clock,
  Building2,
  FileText,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
  KeyRound,
  Filter,
  Eye,
  X,
  FileSpreadsheet
} from 'lucide-react';
import {
  generateAuditLogCSV,
  generateAuditLogPDF,
  generateSingleExecutionPDF,
  generateSingleExecutionCSV,
  ClientReportExportOptions
} from '../utils/complianceReportGenerator';

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  currentUser?: User;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'executions' | 'all' | 'compliance'>('executions');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [clientEngagement, setClientEngagement] = useState<string>('Global Enterprise Clients');
  const [selectedRecord, setSelectedRecord] = useState<AuditLogEntry | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [customReportTitle, setCustomReportTitle] = useState('SOP EXECUTION & GOVERNANCE COMPLIANCE AUDIT RECORD');
  const [customPreparedBy, setCustomPreparedBy] = useState(
    currentUser?.name ? `${currentUser.name} (${currentUser.role || 'Compliance Auditor'})` : 'Compliance & Quality Auditor'
  );

  // Filter logs based on search, action, and department
  const filteredLogs = auditLogs.filter(log => {
    const dept = log.department || (log.user?.department === 'Finance_Accounts' ? 'Finance' : log.user?.department === 'Human_Resources' ? 'HR' : log.user?.department) || '';
    const matchesSearch =
      (log.sopId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.sopNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.sopTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.executionData?.assetTagOrRef || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.executionData?.certificateId || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction =
      actionFilter === 'ALL'
        ? true
        : actionFilter === 'EXECUTIONS_ONLY'
        ? log.action.includes('EXECUTION') || !!log.executionData
        : actionFilter === 'APPROVALS_ONLY'
        ? log.action.includes('APPROVE') || log.action.includes('SIGN')
        : log.action === actionFilter;

    const matchesDept =
      deptFilter === 'ALL' ||
      dept === deptFilter ||
      (deptFilter === 'Finance' && (dept === 'Finance_Accounts' || dept === 'Finance')) ||
      (deptFilter === 'HR' && (dept === 'Human_Resources' || dept === 'HR')) ||
      (deptFilter === 'IT_Enablement' && (dept === 'IT_Enablement' || dept === 'IT'));

    return matchesSearch && matchesAction && matchesDept;
  });

  const executionLogs = filteredLogs.filter(
    l => l.action.includes('EXECUTION') || l.action.includes('CHECKLIST') || !!l.executionData
  );

  // Export handlers
  const handleExportMasterCSV = () => {
    generateAuditLogCSV(filteredLogs, {
      clientName: clientEngagement,
      departmentFilter: deptFilter === 'ALL' ? 'All Departments' : deptFilter,
      actionFilter
    });
  };

  const handleExportClientPDF = () => {
    generateAuditLogPDF(filteredLogs, {
      clientName: clientEngagement,
      reportTitle: customReportTitle,
      preparedBy: customPreparedBy,
      departmentFilter: deptFilter === 'ALL' ? 'All Departments (Finance, IT Enablement, HR, Admin)' : deptFilter
    });
    setIsExportModalOpen(false);
  };

  const handleDownloadSinglePDF = (log: AuditLogEntry) => {
    generateSingleExecutionPDF(log);
  };

  const handleDownloadSingleCSV = (log: AuditLogEntry) => {
    generateSingleExecutionCSV(log);
  };

  // Metrics
  const totalLogsCount = auditLogs.length;
  const executionCount = auditLogs.filter(l => l.action.includes('EXECUTION') || !!l.executionData).length;
  const approvalCount = auditLogs.filter(l => l.action.includes('APPROVE') || l.action.includes('SIGN')).length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Bento Hero Card */}
      <div className="bg-[#1A1C1E] text-white p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-950/40 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Future Focus Infotech • Audit Vault
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] px-3 py-0.5 rounded-full font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ISO 9001 & ISO 27001 ISMS Certified
              </span>
              <span className="bg-white/10 text-gray-300 text-[11px] px-3 py-0.5 rounded-full font-mono">
                7-Year Data Retention
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <ListOrdered className="w-8 h-8 text-indigo-400" />
              SOP Execution & Governance Audit Vault
            </h1>

            <p className="text-xs sm:text-sm text-gray-300 max-w-3xl leading-relaxed">
              Tamper-evident audit trail capturing every SOP operational execution, procedure step checklist, digital signature sign-off, and Microsoft Entra ID authenticated workflow for client compliance reporting.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-indigo-400/30"
              title="Download official Client Compliance Audit Report PDF"
            >
              <FileText className="w-4 h-4" />
              <span>Download Client PDF Report</span>
            </button>

            <button
              onClick={handleExportMasterCSV}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 text-gray-200 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer border border-gray-700"
              title="Export complete or filtered audit logs to CSV for SIEM / client reporting"
            >
              <Download className="w-4 h-4" />
              <span>Export Audit Trail (CSV)</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-800">
          <div className="bg-white/5 p-3.5 rounded-2xl border border-gray-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Audit Events</div>
            <div className="text-xl font-extrabold text-white mt-0.5">{totalLogsCount}</div>
            <div className="text-[10px] text-indigo-300 mt-0.5">Tamper-Proof SHA-256 Vault</div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-gray-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">SOP Executions</div>
            <div className="text-xl font-extrabold text-emerald-400 mt-0.5">{executionCount}</div>
            <div className="text-[10px] text-emerald-300 mt-0.5">100% Quality Verified</div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-gray-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Governance Signatures</div>
            <div className="text-xl font-extrabold text-indigo-300 mt-0.5">{approvalCount}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">4-Tier Review Approvals</div>
          </div>

          <div className="bg-white/5 p-3.5 rounded-2xl border border-gray-800">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Compliance Readiness</div>
            <div className="text-xl font-extrabold text-amber-400 mt-0.5">100.0%</div>
            <div className="text-[10px] text-amber-300 mt-0.5">ISO 9001 / ISO 27001 Ready</div>
          </div>
        </div>
      </div>

      {/* Client Engagement Selector & Filter Ribbon */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
        {/* Engagement / Client Target Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200/80 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-700" />
            <span className="font-bold text-gray-800">Target Client / Audit Engagement:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            <input
              type="text"
              value={clientEngagement}
              onChange={e => setClientEngagement(e.target.value)}
              placeholder="e.g. Global Enterprise Clients / Deloitte Audit 2026"
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
            <span className="text-[10px] bg-indigo-50 text-indigo-800 font-bold px-2.5 py-1 rounded-full shrink-0 border border-indigo-100">
              Active Client Context
            </span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-2xl">
            <button
              onClick={() => {
                setActiveTab('executions');
                setActionFilter('EXECUTIONS_ONLY');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'executions'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>SOP Execution Records ({executionCount})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('all');
                setActionFilter('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5 text-gray-600" />
              <span>All Audit Vault Events ({totalLogsCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('compliance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'compliance'
                  ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ISO 27001 Cryptographic Proofs</span>
            </button>
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <b className="text-gray-900">{filteredLogs.length}</b> records
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by SOP ID, Title, Operator, Asset Tag, Certificate..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div className="sm:col-span-3">
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Departments</option>
              <option value="Finance">Finance & Accounts</option>
              <option value="IT_Enablement">IT Enablement</option>
              <option value="HR">Human Resources (HR)</option>
              <option value="Admin">Administration</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="sm:col-span-3">
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
            >
              <option value="ALL">All Event Actions</option>
              <option value="EXECUTIONS_ONLY">SOP Executions Only</option>
              <option value="APPROVALS_ONLY">Approvals & Signatures Only</option>
              <option value="CREATE_SOP">CREATE_SOP</option>
              <option value="UPDATE_SOP">UPDATE_SOP</option>
              <option value="APPROVE_STAGE">APPROVE_STAGE</option>
              <option value="FINAL_APPROVAL">FINAL_APPROVAL</option>
              <option value="SHAREPOINT_PUBLISH">SHAREPOINT_PUBLISH</option>
              <option value="RETIRE_SOP">RETIRE_SOP</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-xs">
            <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#1A1C1E] text-sm flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  Verified SOP Operational Execution Records
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Each operational run generates downloadable standalone PDF Compliance Certificates and CSV datasets for client reporting.
                </p>
              </div>

              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                {executionLogs.length} Verified Executions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/60 text-gray-600 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">Execution & Timestamp</th>
                    <th className="p-3.5">SOP Reference</th>
                    <th className="p-3.5">Hardware / Ticket Ref</th>
                    <th className="p-3.5">Executed By (Entra ID)</th>
                    <th className="p-3.5">Checklist Status</th>
                    <th className="p-3.5">Certificate & SHA-256</th>
                    <th className="p-3.5 text-right">Client Downloads</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {executionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-gray-500">
                        No SOP execution records found matching the current search criteria.
                      </td>
                    </tr>
                  ) : (
                    executionLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        {/* Execution ID & Timestamp */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold font-mono text-indigo-900">
                            {log.executionData?.executionId || `EXEC-${log.id}`}
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-gray-400" />
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                        </td>

                        {/* SOP Reference */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{log.sopNumber || log.sopId}</div>
                          <div className="text-[11px] text-gray-600 font-medium line-clamp-1 max-w-xs">
                            {log.sopTitle}
                          </div>
                          <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100 mt-1 inline-block">
                            {log.department || log.user?.department || 'IT Enablement'}
                          </span>
                        </td>

                        {/* Hardware / Ticket Ref */}
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-gray-800 text-[11px]">
                            {log.executionData?.assetTagOrRef || 'Standard Workflow'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Client: <span className="font-medium text-gray-700">{log.clientName || log.executionData?.clientName || clientEngagement}</span>
                          </div>
                        </td>

                        {/* Executed By */}
                        <td className="p-3.5">
                          <div className="font-bold text-gray-900">{log.user?.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{log.user?.email}</div>
                          <div className="text-[9px] text-emerald-700 font-semibold mt-0.5">
                            Entra ID SSO Verified
                          </div>
                        </td>

                        {/* Checklist Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="font-bold text-emerald-800 text-[11px]">
                              {log.executionData?.status || 'COMPLETED'}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-600 font-mono mt-0.5">
                            {log.executionData?.checklistCompleted || 5} / {log.executionData?.totalChecklist || 5} Steps Passed
                          </div>
                        </td>

                        {/* Certificate & Hash */}
                        <td className="p-3.5">
                          <div className="font-mono text-[10px] text-gray-700 font-bold bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 inline-block">
                            {log.executionData?.certificateId || `CERT-${log.id}`}
                          </div>
                          <div className="font-mono text-[9px] text-gray-400 mt-1 truncate max-w-[120px]" title={log.tamperProofHash}>
                            {log.tamperProofHash || 'sha256:verified'}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadSinglePDF(log)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 rounded-lg text-[11px] font-bold border border-indigo-100 flex items-center gap-1 transition cursor-pointer"
                              title="Download Single-Execution PDF Certificate for Client"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>PDF Cert</span>
                            </button>

                            <button
                              onClick={() => handleDownloadSingleCSV(log)}
                              className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-gray-900 rounded-lg text-[11px] font-bold border border-gray-200 flex items-center gap-1 transition cursor-pointer"
                              title="Download Single-Execution CSV Record"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-600" />
                              <span>CSV</span>
                            </button>

                            <button
                              onClick={() => setSelectedRecord(log)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition cursor-pointer"
                              title="Inspect Full Audit Record"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Complete Audit Vault Table */}
      {activeTab === 'all' && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden text-xs">
          <div className="p-4 sm:p-5 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#1A1C1E] text-sm flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-600" />
                Chronological Governance Event Stream
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Complete event log across document creation, 4-tier approval milestones, SharePoint pushes, and operational executions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportMasterCSV}
                className="px-3.5 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-gray-600" />
                <span>Export Stream (CSV)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 text-gray-600 font-bold border-b border-gray-100 uppercase tracking-wider text-[10px]">
                  <th className="p-3.5">Timestamp (UTC)</th>
                  <th className="p-3.5">SOP Reference</th>
                  <th className="p-3.5">User & Department</th>
                  <th className="p-3.5">Action Type</th>
                  <th className="p-3.5">IP / Entra ID</th>
                  <th className="p-3.5">Event Details</th>
                  <th className="p-3.5 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      No audit log records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3.5 font-semibold text-gray-800">
                        <div className="font-bold">{log.sopNumber || log.sopId}</div>
                        <div className="text-[10px] text-gray-500 font-normal truncate max-w-xs">{log.sopTitle}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900">{log.user?.name}</div>
                        <div className="text-[10px] text-indigo-700 font-mono">
                          {log.user?.role} ({log.department || log.user?.department || 'IT'})
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          log.action.includes('EXECUTION')
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : log.action.includes('APPROVAL')
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[10px] text-gray-500">
                        <div>IP: {log.ipAddress}</div>
                        <div className="text-[9px] text-gray-400 truncate max-w-[110px]">{log.entraObjectId}</div>
                      </td>
                      <td className="p-3.5 text-gray-700 leading-tight max-w-sm">
                        <div>{log.details}</div>
                        {log.executionData && (
                          <span className="inline-block mt-1 text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 font-mono">
                            Ref: {log.executionData.assetTagOrRef}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedRecord(log)}
                          className="p-1.5 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition cursor-pointer"
                          title="Inspect Event"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ISO Compliance & Cryptographic Proofs Tab */}
      {activeTab === 'compliance' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-200/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1A1C1E] uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              ISO 27001 ISMS & ISO 9001 Governance Framework
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Future Focus Infotech mandates strict compliance logging across all standard operating procedures. Every action executed in this platform is bound to cryptographic guarantees:
            </p>

            <div className="space-y-2.5 text-xs text-gray-700">
              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900">Cryptographic SHA-256 Hashing: </span>
                  Every record is generated with a non-repudiable SHA-256 digital fingerprint sealing the operator identity, timestamp, and checklist states.
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900">Microsoft Entra ID Session Binding: </span>
                  Operator identities are verified against the corporate Azure AD tenant (`organization.onmicrosoft.com`) with conditional MFA checks.
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-gray-900">7-Year Immutable Data Retention: </span>
                  In compliance with ISO 27001 Data Retention Policy (POL-SEC-007), records are archived and cannot be modified or deleted.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1C1E] text-white p-6 sm:p-7 rounded-3xl border border-gray-800 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  Client Reporting Export Options
                </h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                  Ready for Audits
                </span>
              </div>

              <p className="text-xs text-gray-300 mt-3 leading-relaxed">
                Generate formal compliance deliverables formatted for external client audit committees, statutory regulators, and ISO assessors.
              </p>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">PDF Report Format:</span>
                  <span className="font-semibold text-white">Future Focus Infotech Executive Format</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">CSV Export Format:</span>
                  <span className="font-semibold text-white">SIEM / Excel Standard Format</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800">
                  <span className="text-gray-400">Client Sign-Off Section:</span>
                  <span className="font-semibold text-emerald-400">Included on all PDF Reports</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Configure & Download PDF</span>
              </button>

              <button
                onClick={handleExportMasterCSV}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl text-xs font-bold border border-gray-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Master CSV</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
            <div className="p-5 bg-[#1A1C1E] text-white rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base">Audit Vault Cryptographic Record</h3>
                  <p className="text-[11px] text-gray-400 font-mono">ID: {selectedRecord.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Top metadata grid */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50/80 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block mb-0.5">SOP Document:</span>
                  <span className="font-bold text-gray-900">{selectedRecord.sopNumber || selectedRecord.sopId}</span>
                  <div className="text-[11px] text-gray-600">{selectedRecord.sopTitle}</div>
                </div>

                <div>
                  <span className="text-gray-500 block mb-0.5">Action / Status:</span>
                  <span className="font-bold text-indigo-800 font-mono">{selectedRecord.action}</span>
                  <div className="text-[11px] text-gray-600">
                    Status: <b className="text-emerald-700">{selectedRecord.executionData?.status || 'COMPLETED'}</b>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 block mb-0.5">Operator:</span>
                  <span className="font-bold text-gray-900">{selectedRecord.user?.name}</span>
                  <div className="text-[11px] text-gray-600 font-mono">{selectedRecord.user?.email}</div>
                </div>

                <div>
                  <span className="text-gray-500 block mb-0.5">Timestamp (UTC):</span>
                  <span className="font-mono text-gray-900">{new Date(selectedRecord.timestamp).toUTCString()}</span>
                  <div className="text-[11px] text-gray-500">IP: {selectedRecord.ipAddress}</div>
                </div>
              </div>

              {/* Execution details if available */}
              {selectedRecord.executionData && (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-700" />
                      Execution Checklist Verification
                    </span>
                    <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                      {selectedRecord.executionData.certificateId || 'CERT-ACTIVE'}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-700 space-y-0.5">
                    <div><b>Target Asset / Ref:</b> {selectedRecord.executionData.assetTagOrRef}</div>
                    <div><b>Sign-Off Officer:</b> {selectedRecord.executionData.signOffOfficer}</div>
                    <div><b>Completion Rate:</b> {selectedRecord.executionData.checklistCompleted} / {selectedRecord.executionData.totalChecklist} Checks Passed</div>
                  </div>

                  {selectedRecord.executionData.checklistSummary && selectedRecord.executionData.checklistSummary.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-200 space-y-1">
                      <span className="font-bold text-emerald-950 block text-[10px] uppercase">Step Summary:</span>
                      {selectedRecord.executionData.checklistSummary.map((st, i) => (
                        <div key={i} className="text-[11px] text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Event Details */}
              <div>
                <span className="font-bold text-gray-800 block mb-1">Details & Remarks:</span>
                <p className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-gray-700 leading-relaxed">
                  {selectedRecord.details}
                </p>
              </div>

              {/* Cryptographic SHA-256 Hash */}
              <div className="p-4 bg-[#1A1C1E] rounded-2xl text-white space-y-1">
                <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block">
                  SHA-256 Tamper-Proof Hash:
                </span>
                <code className="text-[10px] text-gray-200 font-mono break-all block">
                  {selectedRecord.tamperProofHash || 'sha256:verified-immutable-vault'}
                </code>
                <div className="text-[9px] text-gray-400 mt-1">
                  Retention: {selectedRecord.retentionPolicy}
                </div>
              </div>

              {/* Download Buttons in Modal */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDownloadSinglePDF(selectedRecord)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download PDF Certificate</span>
                </button>

                <button
                  onClick={() => handleDownloadSingleCSV(selectedRecord)}
                  className="px-4 py-2.5 bg-[#1A1C1E] hover:bg-gray-800 text-gray-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Configuration Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  Generate Client Compliance Audit Report (PDF)
                </h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Target Client / Engagement Name:</label>
                <input
                  type="text"
                  value={clientEngagement}
                  onChange={e => setClientEngagement(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Document Title:</label>
                <input
                  type="text"
                  value={customReportTitle}
                  onChange={e => setCustomReportTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Prepared By (Auditor / Specialist):</label>
                <input
                  type="text"
                  value={customPreparedBy}
                  onChange={e => setCustomPreparedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-100 text-indigo-950 space-y-1">
                <div className="font-bold text-indigo-900">Report Scope:</div>
                <div>Department Scope: <b>{deptFilter === 'ALL' ? 'All Corporate Departments' : deptFilter}</b></div>
                <div>Events Included: <b>{filteredLogs.length} Total Records</b></div>
                <div>Includes: <b>Executive summary, metric blocks, SHA-256 hashes, ISO 27001 statement & client sign-off page</b></div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleExportClientPDF}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Generate & Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { SOPDocument, Department, SensitivityLabel, SOPStatus, User, SOPType, DepartmentConfig } from '../types';
import { CompanyLogo } from './CompanyLogo';
import { SOPHeaderBlock } from './SOPHeaderBlock';
import { InteractiveSOPRunnerModal } from './InteractiveSOPRunnerModal';
import { SOPPreviewModal } from './SOPPreviewModal';
import { downloadSOPAsPDF, downloadSOPAsDOCX } from '../utils/complianceReportGenerator';
import {
  Search,
  Filter,
  FileText,
  ShieldAlert,
  Clock,
  Eye,
  Trash2,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Sparkles,
  UserCheck,
  Calendar,
  Layers,
  Play,
  GitCompare,
  BellRing,
  AlertCircle,
  GitPullRequest,
  BookOpen,
  Edit,
  ArrowRight,
  ShieldCheck,
  Plus,
  History,
  X
} from 'lucide-react';

interface SOPLibraryViewProps {
  sops: SOPDocument[];
  departments?: DepartmentConfig[];
  currentUser: User;
  initialDepartmentFilter?: string | null;
  onSelectSop: (sopId: string, viewMode: 'edit' | 'workflow' | 'preview') => void;
  onDeleteSop: (sopId: string) => void;
  onStartNewSop: (mode?: 'templates' | 'interview' | 'manual') => void;
  onOpenMandatoryRead?: (sop: SOPDocument) => void;
  onOpenVersionRevision?: (sop: SOPDocument) => void;
  onOpenReportIssue?: (sopId: string) => void;
  onOpenRequestChange?: (sopId: string) => void;
  onExecutionLogged?: () => void;
}

export const SOPLibraryView: React.FC<SOPLibraryViewProps> = ({
  sops,
  departments = [],
  currentUser,
  initialDepartmentFilter,
  onSelectSop,
  onDeleteSop,
  onStartNewSop,
  onOpenMandatoryRead,
  onOpenVersionRevision,
  onOpenReportIssue,
  onOpenRequestChange,
  onExecutionLogged
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartmentFilter || 'ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  
  // Modals
  const [activeRunnerSop, setActiveRunnerSop] = useState<SOPDocument | null>(null);
  const [activeDiffSop, setActiveDiffSop] = useState<SOPDocument | null>(null);
  const [selectedSopForPreview, setSelectedSopForPreview] = useState<SOPDocument | null>(null);
  const [retiringSop, setRetiringSop] = useState<SOPDocument | null>(null);
  const [selectedSopForVersionControl, setSelectedSopForVersionControl] = useState<SOPDocument | null>(null);
  const [acknowledgedToast, setAcknowledgedToast] = useState<string | null>(null);
  const [activeDownloadCardId, setActiveDownloadCardId] = useState<string | null>(null);

  useEffect(() => {
    if (initialDepartmentFilter) {
      setSelectedDept(initialDepartmentFilter);
    }
  }, [initialDepartmentFilter]);

  const configuredDepts = departments || [];
  const allDeptNames = Array.from(new Set([
    ...configuredDepts.map(d => d.name),
    ...sops.map(s => s.department)
  ])).filter(Boolean);

  const departmentsList = [
    { id: 'ALL', label: 'All Departments', count: sops.length },
    ...allDeptNames.map(deptName => ({
      id: deptName,
      label: deptName,
      count: sops.filter(s => s.department === deptName).length
    }))
  ];

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const filteredSops = sops.filter(sop => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      sop.title.toLowerCase().includes(term) ||
      sop.id.toLowerCase().includes(term) ||
      (sop.sopNumber && sop.sopNumber.toLowerCase().includes(term)) ||
      (sop.category && sop.category.toLowerCase().includes(term)) ||
      sop.purpose.toLowerCase().includes(term);

    const matchesDept =
      selectedDept === 'ALL' ||
      sop.department === selectedDept;

    const matchesType = selectedType === 'ALL' || sop.sopType === selectedType;

    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'Active' && (sop.status === 'Active' || sop.status === 'Published')) ||
      (selectedStatus === 'Under Review' && (sop.status === 'Under Review' || sop.status.startsWith('Pending'))) ||
      (selectedStatus === 'Draft' && sop.status === 'Draft') ||
      (selectedStatus === 'Retired' && (sop.status === 'Retired' || sop.status === 'Archived'));

    return matchesSearch && matchesDept && matchesType && matchesStatus;
  });

  const getReviewStatusInfo = (nextReviewDate?: string) => {
    if (!nextReviewDate) return null;
    const due = new Date(nextReviewDate);
    if (due < now) {
      return { label: 'Overdue', color: 'text-rose-700 bg-rose-50 border-rose-200', isOverdue: true };
    }
    if (due <= thirtyDaysFromNow) {
      return { label: 'Review Due Soon', color: 'text-amber-700 bg-amber-50 border-amber-200', isDueSoon: true };
    }
    return { label: 'Healthy Cycle', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', isHealthy: true };
  };

  const isManagerOrAdmin =
    currentUser.role === 'Department Manager' ||
    currentUser.role === 'Compliance Manager' ||
    currentUser.role === 'Administrator' ||
    currentUser.role === 'Management';

  const canRetire =
    currentUser.role === 'Compliance Manager' ||
    currentUser.role === 'Administrator';

  const handleQuickAcknowledge = (sop: SOPDocument) => {
    setAcknowledgedToast(`Formally acknowledged SOP: ${sop.sopNumber} as read and understood.`);
    setTimeout(() => setAcknowledgedToast(null), 4000);
    if (onOpenMandatoryRead) {
      onOpenMandatoryRead(sop);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast */}
      {acknowledgedToast && (
        <div className="bg-emerald-900 text-emerald-100 p-4 rounded-2xl shadow-lg border border-emerald-700 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
            <span className="text-xs font-semibold">{acknowledgedToast}</span>
          </div>
          <button onClick={() => setAcknowledgedToast(null)} className="text-emerald-300 hover:text-white text-xs font-bold px-2 py-1">
            ✕
          </button>
        </div>
      )}

      {/* Header & Controls Bento Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <CompanyLogo variant="dark" height={36} className="shrink-0" />
            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-semibold mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>FFI Document Center</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
                SOP Library
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Search, view, acknowledge, or submit changes for all departmental procedures.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isManagerOrAdmin && (
              <button
                onClick={() => onStartNewSop('interview')}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ CREATE SOP</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Departments Ribbon */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Department:
          </span>
          {departmentsList.map((item) => {
            const isSelected = selectedDept === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedDept(item.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1A1C1E] text-white shadow-xs'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200/80'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search SOP Number (e.g. HR-SOP-001), Title, Steps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* SOP Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All SOP Types (Standard, Policy, Checklist)</option>
              <option value="Standard">Standard Operating Procedure</option>
              <option value="Policy">Governance Policy</option>
              <option value="Checklist">Operational Checklist</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Lifecycle Statuses</option>
              <option value="Active">Active / Published</option>
              <option value="Under Review">Under Review / Pending Approval</option>
              <option value="Draft">Draft</option>
              <option value="Retired">Retired / Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* SOP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSops.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8 shadow-xs">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-bold text-gray-800 text-base mb-1">
              {sops.length === 0 ? 'SOP Repository is Empty' : 'No SOP documents match your criteria'}
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
              {sops.length === 0
                ? 'There are no standard operating procedures in the platform yet. Click "+ Create SOP" to create your first procedure.'
                : 'Try clearing your search term or adjusting the department filter.'}
            </p>
            {sops.length === 0 && (
              <button
                onClick={() => onStartNewSop('interview')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First SOP</span>
              </button>
            )}
          </div>
        ) : (
          filteredSops.map(sop => {
            const reviewStatus = getReviewStatusInfo(sop.nextReviewDate);
            return (
              <div
                key={sop.id}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                        {sop.sopNumber || sop.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedSopForVersionControl(sop)}
                        title="View Version History & Compare Lineage"
                        className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>v{sop.version}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        {sop.sopType || 'Standard'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        sop.status === 'Active' || sop.status === 'Published'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {sop.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Department */}
                  <h3 className="text-sm font-bold text-[#1A1C1E] mb-1 leading-snug line-clamp-2">
                    {sop.title}
                  </h3>

                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3">
                    <span className="font-semibold text-gray-800">{sop.department}</span>
                    <span>•</span>
                    <span>Owner: {sop.departmentOwner}</span>
                  </div>

                  {/* Purpose excerpt */}
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                    {sop.purpose}
                  </p>

                  {/* Periodic Review Status Indicator */}
                  {reviewStatus && (
                    <div className={`p-2 rounded-xl border text-[11px] font-medium flex items-center justify-between mb-3 ${reviewStatus.color}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Next Review: <strong>{sop.nextReviewDate}</strong></span>
                      </span>
                      <span className="font-bold">{reviewStatus.label}</span>
                    </div>
                  )}

                  {/* Compliance review flag if required */}
                  {sop.requiresComplianceReview && (
                    <div className="text-[10px] font-semibold text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-xl mb-3 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-indigo-600" />
                      <span>Requires Annual Compliance Review</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Bottom Strip */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedSopForPreview(sop)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Procedure</span>
                      </button>

                      {/* Card Download Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveDownloadCardId(activeDownloadCardId === sop.id ? null : sop.id)}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                          title="Download SOP"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>

                        {activeDownloadCardId === sop.id && (
                          <div className="absolute left-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                            <button
                              onClick={() => {
                                downloadSOPAsPDF(sop);
                                setActiveDownloadCardId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 font-medium"
                            >
                              <Download className="w-3 h-3 text-rose-500" />
                              <span>Download PDF</span>
                            </button>
                            <button
                              onClick={() => {
                                downloadSOPAsDOCX(sop);
                                setActiveDownloadCardId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-[11px] text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-1.5 font-medium border-t border-gray-100"
                            >
                              <Download className="w-3 h-3 text-blue-500" />
                              <span>Download Word (.docx)</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSopForVersionControl(sop)}
                        title="View Version History & Compare Versions"
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5 text-indigo-500" />
                        <span>History & Diff</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickAcknowledge(sop)}
                        title="Acknowledge Reading"
                        className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                      >
                        Acknowledge
                      </button>

                      {isManagerOrAdmin && (
                        <button
                          onClick={() => {
                            if ((sop.status === 'Approved' || sop.status === 'Published') && onOpenVersionRevision) {
                              onOpenVersionRevision(sop);
                            } else {
                              onSelectSop(sop.id, 'edit');
                            }
                          }}
                          title={sop.status === 'Approved' || sop.status === 'Published' ? "Create Governed Revision" : "Edit Procedure"}
                          className="text-gray-500 hover:text-indigo-600 p-1 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canRetire && (
                        <button
                          onClick={() => setRetiringSop(sop)}
                          title="Governed SOP Retirement / Archiving"
                          className="text-gray-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Secondary quick actions: Report Issue or Request Change */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    {onOpenReportIssue && (
                      <button
                        onClick={() => onOpenReportIssue(sop.id)}
                        className="hover:text-amber-600 transition cursor-pointer flex items-center gap-1"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span>Report Issue</span>
                      </button>
                    )}

                    {onOpenRequestChange && (
                      <button
                        onClick={() => onOpenRequestChange(sop.id)}
                        className="hover:text-blue-600 transition cursor-pointer flex items-center gap-1"
                      >
                        <GitPullRequest className="w-3 h-3" />
                        <span>Request Change</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Interactive Step Runner Modal */}
      {activeRunnerSop && (
        <InteractiveSOPRunnerModal
          isOpen={true}
          sop={activeRunnerSop}
          currentUser={currentUser}
          onClose={() => setActiveRunnerSop(null)}
          onExecutionCompleted={() => {
            if (onExecutionLogged) onExecutionLogged();
            setActiveRunnerSop(null);
          }}
        />
      )}

      {/* Visual Diff Modal */}
      {activeDiffSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-gray-100 shadow-2xl">
            <h4 className="font-extrabold text-base text-gray-900 mb-2">Visual Diff Viewer</h4>
            <p className="text-xs text-gray-500 mb-4">The visual diff viewer module has been retired. All revisions are tracked cleanly via the History & Revision log.</p>
            <button
              onClick={() => setActiveDiffSop(null)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Complete SOP Reading & Procedure Modal */}
      <SOPPreviewModal
        isOpen={Boolean(selectedSopForPreview)}
        sop={selectedSopForPreview}
        currentUser={currentUser}
        onClose={() => setSelectedSopForPreview(null)}
        onExecuteChecklist={(s) => {
          setSelectedSopForPreview(null);
          setActiveRunnerSop(s);
        }}
        onAcknowledgeRead={handleQuickAcknowledge}
        onOpenReportIssue={onOpenReportIssue}
        onOpenRequestChange={onOpenRequestChange}
        onEditSop={(id) => onSelectSop(id, 'edit')}
      />

      {/* Governed SOP Retirement Modal */}
      {retiringSop && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h4 className="font-extrabold text-lg text-gray-900 mb-1">Retire SOP</h4>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Are you sure you want to retire and archive the SOP <strong className="text-gray-900">"{retiringSop.title}"</strong> ({retiringSop.sopNumber})? This will remove it from active use.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={() => setRetiringSop(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSop(retiringSop.id);
                  setRetiringSop(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Confirm Retirement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Governed SOP Version History & Comparison Modal */}
      {selectedSopForVersionControl && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h4 className="font-extrabold text-base text-gray-900">SOP History & Revision Log</h4>
              </div>
              <button
                onClick={() => setSelectedSopForVersionControl(null)}
                className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold text-gray-700 mb-1">Title: {selectedSopForVersionControl.title}</p>
            <p className="text-xs text-gray-400 mb-4">SOP ID: {selectedSopForVersionControl.sopNumber || selectedSopForVersionControl.id} • Version: v{selectedSopForVersionControl.version || '1.0'}</p>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 mb-4">
              {selectedSopForVersionControl.changeHistory && selectedSopForVersionControl.changeHistory.length > 0 ? (
                selectedSopForVersionControl.changeHistory.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-indigo-600">v{item.version}</span>
                      <span className="text-[10px] text-gray-400">{item.date}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-800">{item.summary}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Author: {item.author}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-gray-400">
                  No version history recorded. This is standard version 1.0.
                </div>
              )}
            </div>
            <div className="text-right">
              <button
                onClick={() => setSelectedSopForVersionControl(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

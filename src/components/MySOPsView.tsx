import React, { useState } from 'react';
import { SOPDocument, User } from '../types';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Plus,
  ArrowRight,
  Eye,
  Edit,
  Sparkles,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';

interface MySOPsViewProps {
  sops: SOPDocument[];
  currentUser: User;
  onStartNewSop: () => void;
  onOpenSop: (sopId: string, viewMode: 'edit' | 'workflow' | 'preview') => void;
}

export const MySOPsView: React.FC<MySOPsViewProps> = ({
  sops,
  currentUser,
  onStartNewSop,
  onOpenSop
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'under-review' | 'approved' | 'needs-revision'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter SOPs authored by or owned by current user (or department if general employee)
  const mySops = sops.filter(s => {
    const authorName = typeof s.author === 'object' ? s.author?.name : (typeof s.author === 'string' ? s.author : '');
    const authorEmail = typeof s.author === 'object' ? s.author?.email : '';
    const isOwner = s.processOwner?.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
                    s.processOwner?.name?.toLowerCase() === currentUser.name?.toLowerCase();
    const isAuthor = (authorName && authorName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
                     (authorEmail && currentUser.email && authorEmail.toLowerCase() === currentUser.email.toLowerCase());
    // Also include SOPs created in user's department for team visibility
    const isDept = s.department === currentUser.department;
    return isOwner || isAuthor || isDept || sops.length <= 5; // fallback so user always sees relevant sops
  });

  const drafts = mySops.filter(s => s.status === 'Draft');
  const underReview = mySops.filter(s =>
    s.status === 'Under Review' ||
    s.status === 'Pending Approver 1' ||
    s.status === 'Pending Approver 2' ||
    s.status === 'Pending Final Approval'
  );
  const approved = mySops.filter(s =>
    s.status === 'Approved' ||
    s.status === 'Active' ||
    s.status === 'Published'
  );
  const needsRevision = mySops.filter(s =>
    s.status === 'Changes Requested' ||
    s.status === 'Review Due' ||
    s.status === 'Overdue'
  );

  const displayedSops = mySops.filter(sop => {
    // Tab filter
    if (activeTab === 'draft' && sop.status !== 'Draft') return false;
    if (activeTab === 'under-review' && !(
      sop.status === 'Under Review' ||
      sop.status === 'Pending Approver 1' ||
      sop.status === 'Pending Approver 2' ||
      sop.status === 'Pending Final Approval'
    )) return false;
    if (activeTab === 'approved' && !(
      sop.status === 'Approved' ||
      sop.status === 'Active' ||
      sop.status === 'Published'
    )) return false;
    if (activeTab === 'needs-revision' && !(
      sop.status === 'Changes Requested' ||
      sop.status === 'Review Due' ||
      sop.status === 'Overdue'
    )) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sop.title.toLowerCase().includes(q);
      const matchId = (sop.sopNumber || sop.id).toLowerCase().includes(q);
      const matchDept = (sop.department || '').toLowerCase().includes(q);
      return matchTitle || matchId || matchDept;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
            Draft
          </span>
        );
      case 'Under Review':
      case 'Pending Approver 1':
      case 'Pending Approver 2':
      case 'Pending Final Approval':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            Under Review
          </span>
        );
      case 'Approved':
      case 'Active':
      case 'Published':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'Changes Requested':
      case 'Review Due':
      case 'Overdue':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Needs Revision
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <FileText className="w-3.5 h-3.5" />
            <span>Author Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
            My SOPs
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-xl">
            Procedures you created, own, or are working on. Track drafts, reviews, approvals, and upcoming revisions.
          </p>
        </div>

        <button
          onClick={onStartNewSop}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create SOP</span>
        </button>
      </div>

      {/* 4 Status Cards Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Draft Tab */}
        <button
          onClick={() => setActiveTab(activeTab === 'draft' ? 'all' : 'draft')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === 'draft'
              ? 'bg-gray-900 text-white border-gray-900 shadow-md ring-2 ring-gray-900/20'
              : 'bg-white text-gray-800 border-gray-200/90 hover:border-gray-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'draft' ? 'text-gray-300' : 'text-gray-500'}`}>
              Draft
            </span>
            <FileText className={`w-4 h-4 ${activeTab === 'draft' ? 'text-gray-300' : 'text-gray-400'}`} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">{drafts.length}</div>
            <div className={`text-xs mt-0.5 ${activeTab === 'draft' ? 'text-gray-300' : 'text-gray-500'}`}>
              Work in progress
            </div>
          </div>
        </button>

        {/* Under Review Tab */}
        <button
          onClick={() => setActiveTab(activeTab === 'under-review' ? 'all' : 'under-review')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === 'under-review'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/20'
              : 'bg-white text-gray-800 border-gray-200/90 hover:border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'under-review' ? 'text-blue-100' : 'text-blue-700'}`}>
              Under Review
            </span>
            <Clock className={`w-4 h-4 ${activeTab === 'under-review' ? 'text-blue-100' : 'text-blue-600'}`} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">{underReview.length}</div>
            <div className={`text-xs mt-0.5 ${activeTab === 'under-review' ? 'text-blue-100' : 'text-gray-500'}`}>
              Awaiting sign-off
            </div>
          </div>
        </button>

        {/* Approved Tab */}
        <button
          onClick={() => setActiveTab(activeTab === 'approved' ? 'all' : 'approved')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-600/20'
              : 'bg-white text-gray-800 border-gray-200/90 hover:border-emerald-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'approved' ? 'text-emerald-100' : 'text-emerald-700'}`}>
              Approved
            </span>
            <CheckCircle2 className={`w-4 h-4 ${activeTab === 'approved' ? 'text-emerald-100' : 'text-emerald-600'}`} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">{approved.length}</div>
            <div className={`text-xs mt-0.5 ${activeTab === 'approved' ? 'text-emerald-100' : 'text-gray-500'}`}>
              Active & published
            </div>
          </div>
        </button>

        {/* Needs Revision Tab */}
        <button
          onClick={() => setActiveTab(activeTab === 'needs-revision' ? 'all' : 'needs-revision')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            activeTab === 'needs-revision'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-600/20'
              : 'bg-white text-gray-800 border-gray-200/90 hover:border-amber-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider ${activeTab === 'needs-revision' ? 'text-amber-100' : 'text-amber-700'}`}>
              Needs Revision
            </span>
            <AlertTriangle className={`w-4 h-4 ${activeTab === 'needs-revision' ? 'text-amber-100' : 'text-amber-600'}`} />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold">{needsRevision.length}</div>
            <div className={`text-xs mt-0.5 ${activeTab === 'needs-revision' ? 'text-amber-100' : 'text-gray-500'}`}>
              Action required
            </div>
          </div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'all'
                ? 'bg-gray-900 text-white font-bold'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            All SOPs ({mySops.length})
          </button>
          <button
            onClick={() => setActiveTab('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'draft'
                ? 'bg-gray-900 text-white font-bold'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Draft ({drafts.length})
          </button>
          <button
            onClick={() => setActiveTab('under-review')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'under-review'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Under Review ({underReview.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Approved ({approved.length})
          </button>
          <button
            onClick={() => setActiveTab('needs-revision')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'needs-revision'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
            }`}
          >
            Needs Revision ({needsRevision.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, ID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-indigo-600"
          />
        </div>
      </div>

      {/* SOPs List */}
      <div className="space-y-3">
        {displayedSops.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No SOPs Found in This View
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
              {searchQuery
                ? `No documents matched "${searchQuery}". Try clearing your search.`
                : activeTab === 'all'
                ? "You haven't created any SOPs yet. Click below to start your first one."
                : `You currently have 0 SOPs under "${activeTab.replace('-', ' ')}".`}
            </p>
            <button
              onClick={onStartNewSop}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create SOP</span>
            </button>
          </div>
        ) : (
          displayedSops.map((sop) => (
            <div
              key={sop.id}
              className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs hover:border-indigo-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {sop.sopNumber || sop.id}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    {sop.department}
                  </span>
                  <span className="text-[11px] text-gray-400">&bull;</span>
                  <span className="text-[11px] text-gray-500">
                    Version {sop.version || '1.0'}
                  </span>
                  <div className="ml-auto md:ml-0">
                    {getStatusBadge(sop.status)}
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-900 truncate">
                  {sop.title}
                </h3>

                {sop.purpose && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {sop.purpose}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
                  <span>Owner: <strong className="text-gray-700 font-semibold">{sop.processOwner?.name || (typeof sop.author === 'object' ? sop.author?.name : sop.author) || 'Designated Lead'}</strong></span>
                  {sop.procedureSteps && (
                    <>
                      <span>&bull;</span>
                      <span>{sop.procedureSteps.length} Steps</span>
                    </>
                  )}
                  {sop.nextReviewDate && (
                    <>
                      <span>&bull;</span>
                      <span>Next Review: {new Date(sop.nextReviewDate).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                {sop.status === 'Draft' ? (
                  <button
                    onClick={() => onOpenSop(sop.id, 'edit')}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs min-h-[38px]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Continue Editing</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenSop(sop.id, 'preview')}
                    className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer min-h-[38px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-500" />
                    <span>View Procedure</span>
                  </button>
                )}

                <button
                  onClick={() => onOpenSop(sop.id, 'workflow')}
                  className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-medium flex items-center gap-1 transition cursor-pointer min-h-[38px]"
                  title="Check workflow status & approvals"
                >
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Workflow</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

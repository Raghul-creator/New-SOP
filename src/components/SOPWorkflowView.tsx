import React, { useState } from 'react';
import { SOPDocument, User, InlineComment, ApprovalDecision, SOPStatus, ApprovalLevel } from '../types';
import { SOPHeaderBlock } from './SOPHeaderBlock';
import { SOPPreviewModal } from './SOPPreviewModal';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ShieldCheck,
  Send,
  Lock,
  KeyRound,
  FileCheck2,
  AlertCircle,
  Share2,
  UserCheck,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  FileText,
  History
} from 'lucide-react';

interface SOPWorkflowViewProps {
  sop: SOPDocument | null;
  currentUser: User;
  onUpdateSopStatus: (sopId: string, newStatus: SOPStatus, actionDetails: string, decision?: ApprovalDecision) => void;
  onAddComment: (sopId: string, commentText: string, stepId?: string) => void;
  onPublishToSharePoint: (sopId: string) => void;
  onOpenApprovalMatrix?: () => void;
  onOpenRevisionModal?: (sop: SOPDocument) => void;
}

export const SOPWorkflowView: React.FC<SOPWorkflowViewProps> = ({
  sop,
  currentUser,
  onUpdateSopStatus,
  onAddComment,
  onPublishToSharePoint,
  onOpenApprovalMatrix,
  onOpenRevisionModal
}) => {
  const [commentText, setCommentText] = useState('');
  const [selectedStepForComment, setSelectedStepForComment] = useState<string>('general');
  const [approvalNote, setApprovalNote] = useState('');
  const [signaturePin, setSignaturePin] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showVersionControl, setShowVersionControl] = useState(true);

  if (!sop) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
        No SOP document selected for workflow review. Please select an SOP from the Repository or Dashboard.
      </div>
    );
  }

  // Handle Comment Submission
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(sop.id, commentText, selectedStepForComment === 'general' ? undefined : selectedStepForComment);
    setCommentText('');
  };

  // Determine current active level & next status based on 4-tier hierarchy
  const getCurrentApprovalLevel = (): { level: ApprovalLevel; targetUser: User | undefined; nextStatus: SOPStatus; stageTitle: string } => {
    switch (sop.status) {
      case 'Draft':
        return {
          level: 'Reviewer',
          targetUser: sop.reviewer,
          nextStatus: 'Under Review',
          stageTitle: 'Submit for Level 1 Review'
        };
      case 'Under Review':
        return {
          level: 'Reviewer',
          targetUser: sop.reviewer,
          nextStatus: 'Pending Approver 1',
          stageTitle: 'Level 1: Technical Review Sign-Off (Team Lead)'
        };
      case 'Pending Approver 1':
        return {
          level: 'Approver 1',
          targetUser: sop.approver1,
          nextStatus: 'Pending Approver 2',
          stageTitle: 'Level 2: Operational Sign-Off (Department Manager)'
        };
      case 'Pending Approver 2':
        return {
          level: 'Approver 2',
          targetUser: sop.approver2,
          nextStatus: 'Pending Final Approval',
          stageTitle: 'Level 3: Executive Sign-Off (HOD)'
        };
      case 'Pending Final Approval':
        return {
          level: 'Final Approval',
          targetUser: sop.finalApprover,
          nextStatus: 'Approved',
          stageTitle: 'Level 4: Final Compliance & Management Sign-Off'
        };
      case 'Changes Requested':
        return {
          level: 'Reviewer',
          targetUser: sop.author,
          nextStatus: 'Under Review',
          stageTitle: 'Resubmit Revised Draft for Level 1 Review'
        };
      default:
        return {
          level: 'Final Approval',
          targetUser: sop.finalApprover,
          nextStatus: 'Approved',
          stageTitle: 'Governance Review Complete'
        };
    }
  };

  const currentLevelInfo = getCurrentApprovalLevel();

  // Handle Approval Action
  const handleApprovalAction = (decisionType: 'Approved' | 'Rejected' | 'Requested Changes') => {
    if (!approvalNote.trim()) {
      alert('Please enter approval review comments or audit notes.');
      return;
    }

    setIsSigning(true);
    setTimeout(() => {
      const sigHash = `sha256:${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      const decision: ApprovalDecision = {
        id: `app-${Date.now()}`,
        level: currentLevelInfo.level,
        stepName: currentLevelInfo.stageTitle,
        user: currentUser,
        decision: decisionType,
        timestamp: new Date().toISOString(),
        comments: approvalNote,
        digitalSignatureHash: sigHash
      };

      let newStatus: SOPStatus = sop.status;
      if (decisionType === 'Approved') {
        newStatus = currentLevelInfo.nextStatus;
      } else if (decisionType === 'Requested Changes') {
        newStatus = 'Changes Requested';
      } else {
        newStatus = 'Draft';
      }

      onUpdateSopStatus(
        sop.id,
        newStatus,
        `Stage "${currentLevelInfo.level}" decision "${decisionType}" by ${currentUser.name} (${currentUser.role}). Signature: ${sigHash}`,
        decision
      );
      setApprovalNote('');
      setSignaturePin('');
      setIsSigning(false);
    }, 600);
  };

  const workflowStages: { label: SOPStatus; title: string; role: string }[] = [
    { label: 'Draft', title: 'Initiation', role: 'Drafting' },
    { label: 'Under Review', title: 'L1: Verification', role: 'Technical Check' },
    { label: 'Pending Approver 1', title: 'L2: Operations', role: 'Operations Review' },
    { label: 'Pending Approver 2', title: 'L3: Governance', role: 'Governance Review' },
    { label: 'Pending Final Approval', title: 'L4: Quality/ISMS', role: 'Compliance Audit' },
    { label: 'Approved', title: 'Approved', role: 'Ready' },
    { label: 'Published', title: 'Published', role: 'SharePoint' }
  ];

  const getStageIndex = (st: SOPStatus) => {
    if (st === 'Changes Requested') return 1;
    return workflowStages.findIndex(s => s.label === st);
  };

  const currentStageIndex = getStageIndex(sop.status);

  return (
    <div className="space-y-6">
      {/* Standardized Focus Infotech Corporate Governance Header Block */}
      <SOPHeaderBlock sop={sop} />

      {/* Action Bar & Visual 7-Stage Workflow Progression */}
      <div className="bg-[#1A1C1E] text-white p-6 rounded-3xl border border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">Lifecycle Governance Engine</span>
            <h2 className="text-lg font-bold text-white tracking-tight">7-Stage Compliance & Verification Pipeline</h2>
          </div>

          <div className="flex items-center space-x-3">
            {sop.status === 'Approved' && (
              <button
                onClick={() => onPublishToSharePoint(sop.id)}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Publish to SharePoint</span>
              </button>
            )}

            <button
              onClick={() => setIsPreviewModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Preview Full SOP</span>
            </button>

            <button
              onClick={() => setShowVersionControl(!showVersionControl)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition cursor-pointer ${
                showVersionControl
                  ? 'bg-indigo-500 text-white border-indigo-400'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-300" />
              <span>{showVersionControl ? 'Hide Version History' : `Version History & Diff (v${sop.version})`}</span>
            </button>

            {onOpenApprovalMatrix && (
              <button
                onClick={onOpenApprovalMatrix}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                <span>View 4-Tier Matrix</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual 7-Stage Workflow Progression */}
        <div className="pt-3 border-t border-gray-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {workflowStages.map((stage, idx) => {
              const isCompleted = currentStageIndex > idx || sop.status === 'Published';
              const isCurrent = currentStageIndex === idx && sop.status !== 'Published';

              return (
                <div key={stage.label} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 font-semibold">0{idx + 1}</span>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        isCompleted ? 'bg-emerald-400' : isCurrent ? 'bg-indigo-400 animate-pulse' : 'bg-gray-600'
                      }`}
                    />
                  </div>
                  <div className={`text-xs font-bold ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-emerald-300' : 'text-gray-300'}`}>
                    {stage.title}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono truncate">{stage.role}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Verification Milestones Overview Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Verification Milestones & Governance Status
          </h3>
          <span className="text-xs font-mono text-gray-500 font-medium">
            Current Stage: <b className="text-indigo-600">{sop.status}</b>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Level 1 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            sop.status === 'Under Review'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : sop.approvalHistory.some(a => a.level === 'Reviewer')
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[10px] uppercase font-mono text-indigo-800">Stage 1: Technical Check</span>
              {sop.approvalHistory.some(a => a.level === 'Reviewer') && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="font-bold text-[#1A1C1E]">Technical Feasibility & Precision</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Prerequisites & Command Verification</div>
          </div>

          {/* Level 2 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            sop.status === 'Pending Approver 1'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : sop.approvalHistory.some(a => a.level === 'Approver 1')
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[10px] uppercase font-mono text-blue-800">Stage 2: Operations Check</span>
              {sop.approvalHistory.some(a => a.level === 'Approver 1') && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="font-bold text-[#1A1C1E]">Operational Alignment & Dependencies</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Service Line & SLA Verification</div>
          </div>

          {/* Level 3 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            sop.status === 'Pending Approver 2'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : sop.approvalHistory.some(a => a.level === 'Approver 2')
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[10px] uppercase font-mono text-indigo-800">Stage 3: Governance Review</span>
              {sop.approvalHistory.some(a => a.level === 'Approver 2') && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="font-bold text-[#1A1C1E]">Risk Posture & Policy Compliance</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Organizational Governance Sign-off</div>
          </div>

          {/* Level 4 */}
          <div className={`p-4 rounded-2xl border transition-all ${
            sop.status === 'Pending Final Approval'
              ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
              : sop.approvalHistory.some(a => a.level === 'Final Approval')
              ? 'bg-emerald-50/60 border-emerald-300'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-[10px] uppercase font-mono text-emerald-800">Stage 4: Compliance Sign-Off</span>
              {sop.approvalHistory.some(a => a.level === 'Final Approval') && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
            </div>
            <div className="font-bold text-[#1A1C1E]">ISO 9001 / 27001 & Purview Seal</div>
            <div className="text-[11px] text-gray-500 mt-0.5">Controlled SharePoint Publication</div>
          </div>
        </div>
      </div>

      {/* Governed Version Control & Lineage Comparison Section */}
      {showVersionControl && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span>Version History & Revision Lineage</span>
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    Current: v{sop.version}
                  </span>
                </h3>
                <p className="text-xs text-gray-500">
                  Audit trail of all iterations with [View Version] snapshots and [Compare Versions] visual diffing.
                </p>
              </div>
            </div>

            {(sop.status === 'Approved' || sop.status === 'Published') && onOpenRevisionModal && (
              <button
                type="button"
                onClick={() => onOpenRevisionModal(sop)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                <span>Create New Revision</span>
              </button>
            )}
          </div>

          <div className="space-y-3 pt-2">
            {sop.changeHistory && sop.changeHistory.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sop.changeHistory.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">v{item.version}</span>
                      <span className="text-[10px] font-medium text-gray-400">{item.date}</span>
                    </div>
                    <p className="text-xs text-gray-800 font-bold mb-1">{item.summary}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Author: {item.author}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">
                No change history logs present. This is standard version 1.0.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Approval Panel & Inline Comments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Document Details & E-Signature Sign-off Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Sign-off Form */}
          {sop.status !== 'Published' && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="font-bold text-[#1A1C1E] text-sm">{currentLevelInfo.stageTitle}</h2>
                    <span className="text-[10px] text-gray-500">
                      Governance Verification &bull; Signed by: <strong className="text-gray-900">{currentUser.name}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-0.5 rounded-full font-bold">
                  Stage: {currentLevelInfo.level}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Review Comments & Audit Verification Notes *
                  </label>
                  <textarea
                    rows={3}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Enter compliance evaluation notes, ISO 9001 verification remarks, or requested amendments..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Active Signing Identity</label>
                    <input
                      type="text"
                      disabled
                      value={`${currentUser.name} (${currentUser.role})`}
                      className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-700 font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Entra ID MFA PIN (Simulated)</label>
                    <input
                      type="password"
                      value={signaturePin}
                      onChange={(e) => setSignaturePin(e.target.value)}
                      placeholder="••••••"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={() => handleApprovalAction('Approved')}
                    disabled={isSigning}
                    className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Level & Forward Next</span>
                  </button>

                  <button
                    onClick={() => handleApprovalAction('Requested Changes')}
                    disabled={isSigning}
                    className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Request Changes</span>
                  </button>

                  <button
                    onClick={() => handleApprovalAction('Rejected')}
                    disabled={isSigning}
                    className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject to Draft</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Procedure Steps Quick Audit List */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5 text-xs">
            <h3 className="font-bold text-[#1A1C1E] text-sm pb-2 border-b border-gray-100">
              SOP Procedure Steps Under Review
            </h3>
            <div className="space-y-3">
              {sop.procedureSteps.map(step => (
                <div key={step.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                  <div className="flex items-center justify-between font-bold text-gray-800">
                    <span>Step {step.stepNumber}: {step.title}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono">{step.assignedRole}</span>
                  </div>
                  <p className="text-gray-700">{step.action}</p>
                  {step.safetyNote && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 font-medium">
                      ⚠️ {step.safetyNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Approval History Ledger */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5 text-xs">
            <h3 className="font-bold text-[#1A1C1E] text-sm pb-2 border-b border-gray-100">
              Immutable Digital Signature Audit Ledger
            </h3>
            {sop.approvalHistory.length === 0 ? (
              <div className="text-gray-400 py-6 text-center">No sign-off records yet.</div>
            ) : (
              <div className="space-y-2.5">
                {sop.approvalHistory.map(app => (
                  <div key={app.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-700 font-bold">
                          {app.level || 'Review'}
                        </span>
                        <span className="text-slate-900">{app.user.name} ({app.user.role})</span>
                      </div>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
                        {app.decision}
                      </span>
                    </div>
                    <div className="text-slate-600">{app.comments}</div>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                      <span>Hash: {app.digitalSignatureHash}</span>
                      <span>{new Date(app.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Col: Inline Comments & Collaboration Thread */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-[#1A1C1E] text-sm">Inline Review Comments</h3>
              </div>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono">
                {sop.comments.length}
              </span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="space-y-2.5">
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Tag Step (Optional)</label>
                <select
                  value={selectedStepForComment}
                  onChange={(e) => setSelectedStepForComment(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="general">General Document Feedback</option>
                  {sop.procedureSteps.map(s => (
                    <option key={s.id} value={s.id}>Step {s.stepNumber}: {s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type review note, compliance question, or editing suggestion..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1A1C1E] hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-indigo-400" />
                <span>Post Review Comment</span>
              </button>
            </form>

            {/* Comment List */}
            <div className="space-y-2.5 pt-2 max-h-[400px] overflow-y-auto">
              {sop.comments.length === 0 ? (
                <div className="text-gray-400 py-6 text-center">No comments added yet.</div>
              ) : (
                sop.comments.map(c => (
                  <div key={c.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-1">
                    <div className="flex items-center justify-between font-semibold text-gray-800">
                      <span>{typeof c.author === 'object' ? c.author?.name : (c.author || 'Anonymous')}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {c.stepId && (
                      <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-mono px-2 py-0.5 rounded-md border border-indigo-100">
                        {c.stepId}
                      </span>
                    )}
                    <p className="text-gray-700 leading-tight">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Full SOP Preview Modal */}
      <SOPPreviewModal
        isOpen={isPreviewModalOpen}
        sop={sop}
        currentUser={currentUser}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
};

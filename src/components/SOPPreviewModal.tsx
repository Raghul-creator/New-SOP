import React, { useState, useEffect } from 'react';
import { SOPDocument, User } from '../types';
import { SOPHeaderBlock } from './SOPHeaderBlock';
import { downloadSOPAsPDF, downloadSOPAsDOCX } from '../utils/complianceReportGenerator';
import {
  X,
  Printer,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  GitPullRequest,
  Play,
  Layers,
  History,
  ShieldCheck,
  Download,
  AlertTriangle,
  UserCheck,
  Share2,
  ExternalLink,
  Edit
} from 'lucide-react';

interface SOPPreviewModalProps {
  isOpen: boolean;
  sop: SOPDocument | null;
  currentUser?: User;
  onClose: () => void;
  onExecuteChecklist?: (sop: SOPDocument) => void;
  onAcknowledgeRead?: (sop: SOPDocument) => void;
  onOpenReportIssue?: (sopId: string) => void;
  onOpenRequestChange?: (sopId: string) => void;
  onEditSop?: (sopId: string) => void;
}

export const SOPPreviewModal: React.FC<SOPPreviewModalProps> = ({
  isOpen,
  sop,
  currentUser,
  onClose,
  onExecuteChecklist,
  onAcknowledgeRead,
  onOpenReportIssue,
  onOpenRequestChange,
  onEditSop
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'checklist' | 'signatures' | 'history'>('document');
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});
  const [copySuccess, setCopySuccess] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);

  useEffect(() => {
    // Reset checked steps when SOP changes
    if (sop) {
      setCheckedSteps({});
      setActiveTab('document');
      setIsDownloadMenuOpen(false);
    }
  }, [sop?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sop) return null;

  const totalSteps = sop.procedureSteps?.length || 0;
  const completedStepsCount = Object.values(checkedSteps).filter(Boolean).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedStepsCount / totalSteps) * 100) : 0;

  const handleToggleCheck = (stepId: string) => {
    setCheckedSteps(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareLink = () => {
    const url = `${window.location.origin}/#sop-${sop.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    }).catch(() => {});
  };

  const isAcknowledged = currentUser && Array.isArray(sop.readAcknowledgments) &&
    sop.readAcknowledgments.some(a => a.user?.id === currentUser.id || a.user?.email === currentUser.email);

  return (
    <div
      id="sop-preview-modal"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold bg-[#1A1C1E] text-white px-2.5 py-1 rounded-lg">
              {sop.sopNumber || sop.id}
            </span>
            <span className="font-mono text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg">
              v{sop.version}
            </span>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              sop.status === 'Published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : sop.status === 'Under Review'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {sop.status}
            </span>
            <span className="text-xs text-gray-500 font-medium hidden sm:inline">
              Department: <strong className="text-gray-800">{sop.department}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareLink}
              title="Copy link to clipboard"
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/70 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{copySuccess ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print controlled procedure"
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200/70 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {onEditSop && (
              <button
                onClick={() => {
                  onClose();
                  onEditSop(sop.id);
                }}
                title="Edit this SOP"
                className="px-3 py-2 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-xl transition cursor-pointer text-xs flex items-center gap-1.5 font-bold"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            {/* Dropdown Download Button */}
            <div className="relative">
              <button
                onClick={() => setIsDownloadMenuOpen(prev => !prev)}
                title="Download standard operating procedure"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>

              {isDownloadMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      downloadSOPAsPDF(sop);
                      setIsDownloadMenuOpen(false);
                    }}
                    title="Download PDF"
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 font-semibold"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-500" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadSOPAsDOCX(sop);
                      setIsDownloadMenuOpen(false);
                    }}
                    title="Download Word (.docx)"
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 font-semibold border-t border-gray-100"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-500" />
                    <span>Download Word (.docx)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="px-6 border-b border-gray-100 flex items-center space-x-2 bg-white text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('document')}
            className={`py-3 px-3.5 font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'document'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Standard Operating Procedure</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-3 px-3.5 font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'checklist'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Interactive Verification ({completedStepsCount}/{totalSteps})</span>
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`py-3 px-3.5 font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'signatures'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Signatures & Audit Ledger ({sop.approvalHistory?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3.5 font-bold border-b-2 transition whitespace-nowrap cursor-pointer flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Revision History</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* TAB 1: Document View */}
          {activeTab === 'document' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Document Header Metadata Block */}
              <SOPHeaderBlock sop={sop} variant="full" />

              {/* Title & Document Summary Banner */}
              <div className="bg-gradient-to-r from-gray-50 to-indigo-50/30 p-6 rounded-2xl border border-gray-200">
                <h1 className="text-xl font-bold tracking-tight text-[#1A1C1E] mb-2">
                  {sop.title}
                </h1>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {sop.purpose}
                </p>
              </div>

              {/* Grid: Purpose & Scope */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    1. Purpose & Objectives
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {sop.purpose || 'No specific purpose declared.'}
                  </p>
                </div>

                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200/80">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                    2. Scope & Applicable Boundary
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {sop.scope || 'Applies enterprise-wide across all Future Focus Infotech teams.'}
                  </p>
                </div>
              </div>

              {/* Roles & Responsibilities */}
              {sop.responsibilities && sop.responsibilities.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    3. Stakeholder Roles & Accountabilities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sop.responsibilities.map((r, i) => (
                      <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                        <strong className="text-gray-900 block font-semibold mb-0.5">{r.role}</strong>
                        <span className="text-gray-600">{r.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step by Step Procedures */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    4. Governed Step-by-Step Procedure ({totalSteps} steps)
                  </h3>
                  <span className="text-[11px] text-gray-500 font-mono">
                    ISO 9001:2015 Clause 8.5 Controlled Execution
                  </span>
                </div>

                <div className="space-y-3">
                  {sop.procedureSteps?.map((step) => (
                    <div
                      key={step.id || step.stepNumber}
                      className="p-4 bg-white rounded-2xl border border-gray-200 shadow-2xs hover:border-indigo-200 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                            {step.stepNumber}
                          </span>
                          <span className="font-bold text-xs text-gray-900">
                            {step.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 font-mono">
                          {step.assignedRole}
                        </span>
                      </div>

                      <p className="text-xs text-gray-700 leading-relaxed pl-8">
                        {step.action}
                      </p>

                      {step.inputsOutputs && (
                        <div className="ml-8 text-[11px] text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-mono">
                          <strong className="text-gray-800">Artifacts / Verification:</strong> {step.inputsOutputs}
                        </div>
                      )}

                      {step.safetyNote && (
                        <div className="ml-8 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span><strong>Security & Safety Note:</strong> {step.safetyNote}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Interactive Checklist */}
          {activeTab === 'checklist' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-indigo-900">Operational Verification Run</h4>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Tick off each step as you review or perform the procedure.
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-indigo-900">{progressPercent}%</span>
                  <div className="w-24 bg-indigo-200 rounded-full h-2 mt-1 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {sop.procedureSteps?.map((step) => {
                  const isChecked = Boolean(checkedSteps[step.id]);
                  return (
                    <div
                      key={step.id}
                      onClick={() => handleToggleCheck(step.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isChecked
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            Step {step.stepNumber}: {step.title}
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {step.assignedRole}
                          </span>
                        </div>
                        <p className={`text-xs ${isChecked ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.action}
                        </p>
                        {step.screenshots && step.screenshots.length > 0 && (
                          <div className="mt-3">
                            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 max-w-md shadow-2xs">
                              <img
                                src={step.screenshots[0]}
                                alt={step.title}
                                className="w-full h-auto max-h-56 object-contain"
                              />
                            </div>
                          </div>
                        )}
                        {step.safetyNote && (
                          <div className="mt-2 text-[10px] text-amber-700 bg-amber-50/80 px-2 py-1 rounded border border-amber-200 font-medium">
                            ⚠️ {step.safetyNote}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Digital Signatures & Audit Ledger */}
          {activeTab === 'signatures' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-sm font-bold text-[#1A1C1E]">
                  4-Tier Digital Signature Chain & Governance Audit
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Immutable cryptographic ledger certifying review integrity under ISO/IEC 27001 ISMS standard.
                </p>
              </div>

              {sop.approvalHistory?.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  No sign-off milestones recorded for this version yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {sop.approvalHistory?.map((entry) => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-[#1A1C1E] text-white px-2 py-0.5 rounded">
                            {entry.level}
                          </span>
                          <span className="font-bold text-gray-900">
                            {entry.user?.name}
                          </span>
                          <span className="text-gray-500 text-[11px]">
                            ({entry.user?.role})
                          </span>
                        </div>
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                          {entry.decision}
                        </span>
                      </div>

                      <p className="text-gray-700 italic bg-white p-2.5 rounded-xl border border-gray-100">
                        "{entry.comments || 'No comment provided'}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1">
                        <span>Digital Hash: {entry.digitalSignatureHash}</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Revision History & Version Comparison */}
          {activeTab === 'history' && (
            <div className="max-w-xl mx-auto py-4">
              <h4 className="font-bold text-gray-900 text-sm mb-3">SOP Revision History</h4>
              <div className="space-y-4">
                {sop.changeHistory && sop.changeHistory.length > 0 ? (
                  sop.changeHistory.map((item, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-indigo-100 last:border-0 pb-2">
                      <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-left">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-indigo-700">v{item.version}</span>
                          <span className="text-[10px] font-medium text-gray-400">{item.date}</span>
                        </div>
                        <p className="text-xs text-gray-800 font-semibold mb-1">{item.summary}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Author: {item.author}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No change history logs present. This is standard version 1.0.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Action Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {onOpenReportIssue && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReportIssue(sop.id);
                }}
                className="text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Report Issue</span>
              </button>
            )}

            <span className="text-gray-300">•</span>

            {onOpenRequestChange && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRequestChange(sop.id);
                }}
                className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-blue-600" />
                <span>Request SOP Change</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {onExecuteChecklist && (
              <button
                onClick={() => {
                  onClose();
                  onExecuteChecklist(sop);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Execute Checklist</span>
              </button>
            )}

            {onAcknowledgeRead && (
              <button
                onClick={() => {
                  onClose();
                  onAcknowledgeRead(sop);
                }}
                disabled={isAcknowledged}
                className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  isAcknowledged
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAcknowledged ? 'Read Acknowledged' : 'Acknowledge Read'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

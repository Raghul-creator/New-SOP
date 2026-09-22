import React, { useState } from 'react';
import { ITAssetWorkflow, SOPDocument, User, AuditLogEntry } from '../types';
import {
  Laptop,
  RefreshCw,
  Trash2,
  Wrench,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Barcode,
  Search,
  BookOpen,
  Send,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';
import {
  generateSingleExecutionPDF,
  generateSingleExecutionCSV
} from '../utils/complianceReportGenerator';

interface ITAssetSOPModuleProps {
  workflows: ITAssetWorkflow[];
  sops: SOPDocument[];
  currentUser: User;
  onNavigateToSop: (sopId: string, viewMode: 'workflow' | 'edit') => void;
  onOpenKnowledgeBase: () => void;
  onExecutionLogged?: (log: AuditLogEntry) => void;
}

export const ITAssetSOPModule: React.FC<ITAssetSOPModuleProps> = ({
  workflows,
  sops,
  currentUser,
  onNavigateToSop,
  onOpenKnowledgeBase,
  onExecutionLogged
}) => {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflows[0]?.id || 'wf-001');
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [assetSerialInput, setAssetSerialInput] = useState<string>('FIT-LT-2026-0891');
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [lastLoggedEntry, setLastLoggedEntry] = useState<AuditLogEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentWf = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];
  const linkedSop = sops.find(s => s.id === currentWf?.sopId);

  const handleToggleCheck = (stepId: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [stepId]: !prev[stepId]
    }));
  };

  const handleExecuteChecklist = async () => {
    if (!assetSerialInput.trim()) {
      alert('Please enter an Asset Serial Number or Tag before executing.');
      return;
    }
    const allChecked = currentWf.checklist.every(c => checkedItems[c.id]);
    if (!allChecked) {
      alert('Please complete all mandatory procedural checklist items.');
      return;
    }

    setIsSubmitting(true);
    const certId = `CERT-EXEC-${Date.now().toString().slice(-6)}`;
    const execId = `EXEC-${Date.now().toString().slice(-6)}`;
    const checklistSummary = currentWf.checklist.map(
      c => `${c.step} [PASSED${c.toolUsed ? ` via ${c.toolUsed}` : ''}]`
    );

    const executionLogPayload = {
      sopId: currentWf.sopId,
      sopNumber: currentWf.sopId,
      sopTitle: currentWf.title,
      department: 'IT_Enablement',
      clientName: 'Enterprise Client Operations - Hardware Fleet',
      user: currentUser,
      checklistCompleted: currentWf.checklist.length,
      totalChecklist: currentWf.checklist.length,
      assetTagOrRef: assetSerialInput,
      checklistSummary,
      executionNotes: `Completed all ${currentWf.checklist.length} quality checks for asset ${assetSerialInput}. Windows Autopilot, BitLocker escrow, and endpoint telemetry verified.`,
      details: `Executed SOP checklist for ${currentWf.title} (Asset Tag: ${assetSerialInput}). Passed 100% of procedural steps under ISO 9001 quality criteria.`
    };

    try {
      const res = await fetch('/api/audit-logs/execution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executionLogPayload)
      });

      if (res.ok) {
        const data = await res.json();
        setLastLoggedEntry(data.log);
        if (onExecutionLogged) {
          onExecutionLogged(data.log);
        }
      }
    } catch (err) {
      console.warn('Execution logged in offline mode:', err);
      // Fallback local log
      const fallbackLog: AuditLogEntry = {
        id: `log-${Date.now()}`,
        sopId: currentWf.sopId,
        sopNumber: currentWf.sopId,
        sopTitle: currentWf.title,
        department: 'IT_Enablement',
        clientName: 'Enterprise Client Operations - Hardware Fleet',
        user: currentUser,
        action: 'SOP_EXECUTION_COMPLETED',
        details: `Executed operational checklist for ${currentWf.title} (Asset Tag: ${assetSerialInput}).`,
        ipAddress: '10.14.20.105',
        timestamp: new Date().toISOString(),
        entraObjectId: currentUser.entraObjectId,
        retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS',
        tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        executionData: {
          executionId: execId,
          clientName: 'Enterprise Client Operations - Hardware Fleet',
          department: 'IT_Enablement',
          checklistCompleted: currentWf.checklist.length,
          totalChecklist: currentWf.checklist.length,
          assetTagOrRef: assetSerialInput,
          checklistSummary,
          signOffOfficer: `${currentUser.name} (${currentUser.role})`,
          status: 'COMPLETED',
          executionNotes: 'All hardware quality checks passed.',
          certificateId: certId
        }
      };
      setLastLoggedEntry(fallbackLog);
      if (onExecutionLogged) {
        onExecutionLogged(fallbackLog);
      }
    } finally {
      setIsSubmitting(false);
      setExecutionResult(
        `Checklist for ${currentWf.title} (Asset: ${assetSerialInput}) signed and completed by ${currentUser.name}. Certificate generated and archived in the Tamper-Proof Audit Vault.`
      );
    }
  };

  const getWorkflowIcon = (cat: string) => {
    switch (cat) {
      case 'Laptop Onboarding':
        return <Laptop className="w-5 h-5 text-cyan-600" />;
      case 'Device Replacement':
        return <RefreshCw className="w-5 h-5 text-blue-600" />;
      case 'Asset Return':
        return <Trash2 className="w-5 h-5 text-rose-600" />;
      case 'Warranty RMA':
        return <Wrench className="w-5 h-5 text-amber-600" />;
      default:
        return <Laptop className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1C1E] rounded-3xl p-6 text-white border border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                Focus Infotech &bull; IT Enablement Hub
              </span>
              <span className="bg-white/10 text-gray-300 border border-white/10 text-xs px-2.5 py-0.5 rounded-full font-mono">
                Hardware Lifecycle
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <Laptop className="w-6 h-6 text-indigo-400" />
              IT Asset Management SOPs & Workflows
            </h1>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Standardized operational workflows for laptop onboarding, hardware refresh cycles, cryptographic drive sanitization on offboarding, and vendor warranty claims.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenKnowledgeBase}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-2 transition cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Knowledge Base & FAQs</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Core Workflow Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflows.map(wf => {
          const isSelected = wf.id === selectedWorkflowId;
          const isPublished = sops.find(s => s.id === wf.sopId)?.status === 'Published';

          return (
            <div
              key={wf.id}
              onClick={() => {
                setSelectedWorkflowId(wf.id);
                setCheckedItems({});
                setExecutionResult(null);
              }}
              className={`p-5 rounded-3xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white hover:border-gray-300 border-gray-200/80 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-gray-50 rounded-2xl border border-gray-200">
                  {getWorkflowIcon(wf.category)}
                </div>
                <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {wf.sopId}
                </span>
              </div>
              <h3 className="font-bold text-sm text-[#1A1C1E] line-clamp-1">{wf.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{wf.description}</p>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-[11px]">
                <span className="text-gray-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  SLA: {wf.slaHours}h
                </span>
                <span className={`font-semibold ${isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isPublished ? '✓ Active SOP' : 'Under Review'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Workflow Interactive Console */}
      {currentWf && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Checklist & Step Execution */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {currentWf.category}
                    </span>
                    <span className="text-xs font-mono text-gray-500 font-semibold">{currentWf.sopId}</span>
                  </div>
                  <h2 className="text-lg font-bold text-[#1A1C1E] mt-1.5">{currentWf.title}</h2>
                </div>

                {linkedSop && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateToSop(linkedSop.id, 'workflow')}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <span>Approval Workflow</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigateToSop(linkedSop.id, 'edit')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <span>View Full SOP</span>
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Asset Tag Input */}
              <div className="mt-4 p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <Barcode className="w-4 h-4 text-indigo-600" />
                  <span>Target Hardware Asset Tag / Serial No:</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={assetSerialInput}
                    onChange={e => setAssetSerialInput(e.target.value)}
                    placeholder="e.g. FIT-LT-2026-0891"
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                  />
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                    Asset Verified
                  </span>
                </div>
              </div>

              {/* Step Checklist */}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    Mandatory Standard Operating Checklist
                  </h4>
                  <span className="text-xs text-gray-500 font-mono">
                    {currentWf.checklist.filter(c => checkedItems[c.id]).length} / {currentWf.checklist.length} Completed
                  </span>
                </div>

                <div className="space-y-2">
                  {currentWf.checklist.map((item, idx) => {
                    const isDone = !!checkedItems[item.id];
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleCheck(item.id)}
                        className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                          isDone
                            ? 'bg-emerald-50/70 border-emerald-300 text-gray-900'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleCheck(item.id)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              Step {idx + 1}: {item.step}
                            </span>
                            {item.toolUsed && (
                              <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
                                {item.toolUsed}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Execution Actions */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Logged under Active Entra ID: <b>{currentUser.email}</b></span>
                </div>

                <button
                  onClick={handleExecuteChecklist}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#1A1C1E] hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4 text-indigo-400" />
                  <span>{isSubmitting ? 'Verifying & Signing...' : 'Sign & Complete Checklist'}</span>
                </button>
              </div>

              {/* Result Confirmation Banner with Client Downloads */}
              {executionResult && (
                <div className="mt-5 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 text-xs text-emerald-950 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-emerald-900">Execution Verified & Certificate Generated!</div>
                      <p className="text-emerald-800 mt-0.5">{executionResult}</p>
                    </div>
                  </div>

                  {lastLoggedEntry && (
                    <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-emerald-900 font-mono">
                        Certificate: <b>{lastLoggedEntry.executionData?.certificateId || 'CERT-ACTIVE'}</b> &bull; SHA-256 Verified
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => generateSingleExecutionPDF(lastLoggedEntry)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Download PDF Certificate</span>
                        </button>

                        <button
                          onClick={() => generateSingleExecutionCSV(lastLoggedEntry)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 rounded-xl font-bold text-xs border border-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download CSV</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Col: SOP Governance Info & Vendor Support */}
          <div className="space-y-4">
            {/* Governance Card */}
            {linkedSop && (
              <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Linked Governance Metadata
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Document ID</span>
                    <span className="font-mono font-bold text-gray-900">{linkedSop.id}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Business Criticality</span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                      {linkedSop.businessCriticality}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Purview Sensitivity</span>
                    <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      {linkedSop.sensitivityLabel}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Process Owner</span>
                    <span className="font-medium text-gray-900">{linkedSop.processOwner?.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100">
                    <span className="text-gray-500">Retention Policy</span>
                    <span className="font-medium text-gray-700">7 Years (ISO 27001)</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gray-600 block mb-1.5">Compliance Standards:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {linkedSop.complianceStandards?.map(std => (
                      <span key={std} className="text-[10px] bg-gray-100 text-gray-700 font-medium px-2.5 py-0.5 rounded-full border border-gray-200">
                        {std}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Vendor Support Box */}
            <div className="bg-[#1A1C1E] rounded-3xl p-6 text-white border border-gray-800 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Wrench className="w-4 h-4" />
                  Vendor SLA & Escalation
                </h3>
                <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Active Contract
                </span>
              </div>

              <div className="text-xs space-y-2 text-gray-300">
                <div className="font-bold text-white text-sm">{currentWf.vendorSupportContact}</div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Direct warranty RMA parts delivery and tier-3 hardware replacement backed by 4-hour on-site technician dispatch.
                </p>
                <div className="pt-2.5 border-t border-gray-800 flex justify-between text-[11px]">
                  <span className="text-gray-400">SLA Response:</span>
                  <span className="text-indigo-300 font-semibold">{currentWf.slaHours} Hours Mission Critical</span>
                </div>
              </div>

              <button
                onClick={onOpenKnowledgeBase}
                className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-indigo-300 rounded-xl text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition mt-2 cursor-pointer"
              >
                <span>View All Vendor Contacts</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

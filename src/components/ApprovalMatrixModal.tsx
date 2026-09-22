import React from 'react';
import { DEPARTMENT_CONFIGS } from '../data/mockData';
import {
  ShieldCheck,
  X,
  Layers,
  Building2,
  Lock,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface ApprovalMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApprovalMatrixModal: React.FC<ApprovalMatrixModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                Future Focus Infotech Governance
              </span>
              <span className="text-[10px] font-mono text-slate-400">Part of en Inc. Group</span>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              Enterprise Governance & Verification Stage Matrix
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Visual Diagram */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-600" />
              Standard Governance Verification Stages
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Level 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Stage 1
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Technical Feasibility Check</h4>
                <p className="text-[11px] text-slate-500">
                  Reviews technical feasibility, step accuracy, tool validity, and safety prerequisites.
                </p>
                <div className="text-[10px] text-cyan-800 font-semibold bg-cyan-50 p-1.5 rounded border border-cyan-200">
                  Status: <b>Under Review</b>
                </div>
              </div>

              {/* Level 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                    Stage 2
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Operational Alignment</h4>
                <p className="text-[11px] text-slate-500">
                  Validates operational alignment, department headcount, budget, and cross-team dependencies.
                </p>
                <div className="text-[10px] text-blue-800 font-semibold bg-blue-50 p-1.5 rounded border border-blue-200">
                  Status: <b>Operational Sign-Off</b>
                </div>
              </div>

              {/* Level 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    Stage 3
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Governance & Risk Posture</h4>
                <p className="text-[11px] text-slate-500">
                  Executive oversight for strategic compliance, risk posture, and organizational governance.
                </p>
                <div className="text-[10px] text-indigo-800 font-semibold bg-indigo-50 p-1.5 rounded border border-indigo-200">
                  Status: <b>Governance Review</b>
                </div>
              </div>

              {/* Level 4 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Stage 4
                  </span>
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Quality & ISMS Compliance</h4>
                <p className="text-[11px] text-slate-500">
                  Validates ISO 9001 / ISO 27001 compliance, applies Purview label, and triggers SharePoint publish.
                </p>
                <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 p-1.5 rounded border border-emerald-200">
                  Status: <b>Approved & Published</b>
                </div>
              </div>
            </div>
          </div>

          {/* Department-Wise Matrix Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cyan-600" />
              Future Focus Infotech Service Line Governance Matrix
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Department / Service Line</th>
                    <th className="py-2.5 px-3">Doc Code</th>
                    <th className="py-2.5 px-3">Primary Standard</th>
                    <th className="py-2.5 px-3">Stage 1 Target</th>
                    <th className="py-2.5 px-3">Stage 2 Target</th>
                    <th className="py-2.5 px-3">Final Publication Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DEPARTMENT_CONFIGS.map(dept => (
                    <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{dept.name}</td>
                      <td className="py-2.5 px-3 font-mono text-cyan-700 font-semibold">{dept.code}-SOP-XXX</td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium">ISO 9001 / ISO 27001 ISMS</td>
                      <td className="py-2.5 px-3 text-slate-600">Technical Check</td>
                      <td className="py-2.5 px-3 text-slate-600">Operational Verification</td>
                      <td className="py-2.5 px-3 text-slate-600 font-semibold text-emerald-700">
                        SharePoint Online / M365 Purview
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security & Audit Policies */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-cyan-600" />
              Digital Signature & Security Enforcement
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Every decision records an immutable SHA-256 digital signature hash chained to Microsoft Entra ID object ID and timestamp. Multi-Factor Authentication (MFA) is strictly enforced for all governance verification sign-offs.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Matrix Overview
          </button>
        </div>
      </div>
    </div>
  );
};

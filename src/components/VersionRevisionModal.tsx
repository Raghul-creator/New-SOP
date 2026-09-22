import React, { useState } from 'react';
import {
  GitCommit,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  ArrowUpRight,
  Loader2,
  Layers
} from 'lucide-react';
import { SOPDocument, User } from '../types';

interface VersionRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sop: SOPDocument;
  currentUser: User;
  onRevisionSuccess?: (updatedSop: SOPDocument) => void;
  onRevisionCreated?: (updatedSop?: SOPDocument) => void;
}

export const VersionRevisionModal: React.FC<VersionRevisionModalProps> = ({
  isOpen,
  onClose,
  sop,
  currentUser,
  onRevisionSuccess,
  onRevisionCreated
}) => {
  const [revisionType, setRevisionType] = useState<'minor' | 'major'>('minor');
  const [changeSummary, setChangeSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentVer = sop.version || '1.0';
  const parts = currentVer.split('.');
  const currentMajor = parseInt(parts[0], 10) || 1;
  const currentMinor = parseInt(parts[1], 10) || 0;

  const nextMinorVer = `${currentMajor}.${currentMinor + 1}`;
  const nextMajorVer = `${currentMajor + 1}.0`;
  const targetVersion = revisionType === 'major' ? nextMajorVer : nextMinorVer;

  const handleCreateRevision = async () => {
    if (!changeSummary.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sops/${sop.id}/create-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          revisionType,
          changeSummary,
          updatedBy: currentUser
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (onRevisionSuccess) onRevisionSuccess(data.sop);
        if (onRevisionCreated) onRevisionCreated(data.sop);
        onClose();
      }
    } catch (err) {
      console.error('Error creating SOP revision:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">SOP Version Control & Revision</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current: <strong className="text-white">{sop.sopNumber || sop.id}</strong> (v{currentVer})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Revision Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Revision Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRevisionType('minor')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  revisionType === 'minor'
                    ? 'border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900">Minor Revision</span>
                  <span className="font-mono text-xs font-bold bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded">
                    v{nextMinorVer}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  For procedural step updates, clarifying notes, tooling tweaks, or minor role reassignments.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRevisionType('major')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                  revisionType === 'major'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900">Major Revision</span>
                  <span className="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                    v{nextMajorVer}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-tight">
                  For comprehensive architectural overhauls, compliance changes, or complete process restructures.
                </p>
              </button>
            </div>
          </div>

          {/* Change Summary Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Change Summary / Audit Justification (Mandatory)</span>
              <span className="text-slate-400 font-normal text-[11px]">Recorded in 7-Year Audit Trail</span>
            </label>
            <textarea
              rows={3}
              value={changeSummary}
              onChange={(e) => setChangeSummary(e.target.value)}
              placeholder="e.g. Updated Step 3 with zero-touch Windows 11 Autopilot script parameters and added NIST SP 800-88 sanitization verification..."
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Governance Notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs text-slate-600">
            <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-cyan-600" />
              <span>Governed Lifecycle Transition</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Creating a revision will set the SOP document status back to <strong>Draft</strong> under author <strong>{currentUser.name}</strong>, requiring complete re-approval through the 4-tier hierarchy before re-publishing to SharePoint.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!changeSummary.trim() || isSubmitting}
              onClick={handleCreateRevision}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-cyan-600/20 flex items-center space-x-2 transition cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Incrementing Version...</span>
                </>
              ) : (
                <>
                  <GitCommit className="w-4 h-4" />
                  <span>Create v{targetVersion} Revision</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

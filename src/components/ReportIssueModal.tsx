import React, { useState } from 'react';
import { SOPDocument, User, IssueReport, IssueType } from '../types';
import { AlertCircle, X, Check, ShieldAlert, FileText, Send, Paperclip, Building2, Upload } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  sops: SOPDocument[];
  preselectedSopId?: string | null;
  currentUser: User;
  onSubmitIssue: (issue: IssueReport) => void;
}

const ISSUE_TYPES: IssueType[] = [
  'SOP unclear',
  'Incorrect step',
  'Missing information',
  'Process unavailable',
  'System issue',
  'Compliance concern',
  'Other'
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  sops,
  preselectedSopId,
  currentUser,
  onSubmitIssue
}) => {
  const [selectedSopId, setSelectedSopId] = useState<string>(preselectedSopId || (sops[0]?.id ?? ''));
  const [issueType, setIssueType] = useState<IssueType>('Incorrect step');
  const [urgency, setUrgency] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSop = sops.find(s => s.id === selectedSopId) || sops[0];
  const department = currentSop?.department || 'IT_Enablement';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !currentSop) return;

    const newIssue: IssueReport = {
      id: `ISSUE-${Date.now().toString().slice(-5)}`,
      sopId: currentSop.id,
      sopNumber: currentSop.sopNumber,
      sopTitle: currentSop.title,
      department: currentSop.department,
      issueType,
      category: issueType,
      severity: urgency,
      urgency,
      title: title.trim() || `${issueType} in ${currentSop.sopNumber}`,
      description: description.trim(),
      attachmentName: attachmentName || undefined,
      reportedBy: currentUser,
      reportedAt: new Date().toISOString(),
      status: 'OPEN',
      assignedToManager: currentSop.departmentOwner || currentSop.processOwner?.name || 'Department Manager'
    };

    onSubmitIssue(newIssue);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setTitle('');
      setDescription('');
      setAttachmentName('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-xl w-full p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1A1C1E]">REPORT AN ISSUE</h2>
            <p className="text-xs text-gray-500">
              Submit discrepancies, unclear steps, system blockers, or compliance concerns.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Issue Logged (Status: OPEN)</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Process owner for <strong className="text-gray-700">{department}</strong> has received this issue report in their task queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* SOP Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Target SOP</label>
              <select
                value={selectedSopId}
                onChange={(e) => setSelectedSopId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sops.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.sopNumber || s.id}] {s.title} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Department (Auto-filled from SOP) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 border border-gray-200 rounded-xl text-xs font-bold text-gray-800">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>{department}</span>
                <span className="text-[10px] font-normal text-gray-500 ml-auto">(Assigned from SOP record)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Issue Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Issue Type</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as IssueType)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {ISSUE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low — Minor clarification</option>
                  <option value="Medium">Medium — General operational note</option>
                  <option value="High">High — Blocked workflow</option>
                  <option value="Critical">Critical — Immediate security / compliance risk</option>
                </select>
              </div>
            </div>

            {/* Title / Summary */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Summary (Optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe what occurred, which step was affected, missing info, or system issues..."
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Attachment */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Attachment</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 cursor-pointer transition">
                  <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                  <span>{attachmentName ? 'Change File' : 'Upload Screenshot / Log'}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
                {attachmentName && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl">
                    <Paperclip className="w-3 h-3 text-indigo-600" />
                    <span className="truncate max-w-xs">{attachmentName}</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentName('')}
                      className="ml-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/70 text-[11px] text-gray-600 flex items-center justify-between">
              <span>Reported by: <strong className="text-gray-900">{currentUser.name}</strong> ({currentUser.role})</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Initial Status: OPEN
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Issue</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

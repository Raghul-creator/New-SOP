import React, { useState } from 'react';
import { SOPDocument, User, ChangeRequest, ChangeType } from '../types';
import { GitPullRequest, X, Check, ArrowRight, Send, Paperclip, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RequestChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sops: SOPDocument[];
  preselectedSopId?: string | null;
  currentUser: User;
  onSubmitChangeRequest: (cr: ChangeRequest) => void;
}

const CHANGE_TYPES: ChangeType[] = [
  'Process outdated',
  'Incorrect information',
  'Missing step',
  'New system',
  'Compliance requirement',
  'Process improvement',
  'Other'
];

export const RequestChangeModal: React.FC<RequestChangeModalProps> = ({
  isOpen,
  onClose,
  sops,
  preselectedSopId,
  currentUser,
  onSubmitChangeRequest
}) => {
  const [selectedSopId, setSelectedSopId] = useState<string>(preselectedSopId || (sops[0]?.id ?? ''));
  const [reason, setReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [changeType, setChangeType] = useState<ChangeType>('Process outdated');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentSop = sops.find(s => s.id === selectedSopId) || sops[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !description.trim() || !currentSop) return;

    const newCR: ChangeRequest = {
      id: `CR-${Date.now().toString().slice(-5)}`,
      sopId: currentSop.id,
      sopNumber: currentSop.sopNumber,
      sopTitle: currentSop.title,
      department: currentSop.department,
      title: `${changeType}: ${currentSop.sopNumber}`,
      reason: reason.trim(),
      description: description.trim(),
      changeType,
      priority,
      proposedChanges: description.trim(),
      businessJustification: reason.trim(),
      attachmentName: attachmentName || undefined,
      submittedBy: currentUser,
      submittedAt: new Date().toISOString(),
      requestedBy: currentUser,
      requestedAt: new Date().toISOString(),
      changeTitle: `${changeType}: ${currentSop.title}`,
      reasonForChange: reason.trim(),
      proposedModifications: description.trim(),
      status: 'SUBMITTED',
      currentVersion: currentSop.version
    };

    onSubmitChangeRequest(newCR);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setReason('');
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

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1A1C1E]">REQUEST SOP CHANGE</h2>
            <p className="text-xs text-gray-500">
              Submit change proposals for active procedures through controlled governance.
            </p>
          </div>
        </div>

        {/* Prominent Governance Rule Notice */}
        <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Controlled Document Policy:</strong> Employees cannot directly modify active SOPs. All proposed modifications are formally reviewed by Process Owners and Compliance before authoring a revision.
          </div>
        </div>

        {submitted ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900">Change Request Logged (SUBMITTED)</h3>
            <p className="text-xs text-gray-500 max-w-sm">
              Your request for <strong className="text-gray-700">{currentSop?.sopNumber}</strong> has been assigned to {currentSop?.departmentOwner || 'Department Lead'} for governance review.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Target SOP */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">SOP Document</label>
              <select
                value={selectedSopId}
                onChange={(e) => setSelectedSopId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sops.map(s => (
                  <option key={s.id} value={s.id}>
                    [{s.sopNumber || s.id}] {s.title} (v{s.version} • {s.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Change Type */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Change Type</label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as ChangeType)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {CHANGE_TYPES.map(ct => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High' | 'Critical')}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Change *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Explain the justification (e.g. process outdated, audit finding, new tool introduced, regulatory requirement)..."
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Detailed Description of Changes *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detail the specific steps, systems, or responsibilities that need to be altered or added..."
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
                  <span>{attachmentName ? 'Change File' : 'Upload Specification / Document'}</span>
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
              <span>Submitted by: <strong className="text-gray-900">{currentUser.name}</strong> ({currentUser.role})</span>
              <span className="font-mono text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Initial Status: SUBMITTED
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
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Change Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

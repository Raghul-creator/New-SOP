import React, { useState } from 'react';
import { NotificationEvent, SOPDocument, User } from '../types';
import {
  Bell,
  X,
  Send,
  Mail,
  MessageSquare,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationEvent[];
  sops: SOPDocument[];
  currentUser: User;
  onSendManualReminder: (sopId: string, type: string, message: string) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  sops,
  currentUser,
  onSendManualReminder
}) => {
  const [selectedSopId, setSelectedSopId] = useState<string>(sops[0]?.id || 'IT-SOP-001');
  const [reminderType, setReminderType] = useState<string>('30_DAYS');
  const [customNote, setCustomNote] = useState<string>('');
  const [dispatchSuccess, setDispatchSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    onSendManualReminder(
      selectedSopId,
      reminderType,
      customNote || `Automated Governance Reminder: Review SOP ${selectedSopId} for compliance.`
    );
    setDispatchSuccess(true);
    setCustomNote('');
    setTimeout(() => setDispatchSuccess(false), 3500);
  };

  const selectedSop = sops.find(s => s.id === selectedSopId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                Future Focus Infotech Microsoft 365 Bridge
              </span>
              <span className="text-[10px] font-mono text-slate-400">Teams Webhooks & Exchange Online</span>
            </div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <Bell className="w-6 h-6 text-cyan-400" />
              Automated Notification Center & Reminder Engine
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
          {/* Rules Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <Send className="w-4 h-4 text-cyan-600" />
                <span>On Submission</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Instant Teams message & Outlook invite dispatched to assigned Level 1 Technical Reviewer.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Stage Approvals</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Automatically notifies Level 2 Dept Manager, Level 3 HOD, or Level 4 Compliance Admin.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Review Cycles</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Automated reminders at 6 months, 12 months, and 30 days prior to next review expiry date.
              </p>
            </div>
          </div>

          {/* Test Reminder Dispatcher */}
          <div className="p-5 bg-cyan-50/60 rounded-xl border border-cyan-200">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              Dispatch Simulated Teams / Email Reminder
            </h3>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Target SOP Document:
                  </label>
                  <select
                    value={selectedSopId}
                    onChange={e => setSelectedSopId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    {sops.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id}: {s.title.substring(0, 45)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Trigger Frequency / Rule:
                  </label>
                  <select
                    value={reminderType}
                    onChange={e => setReminderType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  >
                    <option value="30_DAYS">30 Days Prior to Expiry Warning</option>
                    <option value="6_MONTHS">6-Month Periodic Quality Audit</option>
                    <option value="12_MONTHS">12-Month Annual Governance Renewal</option>
                    <option value="IMMEDIATE">Immediate Level Approval Ping</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Custom Reminder Message / Directives:
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder={`e.g. Please audit Intune Autopilot hashes before next ISO 27001 audit for ${selectedSop?.id}...`}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-600">
                  Target Recipient: <b>{selectedSop?.processOwner?.email || selectedSop?.author?.email || 'assigned.owner@organization.com'}</b>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Notification Now</span>
                </button>
              </div>

              {dispatchSuccess && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Notification successfully transmitted to Microsoft Teams & Outlook Exchange inbox.</span>
                </div>
              )}
            </form>
          </div>

          {/* Live Notification Log Feed */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-600" />
              Recent Dispatch Log ({notifications.length})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-cyan-700 mt-0.5">
                      {n.channel === 'Teams' ? (
                        <MessageSquare className="w-4 h-4" />
                      ) : n.channel === 'Email' ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{n.recipientName}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                          {n.sopId}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          ✓ {n.status}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-1">{n.message}</p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Notification Center
          </button>
        </div>
      </div>
    </div>
  );
};

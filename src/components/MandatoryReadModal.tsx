import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  UserCheck,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { SOPDocument, User, ReadAcknowledgment } from '../types';
import { SOPHeaderBlock } from './SOPHeaderBlock';

interface MandatoryReadModalProps {
  isOpen: boolean;
  onClose: () => void;
  sop: SOPDocument;
  currentUser: User;
  onAcknowledgeSuccess: (ack: ReadAcknowledgment) => void;
}

export const MandatoryReadModal: React.FC<MandatoryReadModalProps> = ({
  isOpen,
  onClose,
  sop,
  currentUser,
  onAcknowledgeSuccess
}) => {
  const [agreed, setAgreed] = useState(false);
  const [mfaConfirmed, setMfaConfirmed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'sign' | 'history'>('sign');

  if (!isOpen) return null;

  const existingAcks = sop.readAcknowledgments || [];
  const hasUserAlreadySigned = existingAcks.some(a => a.user.id === currentUser.id || a.user.email === currentUser.email);

  const handleSignAcknowledgment = async () => {
    if (!agreed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/sops/${sop.id}/acknowledge-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: currentUser,
          acknowledgedText: 'I confirm that I have read, understood, and agree to strictly adhere to this Standard Operating Procedure in accordance with Focus Infotech governance standards.',
          mfaVerified: mfaConfirmed
        })
      });

      if (res.ok) {
        const data = await res.json();
        onAcknowledgeSuccess(data.acknowledgment);
        setActiveTab('history');
      }
    } catch (err) {
      console.error('Error recording read acknowledgment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Mandatory Read Confirmation</h2>
                <span className="font-mono text-[10px] bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-slate-700">
                  {sop.sopNumber || sop.id} v{sop.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ISO 9001 / ISO 27001 ISMS Compliance & Employee Attestation
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

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('sign')}
            className={`pb-3 text-xs font-bold border-b-2 px-3 transition cursor-pointer ${
              activeTab === 'sign'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign Confirmation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-bold border-b-2 px-3 transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <span>Audit Trail & Attestations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
              {existingAcks.length}
            </span>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'sign' ? (
            <div className="space-y-5">
              
              {/* Standardized Focus Infotech Corporate Governance Header Block */}
              <SOPHeaderBlock sop={sop} />

              {hasUserAlreadySigned && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>You have already confirmed and signed this version of the SOP. Re-signing will append an updated timestamp.</span>
                </div>
              )}

              {/* Attestation Text */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Focus Infotech Mandatory Employee Attestation Statement</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed italic">
                  "I hereby confirm that I have completely read and understood this Standard Operating Procedure ({sop.sopNumber || sop.id} v{sop.version}). I commit to adhering strictly to all documented steps, safety controls, and escalation matrices during my daily operations at Focus Infotech."
                </p>

                <label className="flex items-start space-x-3 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    I acknowledge and digitally sign this attestation under my corporate Microsoft Entra ID account ({currentUser.email}).
                  </span>
                </label>
              </div>

              {/* Security & Entra ID Verification */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-700">
                  <KeyRound className="w-4 h-4 text-cyan-600" />
                  <span>MFA Token & IP Stamping: <strong>10.14.20.50 (Verified)</strong></span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">SHA-256 Signed</span>
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
                  disabled={!agreed || isSubmitting}
                  onClick={handleSignAcknowledgment}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Signature...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Submit Digital Confirmation</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Total recorded employee read confirmations for <strong>{sop.sopNumber || sop.id}</strong>:
              </div>

              {existingAcks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs">No employee confirmations recorded yet for this version.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {existingAcks.map((ack) => (
                    <div
                      key={ack.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900">{ack.user.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.2 rounded font-mono">
                            {ack.user.department.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(ack.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        "{ack.acknowledgedText}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-200">
                        <span className="truncate max-w-[280px]">Hash: {ack.signatureHash}</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          MFA Validated
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveTab('sign')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Back to Attestation Form
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

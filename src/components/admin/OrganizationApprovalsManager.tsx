import React, { useState } from 'react';
import { OrganizationApprovalSettings, ApprovalTierConfig, DepartmentConfig } from '../../types';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Save,
  Plus,
  Trash2,
  Edit2,
  Mail,
  UserCheck,
  Lock,
  ArrowRight,
  Shield,
  Layers
} from 'lucide-react';

interface OrganizationApprovalsManagerProps {
  settings: OrganizationApprovalSettings;
  departments: DepartmentConfig[];
  onSaveSettings: (updated: OrganizationApprovalSettings) => Promise<void>;
  onEditDepartment: (dept: DepartmentConfig) => void;
}

export const OrganizationApprovalsManager: React.FC<OrganizationApprovalsManagerProps> = ({
  settings,
  departments,
  onSaveSettings,
  onEditDepartment
}) => {
  const [formData, setFormData] = useState<OrganizationApprovalSettings>(settings);
  const [editingTierIndex, setEditingTierIndex] = useState<number | null>(null);
  const [tierEditState, setTierEditState] = useState<ApprovalTierConfig | null>(null);
  const [isAddTierModalOpen, setIsAddTierModalOpen] = useState(false);
  const [newTier, setNewTier] = useState<Partial<ApprovalTierConfig>>({
    title: '',
    approverName: '',
    approverRole: 'Approver',
    approverEmail: '',
    isRequired: true,
    description: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      await onSaveSettings(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save organization approval settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEditTier = (index: number) => {
    setEditingTierIndex(index);
    setTierEditState({ ...formData.tiers[index] });
  };

  const handleSaveEditTier = () => {
    if (editingTierIndex === null || !tierEditState) return;
    const updatedTiers = [...formData.tiers];
    updatedTiers[editingTierIndex] = tierEditState;
    setFormData({ ...formData, tiers: updatedTiers });
    setEditingTierIndex(null);
    setTierEditState(null);
  };

  const handleCancelEditTier = () => {
    setEditingTierIndex(null);
    setTierEditState(null);
  };

  const handleDeleteTier = (index: number) => {
    const updatedTiers = formData.tiers.filter((_, idx) => idx !== index);
    setFormData({ ...formData, tiers: updatedTiers });
  };

  const handleCreateNewTier = () => {
    if (!newTier.title || !newTier.approverName || !newTier.approverEmail) {
      setErrorMessage('Please provide Title, Approver Name, and Approver Email for the new gate.');
      return;
    }

    const nextNumber = formData.tiers.length + 1;
    const created: ApprovalTierConfig = {
      id: `tier-${Date.now()}`,
      tierNumber: nextNumber,
      tierKey: `custom_${Date.now()}`,
      title: newTier.title.trim(),
      approverName: newTier.approverName.trim(),
      approverRole: newTier.approverRole?.trim() || 'Approver',
      approverEmail: newTier.approverEmail.trim(),
      isRequired: !!newTier.isRequired,
      description: newTier.description?.trim() || 'Custom organizational verification gate.'
    };

    setFormData({
      ...formData,
      tiers: [...formData.tiers, created]
    });

    setIsAddTierModalOpen(false);
    setNewTier({
      title: '',
      approverName: '',
      approverRole: 'Approver',
      approverEmail: '',
      isRequired: true,
      description: ''
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Alert Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">
              Organization approval names and governance gates have been saved successfully!
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Top Banner: Overview & Fast Save */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Governance & Approvals Matrix</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1C1E]">
            Organization Approval Names & Tiers
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Define designated organizational approvers, sign-off hierarchies, and segregation of duties.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Organization Approvals'}</span>
        </button>
      </div>

      {/* Organization Parameters */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-5">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Organization Details & Gate Policies</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">Organization / Entity Name</label>
            <input
              type="text"
              value={formData.organizationName}
              onChange={e => setFormData({ ...formData, organizationName: e.target.value })}
              placeholder="e.g., Focus Infotech"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900">Enforce Segregation of Duties</div>
              <div className="text-[11px] text-gray-500">Author cannot approve their own SOP (ISO 9001 / 27001)</div>
            </div>
            <input
              type="checkbox"
              checked={formData.enforceSegregationOfDuties}
              onChange={e => setFormData({ ...formData, enforceSegregationOfDuties: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <label className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Department Head Sign-Off</span>
              <span className="text-[10px] text-gray-500">Tier 1 operational check</span>
            </div>
            <input
              type="checkbox"
              checked={formData.requireDepartmentHeadApproval}
              onChange={e => setFormData({ ...formData, requireDepartmentHeadApproval: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </label>

          <label className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Compliance Audit Gate</span>
              <span className="text-[10px] text-gray-500">Tier 2 regulatory standard</span>
            </div>
            <input
              type="checkbox"
              checked={formData.requireComplianceReview}
              onChange={e => setFormData({ ...formData, requireComplianceReview: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </label>

          <label className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer hover:bg-gray-100/60 transition">
            <div>
              <span className="text-xs font-bold text-gray-800 block">Executive Sign-Off</span>
              <span className="text-[10px] text-gray-500">Tier 3 high-impact gate</span>
            </div>
            <input
              type="checkbox"
              checked={formData.requireExecutiveSignOff}
              onChange={e => setFormData({ ...formData, requireExecutiveSignOff: e.target.checked })}
              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Designated Approval Tiers */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Designated Sign-Off Tiers ({formData.tiers.length})</span>
            </h3>
            <p className="text-xs text-gray-500">
              Customize the approver names and email addresses responsible for reviewing documents.
            </p>
          </div>

          <button
            onClick={() => setIsAddTierModalOpen(true)}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Gate</span>
          </button>
        </div>

        <div className="space-y-3">
          {formData.tiers.map((tier, index) => {
            const isEditing = editingTierIndex === index;

            return (
              <div
                key={tier.id || index}
                className="p-4 bg-gray-50/60 border border-gray-200/80 rounded-2xl transition hover:border-gray-300"
              >
                {isEditing && tierEditState ? (
                  /* Inline Tier Editor */
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-indigo-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-xs font-bold text-indigo-700">Editing Tier #{tier.tierNumber}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelEditTier}
                          className="px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEditTier}
                          className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700">Gate Title</label>
                        <input
                          type="text"
                          value={tierEditState.title}
                          onChange={e => setTierEditState({ ...tierEditState, title: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700">Designated Approver Name</label>
                        <input
                          type="text"
                          value={tierEditState.approverName}
                          onChange={e => setTierEditState({ ...tierEditState, approverName: e.target.value })}
                          placeholder="e.g., Rajesh Kumar / Unit Lead"
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700">Approver Role Title</label>
                        <input
                          type="text"
                          value={tierEditState.approverRole}
                          onChange={e => setTierEditState({ ...tierEditState, approverRole: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700">Approver Email Address</label>
                        <input
                          type="email"
                          value={tierEditState.approverEmail}
                          onChange={e => setTierEditState({ ...tierEditState, approverEmail: e.target.value })}
                          placeholder="approver@organization.com"
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tierEditState.isRequired}
                          onChange={e => setTierEditState({ ...tierEditState, isRequired: e.target.checked })}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                        <span className="text-xs text-gray-700 font-medium">Mandatory Approval Gate (Blocking)</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  /* Display Tier Card */
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
                        {tier.tierNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-gray-900">{tier.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            tier.isRequired
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {tier.isRequired ? 'Mandatory Gate' : 'Optional Gate'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-600 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-semibold text-gray-800">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {tier.approverName}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500 font-medium">{tier.approverRole}</span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1 text-gray-500 font-mono text-[11px]">
                            <Mail className="w-3 h-3 text-gray-400" />
                            {tier.approverEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={() => handleStartEditTier(index)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                        title="Edit Approver Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Approver</span>
                      </button>

                      {index >= 3 && (
                        <button
                          onClick={() => handleDeleteTier(index)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Delete Custom Gate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Department Approvers Directory */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Departmental Approver Assignments ({departments.length})</span>
            </h3>
            <p className="text-xs text-gray-500">
              Each department can define its own primary reviewer and compliance sign-off personnel.
            </p>
          </div>
        </div>

        {departments.length === 0 ? (
          <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-gray-600">No departments created yet.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Create a department under "Department Governance" to assign specific departmental approvers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {departments.map(dept => (
              <div
                key={dept.id}
                className="p-4 bg-gray-50/70 border border-gray-200/80 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold font-mono text-xs flex items-center justify-center">
                        {dept.code}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900">{dept.name}</h4>
                    </div>
                    <button
                      onClick={() => onEditDepartment(dept)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs mt-3 bg-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Primary Approver:</span>
                      <strong className="text-gray-800">{dept.primaryApproverName || dept.headName}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono">
                      <span>Email:</span>
                      <span>{dept.primaryApproverEmail || dept.headEmail}</span>
                    </div>
                    <div className="border-t border-gray-100 my-1 pt-1 flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Compliance Reviewer:</span>
                      <strong className="text-gray-800">{dept.complianceApproverName || 'Quality & Compliance Officer'}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Custom Gate Modal */}
      {isAddTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Add Custom Approval Gate</span>
              </h3>
              <button
                onClick={() => setIsAddTierModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700">Gate Title</label>
                <input
                  type="text"
                  value={newTier.title}
                  onChange={e => setNewTier({ ...newTier, title: e.target.value })}
                  placeholder="e.g., Legal Counsel Sign-Off"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Approver Person Name</label>
                <input
                  type="text"
                  value={newTier.approverName}
                  onChange={e => setNewTier({ ...newTier, approverName: e.target.value })}
                  placeholder="e.g., Legal Advisor / Chief Risk Officer"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Approver Role Title</label>
                <input
                  type="text"
                  value={newTier.approverRole}
                  onChange={e => setNewTier({ ...newTier, approverRole: e.target.value })}
                  placeholder="e.g., General Counsel"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Approver Email</label>
                <input
                  type="email"
                  value={newTier.approverEmail}
                  onChange={e => setNewTier({ ...newTier, approverEmail: e.target.value })}
                  placeholder="approver@organization.com"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700">Gate Purpose</label>
                <input
                  type="text"
                  value={newTier.description}
                  onChange={e => setNewTier({ ...newTier, description: e.target.value })}
                  placeholder="Brief summary of what this sign-off verifies..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newTier.isRequired}
                  onChange={e => setNewTier({ ...newTier, isRequired: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-xs text-gray-800 font-semibold">Mandatory Gate (Required to Publish)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsAddTierModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewTier}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Add Gate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

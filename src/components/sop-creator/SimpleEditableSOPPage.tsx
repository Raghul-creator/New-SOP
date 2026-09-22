import React, { useState } from 'react';
import {
  SOPDocument,
  User,
  DepartmentConfig,
  ProcedureStep
} from '../../types';
import { downloadSOPAsPDF, downloadSOPAsDOCX } from '../../utils/complianceReportGenerator';
import {
  Edit3,
  Save,
  FileText,
  AlertTriangle,
  Building2,
  UserCheck,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  CheckCircle2,
  Maximize2,
  X,
  UploadCloud,
  Check,
  Loader2,
  Download
} from 'lucide-react';

export interface SimpleEditableSOPPageProps {
  initialSop: SOPDocument;
  currentUser: User;
  departments: DepartmentConfig[];
  onSaveDraft: (sop: SOPDocument) => void;
  onSaveSop: (sop: SOPDocument) => void;
  onBack?: () => void;
}

export const SimpleEditableSOPPage: React.FC<SimpleEditableSOPPageProps> = ({
  initialSop,
  currentUser,
  departments,
  onSaveDraft,
  onSaveSop,
  onBack
}) => {
  // Main editing toggle state (starts in edit mode so user can immediately edit)
  const [isEditMode, setIsEditMode] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveActionType, setSaveActionType] = useState<'draft' | 'sop' | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState<boolean>(false);

  // Editable Form Fields
  const [title, setTitle] = useState<string>(initialSop.title || '');
  const matchedInitialDept = departments.find(d =>
    (initialSop.departmentId && d.id === initialSop.departmentId) ||
    d.id === initialSop.department ||
    (initialSop.departmentName && d.name.toLowerCase() === initialSop.departmentName.toLowerCase()) ||
    d.name.toLowerCase() === initialSop.department?.toLowerCase() ||
    d.code.toLowerCase() === initialSop.department?.toLowerCase()
  );
  const [departmentId, setDepartmentId] = useState<string>(
    initialSop.departmentId || matchedInitialDept?.id || departments[0]?.id || ''
  );
  const [purpose, setPurpose] = useState<string>(initialSop.purpose || '');
  
  // Responsible Person
  const initialResponsiblePerson =
    initialSop.responsibilities?.[0]?.role ||
    initialSop.departmentOwner ||
    initialSop.processOwner?.name ||
    '';
  const [responsiblePerson, setResponsiblePerson] = useState<string>(initialResponsiblePerson);

  // Warnings / Notes
  const initialWarnings =
    initialSop.exceptionHandling ||
    initialSop.exceptions ||
    '';
  const [warningsNotes, setWarningsNotes] = useState<string>(initialWarnings);

  // Procedure Steps
  const [steps, setSteps] = useState<ProcedureStep[]>(() => {
    if (Array.isArray(initialSop.procedureSteps) && initialSop.procedureSteps.length > 0) {
      return initialSop.procedureSteps.map((step, idx) => ({
        ...step,
        stepNumber: idx + 1
      }));
    }
    return [
      {
        id: `step-${Date.now()}-1`,
        stepNumber: 1,
        title: 'Step 1',
        action: '',
        assignedRole: initialResponsiblePerson || 'Not provided',
        screenshots: []
      }
    ];
  });

  // Lightbox modal for enlarged screenshot preview
  const [activeEnlargedImage, setActiveEnlargedImage] = useState<{ url: string; title: string } | null>(null);

  // Helper to compile the complete updated SOPDocument
  const compileCurrentSop = (targetStatus: 'Draft' | 'Active'): SOPDocument => {
    const updatedResponsibilities = [
      {
        role: responsiblePerson.trim() || 'Not provided',
        description: responsiblePerson.trim() ? `Executes the procedure steps.` : 'Not provided'
      }
    ];

    const updatedSteps = steps.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
      assignedRole: responsiblePerson.trim() || s.assignedRole || 'Not provided'
    }));

    const currentDeptObj = departments.find(d =>
      d.id === departmentId ||
      d.code === departmentId ||
      d.name.toLowerCase() === departmentId.toLowerCase()
    );
    const resolvedDeptId = currentDeptObj ? currentDeptObj.id : (initialSop.departmentId || departmentId);
    const resolvedDeptName = currentDeptObj ? currentDeptObj.name : (initialSop.departmentName || initialSop.department || departmentId);

    return {
      ...initialSop,
      title: title.trim() || 'Not provided',
      department: resolvedDeptName,
      departmentId: resolvedDeptId,
      departmentName: resolvedDeptName,
      departmentOwner: responsiblePerson.trim() || initialSop.departmentOwner || 'Not provided',
      purpose: purpose.trim() || 'Not provided',
      status: targetStatus,
      responsibilities: updatedResponsibilities,
      procedureSteps: updatedSteps,
      exceptionHandling: warningsNotes.trim() || 'Not provided',
      exceptions: warningsNotes.trim() || 'Not provided',
      updatedAt: new Date().toISOString()
    };
  };

  // Action: Toggle Edit Mode
  const handleToggleEdit = () => {
    setIsEditMode(prev => !prev);
  };

  // Action: Save Draft
  const handleSaveDraftClick = () => {
    setIsSaving(true);
    setSaveActionType('draft');
    const draftSop = compileCurrentSop('Draft');
    setSaveSuccessMessage('Draft saved successfully! Updating library...');
    setTimeout(() => {
      onSaveDraft(draftSop);
    }, 400);
  };

  // Action: Save SOP
  const handleSaveSopClick = () => {
    setIsSaving(true);
    setSaveActionType('sop');
    const finalizedSop = compileCurrentSop('Active');
    setSaveSuccessMessage('SOP saved successfully! Updating library...');
    setTimeout(() => {
      onSaveSop(finalizedSop);
    }, 400);
  };

  // Step Management
  const handleUpdateStep = (index: number, field: keyof ProcedureStep, value: any) => {
    setSteps(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddStep = () => {
    setSteps(prev => [
      ...prev,
      {
        id: `step-${Date.now()}-${prev.length + 1}`,
        stepNumber: prev.length + 1,
        title: `Step ${prev.length + 1}`,
        action: '',
        assignedRole: responsiblePerson.trim() || 'Not provided',
        screenshots: []
      }
    ]);
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(prev => {
      const filtered = prev.filter((_, idx) => idx !== index);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    setSteps(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  };

  // Screenshot handling for individual step
  const handleAddScreenshotToStep = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSteps(prev => {
        const copy = [...prev];
        const existing = copy[index].screenshots || [];
        copy[index] = { ...copy[index], screenshots: [...existing, dataUrl] };
        return copy;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveScreenshotFromStep = (stepIndex: number, shotIndex: number) => {
    setSteps(prev => {
      const copy = [...prev];
      const existing = [...(copy[stepIndex].screenshots || [])];
      existing.splice(shotIndex, 1);
      copy[stepIndex] = { ...copy[stepIndex], screenshots: existing };
      return copy;
    });
  };

  // Collect all unique screenshots across steps for the Screenshots section
  const allScreenshots = steps.flatMap((st, sIdx) =>
    (st.screenshots || []).map((url, shotIdx) => ({
      url,
      stepNumber: st.stepNumber,
      stepTitle: st.title,
      stepIndex: sIdx,
      shotIndex: shotIdx
    }))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200" id="simple-editable-sop-page">
      {/* Top Banner / Actions Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-4 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              title="Return to previous screen"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {isEditMode ? 'Editing SOP' : 'Document Preview'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {initialSop.sopNumber || 'SOP'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 truncate max-w-md sm:max-w-xl">
              {title || 'Untitled SOP'}
            </h1>
          </div>
        </div>

        {/* ONLY THE 3 REQUESTED MAIN ACTIONS */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0" id="sop-main-actions-toolbar">
          {/* Action 1: Edit Toggle */}
          <button
            type="button"
            id="toggle-edit-mode-btn"
            onClick={handleToggleEdit}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border ${
              isEditMode
                ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title={isEditMode ? 'Switch to View mode' : 'Switch to Edit mode'}
          >
            {isEditMode ? (
              <>
                <Eye className="w-4 h-4 text-amber-700" />
                <span>View Preview</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 text-gray-700" />
                <span>Edit</span>
              </>
            )}
          </button>

          {/* Action 2: Save Draft */}
          <button
            type="button"
            id="save-draft-btn"
            onClick={handleSaveDraftClick}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && saveActionType === 'draft' ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
            ) : (
              <Save className="w-4 h-4 text-gray-600" />
            )}
            <span>Save Draft</span>
          </button>

          {/* Action 3: Save SOP */}
          <button
            type="button"
            id="save-sop-btn"
            onClick={handleSaveSopClick}
            disabled={isSaving}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving && saveActionType === 'sop' ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-blue-100" />
            )}
            <span>Save SOP</span>
          </button>

          {/* Action 4: Download SOP Dropdown */}
          <div className="relative">
            <button
              type="button"
              id="download-sop-editable-btn"
              onClick={() => setIsDownloadMenuOpen(prev => !prev)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-2xs transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>Download</span>
            </button>

            {isDownloadMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => {
                    const currentSopDoc = compileCurrentSop('Active');
                    downloadSOPAsPDF(currentSopDoc);
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
                    const currentSopDoc = compileCurrentSop('Active');
                    downloadSOPAsDOCX(currentSopDoc);
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
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Main Single Editable SOP Document Form */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8 space-y-8">
        
        {/* 1. SOP Title & Department */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
          {/* SOP Title */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              SOP Title <span className="text-red-500">*</span>
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="editable-sop-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. AWS S3 Bucket Setup & Access Configuration"
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-base sm:text-lg font-bold text-gray-900 focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition"
              />
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 py-1">
                {title || 'Untitled SOP'}
              </h2>
            )}
            <p className="text-xs text-gray-500">
              Clear, standardized title describing the visible operational task.
            </p>
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Department</span> <span className="text-red-500">*</span>
            </label>
            {isEditMode ? (
              <select
                id="editable-sop-department"
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition"
              >
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="py-2 px-3 bg-gray-50 rounded-xl text-sm font-semibold text-gray-800 border border-gray-200/60 inline-block">
                {departments.find(d => d.id === departmentId)?.name || initialSop.departmentName || initialSop.department || 'Not specified'}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Organizational unit owning this procedure.
            </p>
          </div>
        </div>

        {/* 2. Purpose & Responsible Person */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-gray-100">
          {/* Purpose */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Purpose</span>
            </label>
            {isEditMode ? (
              <textarea
                id="editable-sop-purpose"
                rows={3}
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                placeholder="Describe the operational goal and outcome of this SOP..."
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition leading-relaxed resize-y"
              />
            ) : (
              <div className="p-3.5 bg-gray-50/70 rounded-xl border border-gray-200/60 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {purpose || 'Not provided'}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Why this procedure exists and what it accomplishes.
            </p>
          </div>

          {/* Responsible Person */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gray-500" />
              <span>Responsible Person</span>
            </label>
            {isEditMode ? (
              <input
                type="text"
                id="editable-sop-responsible-person"
                value={responsiblePerson}
                onChange={e => setResponsiblePerson(e.target.value)}
                placeholder="e.g. IT Administrator, Cloud Engineer"
                className="w-full px-4 py-3 bg-gray-50/50 hover:bg-white focus:bg-white border border-gray-200 focus:border-blue-500 rounded-xl text-sm font-semibold text-gray-800 focus:outline-hidden focus:ring-3 focus:ring-blue-100 transition"
              />
            ) : (
              <div className="p-3 bg-gray-50/70 rounded-xl border border-gray-200/60 text-sm font-semibold text-gray-800">
                {responsiblePerson || 'Not provided'}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Primary role or individual tasked with execution.
            </p>
          </div>
        </div>

        {/* 3. Warnings / Notes */}
        <div className="space-y-2 pb-6 border-b border-gray-100">
          <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Warnings / Notes</span>
          </label>
          {isEditMode ? (
            <textarea
              id="editable-sop-warnings-notes"
              rows={2}
              value={warningsNotes}
              onChange={e => setWarningsNotes(e.target.value)}
              placeholder="Crucial safety precautions, warnings, or exception handling..."
              className="w-full px-4 py-3 bg-amber-50/30 hover:bg-amber-50/50 focus:bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-3 focus:ring-amber-100 transition leading-relaxed resize-y"
            />
          ) : (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-sm text-amber-950 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed whitespace-pre-wrap">{warningsNotes || 'Not provided'}</p>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Mandatory warnings, security precautions, and operational fallback instructions.
          </p>
        </div>

        {/* 4. Procedure (Step-by-Step with embedded Screenshots) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>Procedure</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {steps.length} {steps.length === 1 ? 'Step' : 'Steps'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Sequential action instructions with related step screenshots.
              </p>
            </div>

            {isEditMode && (
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            )}
          </div>

          {/* List of Steps */}
          <div className="space-y-4">
            {steps.map((step, idx) => (
              <div
                key={step.id || idx}
                className="p-5 bg-gray-50/70 hover:bg-gray-50 rounded-2xl border border-gray-200/90 transition space-y-4"
              >
                {/* Step Header & Reorder / Delete Controls */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      {step.stepNumber}
                    </span>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={step.title}
                        onChange={e => handleUpdateStep(idx, 'title', e.target.value)}
                        placeholder={`Step ${step.stepNumber} Action Title`}
                        className="px-3 py-1.5 bg-white border border-gray-300 focus:border-blue-500 rounded-lg text-sm font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-blue-100 max-w-sm sm:max-w-md"
                      />
                    ) : (
                      <h4 className="text-sm font-bold text-gray-900">
                        {step.title}
                      </h4>
                    )}
                  </div>

                  {/* Reorder and Delete controls when in edit mode */}
                  {isEditMode && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-white transition cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveStep(idx, 'down')}
                        disabled={idx === steps.length - 1}
                        className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded-lg hover:bg-white transition cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(idx)}
                        disabled={steps.length <= 1}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 rounded-lg transition cursor-pointer ml-1"
                        title="Delete Step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Step Instruction / Action */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Instruction
                  </label>
                  {isEditMode ? (
                    <textarea
                      rows={2}
                      value={step.action}
                      onChange={e => handleUpdateStep(idx, 'action', e.target.value)}
                      placeholder="Enter concrete step-by-step instructions for this action..."
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-blue-500 rounded-xl text-sm text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-blue-100 transition resize-y leading-relaxed"
                    />
                  ) : (
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-xl border border-gray-200/60">
                      {step.action}
                    </p>
                  )}
                </div>

                {/* Step Screenshots */}
                <div className="space-y-2 pt-2 border-t border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      <span>Screenshots</span>
                    </span>

                    {/* Upload new screenshot to this step */}
                    {isEditMode && (
                      <label className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Add Screenshot</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => handleAddScreenshotToStep(idx, e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Screenshots gallery for this step */}
                  {step.screenshots && step.screenshots.length > 0 ? (
                    <div className="flex flex-wrap gap-3 pt-1">
                      {step.screenshots.map((shot, shotIdx) => (
                        <div
                          key={shotIdx}
                          className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow-2xs"
                        >
                          <img
                            src={shot}
                            alt={`Step ${step.stepNumber} Visual Evidence ${shotIdx + 1}`}
                            className="h-28 w-44 object-cover group-hover:opacity-90 transition cursor-pointer"
                            onClick={() =>
                              setActiveEnlargedImage({
                                url: shot,
                                title: `Step ${step.stepNumber}: ${step.title}`
                              })
                            }
                            referrerPolicy="no-referrer"
                          />

                          {/* Zoom Button */}
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEnlargedImage({
                                url: shot,
                                title: `Step ${step.stepNumber}: ${step.title}`
                              })
                            }
                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold gap-1.5 cursor-pointer"
                          >
                            <Maximize2 className="w-4 h-4" />
                            <span>Zoom</span>
                          </button>

                          {/* Delete screenshot button when editing */}
                          {isEditMode && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleRemoveScreenshotFromStep(idx, shotIdx);
                              }}
                              className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                              title="Remove screenshot"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 italic py-1">
                      No screenshot attached to this step.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Screenshots Overview Gallery (if multiple screenshots exist) */}
        {allScreenshots.length > 0 && (
          <div className="pt-6 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>All Visual Screenshots ({allScreenshots.length})</span>
              </h3>
              <span className="text-xs text-gray-400">
                Click any screenshot to enlarge in high resolution
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {allScreenshots.map((item, i) => (
                <div
                  key={i}
                  onClick={() =>
                    setActiveEnlargedImage({
                      url: item.url,
                      title: `Step ${item.stepNumber}: ${item.stepTitle}`
                    })
                  }
                  className="group relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow-2xs cursor-pointer hover:border-blue-500 transition"
                >
                  <img
                    src={item.url}
                    alt={`Step ${item.stepNumber}`}
                    className="h-24 w-full object-cover group-hover:scale-105 transition duration-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold">
                    Step {item.stepNumber}
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white text-xs font-semibold gap-1">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>View</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Actions Bar (Replicates top for seamless one-page completion) */}
        <div className="pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-gray-500">
            {isEditMode
              ? 'You are in editing mode. Changes are saved when clicking Save Draft or Save SOP.'
              : 'Preview mode. Click Edit to make modifications.'}
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleToggleEdit}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs sm:text-sm rounded-xl border border-gray-200 transition cursor-pointer"
            >
              {isEditMode ? 'View Preview' : 'Edit'}
            </button>

            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSaving}
              className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 font-bold text-xs sm:text-sm rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              onClick={handleSaveSopClick}
              disabled={isSaving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
            >
              Save SOP
            </button>
          </div>
        </div>
      </div>

      {/* High-Resolution Screenshot Lightbox Modal */}
      {activeEnlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveEnlargedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/90 text-white border-b border-gray-700">
              <span className="text-sm font-semibold truncate">
                {activeEnlargedImage.title}
              </span>
              <button
                type="button"
                onClick={() => setActiveEnlargedImage(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center max-h-[calc(90vh-60px)]">
              <img
                src={activeEnlargedImage.url}
                alt={activeEnlargedImage.title}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

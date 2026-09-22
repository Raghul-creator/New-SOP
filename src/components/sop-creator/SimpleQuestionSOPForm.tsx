import React, { useState, useEffect } from 'react';
import {
  SOPDocument,
  User,
  DepartmentConfig,
  ProcedureStep,
  ResponsibilityItem,
  ChangeHistoryItem,
  DefinitionItem,
  ReferenceItem
} from '../../types';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Calendar,
  Building2,
  FileText,
  Bookmark,
  ShieldAlert,
  Sliders,
  Users,
  AlertOctagon,
  FileSignature
} from 'lucide-react';
import { AIAssistantInline } from './AIAssistantInline';
import { CreateDepartmentModal } from '../CreateDepartmentModal';
import { buildUnifiedSOPDocument } from './sopEngine';

export interface SimpleQuestionSOPFormProps {
  currentUser: User;
  departments: DepartmentConfig[];
  initialDepartment?: string;
  initialSop?: SOPDocument | null;
  existingSops?: SOPDocument[];
  onSaveSop: (sop: SOPDocument, submitForApproval?: boolean) => void;
  onPreview?: (sop: SOPDocument) => void;
  onBack: () => void;
  onGenerated?: (sop: SOPDocument) => void;
  onSaveDepartment?: (dept: Partial<DepartmentConfig>) => Promise<any>;
}

export const SimpleQuestionSOPForm: React.FC<SimpleQuestionSOPFormProps> = ({
  currentUser,
  departments,
  initialDepartment,
  initialSop,
  existingSops = [],
  onSaveSop,
  onBack,
  onGenerated,
  onSaveDepartment
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [localDepartments, setLocalDepartments] = useState<DepartmentConfig[]>(departments);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);

  useEffect(() => {
    if (departments && departments.length > 0) {
      setLocalDepartments(departments);
    }
  }, [departments]);

  const allDepartments = localDepartments.length > 0 ? localDepartments : departments;

  // Resolve initial department ID
  const matchedDept = allDepartments.find(
    d => (initialSop?.departmentId && d.id === initialSop.departmentId) ||
         d.id === initialDepartment ||
         d.id === initialSop?.department ||
         (initialSop?.departmentName && d.name.toLowerCase() === initialSop.departmentName.toLowerCase()) ||
         (initialDepartment && d.name.toLowerCase() === initialDepartment.toLowerCase()) ||
         (initialDepartment && d.code.toLowerCase() === initialDepartment.toLowerCase()) ||
         (initialSop?.department && d.name.toLowerCase() === initialSop.department.toLowerCase()) ||
         (initialSop?.department && d.code.toLowerCase() === initialSop.department.toLowerCase())
  );
  const defaultDeptId = initialSop?.departmentId || matchedDept?.id || initialDepartment || (allDepartments[0]?.id) || '';

  // Step 1: SOP Information State
  const [sopName, setSopName] = useState(initialSop?.title || '');
  const [departmentId, setDepartmentId] = useState<string>(defaultDeptId);
  const [version, setVersion] = useState(initialSop?.version || '1.0');
  const [sensitivityLabel, setSensitivityLabel] = useState(initialSop?.sensitivityLabel || 'Internal');
  const [businessCriticality, setBusinessCriticality] = useState(initialSop?.businessCriticality || 'Medium');

  useEffect(() => {
    if (!departmentId && allDepartments.length > 0) {
      const match = allDepartments.find(
        d => (initialSop?.departmentId && d.id === initialSop.departmentId) ||
             d.id === initialDepartment ||
             (initialDepartment && d.name.toLowerCase() === initialDepartment.toLowerCase()) ||
             (initialSop?.department && d.name.toLowerCase() === initialSop.department.toLowerCase())
      );
      setDepartmentId(initialSop?.departmentId || match?.id || allDepartments[0]?.id || '');
    }
  }, [allDepartments, departmentId, initialSop, initialDepartment]);

  // Step 2: Purpose/Scope State
  const [purpose, setPurpose] = useState(initialSop?.purpose || '');
  const [scopeInScope, setScopeInScope] = useState(initialSop?.scope || '');
  const [scopeOutOfScope, setScopeOutOfScope] = useState(initialSop?.previousVersionSnapshot?.scope || '');

  // Step 3: Process Information State
  const [trigger, setTrigger] = useState(initialSop?.trigger || '');
  const [prerequisitesText, setPrerequisitesText] = useState(
    initialSop?.prerequisites ? initialSop.prerequisites.join('\n') : ''
  );
  const [softwareTools, setSoftwareTools] = useState(initialSop?.systemsUsed || '');

  // Step 4: Procedure Steps (List of Steps)
  const [procedureSteps, setProcedureSteps] = useState<Omit<ProcedureStep, 'id'>[]>(() => {
    if (initialSop?.procedureSteps && initialSop.procedureSteps.length > 0) {
      return initialSop.procedureSteps.map(s => ({
        stepNumber: s.stepNumber,
        title: s.title,
        action: s.action,
        assignedRole: s.assignedRole || '',
        toolUsed: s.toolUsed || ''
      }));
    }
    return [
      {
        stepNumber: 1,
        title: 'Initial Check and Preparation',
        action: 'Review the pre-requisite list and ensure you have all needed information.',
        assignedRole: '',
        toolUsed: ''
      }
    ];
  });

  // Step 5: Roles State
  const [performerRole, setPerformerRole] = useState(
    initialSop?.responsibilities?.[0]?.role || initialSop?.processOwner?.role || initialSop?.departmentOwner || 'Operational Personnel'
  );
  const [reviewerRole, setReviewerRole] = useState(initialSop?.reviewer?.role || 'Technical Lead');
  const [approverRole, setApproverRole] = useState(initialSop?.approver2?.role || 'Department Head');

  // Step 6: Definitions State (Interactive key-value list)
  const [definitionsList, setDefinitionsList] = useState<DefinitionItem[]>(() => {
    if (initialSop?.definitions && initialSop.definitions.length > 0) {
      return initialSop.definitions.map(d => ({ term: d.term, definition: d.definition }));
    }
    return [
      { term: 'SOP', definition: 'Standard Operating Procedure' },
      { term: 'FFI', definition: 'Future Focus Infotech' }
    ];
  });

  // Step 7: Escalation State
  const [escalationPath, setEscalationPath] = useState(initialSop?.escalation || '');

  // Step 8: Related Docs State
  const [relatedDocs, setRelatedDocs] = useState(
    initialSop?.references ? initialSop.references.map(r => `${r.title}: ${r.urlOrDocId}`).join('\n') : ''
  );

  // Step 9: Revision History State
  const [revisionHistory, setRevisionHistory] = useState<ChangeHistoryItem[]>(() => {
    if (initialSop?.changeHistory && initialSop.changeHistory.length > 0) {
      return initialSop.changeHistory;
    }
    return [
      {
        version: '1.0',
        date: new Date().toISOString().split('T')[0],
        author: currentUser.name,
        summary: 'Initial Creation of SOP'
      }
    ];
  });

  // Step 10: Approval State
  const [approverName, setApproverName] = useState(initialSop?.approver2?.name || '');
  const [approvalDate, setApprovalDate] = useState(
    initialSop?.approvalHistory?.[0]?.timestamp?.split('T')[0] || new Date().toISOString().split('T')[0]
  );

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  // Save Department Creation Handler
  const handleCreateDepartment = async (deptData: Partial<DepartmentConfig>) => {
    let createdDept: DepartmentConfig;
    if (onSaveDepartment) {
      createdDept = await onSaveDepartment(deptData);
    } else {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create department');
      }
      createdDept = await res.json();
    }

    if (createdDept && (createdDept.id || createdDept.name)) {
      const newId = createdDept.id || createdDept.name;
      setLocalDepartments(prev => {
        const exists = prev.some(d => d.id === newId || d.name.toLowerCase() === createdDept.name.toLowerCase());
        if (exists) {
          return prev.map(d => (d.id === newId || d.name.toLowerCase() === createdDept.name.toLowerCase()) ? createdDept : d);
        }
        return [...prev, createdDept];
      });
      setDepartmentId(newId);
    }
  };

  const generateSopNumber = (deptCodeOrId: string) => {
    const cleanCode = (deptCodeOrId || 'SOP').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || 'SOP';
    const deptSops = existingSops.filter(s => s.department === deptCodeOrId || s.departmentId === deptCodeOrId || s.sopNumber?.startsWith(cleanCode));
    const nextNum = deptSops.length + 1;
    return `${cleanCode}-SOP-${String(nextNum).padStart(3, '0')}`;
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!sopName.trim()) {
        newErrors.sopName = 'Please enter a name for the SOP.';
      }
      if (!departmentId) {
        newErrors.department = 'Please select a department.';
      }
    } else if (currentStep === 2) {
      if (!purpose.trim()) {
        newErrors.purpose = 'Please describe the purpose of this SOP.';
      }
    } else if (currentStep === 4) {
      // Validate at least one procedure step exists and is filled
      if (procedureSteps.length === 0) {
        newErrors.procedure = 'Please add at least one procedural step.';
      } else {
        const emptyStepIndex = procedureSteps.findIndex(s => !s.title.trim() || !s.action.trim());
        if (emptyStepIndex !== -1) {
          newErrors.procedure = `Step ${emptyStepIndex + 1} must have a title and action instruction.`;
        }
      }
    } else if (currentStep === 5) {
      if (!performerRole.trim()) {
        newErrors.performerRole = 'Please specify the main role performing this procedure.';
      }
    } else if (currentStep === 10) {
      if (!approverName.trim()) {
        newErrors.approverName = 'Please enter the name of the Approver.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 10));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleGenerateSOP = async () => {
    if (!validateCurrentStep()) return;

    setIsGenerating(true);
    setGenerationStatus('Compiling guided interview responses into standard SOP format...');

    const now = new Date().toISOString();
    const effective = initialSop?.effectiveDate || now.split('T')[0];
    const nextReview = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const currentDeptObj = allDepartments.find(d => d.id === departmentId || d.code === departmentId || d.name === departmentId);
    const deptName = currentDeptObj ? currentDeptObj.name : departmentId;

    // Compile procedure steps
    const finalSteps: ProcedureStep[] = procedureSteps.map((s, idx) => ({
      id: `step-${Date.now()}-${idx + 1}`,
      stepNumber: s.stepNumber,
      title: s.title.trim(),
      action: s.action.trim(),
      assignedRole: s.assignedRole.trim() || performerRole.trim(),
      toolUsed: s.toolUsed?.trim() || undefined,
      safetyNote: ''
    }));

    // Compile responsibilities
    const responsibilities: ResponsibilityItem[] = [
      {
        role: performerRole.trim(),
        description: `Executes the primary procedural steps of the ${sopName} process.`
      }
    ];

    if (reviewerRole.trim()) {
      responsibilities.push({
        role: reviewerRole.trim(),
        description: `Reviews and audits procedural executions for quality control.`
      });
    }

    if (approverRole.trim()) {
      responsibilities.push({
        role: approverRole.trim(),
        description: `Approves process reviews, compliance overrides, and standard exceptions.`
      });
    }

    // Parse prerequisites
    const prerequisites: string[] = prerequisitesText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    // Parse related docs
    const references: ReferenceItem[] = relatedDocs
      .split('\n')
      .map((line, idx) => {
        const parts = line.split(':');
        const title = parts[0]?.trim() || `Reference Doc ${idx + 1}`;
        const urlOrDocId = parts.slice(1).join(':')?.trim() || 'Internal System';
        return { title, urlOrDocId };
      })
      .filter(Boolean);

    // Generate complete SOP Document following the official FFI SOP Master Layout Format
    const inputsSteps = finalSteps.map(step => ({
      stepNumber: step.stepNumber,
      title: step.title,
      action: step.action,
      assignedRole: step.assignedRole,
      toolUsed: step.toolUsed || undefined
    }));

    const generatedSop = buildUnifiedSOPDocument({
      id: initialSop?.id,
      sopNumber: initialSop?.sopNumber,
      title: sopName.trim(),
      departmentId: currentDeptObj?.id || departmentId,
      departmentName: deptName,
      version,
      status: 'Draft',
      sensitivityLabel: sensitivityLabel as any,
      businessCriticality: businessCriticality as any,
      purpose: purpose.trim(),
      scopeInScope: scopeInScope.trim(),
      scopeOutOfScope: scopeOutOfScope.trim(),
      systemsUsed: softwareTools.trim(),
      prerequisites,
      responsibilities,
      procedureSteps: inputsSteps,
      definitions: definitionsList.filter(d => d.term.trim()),
      references,
      exceptionHandling: escalationPath.trim(),
      changeHistory: revisionHistory,
      currentUser
    });

    // Add final sign-off to approvalHistory for tracking
    generatedSop.approvalHistory = [
      {
        id: `appdec-${Date.now()}`,
        stepName: 'Final Sign-off',
        user: {
          id: `approver-${Date.now()}`,
          name: approverName.trim(),
          email: 'approver@focusinfotech.com',
          role: 'Approver',
          department: deptName
        },
        decision: 'Approved',
        timestamp: new Date().toISOString(),
        comments: 'Approved via guided interview sign-off.'
      }
    ];

    setTimeout(() => {
      if (onGenerated) {
        onGenerated(generatedSop);
      } else {
        onSaveSop(generatedSop, false);
      }
      setIsGenerating(false);
    }, 400);
  };

  const stepsMeta = [
    { num: 1, name: 'SOP Info', icon: Building2 },
    { num: 2, name: 'Purpose', icon: FileText },
    { num: 3, name: 'Context', icon: Bookmark },
    { num: 4, name: 'Procedure', icon: Sliders },
    { num: 5, name: 'Roles', icon: Users },
    { num: 6, name: 'Definitions', icon: Info },
    { num: 7, name: 'Escalation', icon: ShieldAlert },
    { num: 8, name: 'References', icon: FileSignature },
    { num: 9, name: 'History', icon: Bookmark },
    { num: 10, name: 'Sign-off', icon: Check }
  ];

  return (
    <div id="guided-interview-form" className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Standard SOP Guided Interview</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Follow FFI's official master layout standard to compile your procedure safely step-by-step.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
        >
          Exit
        </button>
      </div>

      {/* Stepper progress track */}
      <div className="grid grid-cols-5 md:grid-cols-10 gap-2 pb-2">
        {stepsMeta.map((s) => {
          const isActive = currentStep === s.num;
          const isCompleted = currentStep > s.num;
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => {
                if (validateCurrentStep() || currentStep > s.num) {
                  setCurrentStep(s.num);
                }
              }}
              className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : isCompleted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
              }`}
            >
              <s.icon className={`w-4 h-4 mb-1 ${isActive ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold block truncate max-w-full leading-none">
                {s.num}. {s.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form Area */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs min-h-[400px] flex flex-col justify-between">
        <div className="space-y-6">
          {/* STEP 1: SOP INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Step 1: Document & SOP Metadata
                </h3>
                <p className="text-xs text-gray-500 mt-1">Specify official document identification tags.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center justify-between">
                  <span>SOP Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={sopName}
                  onChange={(e) => {
                    setSopName(e.target.value);
                    if (errors.sopName) setErrors(prev => ({ ...prev, sopName: '' }));
                  }}
                  placeholder="e.g., Azure VM Provisioning Procedure"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 bg-gray-50/50"
                />
                {errors.sopName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.sopName}</p>
                )}
                <AIAssistantInline
                  fieldName="SOP Name"
                  processName={sopName}
                  department=""
                  enteredData={{}}
                  onAccept={(v) => setSopName(v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Department <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <select
                      value={departmentId}
                      onChange={(e) => {
                        setDepartmentId(e.target.value);
                        if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
                    >
                      <option value="">Select a Department</option>
                      {allDepartments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreateDeptModalOpen(true)}
                      className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      New
                    </button>
                  </div>
                  {errors.department && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.department}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Version</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g., 1.0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Sensitivity Label</label>
                  <select
                    value={sensitivityLabel}
                    onChange={(e) => setSensitivityLabel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Public">Public (Unrestricted)</option>
                    <option value="Internal">Internal (Strictly FFI Personnel)</option>
                    <option value="Confidential">Confidential (Restricted Access)</option>
                    <option value="Restricted">Restricted (Client-Private)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Business Criticality</label>
                  <select
                    value={businessCriticality}
                    onChange={(e) => setBusinessCriticality(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
                  >
                    <option value="Low">Low (No Service Impact)</option>
                    <option value="Medium">Medium (Partial/Internal Impact)</option>
                    <option value="High">High (Production or SLA Critical)</option>
                    <option value="Critical">Mission Critical (Severe Outage Risk)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PURPOSE/SCOPE */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Step 2: Purpose & Scope
                </h3>
                <p className="text-xs text-gray-500 mt-1">Describe why the process exists and where it applies.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Purpose Statement <span className="text-red-500">*</span></label>
                <textarea
                  value={purpose}
                  onChange={(e) => {
                    setPurpose(e.target.value);
                    if (errors.purpose) setErrors(prev => ({ ...prev, purpose: '' }));
                  }}
                  rows={3}
                  placeholder="What is the objective of this operating procedure?"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                {errors.purpose && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.purpose}</p>
                )}
                <AIAssistantInline
                  fieldName="Purpose"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{}}
                  onAccept={(v) => setPurpose(v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">In-Scope</label>
                  <textarea
                    value={scopeInScope}
                    onChange={(e) => setScopeInScope(e.target.value)}
                    rows={3}
                    placeholder="Specify target systems, teams, or parameters included."
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                  <AIAssistantInline
                    fieldName="Scope"
                    processName={sopName}
                    department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                    enteredData={{ purpose }}
                    onAccept={(v) => setScopeInScope(v)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Out-of-Scope</label>
                  <textarea
                    value={scopeOutOfScope}
                    onChange={(e) => setScopeOutOfScope(e.target.value)}
                    rows={3}
                    placeholder="Specify exclusions to prevent unauthorized deviations."
                    className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PROCESS INFORMATION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-indigo-600" />
                  Step 3: Process Prerequisites & Triggers
                </h3>
                <p className="text-xs text-gray-500 mt-1">Specify process triggers, inputs, and environment software systems.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Process Trigger</label>
                <input
                  type="text"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="e.g., Receipt of approved system access ticket via ServiceDesk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                <AIAssistantInline
                  fieldName="Process Trigger"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose }}
                  onAccept={(v) => setTrigger(v)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Mandatory Prerequisites (One item per line)</label>
                <textarea
                  value={prerequisitesText}
                  onChange={(e) => setPrerequisitesText(e.target.value)}
                  rows={3}
                  placeholder="e.g.&#10;Admin account to Azure Portal&#10;Approved Change Order Ticket ID"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50 font-mono text-xs"
                />
                <AIAssistantInline
                  fieldName="Prerequisites"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, trigger }}
                  onAccept={(v) => setPrerequisitesText(v)}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Systems & Tools Used</label>
                <input
                  type="text"
                  value={softwareTools}
                  onChange={(e) => setSoftwareTools(e.target.value)}
                  placeholder="e.g., AWS Management Console, Jenkins, kubectl, Terraform CLI"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                <AIAssistantInline
                  fieldName="Systems/Tools"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, trigger }}
                  onAccept={(v) => setSoftwareTools(v)}
                />
              </div>
            </div>
          )}

          {/* STEP 4: PROCEDURE STEPS */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Step 4: Procedural Steps Sequence
                </h3>
                <p className="text-xs text-gray-500 mt-1">Standardize the exact flow of operations. Maintain active voice instructions.</p>
              </div>

              {errors.procedure && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.procedure}</span>
                </div>
              )}

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {procedureSteps.map((s, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                        Step {idx + 1}
                      </span>
                      {procedureSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setProcedureSteps(prev => prev.filter((_, i) => i !== idx).map((item, nIdx) => ({ ...item, stepNumber: nIdx + 1 })));
                          }}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Step Title *</label>
                        <input
                          type="text"
                          value={s.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProcedureSteps(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                            if (errors.procedure) setErrors(prev => ({ ...prev, procedure: '' }));
                          }}
                          placeholder="e.g. Login to Dashboard"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Assigned Role</label>
                        <input
                          type="text"
                          value={s.assignedRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProcedureSteps(prev => prev.map((item, i) => i === idx ? { ...item, assignedRole: val } : item));
                          }}
                          placeholder={performerRole || 'e.g. Administrator'}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Instruction *</label>
                      <textarea
                        value={s.action}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProcedureSteps(prev => prev.map((item, i) => i === idx ? { ...item, action: val } : item));
                          if (errors.procedure) setErrors(prev => ({ ...prev, procedure: '' }));
                        }}
                        rows={2}
                        placeholder="Detail the exact action and expected response."
                        className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setProcedureSteps(prev => [
                      ...prev,
                      {
                        stepNumber: prev.length + 1,
                        title: '',
                        action: '',
                        assignedRole: '',
                        toolUsed: ''
                      }
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Next Step</span>
                </button>

                <AIAssistantInline
                  fieldName="Procedure"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, trigger, performerRole, softwareTools }}
                  onAccept={(v) => {
                    // Let's add steps based on text
                    const parts = v.split('\n').filter(Boolean);
                    if (parts.length > 0) {
                      const newSteps = parts.map((part, index) => {
                        const clean = part.replace(/^\d+[\.\)\-]\s*/, '').trim();
                        let title = clean;
                        let action = clean;
                        if (clean.includes(':')) {
                          const split = clean.split(':');
                          title = split[0].trim();
                          action = split.slice(1).join(':').trim() || title;
                        } else if (clean.length > 40) {
                          title = clean.split(' ').slice(0, 5).join(' ');
                        }
                        return {
                          stepNumber: index + 1,
                          title,
                          action,
                          assignedRole: performerRole,
                          toolUsed: softwareTools
                        };
                      });
                      setProcedureSteps(newSteps);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 5: ROLES */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Step 5: Process Ownership & Role Assignment
                </h3>
                <p className="text-xs text-gray-500 mt-1">Specify executing, reviewing, and approving authorities.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Primary Performer Role <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={performerRole}
                  onChange={(e) => {
                    setPerformerRole(e.target.value);
                    if (errors.performerRole) setErrors(prev => ({ ...prev, performerRole: '' }));
                  }}
                  placeholder="e.g. Cloud Security Analyst, IT Helpdesk Agent"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                {errors.performerRole && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.performerRole}</p>
                )}
                <AIAssistantInline
                  fieldName="Roles"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose }}
                  onAccept={(v) => {
                    // Expect format like: "Performer: Role\nReviewer: Role..."
                    const lines = v.split('\n');
                    lines.forEach(l => {
                      if (l.toLowerCase().includes('performer')) {
                        setPerformerRole(l.split(':')[1]?.trim() || performerRole);
                      } else if (l.toLowerCase().includes('reviewer')) {
                        setReviewerRole(l.split(':')[1]?.trim() || reviewerRole);
                      } else if (l.toLowerCase().includes('approver')) {
                        setApproverRole(l.split(':')[1]?.trim() || approverRole);
                      }
                    });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Reviewing Authority Role</label>
                  <input
                    type="text"
                    value={reviewerRole}
                    onChange={(e) => setReviewerRole(e.target.value)}
                    placeholder="e.g. Lead Devops, InfoSec Auditor"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">Approving Manager Role</label>
                  <input
                    type="text"
                    value={approverRole}
                    onChange={(e) => setApproverRole(e.target.value)}
                    placeholder="e.g. Director of Infrastructure, Operations Manager"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: DEFINITIONS */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Info className="w-5 h-5 text-indigo-600" />
                  Step 6: Core Terms & Definitions
                </h3>
                <p className="text-xs text-gray-500 mt-1">Define abbreviations or technical jargon to ensure standard readability.</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {definitionsList.map((d, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={d.term}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDefinitionsList(prev => prev.map((item, i) => i === idx ? { ...item, term: val } : item));
                        }}
                        placeholder="Term (e.g. AWS)"
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                      />
                      <input
                        type="text"
                        value={d.definition}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDefinitionsList(prev => prev.map((item, i) => i === idx ? { ...item, definition: val } : item));
                        }}
                        placeholder="Definition/Description"
                        className="col-span-2 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none"
                      />
                    </div>
                    {definitionsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setDefinitionsList(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setDefinitionsList(prev => [...prev, { term: '', definition: '' }])}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Definition</span>
                </button>

                <AIAssistantInline
                  fieldName="Definitions"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, softwareTools }}
                  onAccept={(v) => {
                    const lines = v.split('\n').filter(Boolean);
                    if (lines.length > 0) {
                      const newDefs = lines.map(line => {
                        const parts = line.split(':');
                        return {
                          term: parts[0]?.trim() || '',
                          definition: parts.slice(1).join(':')?.trim() || ''
                        };
                      }).filter(d => d.term);
                      setDefinitionsList(newDefs);
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 7: ESCALATION */}
          {currentStep === 7 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  Step 7: Escalation Triggers & Contacts
                </h3>
                <p className="text-xs text-gray-500 mt-1">Formulate the hierarchy for issue resolution and deviation reports.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Escalation Path (Tiers/SLA)</label>
                <textarea
                  value={escalationPath}
                  onChange={(e) => setEscalationPath(e.target.value)}
                  rows={4}
                  placeholder="Define L1, L2, and L3 support tiers and contacts."
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                <AIAssistantInline
                  fieldName="Escalation"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, performerRole }}
                  onAccept={(v) => setEscalationPath(v)}
                />
              </div>
            </div>
          )}

          {/* STEP 8: RELATED DOCS */}
          {currentStep === 8 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-indigo-600" />
                  Step 8: Associated Documents & References
                </h3>
                <p className="text-xs text-gray-500 mt-1">Trace dependencies to existing parent policies or templates.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">References (One per line as Title: Doc ID/URL)</label>
                <textarea
                  value={relatedDocs}
                  onChange={(e) => setRelatedDocs(e.target.value)}
                  rows={4}
                  placeholder="e.g.&#10;FFI Information Security Policy: FFI-SEC-POL-001&#10;AWS S3 Storage Policy: AWS-POL-S3"
                  className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50 font-mono text-xs"
                />
                <AIAssistantInline
                  fieldName="Related Docs"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose }}
                  onAccept={(v) => setRelatedDocs(v)}
                />
              </div>
            </div>
          )}

          {/* STEP 9: REVISION HISTORY */}
          {currentStep === 9 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-indigo-600" />
                  Step 9: Document Revision Control
                </h3>
                <p className="text-xs text-gray-500 mt-1">Establish the initial audit log version control.</p>
              </div>

              <div className="space-y-3">
                {revisionHistory.map((h, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Version</label>
                        <input
                          type="text"
                          value={h.version}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRevisionHistory(prev => prev.map((item, i) => i === idx ? { ...item, version: val } : item));
                          }}
                          className="w-full px-2 py-1 border rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Date</label>
                        <input
                          type="text"
                          value={h.date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRevisionHistory(prev => prev.map((item, i) => i === idx ? { ...item, date: val } : item));
                          }}
                          className="w-full px-2 py-1 border rounded-md text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600">Author</label>
                        <input
                          type="text"
                          value={h.author}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRevisionHistory(prev => prev.map((item, i) => i === idx ? { ...item, author: val } : item));
                          }}
                          className="w-full px-2 py-1 border rounded-md text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 font-mono">Summary of Changes</label>
                      <input
                        type="text"
                        value={h.summary}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRevisionHistory(prev => prev.map((item, i) => i === idx ? { ...item, summary: val } : item));
                        }}
                        className="w-full px-2 py-1.5 border rounded-md text-xs bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setRevisionHistory(prev => [
                      ...prev,
                      {
                        version: `1.${prev.length}`,
                        date: new Date().toISOString().split('T')[0],
                        author: currentUser.name,
                        summary: 'Minor revision update.'
                      }
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Revision Entry</span>
                </button>

                <AIAssistantInline
                  fieldName="Revision History"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ version }}
                  onAccept={(v) => {
                    // Update current release notes
                    setRevisionHistory(prev => prev.map((item, idx) => idx === 0 ? { ...item, summary: v } : item));
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 10: APPROVAL */}
          {currentStep === 10 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-gray-100 pb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Check className="w-5 h-5 text-indigo-600" />
                  Step 10: Approving Manager Sign-off
                </h3>
                <p className="text-xs text-gray-500 mt-1">Formulate the official executive approvals required before deployment.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Approving Manager Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => {
                    setApproverName(e.target.value);
                    if (errors.approverName) setErrors(prev => ({ ...prev, approverName: '' }));
                  }}
                  placeholder="e.g. Ramesh Kumar, Head of IT Ops"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                />
                {errors.approverName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.approverName}</p>
                )}
                <AIAssistantInline
                  fieldName="Approval"
                  processName={sopName}
                  department={allDepartments.find(d => d.id === departmentId)?.name || ''}
                  enteredData={{ purpose, performerRole, approverRole }}
                  onAccept={(v) => {
                    // Pull Approver name if possible
                    const parts = v.split('\n');
                    parts.forEach(p => {
                      if (p.toLowerCase().includes('name')) {
                        setApproverName(p.split(':')[1]?.trim() || approverName);
                      }
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Approval Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={approvalDate}
                    onChange={(e) => setApprovalDate(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next / Back Control Buttons */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 10 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateSOP}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-extrabold rounded-xl shadow-sm transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                  <span>Generate FFI SOP</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Loading overlay for final SOP compiling */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-gray-100 shadow-2xl animate-in zoom-in-95 duration-200">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
            <h4 className="font-extrabold text-base text-gray-900 mb-1">Compiling Master Document</h4>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">{generationStatus}</p>
          </div>
        </div>
      )}

      {/* New Department Dialog */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSaveDepartment={handleCreateDepartment}
      />
    </div>
  );
};

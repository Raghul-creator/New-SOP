import {
  ComplianceStandard,
  SensitivityLabel,
  BusinessCriticality,
  StepType,
  DecisionBranch,
  SOPType,
  SOPApprovalConfig
} from '../../types';

export interface CreatorStepItem {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  role: string;
  department: string;
  stepType: StepType;
  toolUsed: string; // System used
  document?: string; // Document / form
  documentsRecords?: string; // Standardized document/records identifier
  expectedOutcome?: string; // Expected outcome
  isRequired: boolean;
  tipOrWarning: string;
  decisionBranch?: DecisionBranch;
  aiSuggestion?: {
    originalTitle: string;
    originalDescription: string;
    originalExpectedOutcome?: string;
    suggestedTitle: string;
    suggestedDescription: string;
    suggestedExpectedOutcome?: string;
    explanation?: string;
  } | null;
}

export interface CreatorQuestionAnswers {
  // Required Canonical SOP Questionnaire Data Model Fields
  processName: string;
  purpose: string;
  department: string;
  processOwner: string;
  processPerformer: string;
  processReviewer: string;
  processFrequency: string;
  trigger: string;
  inputs: string;
  prerequisites: string;
  steps: string[];
  toolsSystems: string;
  documentsRecords: string;
  outputs: string;
  sla: string;
  qualityChecks: string;
  risks: string;
  controls: string;
  exceptions: string;
  escalationPath: string;
  approvalsRequired: string;
  complianceRequirements: string;
  kpis: string;
  relatedSOPs: string;
  additionalInformation: string;

  // Step 4 canonical fields
  recordsCreated?: string;
  recordsStorageLocation?: string;
  supportingSystems?: string;
  retentionPeriod?: string;

  // Extended properties for procedural UI state and workflow backward compatibility
  sopType?: SOPType;
  targetAudience?: string;
  targetAudienceNA?: boolean;
  purposeNA?: boolean;
  triggerNA?: boolean;
  inputsNA?: boolean;
  prerequisitesNA?: boolean;
  toolsSystemsNA?: boolean;
  documentsRecordsNA?: boolean;
  outputsNA?: boolean;
  slaNA?: boolean;
  qualityChecksNA?: boolean;
  risksNA?: boolean;
  controlsNA?: boolean;
  exceptionsNA?: boolean;
  escalationPathNA?: boolean;
  approvalsRequiredNA?: boolean;
  processDescription?: string;
  approverRole?: string;
  approverRoleNA?: boolean;
  approverName?: string;
  approverEmail?: string;
  processOwnerName?: string;
  processOwnerEmail?: string;
  processOwnerRole?: string;
  processOwnerDept?: string;
  processCategory?: string;
  outOfScope?: string;
  approvalConfig?: SOPApprovalConfig;
  requiresApproval?: boolean;
  expectedCompletionTime?: string;
  completionTimeNA?: boolean;
  otherDepartments?: string[];
  reviewFrequency?: 'Annual' | 'Bi-annual' | 'Quarterly';
  complianceStandards?: ComplianceStandard[];
  businessCriticality?: BusinessCriticality;
  sensitivityLabel?: SensitivityLabel;
  structuredSteps?: CreatorStepItem[];
  // Legacy aliases supported for seamless transition
  systemsUsed?: string;
  systemsUsedNA?: boolean;
  documentsRequired?: string;
  documentsRequiredNA?: boolean;
  exceptionHandling?: string;
  exceptionHandlingNA?: boolean;
  exceptionScenario?: string;
  exceptionNA?: boolean;
  escalationContact?: string;
  escalationContactNA?: boolean;
  recordsMaintained?: string;
  recordsMaintainedNA?: boolean;
}

/**
 * Returns safe empty defaults for every single field in CreatorQuestionAnswers.
 * Guaranteed to never produce undefined questionnaire state.
 */
export function createEmptyCreatorAnswers(): CreatorQuestionAnswers {
  return {
    processName: '',
    purpose: '',
    department: 'IT Enablement',
    processOwner: '',
    processPerformer: '',
    processReviewer: '',
    processFrequency: 'Annual',
    trigger: '',
    inputs: '',
    prerequisites: '',
    steps: [''],
    toolsSystems: '',
    documentsRecords: '',
    outputs: '',
    sla: '',
    qualityChecks: '',
    risks: '',
    controls: '',
    exceptions: '',
    escalationPath: '',
    approvalsRequired: '',
    complianceRequirements: '',
    kpis: '',
    relatedSOPs: '',
    additionalInformation: '',
    recordsCreated: '',
    recordsStorageLocation: '',
    supportingSystems: '',
    retentionPeriod: '',

    // Safe procedural defaults
    sopType: 'SOP',
    processDescription: '',
    targetAudience: '',
    systemsUsed: '',
    documentsRequired: '',
    exceptionHandling: '',
    escalationContact: '',
    approverRole: '',
    reviewFrequency: 'Annual',
    complianceStandards: ['ISO 27001', 'SOC 2 Type II'],
    businessCriticality: 'High',
    sensitivityLabel: 'Internal'
  };
}

export type SOPStatus =
  | 'Active'
  | 'Draft'
  | 'Under Review'
  | 'Review Due'
  | 'Overdue'
  | 'Retired'
  | 'Changes Requested'
  | 'Pending Approver 1'
  | 'Pending Approver 2'
  | 'Pending Final Approval'
  | 'Approved'
  | 'Publishing Queue'
  | 'Published'
  | 'Archived';

export type UserRole =
  | 'Employee'
  | 'Department Manager'
  | 'Compliance Manager'
  | 'Administrator'
  | 'Management'
  | 'Author'
  | 'Reviewer'
  | 'Approver'
  | 'ComplianceAdmin'
  | 'SharePointAdmin'
  | 'ITAdmin';

export type SOPType =
  | 'Policy'
  | 'SOP'
  | 'Work Instruction'
  | 'Standard'
  | 'Guideline'
  | 'Checklist'
  | 'Technical Manual';

export interface SOPApprovalConfig {
  requireDeptManager: boolean;
  requireCompliance: boolean;
  requireManagement: boolean;
  requireCustomApprover: boolean;
  customApproverName?: string;
  customApproverRole?: string;
  customApproverEmail?: string;
}

export interface HistoricalVersion {
  version: string;
  sopNumber: string;
  title: string;
  status: SOPStatus;
  date: string;
  effectiveDate: string;
  author: string;
  changeDescription: string;
  changeSummary?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt: string;
  snapshot: any;
}

export interface SOPRetirementInfo {
  retiredAt: string;
  retirementReason: string;
  replacementSopId?: string;
  replacementSopTitle?: string;
  approvedBy: string;
  approverRole?: string;
}

export type EntraGroup =
  | 'SOP_Admins'
  | 'SOP_Authors'
  | 'SOP_Reviewers'
  | 'SOP_Approvers'
  | 'SOP_Readers';

export type Department = string;

export interface TaskItem {
  id: string;
  sopId: string;
  sopNumber?: string;
  sopTitle: string;
  department: Department;
  title: string;
  description?: string;
  assignedTo: string; // User name or ID
  assignedToRole?: string;
  assignedToEmail?: string;
  assignedBy?: string;
  assignedDate?: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  checklist?: { id: string; text: string; completed: boolean }[];
  notes?: string;
  completedAt?: string;
  completedBy?: string;
  createdAt?: string;
  taskType?: string;
}

export type IssueType =
  | 'SOP unclear'
  | 'Incorrect step'
  | 'Missing information'
  | 'Process unavailable'
  | 'System issue'
  | 'Compliance concern'
  | 'Outdated Tool or Link'
  | 'Safety or Security Concern'
  | 'Unclear Instruction'
  | 'Other';

export type IssueStatus = 'OPEN' | 'IN PROGRESS' | 'RESOLVED' | 'CLOSED' | 'Open' | 'Under Review' | 'In Progress' | 'Resolved' | 'Declined';

export interface IssueReport {
  id: string;
  sopId: string;
  sopNumber?: string;
  sopTitle: string;
  department: Department;
  issueType?: IssueType;
  category?: string;
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  urgency?: 'Low' | 'Medium' | 'High' | 'Critical';
  title?: string;
  description: string;
  attachmentName?: string;
  attachmentUrl?: string;
  reportedBy: User;
  reportedAt?: string;
  createdAt?: string;
  status: IssueStatus;
  resolutionNotes?: string;
  assignedTo?: string;
  assignedToManager?: string;
}

export type ChangeType =
  | 'Process outdated'
  | 'Incorrect information'
  | 'Missing step'
  | 'New system'
  | 'Compliance requirement'
  | 'Process improvement'
  | 'Other';

export type ChangeRequestStatus =
  | 'SUBMITTED'
  | 'UNDER REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTED'
  | 'Submitted'
  | 'Under Review'
  | 'Approved'
  | 'Declined'
  | 'Pending Review';

export interface ChangeRequest {
  id: string;
  sopId: string;
  sopNumber?: string;
  sopTitle: string;
  department: Department;
  title?: string;
  reason?: string;
  description?: string;
  changeType?: ChangeType;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  proposedChanges?: string;
  businessJustification?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  sectionAffected?: string;
  submittedBy?: User;
  submittedAt?: string;
  createdAt?: string;
  status: ChangeRequestStatus;
  changeTitle?: string;
  reasonForChange?: string;
  proposedModifications?: string;
  requestedBy?: User;
  requestedAt?: string;
  currentVersion?: string;
  reviewComments?: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type ClientProjectScope =
  | 'Global Enterprise (All Projects)'
  | 'Deloitte Consulting Engagement'
  | 'Barclays Banking Fleet'
  | 'Amazon AWS Cloud Services'
  | 'HealthTech Solutions HIPAA'
  | 'Focus Infotech Core Internal';

export type SensitivityLabel =
  | 'Public'
  | 'Internal'
  | 'Internal Use'
  | 'Confidential'
  | 'Highly Confidential'
  | (string & {});

export type BusinessCriticality =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Mission Critical';

export type ComplianceStandard =
  | 'ISO 9001'
  | 'ISO 27001'
  | 'ISO 27001 ISMS'
  | 'SOC 2 Type II'
  | 'GDPR / Data Privacy'
  | 'HIPAA Security Rule'
  | 'Internal Audit Requirements'
  | 'IT Security Policies'
  | 'Data Retention Policies'
  | (string & {});

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  title?: string;
  avatar?: string;
  entraObjectId?: string;
  entraGroups?: EntraGroup[];
  mfaEnforced?: boolean;
}

export interface ResponsibilityItem {
  role: string;
  description: string;
}

export type StepType =
  | 'Instruction'
  | 'Approval'
  | 'Checklist'
  | 'Form'
  | 'Document Upload'
  | 'Decision'
  | 'Notification'
  | 'Assignment'
  | 'Review';

export interface DecisionBranch {
  question?: string;
  yesNextProcess: string;
  noAlternativeProcess: string;
}

export interface ProcedureStep {
  id: string;
  stepNumber: number;
  title: string;
  action: string;
  assignedRole: string;
  assignedDepartment?: string;
  stepType?: StepType;
  isRequired?: boolean;
  toolUsed?: string;
  decisionBranch?: DecisionBranch;
  safetyNote?: string;
  screenshots?: string[];
  inputsOutputs?: string;
  checklistItems?: string[];
  evidenceRequired?: boolean;
  evidenceType?: 'screenshot' | 'jira_ticket' | 'ip_address' | 'terminal_output' | 'text' | string;
  suggestedJiraPrefix?: string;
}

export interface DefinitionItem {
  term: string;
  definition: string;
}

export interface ReferenceItem {
  title: string;
  urlOrDocId: string;
}

export interface ChangeHistoryItem {
  version: string;
  date: string;
  author: string;
  summary: string;
  changeDescription?: string;
  status?: SOPStatus;
  approvedBy?: string;
  diffSummary?: {
    addedLines?: number;
    removedLines?: number;
    modifiedSections?: string[];
  };
}

export interface InlineComment {
  id: string;
  author: User;
  text: string;
  stepId?: string;
  createdAt: string;
  resolved: boolean;
  inlineQuote?: string;
}

export type ApprovalLevel = 'Reviewer' | 'Approver 1' | 'Approver 2' | 'Final Approval' | 'Tech Lead Review' | 'QA / InfoSec Sign-off' | 'Published (v1.0)';

export interface ApprovalDecision {
  id: string;
  stepName: string; // e.g. 'Draft (Author) -> Technical Lead Review', 'QA / InfoSec Sign-off'
  level?: ApprovalLevel | 1 | 2 | 3 | 4;
  user: User;
  decision: 'Approved' | 'Rejected' | 'Requested Changes';
  timestamp: string;
  comments: string;
  digitalSignatureHash?: string;
  mfaVerified?: boolean;
}

export interface SharePointExportStatus {
  siteUrl: string;
  libraryName: string;
  itemUniqueId: string;
  lastSyncedAt: string;
  publishedBy: string;
  verifyHash: string;
  status: 'Published' | 'Pending' | 'Failed';
  graphApiEndpoint?: string;
}

export interface ComplianceAnalysis {
  score: number;
  sensitivityMatch: boolean;
  issues: string[];
  suggestions: string[];
  missingSections: string[];
  regulatoryComplianceNotes: string;
  standardAlignments?: { standard: ComplianceStandard; compliant: boolean; remarks: string }[];
}

export interface DuplicateAnalysis {
  isDuplicate: boolean;
  similarityScore: number;
  matchedSopId?: string;
  matchedSopTitle?: string;
  overlapSummary: string;
  recommendation: 'Proceed' | 'Merge' | 'Reject As Duplicate';
}

export interface SecurityControls {
  mfaEnforced: boolean;
  conditionalAccessPass: boolean;
  dlpScanPassed: boolean;
  purviewSensitivityLabel: SensitivityLabel;
  downloadRestricted: boolean;
  retentionYears: number;
}

export interface ReadAcknowledgment {
  id: string;
  sopId: string;
  sopNumber: string;
  sopTitle: string;
  sopVersion: string;
  user: User;
  timestamp: string;
  department: Department;
  acknowledgedText: string; // e.g. "I confirm that I have read, understood, and agree to adhere to this SOP in accordance with Future Focus Infotech governance standards."
  signatureHash: string;
  ipAddress: string;
  mfaVerified: boolean;
  entraObjectId: string;
}

export interface ReminderScheduleItem {
  daysBefore: number; // e.g. 60, 30, 7, 0 (Day of expiry)
  label: string; // e.g. "60 Days Pre-Expiry Warning", "30 Days Immediate Review Notice", "7 Days Escalation Warning"
  targetRole: string; // "Process Owner & Department Manager"
  status: 'Scheduled' | 'Triggered' | 'Overdue';
  triggeredAt?: string;
  channel: 'Teams' | 'Email' | 'Both';
}

export interface SharePointPermissionMapping {
  status: SOPStatus;
  authorPermission: 'Read/Write' | 'Read Only';
  reviewerPermission: 'Review/Contribute' | 'Read Only' | 'No Access';
  approverPermission: 'Approve/Contribute' | 'Read Only' | 'No Access';
  organizationPermission: 'Full Organization Read' | 'Restricted Read' | 'No Access';
  purviewLabelEnforced: SensitivityLabel;
  watermarkEnforced: boolean;
}

export interface DepartmentScorecard {
  department: Department;
  name: string;
  code: string;
  headName: string;
  headEmail: string;
  totalSops: number;
  approvedSops: number;
  pendingApprovals: number;
  overdueReviews: number;
  expiringIn30Days: number;
  complianceScore: number; // e.g. 98, 95, 90, 85
  auditReadiness: 'Audit Ready' | 'Action Needed' | 'Critical Review Required';
  slaAdherence: number; // e.g. 96.5%
  lastAuditDate: string;
}

export interface AIAssistantSource {
  sopId: string;
  sopNumber: string;
  title: string;
  department: Department;
  status: SOPStatus;
  version: string;
  stepNumbers?: number[];
  relevanceScore: number;
  highlightSnippet: string;
}

export interface AIAssistantAnswer {
  query: string;
  answerMarkdown: string;
  directActionSteps: string[];
  sources: AIAssistantSource[];
  safetyWarnings: string[];
  referencedSopIds?: string[];
  relatedTroubleshootingIds?: string[];
  suggestedFollowUps: string[];
  generatedAt: string;
}

export type AIAssumptionStatus = 'pending' | 'confirmed' | 'corrected' | 'removed';

export interface AIAssumption {
  id: string;
  category?: 'Approver' | 'Responsibility' | 'System' | 'Record' | 'Timeline' | 'Escalation' | 'General';
  inferredText: string;
  fieldTarget?: string;
  status: AIAssumptionStatus;
  originalText?: string;
  userCorrection?: string;
  confirmedAt?: string;
}

export interface HumanVerificationRecord {
  verifiedProcessSteps: boolean;
  verifiedResponsibilities: boolean;
  verifiedSystemsAndTools: boolean;
  verifiedDocumentsAndRecords: boolean;
  verifiedTimelines: boolean;
  verifiedApprover: boolean;
  reviewedAiSuggestions: boolean;
  reviewedAiAssumptions: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  verifiedByRole?: string;
  verifiedByEmail?: string;
  isFullyVerified?: boolean;
  statementAccepted?: boolean;
}

export interface SOPDocument {
  id: string; // Document Numbering Standard: e.g. SEC-SOP-001, DEV-SOP-001, CLD-SOP-001
  sopNumber: string; // Standard Numbering field
  title: string;
  department: Department;
  departmentId?: string;
  departmentName?: string;
  departmentOwner?: string; // Clear department ownership
  category: string;
  sopType?: SOPType; // Standard, Policy, Guideline, Checklist, Technical Manual
  requiresComplianceReview?: boolean; // Only SOPs requiring compliance review go through Compliance
  version: string; // e.g. 1.0, 1.1, 2.0
  status: SOPStatus;
  clientScope?: ClientProjectScope | string; // Multi-tenant / Client Project Scoping
  sensitivityLabel: SensitivityLabel;
  businessCriticality: BusinessCriticality;
  complianceStandards: ComplianceStandard[];
  screenshots?: string[];
  
  // Key Role Assignment (Ownership Matrix)
  author: User;
  processOwner: User;
  reviewer?: User; // Level 1: Tech Lead / Reviewer
  approver1?: User; // Level 2: QA / InfoSec Officer
  approver2?: User; // Level 3: Department Manager / HOD
  finalApprover?: User; // Level 4: Compliance / Management
  
  // Legacy multi-user arrays for compatibility
  reviewers: User[];
  approvers: User[];
  
  // Dates & Review Cycles (6/12 months & reminders)
  effectiveDate: string;
  nextReviewDate: string;
  reviewFrequencyMonths: number; // 6, 12, etc.
  reminderSchedule?: ReminderScheduleItem[];
  reviewCycleEscalated?: boolean;
  
  // Mandatory Employee Read Confirmations (Audit)
  readAcknowledgments?: ReadAcknowledgment[];
  
  // Core Sections
  purpose: string;
  scope: string;
  scopeInScope?: string;
  scopeOutOfScope?: string;
  operatingPrinciples?: string;
  tenantReference?: string;
  conditionalAccessConfig?: string;
  dynamicGroupConfig?: string;
  registrationCampaignConfig?: string;
  escalationMatrix?: string;
  relatedPolicies?: string;
  prerequisites?: string[];
  responsibilities: ResponsibilityItem[];
  procedureSteps: ProcedureStep[];
  definitions: DefinitionItem[];
  references: ReferenceItem[];
  exceptionHandling?: string;
  changeHistory: ChangeHistoryItem[];

  // Structured Generation & Governance Fields
  trigger?: string;
  requiredDocuments?: string;
  systemsUsed?: string;
  keywords?: string[];
  tags?: string[];
  sla?: string;
  exceptions?: string;
  escalation?: string;
  records?: string;
  decisionPoints?: string[];
  isAiDraft?: boolean;
  approvalConfig?: SOPApprovalConfig;
  retirementInfo?: SOPRetirementInfo;
  historicalVersions?: HistoricalVersion[];
  aiAssumptions?: AIAssumption[];
  humanVerification?: HumanVerificationRecord;

  // Previous Version Snapshot for Visual Text Diffing
  previousVersionSnapshot?: {
    version: string;
    title?: string;
    purpose: string;
    scope: string;
    procedureSteps: ProcedureStep[];
    responsibilities?: ResponsibilityItem[];
  };
  
  // Collaboration & Approvals
  comments: InlineComment[];
  approvalHistory: ApprovalDecision[];
  
  // Integrations & Analysis
  sharePointExportStatus?: SharePointExportStatus;
  complianceAnalysis?: ComplianceAnalysis;
  duplicateAnalysis?: DuplicateAnalysis;
  securityControls?: SecurityControls;
  
  // IT Asset & Knowledge Base linkages
  isItAssetSop?: boolean;
  itAssetCategory?: 'Laptop Onboarding' | 'Device Replacement' | 'Asset Return' | 'Warranty RMA' | 'Printer Troubleshooting' | 'M365 Provisioning' | 'Intune Enrollment' | 'OneDrive Config' | 'VPN Access' | 'Offboarding' | 'Asset Transfer';
  linkedTroubleshootingGuideIds?: string[];
  linkedFaqIds?: string[];
  relatedSopIds?: string[];
  
  createdAt: string;
  updatedAt: string;
}

export interface SOPStepExecutionLog {
  stepNumber: number;
  stepTitle: string;
  actionText: string;
  completedAt: string;
  durationSeconds: number;
  evidenceType?: 'screenshot' | 'jira_ticket' | 'ip_address' | 'terminal_output' | 'text';
  evidenceValue?: string;
  evidenceNotes?: string;
  evidenceScreenshot?: string;
  verifiedBy: string;
}

export interface SOPExecutionSummary {
  executionId: string;
  clientName?: string;
  department?: Department;
  checklistCompleted: number;
  totalChecklist: number;
  assetTagOrRef?: string;
  jiraTicketNumber?: string;
  verificationEndpoint?: string;
  durationSeconds?: number;
  checklistSummary?: string[];
  stepLogs?: SOPStepExecutionLog[];
  signOffOfficer?: string;
  status: 'COMPLETED' | 'EXCEPTION' | 'IN_PROGRESS';
  executionNotes?: string;
  certificateId?: string;
}

export interface AuditLogEntry {
  id: string;
  sopId: string;
  sopNumber?: string;
  sopTitle: string;
  department?: Department;
  clientName?: string;
  user: User;
  action: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
  entraObjectId?: string;
  retentionPolicy?: string; // "Retained for 7 Years under ISO 27001 ISMS / Enterprise Organization Data Policy"
  tamperProofHash?: string;
  executionData?: SOPExecutionSummary;
}

export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  headName?: string;
  headEmail: string;
  description?: string;
  status: 'Active' | 'Disabled';
  createdAt?: string;
  updatedAt?: string;
  sharePointLibrary?: string;
  defaultReviewers?: string[];
  defaultApprovers?: string[];
  defaultApprover2?: string[];
  defaultFinalApprover?: string[];
  primaryApproverName?: string;
  primaryApproverEmail?: string;
  complianceApproverName?: string;
  complianceApproverEmail?: string;
  finalApproverName?: string;
  finalApproverEmail?: string;
}

export interface ApprovalTierConfig {
  id: string;
  tierNumber: number;
  tierKey: string;
  title: string;
  approverName: string;
  approverRole: string;
  approverEmail: string;
  isRequired: boolean;
  description?: string;
}

export interface OrganizationApprovalSettings {
  organizationName: string;
  requireDepartmentHeadApproval: boolean;
  requireComplianceReview: boolean;
  requireExecutiveSignOff: boolean;
  enforceSegregationOfDuties: boolean;
  allowDelegatedApproval: boolean;
  tiers: ApprovalTierConfig[];
}

export interface ITAssetWorkflow {
  id: string;
  title: string;
  sopId: string;
  category: 'Laptop Onboarding' | 'Device Replacement' | 'Asset Return' | 'Warranty RMA';
  slaHours: number;
  description: string;
  checklist: { id: string; step: string; required: boolean; toolUsed?: string }[];
  vendorSupportContact?: string;
}

export interface TroubleshootingGuide {
  id: string;
  title: string;
  category: string;
  relatedSopId: string;
  symptoms: string[];
  rootCause: string;
  resolutionSteps: string[];
  verifiedBy: string;
  updatedAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  department: Department;
  relatedSopId?: string;
  tags: string[];
}

export interface VendorContact {
  id: string;
  vendorName: string;
  serviceCategory: string;
  accountNumber: string;
  contactEmail: string;
  phone: string;
  supportPortalUrl: string;
  slaResponseTime: string;
  escalationManager: string;
  activeContract: string;
}

export interface NotificationEvent {
  id: string;
  recipientEmail: string;
  recipientName: string;
  channel: 'Teams' | 'Email' | 'Both';
  triggerType?:
    | 'SOP_SUBMITTED_FOR_REVIEW'
    | 'REVIEW_COMPLETED'
    | 'STAGE_APPROVAL_PENDING'
    | 'FINAL_APPROVAL_GRANTED'
    | 'REVIEW_CYCLE_REMINDER'
    | 'EXPIRY_WARNING'
    | 'APPROVAL_REQUIRED'
    | 'SOP_APPROVED'
    | 'SOP_REJECTED'
    | 'SOP_UPDATED'
    | 'TASK_ASSIGNED'
    | 'ISSUE_ASSIGNED'
    | 'ISSUE_RESOLVED'
    | 'CHANGE_REQUEST_SUBMITTED'
    | (string & {});
  rule?: string;
  sopId: string;
  sopTitle: string;
  message: string;
  timestamp: string;
  status: 'Delivered' | 'Pending' | 'Queued';
}


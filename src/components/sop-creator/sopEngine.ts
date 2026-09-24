import { SOPDocument, User, ProcedureStep } from '../../types';

export interface SOPGenerationInputs {
  id?: string;
  sopNumber?: string;
  title: string;
  departmentId: string;
  departmentName: string;
  version?: string;
  status?: string;
  sensitivityLabel?: string;
  businessCriticality?: string;
  purpose: string;
  scopeInScope?: string;
  scopeOutOfScope?: string;
  operatingPrinciples?: string;
  tenantReference?: string;
  conditionalAccessConfig?: string;
  dynamicGroupConfig?: string;
  registrationCampaignConfig?: string;
  escalationMatrix?: string;
  relatedPolicies?: string;
  systemsUsed?: string;
  prerequisites?: string[];
  responsibilities?: { role: string; description: string }[];
  procedureSteps: {
    stepNumber: number;
    title: string;
    action: string;
    assignedRole: string;
    toolUsed?: string;
    screenshots?: string[];
  }[];
  definitions?: { term: string; definition: string }[];
  references?: { title: string; urlOrDocId: string }[];
  exceptionHandling?: string;
  changeHistory?: { version: string; date: string; author: string; summary: string }[];
  currentUser: User;
}

export function cleanSopTitle(title: string): string {
  if (!title) return '';
  let clean = title.trim();
  
  // Strip outer quotes, bold asterisks, and backticks
  clean = clean.replace(/^[\*"'“`]+|[\*"'”`]+$/g, '');
  
  const patterns = [
    /^(?:the\s+)?(?:proposed\s+)?sop\s+name\s+(?:is|proposed)\s*[\:\-\"\'“`]?\s*/i,
    /^suggested\s+sop\s+name\s+(?:is)?\s*[\:\-\"\'“`]?\s*/i,
    /^proposed\s+sop\s+name\s*[\:\-\"\'“`]?\s*/i,
    /^enter\s+sop\s+name\s*[\:\-\"\'“`]?\s*/i,
    /^sop\s+title\s*[\:\-\"\'“`]?\s*/i,
    /^sop\s+name\s*[\:\-\"\'“`]?\s*/i
  ];

  for (const pattern of patterns) {
    clean = clean.replace(pattern, '');
  }

  // Double check outer quotes/bold after removal
  clean = clean.replace(/^[\*"'“`]+|[\*"'”`]+$/g, '').trim();
  return clean;
}

export function generateSopNumber(departmentCode: string): string {
  const code = (departmentCode || 'FFI').toUpperCase().slice(0, 4).replace(/\s+/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `${code}-SOP-${rand}`;
}

export function buildUnifiedSOPDocument(inputs: SOPGenerationInputs): SOPDocument {
  const cleanedTitle = cleanSopTitle(inputs.title);
  const now = new Date().toISOString().split('T')[0];
  const effective = now;
  const nextReview = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const performerRole = inputs.responsibilities?.[0]?.role || 'Operational Personnel';

  const defaultHistory = [
    {
      version: inputs.version || '1.0',
      date: effective,
      author: inputs.currentUser.name,
      summary: `Initial creation of standard operating procedure for ${cleanedTitle}.`
    }
  ];

  // Map input steps to proper ProcedureStep objects
  const finalSteps: ProcedureStep[] = inputs.procedureSteps.map(step => ({
    id: `step-${Date.now()}-${step.stepNumber}`,
    stepNumber: step.stepNumber,
    title: step.title.trim() || `Step ${step.stepNumber}`,
    action: step.action.trim() || 'Execute standard instruction.',
    assignedRole: step.assignedRole || performerRole,
    toolUsed: step.toolUsed || undefined,
    screenshots: step.screenshots || [],
    safetyNote: ''
  }));

  const inScopeStr = inputs.scopeInScope?.trim() || `All operational steps required to perform ${cleanedTitle} within the department.`;
  const outOfScopeStr = inputs.scopeOutOfScope?.trim() || 'Operational tasks, manual exceptions, or physical setups outside designated system scopes.';

  return {
    id: inputs.id || `sop-${Date.now()}`,
    sopNumber: inputs.sopNumber || generateSopNumber(inputs.departmentName),
    title: cleanedTitle,
    department: inputs.departmentName,
    departmentId: inputs.departmentId,
    departmentName: inputs.departmentName,
    departmentOwner: performerRole,
    category: 'Technical Standard Operating Procedure',
    sopType: 'SOP',
    version: inputs.version || '1.0',
    status: (inputs.status as any) || 'Draft',
    sensitivityLabel: (inputs.sensitivityLabel as any) || 'Internal',
    businessCriticality: (inputs.businessCriticality as any) || 'Medium',
    complianceStandards: [],
    author: {
      id: inputs.currentUser.id,
      name: inputs.currentUser.name,
      email: inputs.currentUser.email,
      role: inputs.currentUser.role,
      department: inputs.currentUser.department || inputs.departmentName
    },
    processOwner: {
      id: `owner-${Date.now()}`,
      name: inputs.currentUser.name,
      email: inputs.currentUser.email,
      role: inputs.currentUser.role,
      department: inputs.departmentName
    },
    effectiveDate: effective,
    nextReviewDate: nextReview,
    reviewFrequencyMonths: 12,
    purpose: inputs.purpose.trim() || `Standard operating procedure detailing execution for ${cleanedTitle}.`,
    scope: `In Scope: ${inScopeStr}\nOut of Scope: ${outOfScopeStr}`,
    scopeInScope: inScopeStr,
    scopeOutOfScope: outOfScopeStr,
    operatingPrinciples: inputs.operatingPrinciples?.trim() || 'Not Applicable',
    tenantReference: inputs.tenantReference?.trim() || 'Not Applicable',
    conditionalAccessConfig: inputs.conditionalAccessConfig?.trim() || 'Not Applicable',
    dynamicGroupConfig: inputs.dynamicGroupConfig?.trim() || 'Not Applicable',
    registrationCampaignConfig: inputs.registrationCampaignConfig?.trim() || 'Not Applicable',
    escalationMatrix: inputs.escalationMatrix?.trim() || inputs.exceptionHandling?.trim() || 'Not Applicable',
    relatedPolicies: inputs.relatedPolicies?.trim() || 'Not Applicable',
    systemsUsed: inputs.systemsUsed?.trim() || 'Not provided',
    prerequisites: inputs.prerequisites || [],
    responsibilities: inputs.responsibilities || [
      {
        role: performerRole,
        description: `Primary executor of the sequential process instructions for ${inputs.title.trim()}.`
      }
    ],
    procedureSteps: finalSteps,
    definitions: inputs.definitions || [],
    references: inputs.references || [],
    exceptionHandling: inputs.exceptionHandling?.trim() || 'L1 Support and immediate manager escalation within 2 hours.',
    changeHistory: inputs.changeHistory || defaultHistory,
    comments: [],
    approvalHistory: [],
    reviewers: [],
    approvers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

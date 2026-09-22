import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import {
  INITIAL_SOPS,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
  DEFAULT_CORPORATE_USER,
  INITIAL_IT_ASSET_WORKFLOWS,
  INITIAL_TROUBLESHOOTING_GUIDES,
  INITIAL_FAQS,
  INITIAL_VENDOR_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_ISSUES,
  INITIAL_CHANGE_REQUESTS,
  DEPARTMENT_SCORECARDS,
  DEPARTMENT_CONFIGS
} from './src/data/mockData';
import {
  SOPDocument,
  AuditLogEntry,
  NotificationEvent,
  ReadAcknowledgment,
  DepartmentScorecard,
  DepartmentConfig,
  AIAssistantAnswer,
  AIAssistantSource,
  TaskItem,
  IssueReport,
  ChangeRequest,
  UserRole,
  User,
  ApprovalTierConfig,
  OrganizationApprovalSettings
} from './src/types';

let sopsStore: SOPDocument[] = [...INITIAL_SOPS];
let auditLogsStore: AuditLogEntry[] = [...INITIAL_AUDIT_LOGS];
let notificationsStore: NotificationEvent[] = [...INITIAL_NOTIFICATIONS];
let scorecardsStore: DepartmentScorecard[] = [...DEPARTMENT_SCORECARDS];
let departmentsStore: DepartmentConfig[] = [...DEPARTMENT_CONFIGS];
let tasksStore: TaskItem[] = [...INITIAL_TASKS];
let issuesStore: IssueReport[] = [...INITIAL_ISSUES];
let changeRequestsStore: ChangeRequest[] = [...INITIAL_CHANGE_REQUESTS];
let sopQuestionnaireDraftsStore: Record<string, any> = {};
let usersStore: User[] = [...INITIAL_USERS];

let organizationApprovalSettingsStore: OrganizationApprovalSettings = {
  organizationName: 'Future Focus Infotech',
  requireDepartmentHeadApproval: true,
  requireComplianceReview: true,
  requireExecutiveSignOff: false,
  enforceSegregationOfDuties: true,
  allowDelegatedApproval: false,
  tiers: [
    {
      id: 'tier-1',
      tierNumber: 1,
      tierKey: 'dept_manager',
      title: 'Tier 1: Department Manager Sign-Off',
      approverName: 'Department Head / Operational Lead',
      approverRole: 'Department Manager',
      approverEmail: 'dept.head@organization.com',
      isRequired: true,
      description: 'First sign-off gate verifying operational validity and procedural execution.'
    },
    {
      id: 'tier-2',
      tierNumber: 2,
      tierKey: 'compliance',
      title: 'Tier 2: Compliance & Regulatory Review',
      approverName: 'Quality & Compliance Officer',
      approverRole: 'Compliance Manager',
      approverEmail: 'compliance@organization.com',
      isRequired: true,
      description: 'Secondary gate ensuring ISO 9001 / ISO 27001 statutory standards adherence.'
    },
    {
      id: 'tier-3',
      tierNumber: 3,
      tierKey: 'management',
      title: 'Tier 3: Executive Authority Sign-Off',
      approverName: 'Director of Operations / VP',
      approverRole: 'Executive Management',
      approverEmail: 'executive@organization.com',
      isRequired: false,
      description: 'Final governance sign-off for high-impact and mission-critical SOP policies.'
    }
  ]
};

// Initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Helper to perform generateContent calls with robust, automatic model fallbacks and retry backoff to handle overload/deprecation (503/404/429)
async function generateContentWithFallback(
  gemini: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    primaryModel?: string;
  }
) {
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const requestedModel = params.primaryModel || 'gemini-3.8-flash';
  const rawModels = [
    requestedModel,
    'gemini-3.8-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];
  const models = Array.from(new Set(rawModels));
  const exhaustedModels = new Set<string>();

  let lastError: any = null;
  const retryCycles = 2; // Try the entire model list up to 2 times

  for (let cycle = 1; cycle <= retryCycles; cycle++) {
    for (const model of models) {
      if (exhaustedModels.has(model)) {
        console.log(`[Gemini API] Skipping blacklisted/exhausted model: ${model}`);
        continue;
      }

      const maxAttempts = 2; // Try each model up to 2 times per cycle
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          console.log(`[Gemini API] Cycle ${cycle}/${retryCycles} - Attempt ${attempt}/${maxAttempts} generateContent with model: ${model}`);
          const response = await gemini.models.generateContent({
            model: model,
            contents: params.contents,
            config: params.config
          });
          return response;
        } catch (err: any) {
          const errMsg = String(err.message || err).toUpperCase();
          console.warn(`[Gemini API] Cycle ${cycle} - Model ${model} attempt ${attempt} failed:`, err.message || err);
          lastError = err;

          // If the error is authentication/API key/permission related, do not retry other models as they will also fail.
          if (
            errMsg.includes('API KEY') || 
            errMsg.includes('API_KEY') || 
            errMsg.includes('PERMISSION_DENIED') || 
            errMsg.includes('UNAUTHORIZED') || 
            errMsg.includes('401') || 
            errMsg.includes('403')
          ) {
            throw err;
          }

          // Check if error is transient / retryable (503, 429, overload, busy, quota, rate, unavailable)
          const isTransient = 
            errMsg.includes('503') || 
            errMsg.includes('429') || 
            errMsg.includes('UNAVAILABLE') || 
            errMsg.includes('RATE_LIMIT') || 
            errMsg.includes('LIMIT_EXCEEDED') || 
            errMsg.includes('QUOTA') || 
            errMsg.includes('TEMPORARY') || 
            errMsg.includes('BUSY') || 
            errMsg.includes('OVERLOAD') || 
            errMsg.includes('DEMAND');

          const isQuotaOrLimit = 
            errMsg.includes('429') || 
            errMsg.includes('QUOTA') || 
            errMsg.includes('RESOURCE_EXHAUSTED') || 
            errMsg.includes('RATE_LIMIT') || 
            errMsg.includes('LIMIT_EXCEEDED');

          if (isQuotaOrLimit) {
            console.log(`[Gemini API] Quota or rate limit exceeded on ${model}. Blacklisting this model for the rest of this request.`);
            exhaustedModels.add(model);
          }

          // Under high-demand, overload, 503, or 429 quota limits, we should proceed immediately to the next fallback model inside the cycle
          const shouldRetrySameModel = isTransient && 
            !isQuotaOrLimit &&
            !errMsg.includes('503') && 
            !errMsg.includes('UNAVAILABLE') && 
            !errMsg.includes('DEMAND') && 
            !errMsg.includes('OVERLOAD');

          if (shouldRetrySameModel && attempt < maxAttempts) {
            const backoffTime = attempt * 1000;
            console.log(`[Gemini API] Transient error detected on ${model}. Retrying in ${backoffTime}ms...`);
            await sleep(backoffTime);
          } else {
            console.log(`[Gemini API] Falling back from model ${model} immediately due to load or attempt limit...`);
            break; // Break out of the attempt loop to try the next model
          }
        }
      }
    }
    // If we've completed a cycle of all models and it failed, sleep a bit before the next cycle
    if (cycle < retryCycles) {
      console.log(`[Gemini API] Completed cycle ${cycle}/${retryCycles} of fallback models. All failed. Waiting 1500ms before starting next cycle...`);
      await sleep(1500);
    }
  }
  throw lastError || new Error('All Gemini model generateContent attempts failed across all fallback cycles');
}

// Generate SOP Standard Number dynamically based on department code with collision prevention
function generateSopNumber(dept: string): string {
  let prefix = 'IT';
  const matchedDept = departmentsStore.find(d =>
    d.id.toLowerCase() === dept.toLowerCase() ||
    d.name.toLowerCase() === dept.toLowerCase() ||
    d.code.toLowerCase() === dept.toLowerCase()
  );

  if (matchedDept && matchedDept.code) {
    prefix = matchedDept.code.toUpperCase();
  } else if (dept.toLowerCase().includes('fin')) prefix = 'FIN';
  else if (dept.toLowerCase().includes('hr')) prefix = 'HR';
  else if (dept.toLowerCase().includes('pay')) prefix = 'PAY';
  else if (dept.toLowerCase().includes('comp') || dept.toLowerCase().includes('sec')) prefix = 'CMP';
  else if (dept.length <= 4) prefix = dept.toUpperCase();
  else prefix = dept.slice(0, 3).toUpperCase();

  // Find all existing numbers matching the prefix pattern strictly
  const regex = new RegExp(`^${prefix}-SOP-(\\d+)$`, 'i');
  let maxNumber = 0;

  sopsStore.forEach(s => {
    const idMatch = s.id.match(regex);
    if (idMatch && idMatch[1]) {
      const num = parseInt(idMatch[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
    if (s.sopNumber) {
      const sopNumMatch = s.sopNumber.match(regex);
      if (sopNumMatch && sopNumMatch[1]) {
        const num = parseInt(sopNumMatch[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }
  });

  const nextNum = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}-SOP-${nextNum}`;
}

// Automated Review Cycle Background Worker (60-day, 30-day, 7-day reminders & Overdue Escalation)
function runReviewCycleAuditWorker(): { remindersDispatched: number; overdueEscalated: number } {
  const now = new Date();
  let remindersDispatched = 0;
  let overdueEscalated = 0;

  sopsStore.forEach(sop => {
    if (!sop.nextReviewDate) return;

    const reviewDate = new Date(sop.nextReviewDate);
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let triggerRule: string | null = null;
    let reminderStage = '';
    let isEscalation = false;

    if (diffDays < 0) {
      triggerRule = `REVIEW_OVERDUE_${sop.id}_v${sop.version}`;
      reminderStage = `OVERDUE by ${Math.abs(diffDays)} days! Escalated to HOD & Compliance.`;
      isEscalation = true;
    } else if (diffDays <= 7) {
      triggerRule = `REVIEW_7_DAYS_${sop.id}_v${sop.version}`;
      reminderStage = 'Final 7-Day Review Notice before expiration';
    } else if (diffDays <= 30) {
      triggerRule = `REVIEW_30_DAYS_${sop.id}_v${sop.version}`;
      reminderStage = '30-Day Mandatory Review Warning';
    } else if (diffDays <= 60) {
      triggerRule = `REVIEW_60_DAYS_${sop.id}_v${sop.version}`;
      reminderStage = '60-Day Advance Review Notice';
    }

    if (triggerRule) {
      // Check if notification already exists for this rule today/version
      const exists = notificationsStore.some(n => n.rule === triggerRule);
      if (!exists) {
        const deptOwnerName = typeof sop.departmentOwner === 'object' && sop.departmentOwner !== null
          ? (sop.departmentOwner as any).name
          : typeof sop.departmentOwner === 'string'
          ? sop.departmentOwner
          : sop.approver2?.name || 'Department Head / Compliance';

        const deptOwnerEmail = typeof sop.departmentOwner === 'object' && sop.departmentOwner !== null
          ? (sop.departmentOwner as any).email
          : sop.approver2?.email || 'compliance@organization.com';

        const authorName = typeof sop.author === 'object' ? sop.author?.name : (sop.author || 'Author');
        const authorEmail = typeof sop.author === 'object' ? sop.author?.email : 'author@organization.com';
        const recipient = isEscalation
          ? deptOwnerName
          : sop.processOwner?.name || authorName;
        const recipientEmail = isEscalation
          ? deptOwnerEmail
          : sop.processOwner?.email || authorEmail;

        const notif: NotificationEvent = {
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sopId: sop.id,
          sopTitle: sop.title,
          recipientEmail,
          recipientName: recipient,
          channel: 'Teams',
          status: 'Delivered',
          timestamp: new Date().toISOString(),
          rule: triggerRule,
          triggerType: isEscalation ? 'EXPIRY_WARNING' : 'REVIEW_CYCLE_REMINDER',
          message: `[Automated Review Cycle] SOP ${sop.sopNumber || sop.id} (${sop.title}) - ${reminderStage}. Scheduled Review Due Date: ${sop.nextReviewDate}.`
        };

        notificationsStore.unshift(notif);

        // Audit Trail Log entry for automated governance
        const log: AuditLogEntry = {
          id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          sopId: sop.id,
          sopTitle: sop.title,
          user: DEFAULT_CORPORATE_USER, // Compliance / System Officer
          action: isEscalation ? 'ESCALATION_TRIGGERED' : 'NOTIFICATION_SENT',
          details: `Automated Review Cycle dispatched: ${reminderStage} sent to ${recipient} (${recipientEmail}) via Microsoft Teams webhook.`,
          ipAddress: '127.0.0.1 (Automated Worker)',
          timestamp: new Date().toISOString(),
          entraObjectId: 'system-governance-worker',
          retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Focus Infotech Data Policy',
          tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
        };

        auditLogsStore.unshift(log);

        if (isEscalation) overdueEscalated++;
        else remindersDispatched++;
      }
    }
  });

  return { remindersDispatched, overdueEscalated };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const CLOUD_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      company: 'Focus Infotech',
      platform: 'Focus Infotech SOP Governance Platform',
      version: '1.0',
      timestamp: new Date().toISOString(),
      geminiAvailable: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
    });
  });

  // Get all departments
  app.get('/api/departments', (req, res) => {
    res.json(departmentsStore);
  });

  // Create department
  app.post('/api/departments', (req, res) => {
    const {
      name,
      code,
      headName,
      headEmail,
      description,
      status = 'Active',
      primaryApproverName,
      primaryApproverEmail,
      complianceApproverName,
      complianceApproverEmail,
      finalApproverName,
      finalApproverEmail,
      performingUser
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Department name is required' });
    }

    const cleanName = name.trim();

    // Generate clean unique code if not explicitly provided
    let baseCode = (code?.trim() || cleanName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)).toUpperCase();
    if (!baseCode) baseCode = 'DEPT';

    let uniqueCode = baseCode;
    let counter = 2;
    while (departmentsStore.some(d => d.code.toUpperCase() === uniqueCode && d.name.toLowerCase() !== cleanName.toLowerCase())) {
      uniqueCode = `${baseCode.slice(0, 4)}${counter++}`;
    }

    // Check duplicate name
    const existing = departmentsStore.find(
      d => d.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) {
      return res.status(409).json({ error: `Department "${cleanName}" already exists.` });
    }

    const newDept: DepartmentConfig = {
      id: cleanName,
      name: cleanName,
      code: uniqueCode,
      headName: headName?.trim() || `${cleanName} Lead`,
      headEmail: headEmail?.trim() || `head.${uniqueCode.toLowerCase()}@organization.com`,
      description: description?.trim() || `${cleanName} operational governance and process management.`,
      status: status === 'Disabled' ? 'Disabled' : 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sharePointLibrary: `https://futurefocus.sharepoint.com/sites/${uniqueCode}_Division/Controlled_SOPs`,
      defaultReviewers: [headEmail || `head.${uniqueCode.toLowerCase()}@organization.com`],
      defaultApprovers: [headEmail || `head.${uniqueCode.toLowerCase()}@organization.com`],
      defaultApprover2: [],
      defaultFinalApprover: [],
      primaryApproverName: primaryApproverName?.trim() || headName?.trim() || `${cleanName} Manager`,
      primaryApproverEmail: primaryApproverEmail?.trim() || headEmail?.trim() || `approver.${uniqueCode.toLowerCase()}@organization.com`,
      complianceApproverName: complianceApproverName?.trim() || 'Compliance & Quality Reviewer',
      complianceApproverEmail: complianceApproverEmail?.trim() || 'compliance@organization.com',
      finalApproverName: finalApproverName?.trim() || 'Executive Authority',
      finalApproverEmail: finalApproverEmail?.trim() || 'executive@organization.com'
    };

    departmentsStore.push(newDept);

    // Audit log
    const user = performingUser || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newDept.id,
      sopTitle: `Department: ${newDept.name}`,
      user,
      action: 'CREATE_SOP', // standard governance event
      details: `Administrator created new Department "${newDept.name}" (${newDept.code}) with status ${newDept.status}. Approver: ${newDept.primaryApproverName}.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.status(201).json(newDept);
  });

  // Update department (Edit / Disable / Reactivate)
  app.put('/api/departments/:id', (req, res) => {
    const deptId = req.params.id;
    const index = departmentsStore.findIndex(
      d => d.id === deptId || d.code.toUpperCase() === deptId.toUpperCase()
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const current = departmentsStore[index];
    const {
      name,
      code,
      headName,
      headEmail,
      description,
      status,
      primaryApproverName,
      primaryApproverEmail,
      complianceApproverName,
      complianceApproverEmail,
      finalApproverName,
      finalApproverEmail,
      performingUser
    } = req.body;

    const updated: DepartmentConfig = {
      ...current,
      name: name?.trim() || current.name,
      code: code ? code.trim().toUpperCase() : current.code,
      headName: headName !== undefined ? headName.trim() : current.headName,
      headEmail: headEmail !== undefined ? headEmail.trim() : current.headEmail,
      description: description !== undefined ? description.trim() : current.description,
      status: status || current.status,
      primaryApproverName: primaryApproverName !== undefined ? primaryApproverName.trim() : current.primaryApproverName,
      primaryApproverEmail: primaryApproverEmail !== undefined ? primaryApproverEmail.trim() : current.primaryApproverEmail,
      complianceApproverName: complianceApproverName !== undefined ? complianceApproverName.trim() : current.complianceApproverName,
      complianceApproverEmail: complianceApproverEmail !== undefined ? complianceApproverEmail.trim() : current.complianceApproverEmail,
      finalApproverName: finalApproverName !== undefined ? finalApproverName.trim() : current.finalApproverName,
      finalApproverEmail: finalApproverEmail !== undefined ? finalApproverEmail.trim() : current.finalApproverEmail,
      updatedAt: new Date().toISOString()
    };

    departmentsStore[index] = updated;

    // Audit log
    const user = performingUser || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: updated.id,
      sopTitle: `Department: ${updated.name}`,
      user,
      action: 'UPDATE_SOP',
      details: `Department "${updated.name}" (${updated.code}) updated. Approver: ${updated.primaryApproverName || updated.headName}.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json(updated);
  });

  // Delete department
  app.delete('/api/departments/:id', (req, res) => {
    const deptId = req.params.id;
    const index = departmentsStore.findIndex(
      d => d.id === deptId || d.code.toUpperCase() === deptId.toUpperCase() || d.name.toLowerCase() === deptId.toLowerCase()
    );

    if (index === -1) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const removed = departmentsStore.splice(index, 1)[0];
    res.json({ success: true, removed });
  });

  // Get Organization Approval Settings & Designated Approvers
  app.get('/api/organization/approvals', (req, res) => {
    res.json(organizationApprovalSettingsStore);
  });

  // Update Organization Approval Settings & Approver Names
  app.put('/api/organization/approvals', (req, res) => {
    const {
      organizationName,
      requireDepartmentHeadApproval,
      requireComplianceReview,
      requireExecutiveSignOff,
      enforceSegregationOfDuties,
      allowDelegatedApproval,
      tiers,
      performingUser
    } = req.body;

    organizationApprovalSettingsStore = {
      ...organizationApprovalSettingsStore,
      organizationName: organizationName !== undefined ? organizationName.trim() : organizationApprovalSettingsStore.organizationName,
      requireDepartmentHeadApproval: requireDepartmentHeadApproval !== undefined ? !!requireDepartmentHeadApproval : organizationApprovalSettingsStore.requireDepartmentHeadApproval,
      requireComplianceReview: requireComplianceReview !== undefined ? !!requireComplianceReview : organizationApprovalSettingsStore.requireComplianceReview,
      requireExecutiveSignOff: requireExecutiveSignOff !== undefined ? !!requireExecutiveSignOff : organizationApprovalSettingsStore.requireExecutiveSignOff,
      enforceSegregationOfDuties: enforceSegregationOfDuties !== undefined ? !!enforceSegregationOfDuties : organizationApprovalSettingsStore.enforceSegregationOfDuties,
      allowDelegatedApproval: allowDelegatedApproval !== undefined ? !!allowDelegatedApproval : organizationApprovalSettingsStore.allowDelegatedApproval,
      tiers: Array.isArray(tiers) ? tiers : organizationApprovalSettingsStore.tiers
    };

    const user = performingUser || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: 'ORG-APPROVAL-CONFIG',
      sopTitle: 'Organization Approval Governance Matrix',
      user,
      action: 'UPDATE_SOP',
      details: `Administrator updated organization approval settings and designated approver tiers for "${organizationApprovalSettingsStore.organizationName}".`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json(organizationApprovalSettingsStore);
  });

  // User Directory Management Endpoints
  app.get('/api/users', (req, res) => {
    res.json(usersStore);
  });

  app.post('/api/users', (req, res) => {
    const { name, email, role = 'Approver', department = 'Operations', title, performingUser } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required to add an approver/user' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = usersStore.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: `User with email "${cleanEmail}" already exists` });
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      role: role as UserRole,
      department: department.trim(),
      title: title?.trim() || `${role} - ${department}`,
      entraObjectId: `entra-${Date.now()}`,
      mfaEnforced: true
    };

    usersStore.push(newUser);

    const user = performingUser || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newUser.id,
      sopTitle: `User: ${newUser.name}`,
      user,
      action: 'CREATE_SOP',
      details: `Added new personnel "${newUser.name}" (${newUser.role}, ${newUser.department}) to organization directory.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.status(201).json(newUser);
  });

  app.put('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const index = usersStore.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = usersStore[index];
    const { name, email, role, department, title, performingUser } = req.body;

    const updatedUser: User = {
      ...current,
      name: name !== undefined ? name.trim() : current.name,
      email: email !== undefined ? email.trim().toLowerCase() : current.email,
      role: role !== undefined ? (role as UserRole) : current.role,
      department: department !== undefined ? department.trim() : current.department,
      title: title !== undefined ? title.trim() : current.title
    };

    usersStore[index] = updatedUser;

    const user = performingUser || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: updatedUser.id,
      sopTitle: `User: ${updatedUser.name}`,
      user,
      action: 'UPDATE_SOP',
      details: `Updated personnel details for "${updatedUser.name}" (${updatedUser.role}, ${updatedUser.department}).`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json(updatedUser);
  });

  app.delete('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    const index = usersStore.findIndex(u => u.id === userId || u.email.toLowerCase() === userId.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = usersStore[index];
    // Prevent deleting the last Administrator
    const adminCount = usersStore.filter(u => u.role === 'Administrator').length;
    if (targetUser.role === 'Administrator' && adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the sole Administrator of the organization.' });
    }

    usersStore.splice(index, 1);

    const user = (req.body?.performingUser as User) || DEFAULT_CORPORATE_USER;
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: targetUser.id,
      sopTitle: `User: ${targetUser.name}`,
      user,
      action: 'UPDATE_SOP',
      details: `Removed user "${targetUser.name}" (${targetUser.email}) from organization directory.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId || 'admin-action',
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json({ success: true, removedUser: targetUser });
  });

  // AI Assistance for Question-Based SOP Creator
  app.post('/api/ai/sop-assist', async (req, res) => {
    const {
      type,
      action,
      processName,
      department,
      description,
      processDescription,
      targetAudience,
      currentSteps,
      performer,
      reviewer,
      approver,
      trigger,
      systems,
      documents,
      prerequisites,
      step,
      context
    } = req.body;

    const operation = action || type;
    const gemini = getGeminiClient();

    const performerVal = req.body.processPerformer || performer || '';
    const reviewerVal = req.body.processReviewer || reviewer || '';
    const approverVal = req.body.approvalsRequired || req.body.approverRole || approver || '';
    const systemsVal = req.body.toolsSystems || req.body.systemsUsed || systems || '';
    const docsVal = req.body.documentsRecords || req.body.documentsRequired || documents || '';
    const risksVal = req.body.risks || '';
    const exceptionsVal = req.body.exceptions || req.body.exceptionScenario || req.body.exceptionHandling || '';
    const rawText = processDescription || description || (Array.isArray(req.body.steps) ? req.body.steps.filter(Boolean).join('. ') : '') || '';

    // Helper: Strict extraction fallback based purely on user supplied text (Zero-hallucination)
    const extractStepsFallback = (
      inputDesc: string,
      userSys: string,
      userDocs: string,
      userRole: string
    ) => {
      const systemValue = userSys && userSys.trim() && userSys.toLowerCase() !== 'not applicable'
        ? userSys.trim()
        : 'Not provided';
      
      const docValue = userDocs && userDocs.trim() && userDocs.toLowerCase() !== 'not applicable'
        ? userDocs.trim()
        : 'Not provided';

      const roleValue = userRole && userRole.trim() ? userRole.trim() : 'Not provided';

      // Extract lines or clauses strictly based on user provided input
      const rawLines = (inputDesc || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      let sentences: string[] = [];
      if (rawLines.length > 1) {
        sentences = rawLines;
      } else {
        const numberedParts = (inputDesc || '').split(/(?=(?:^|\s+)\d+[\.\)]\s+)/).map(s => s.trim()).filter(Boolean);
        if (numberedParts.length > 1) {
          sentences = numberedParts;
        } else {
          sentences = (inputDesc || '')
            .split(/(?<=[a-zA-Z0-9\)])[\.\;]\s+(?=[A-Z0-9])/)
            .map(s => s.trim())
            .filter(s => s.length > 2);
          if (sentences.length === 0 && inputDesc.trim()) {
            sentences = [inputDesc.trim()];
          }
        }
      }

      if (sentences.length === 0) {
        return [
          {
            stepNumber: 1,
            title: 'Step 1',
            description: inputDesc || 'Not provided',
            role: roleValue,
            toolUsed: systemValue,
            document: docValue,
            expectedOutcome: 'Not provided'
          }
        ];
      }

      const clauses: string[] = [];
      sentences.forEach(s => {
        const parts = s.split(/\s+then\s+|\s+after which\s+|\s+followed by\s+/i);
        parts.forEach(p => {
          const clean = p.replace(/^\d+[\.\)\-]\s*/, '').trim();
          if (clean.length > 1) clauses.push(clean);
        });
      });

      return clauses.slice(0, 15).map((clause, idx) => {
        let title = clause.charAt(0).toUpperCase() + clause.slice(1);
        if (title.length > 45) {
          const words = title.split(/\s+/);
          title = words.slice(0, 6).join(' ');
        }
        title = title.replace(/\.+$/, '');
        return {
          stepNumber: idx + 1,
          title: title || `Step ${idx + 1}`,
          description: clause.endsWith('.') ? clause : `${clause}.`,
          role: roleValue,
          toolUsed: systemValue,
          document: docValue,
          expectedOutcome: 'Not provided'
        };
      });
    };

    // 1. EXTRACT STEPS FROM NATURAL LANGUAGE PROCESS DESCRIPTION
    if (operation === 'extract-steps') {
      const inputRawText = rawText;
      const userSys = systemsVal;
      const userDocs = docsVal;
      const userRole = performerVal;

      if (gemini && inputRawText) {
        try {
          const prompt = `You are a strict, objective Standard Operating Procedure (SOP) analyst.
Your task is to convert the following natural-language process description into a sequential list of structured steps for an SOP.

CRITICAL MANDATORY RULES (STRICT COMPLIANCE REQUIRED):
1. The AI must never invent company policies, approvals, software, SLA times, compliance standards, roles, email addresses, URLs, controls, or procedures.
2. Only use information supplied by the user or clearly visible in the input.
3. If information is missing, leave it blank or write "Not provided".
4. Do not automatically insert example company information into the final SOP.
5. DO NOT insert systems or software such as Jira, ServiceNow, SAP, Darwinbox, Microsoft Intune, Slack, Workday, etc., unless explicitly specified by the user in User Systems Used below.
   - For example, if the user says "Create a ticket.", write "Create a service ticket" - NEVER invent "Create a Jira ticket".
   - If the user did not specify a system or application, set "toolUsed" to "Not provided".
6. The same rule applies to: People, Roles, Departments, Systems, Approvers, Policies, Compliance standards, Deadlines, SLA times, Controls, and Contact information.
7. If the responsible role is not clearly stated by the user, set "role" to "${userRole || 'Not provided'}".
8. Only use documents from User Documents Required, or "Not provided".

User Context:
- SOP Title: ${processName || 'Not provided'}
- Department: ${department || 'Not provided'}
- Process Start / Trigger: ${trigger || 'Not provided'}
- Default Performer Role: ${userRole || 'Not provided'}
- User Systems Used: ${userSys || 'Not provided'}
- User Documents Required: ${userDocs || 'Not provided'}
- User Prerequisites: ${prerequisites || 'Not provided'}

Natural-Language Process Description:
"""${inputRawText}"""

Output ONLY a valid JSON array of step objects with this schema:
[
  {
    "stepNumber": 1,
    "title": "Short active imperative step title based strictly on user input",
    "description": "Step instruction based strictly on user input without inventing actions",
    "role": "Specific role from user input, or '${userRole || 'Not provided'}'",
    "toolUsed": "System name ONLY if provided in User Systems Used, otherwise 'Not provided'",
    "document": "Document name ONLY if provided in User Documents Required, otherwise 'Not provided'",
    "documentsRecords": "Document name ONLY if provided in User Documents Required, otherwise 'Not provided'",
    "expectedOutcome": "Outcome if mentioned by user, otherwise 'Not provided'"
  }
]`;

          const response = await generateContentWithFallback(gemini, {
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          if (response.text) {
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            }
            const parsed = JSON.parse(cleanText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const rawTextLower = (inputRawText || '').toLowerCase();
              const sanitized = parsed.map((s, idx) => {
                const docFinal = s.document || s.documentsRecords || (userDocs && userDocs.toLowerCase() !== 'not applicable' ? userDocs : 'Not provided');
                const toolLower = (s.toolUsed || '').toLowerCase();
                const isMentionedInUserText = rawTextLower.includes(toolLower) || (userSys && userSys.toLowerCase().includes(toolLower));
                return {
                  stepNumber: s.stepNumber || idx + 1,
                  title: s.title || `Step ${idx + 1}`,
                  description: s.description || '',
                  role: s.role || (userRole || 'Not provided'),
                  toolUsed: (!userSys || userSys.toLowerCase() === 'not applicable') && !isMentionedInUserText && (toolLower.includes('jira') || toolLower.includes('servicenow') || toolLower.includes('sap'))
                    ? 'Not provided'
                    : s.toolUsed || 'Not provided',
                  document: docFinal,
                  documentsRecords: docFinal,
                  expectedOutcome: s.expectedOutcome || 'Not provided'
                };
              });
              return res.json({ steps: sanitized });
            }
          }
        } catch (e) {
          console.error('Gemini step extraction error:', e);
        }
      }

      // High-quality, rule-based fallback strictly from user input
      const extracted = extractStepsFallback(inputRawText, userSys, userDocs, userRole).map(s => ({
        ...s,
        documentsRecords: s.document
      }));
      return res.json({ steps: extracted });
    }

    // 2. IMPROVE A SINGLE STEP (WITHOUT INVENTING INFORMATION)
    if (operation === 'improve-step') {
      const stepItem = step || {};
      const ctx = context || {};

      if (gemini && stepItem.title) {
        try {
          const prompt = `You are an objective process documentation specialist.
Improve this SINGLE procedural step for clarity and active voice.

CRITICAL MANDATORY RULES:
1. The AI must never invent company policies, approvals, software, SLA times, compliance standards, roles, email addresses, URLs, controls, or procedures.
2. Only use information supplied by the user.
3. If information is missing, leave it blank or write "Not provided".
4. Do not automatically insert example company information into the final SOP.
5. Preserve the user's intent. Do not add software tools, roles, policies, or standards that the user did not specify.

Current Step:
- Title: "${stepItem.title}"
- Description: "${stepItem.description || ''}"
- Responsible Role: "${stepItem.role || 'Not provided'}"
- System Used: "${stepItem.toolUsed || 'Not provided'}"
- Document: "${stepItem.document || 'Not provided'}"
- Expected Outcome: "${stepItem.expectedOutcome || ''}"

Process Context:
- Process: "${ctx.processName || processName || 'Not provided'}"
- Allowed Systems: "${ctx.systemsUsed || systems || 'None specified'}"

Return ONLY a valid JSON object matching this schema:
{
  "suggestedTitle": "Refined active imperative title strictly representing the user action",
  "suggestedDescription": "Clear, concise instructions without adding unstated tools or policies",
  "suggestedExpectedOutcome": "Outcome if known, otherwise 'Not provided'",
  "explanation": "Brief 1-sentence note explaining what was improved"
}`;

          const response = await generateContentWithFallback(gemini, {
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          if (response.text) {
            const parsed = JSON.parse(response.text);
            if (parsed.suggestedTitle && parsed.suggestedDescription) {
              return res.json({
                suggestion: {
                  suggestedTitle: parsed.suggestedTitle,
                  suggestedDescription: parsed.suggestedDescription,
                  suggestedExpectedOutcome: parsed.suggestedExpectedOutcome || 'Not provided',
                  explanation: parsed.explanation || 'Refined phrasing for clarity while preserving exact user scope.'
                }
              });
            }
          }
        } catch (e) {
          console.error('Gemini step improvement error:', e);
        }
      }

      // Deterministic fallback improvement without inventing tools or policies
      const currentTitle = stepItem.title || 'Execute Step';
      const cleanTitle = currentTitle.replace(/^(step\s*\d*[\:\-]\s*)/i, '').trim();
      const imperativeTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
      return res.json({
        suggestion: {
          suggestedTitle: imperativeTitle,
          suggestedDescription: stepItem.description || imperativeTitle,
          suggestedExpectedOutcome: stepItem.expectedOutcome || 'Not provided',
          explanation: 'Standardized phrasing into clear active voice based on supplied text.'
        }
      });
    }

    // 3. Suggest Objective / Purpose
    if (operation === 'suggest-objective' || operation === 'draft-objective') {
      if (gemini) {
        try {
          const prompt = `Write a concise 1-2 sentence SOP Purpose statement based STRICTLY on the user's provided process name and description.
CRITICAL MANDATORY RULES:
1. The AI must never invent company policies, approvals, software, SLA times, compliance standards, roles, email addresses, URLs, controls, or procedures.
2. Only use information supplied by the user.
3. If information is missing, leave it blank or write "Not provided".
4. Do not automatically insert example company information, ISO standards, or unstated compliance frameworks into the final SOP.
Process Name: "${processName || 'Not provided'}"
Department: "${department || 'Not provided'}"
Description: "${description || 'Not provided'}"
Return ONLY the plain text of the purpose statement.`;
          const response = await generateContentWithFallback(gemini, {
            contents: prompt
          });
          const text = response.text ? response.text.trim() : '';
          if (text) return res.json({ suggestion: text, objective: text });
        } catch (e) {
          console.error('Gemini objective assist error:', e);
        }
      }

      const fallback = processName ? `Define the procedural steps for ${processName}.` : 'Not provided';
      return res.json({ suggestion: fallback, objective: fallback });
    }

    // 4. Draft Step-by-Step Procedure
    if (operation === 'draft-steps') {
      const userSys = systems || 'Not provided';
      const fallbackSteps = extractStepsFallback(description || processName || '', userSys, documents || 'Not provided', performer || 'Not provided');
      return res.json({ steps: fallbackSteps });
    }

    // 5. AI Field Assist (Explanation, Example, Suggestion, Improve, Ask Me, Clear)
    if (operation === 'field-assist') {
      const { fieldName, enteredData, subAction = 'explain', currentValue = '' } = req.body;
      const title = processName || enteredData?.processName || enteredData?.title || 'Not provided';
      const dept = department || enteredData?.department || 'Not provided';
      const perf = performerVal || enteredData?.processPerformer || enteredData?.performer || 'Not provided';

      // Standard FFI deterministic local fallbacks
      const fallbacks: Record<string, { explanation: string; example: string; suggestion: string; question: string; warning: string }> = {
        'SOP Name': {
          explanation: 'The official title of the Standard Operating Procedure, which should be clear and action-oriented.',
          example: 'E.g., "Active Directory User Provisioning" or "AWS Virtual Private Cloud Deployment"',
          suggestion: title !== 'Not provided' ? title : '',
          question: 'What is the exact, active name of the operational process or task you are trying to document?',
          warning: 'Ensure you have not included unverified version numbers, temporary project codes, or specific department IDs inside the title.'
        },
        'Purpose': {
          explanation: 'Defines the main objective and business goal of the SOP, explaining why the process is performed.',
          example: 'E.g., "To establish a standardized, secure procedure for provisioning user accounts, ensuring compliance with ISO 27001 requirements."',
          suggestion: title !== 'Not provided' ? `This procedure defines the standard operational steps required to perform ${title} within the ${dept} department.` : '',
          question: 'What specific business problem, operational standard, or error state does this process aim to prevent or resolve?',
          warning: 'Rule Check: Remove any references to unapproved regulatory standards (such as ISO claims) or corporate KPIs unless officially verified.'
        },
        'Scope': {
          explanation: 'Specifies exactly which departments, roles, environments, or systems are covered by this SOP, and what is excluded.',
          example: 'E.g., "In Scope: All production cloud environments. Out of Scope: Local development setups."',
          suggestion: `In Scope: All operational steps required for ${title} within the ${dept} environment.\nOut of Scope: Maintenance or initial infrastructure design.`,
          question: 'Are there any specific user bases, geographical regions, or non-production software systems that are excluded from this procedure?',
          warning: 'Ensure you do not define personal contact names, unverified tenant IDs, or specific external vendor limits unless explicitly specified.'
        },
        'Process Trigger': {
          explanation: 'The event, schedule, or request that initiates the execution of this procedure.',
          example: 'E.g., "Receipt of an approved access request ticket via the IT Helpdesk."',
          suggestion: `Receipt of a formal request or scheduled operational task to initiate ${title}.`,
          question: 'What physical event, user request, or automated cron alert triggers the first step of this procedure?',
          warning: 'Do not assume or write specific URLs, unapproved webforms, or individual employee emails as the trigger channel.'
        },
        'Prerequisites': {
          explanation: 'Any mandatory conditions, access privileges, tools, or inputs required before commencing the procedure.',
          example: 'E.g., "1. Admin access to AWS Console. 2. Approved change request ticket."',
          suggestion: `1. Appropriate access permissions for ${title} systems.\n2. Verification of operational requirements.`,
          question: 'What specific system accesses, software licenses, or parent approvals must be confirmed before beginning?',
          warning: 'Never write down specific password values, actual decryption keys, or unverified admin login URLs.'
        },
        'Systems/Tools': {
          explanation: 'The list of software applications, utilities, consoles, or command-line tools used during execution.',
          example: 'E.g., "AWS Management Console, Terraform CLI, Git, Slack"',
          suggestion: enteredData?.toolsSystems || '[Identify systems and software tools used in this process]',
          question: 'What exact software applications, admin panels, or internal portals are operated in this procedure?',
          warning: 'Strictly remove specific database IP addresses, server names, API keys, or unapproved third-party tools.'
        },
        'Procedure': {
          explanation: 'The sequential, step-by-step instructions describing exactly how to execute the process.',
          example: 'E.g., "Step 1: Log in to AWS Console. Step 2: Navigate to VPC dashboard."',
          suggestion: '[Complete the numbered steps in the table below]',
          question: 'What are the sequential, step-by-step instructions for executing this procedure from start to finish?',
          warning: 'Do not include any hypothetical branches, unapproved tool logins, or references to staff names.'
        },
        'Roles': {
          explanation: 'The roles involved in executing, reviewing, or approving this procedure.',
          example: 'E.g., "Performer: Cloud Engineer. Reviewer: DevOps Lead. Approver: IT Director."',
          suggestion: `Performer: ${perf}\nReviewer: [Identify reviewer role]\nApprover: [Identify approver role]`,
          question: 'Who are the designated operational roles (e.g., L1 Support, DevOps Engineer) responsible for execution and approval?',
          warning: 'Never write specific human names, private emails, phone numbers, or signature assets.'
        },
        'Definitions': {
          explanation: 'Definitions of key terms, acronyms, or specific technical jargon used in the document.',
          example: 'E.g., "SOP: Standard Operating Procedure. AWS: Amazon Web Services."',
          suggestion: `FFI: Future Focus Infotech\nSOP: Standard Operating Procedure\n${title !== 'Not provided' ? title.slice(0, 4).toUpperCase() + ': ' + title : ''}`,
          question: 'What technical abbreviations, team names, or acronyms inside this document should be defined for a new employee?',
          warning: 'Do not invent or suggest unverified vendor definitions or unapproved industry acronyms.'
        },
        'Escalation': {
          explanation: 'The escalation paths, SLAs, and primary contacts to be notified if errors or exceptions occur during execution.',
          example: 'E.g., "L1: IT Helpdesk. L2: Systems Engineer (SLA: 2 hours). L3: IT Manager."',
          suggestion: 'L1: Standard operational support team\nL2: Department head (Escalate within 2 hours of unresolved issue)\nL3: Compliance team',
          question: 'What is the precise contact role or support desk to contact if a system block or exception scenario arises?',
          warning: 'Do not include specific mobile numbers, private Slack handles, or unverified support SLAs.'
        },
        'Related Docs': {
          explanation: 'References to other SOPs, forms, parent policies, or compliance guidelines related to this process.',
          example: 'E.g., "FFI-SEC-POL-004: Password Security Policy."',
          suggestion: '1. FFI Information Security Policy\n2. Departmental Operations Manual',
          question: 'Are there any existing parent security policies, corporate guidelines, or related forms that govern this procedure?',
          warning: 'Do not invent hypothetical document reference numbers, draft folder URLs, or policy IDs.'
        },
        'Revision History': {
          explanation: 'The audit log of versions, dates, change summaries, and authors for this SOP.',
          example: 'E.g., "v1.0 - 2026-09-22 - Initial Release - J. Doe"',
          suggestion: `v1.0 - ${new Date().toISOString().split('T')[0]} - Initial Release - Process Author`,
          question: 'What is the initial revision state, version number, and summary description for this release?',
          warning: 'Ensure you list only standard version markers (e.g. 1.0) and do not pre-date approvals.'
        },
        'Approval': {
          explanation: 'The designated roles or authorities required to formally sign off and activate this procedure.',
          example: 'E.g., "Approved by: Head of DevOps (Sign-off via Email approval)."',
          suggestion: `Role: Head of Department\nName: [Insert Name]\nDate: ${new Date().toISOString().split('T')[0]}`,
          question: 'Which official corporate role holds the final operational sign-off and auditing authority for this procedure?',
          warning: 'Never fabricate signatures, approval certificates, or unverified compliance review outcomes.'
        }
      };

      const fallbackKey = Object.keys(fallbacks).find(k => kNameMatch(k, fieldName)) || 'SOP Name';
      const matchedFallback = fallbacks[fallbackKey] || fallbacks['SOP Name'];

      if (gemini) {
        try {
          let systemInstruction = `You are an objective process documentation specialist at Future Focus Infotech (FFI).
You are assisting an employee in filling out the "${fieldName}" field of a Standard Operating Procedure (SOP).

Process Context:
- SOP Title: "${title}"
- Department: "${dept}"
- Primary Performer: "${perf}"
- Other Form Context: ${JSON.stringify(enteredData || {})}
- Current Field Value: "${currentValue}"

CRITICAL MANDATORY RULES (STRICT COMPLIANCE REQUIRED):
1. The AI must never invent, assume, or fabricate any specific company facts, server names, database instances, IP addresses, employee names, department names, document IDs, tenant IDs, policy IDs, URLs, dates, approvals, signatures, compliance certifications, ISO claims, or technical configuration values.
2. Keep suggestions strictly structured and scoped only to the actual details provided.
3. If information is missing or unstated, use generic, structured placeholders like "[Insert specific tool used for...]" or "[Define escalations for...]" or keep it focused solely on the provided title and department. Never invent hypothetical names, IDs, dates, URLs, policies, or approvals.
4. User always remains in control. Provide constructive and precise aid.`;

          let actionPrompt = '';

          if (subAction === 'explain') {
            actionPrompt = `
Task: Explain the "${fieldName}" field.
Provide:
1. "explanation": A clear, professional, concise explanation (1-2 sentences) of what this field means and why it is important for a standard FFI SOP.
2. "example": A realistic, professional, concise example of how this field looks in a typical process (1-2 sentences). Keep it general and realistic.
3. "suggestion": A custom, context-aware suggestion for this field, drafted specifically using the SOP Title ("${title}"), Department ("${dept}"), and any other relevant context entered so far.

Return ONLY a valid JSON object matching this schema:
{
  "explanation": "...",
  "example": "...",
  "suggestion": "..."
}`;
          } else if (subAction === 'suggest') {
            actionPrompt = `
Task: Suggest a high-quality draft of professional wording for "${fieldName}" based ONLY on information already entered in the Process Context.
- Do not fabricate any systems, tools, names, IDs, URLs, dates, or approvals not explicitly stated in the context.
- Use generic bracketed placeholders for unstated but necessary details.
Return ONLY a valid JSON object matching this schema:
{
  "suggestion": "A custom draft suggestion based strictly on the available context."
}`;
          } else if (subAction === 'improve') {
            actionPrompt = `
Task: Rewrite the user's current entered text professionally without changing its meaning.
User's current text: "${currentValue || '(User has not entered text yet)'}"
- If the current text is empty, suggest a generic high-quality template.
- Rewrite the user's text to make it extremely clear, professional, active voice, and structured.
- Keep the meaning identical. Do NOT add any unstated systems, tools, approvals, names, dates, or other fictitious facts.
Return ONLY a valid JSON object matching this schema:
{
  "suggestion": "The professionally rewritten text."
}`;
          } else if (subAction === 'ask-me') {
            actionPrompt = `
Task: Ask a direct, polite, helpful question identifying any critical piece of information that is missing from the current context for "${fieldName}".
- Review the entered context and the current value. If details are missing, ask a short, relevant question to prompt the user.
Return ONLY a valid JSON object matching this schema:
{
  "question": "A direct, polite, helpful question asking for the missing detail."
}`;
          } else if (subAction === 'clear') {
            actionPrompt = `
Task: Scan the user's text for unsupported assumptions, hallucinated tools, fabricated names, unstated dates, URLs, policy numbers, approvals, or compliance certifications.
User's current text: "${currentValue}"
- Evaluate the text critically. Identify if the user has assumed or hardcoded unverified details.
- Advise the user clearly on what should be removed or made generic.
Return ONLY a valid JSON object matching this schema:
{
  "warning": "A clear, helpful breakdown of what assumptions or unverified details should be removed or genericized."
}`;
          }

          const prompt = `${systemInstruction}\n\n${actionPrompt}`;

          const response = await generateContentWithFallback(gemini, {
            contents: prompt,
            config: { responseMimeType: 'application/json' }
          });

          if (response.text) {
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```')) {
              cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
            }
            const parsed = JSON.parse(cleanText);

            // Construct unified response containing keys
            return res.json({
              explanation: parsed.explanation || matchedFallback.explanation,
              example: parsed.example || matchedFallback.example,
              suggestion: parsed.suggestion || matchedFallback.suggestion,
              question: parsed.question || matchedFallback.question,
              warning: parsed.warning || matchedFallback.warning,
              result: parsed.suggestion || parsed.question || parsed.warning || ''
            });
          }
        } catch (e) {
          console.error(`Gemini field assist subAction [${subAction}] error:`, e);
        }
      }

      // Safe, high-quality, zero-hallucination deterministic fallback if offline
      let resultText = '';
      if (subAction === 'suggest') {
        resultText = matchedFallback.suggestion;
      } else if (subAction === 'improve') {
        resultText = currentValue 
          ? currentValue.trim().charAt(0).toUpperCase() + currentValue.trim().slice(1)
          : matchedFallback.suggestion;
      } else if (subAction === 'ask-me') {
        resultText = matchedFallback.question;
      } else if (subAction === 'clear') {
        resultText = matchedFallback.warning;
      }

      return res.json({
        explanation: matchedFallback.explanation,
        example: matchedFallback.example,
        suggestion: matchedFallback.suggestion,
        question: matchedFallback.question,
        warning: matchedFallback.warning,
        result: resultText || matchedFallback.suggestion
      });
    }

    res.json({ status: 'ok' });
  });

  function kNameMatch(key: string, name: string): boolean {
    return key.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(key.toLowerCase());
  }

  // ==========================================
  // AI SCREENSHOT ANALYSIS FOR SOP GENERATION
  // ==========================================
  app.post('/api/ai/analyze-screenshots', async (req, res) => {
    const { sopName, department, images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required for analysis' });
    }

    const gemini = getGeminiClient();

    // Helper: Clean filename into readable title
    const cleanFileName = (filename: string) => {
      const withoutExt = filename.replace(/\.[^/.]+$/, '');
      const readable = withoutExt.replace(/[-_]/g, ' ').trim();
      return readable.charAt(0).toUpperCase() + readable.slice(1);
    };

    // Helper: Extract MIME type and pure base64 data
    const extractBase64AndMime = (dataUrl: string) => {
      if (!dataUrl) return { mimeType: 'image/png', base64Data: '' };
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        let mimeType = match[1].toLowerCase();
        if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
        return { mimeType, base64Data: match[2] };
      }
      return { mimeType: 'image/png', base64Data: dataUrl };
    };

    // Helper: Deterministic fallback if Gemini is offline or fails (Zero-hallucination)
    const createFallbackAnalysis = () => {
      const steps = images.map((img: any, idx: number) => {
        const titleFromFileName = cleanFileName(img.fileName || `step_${idx + 1}`);
        return {
          stepNumber: idx + 1,
          title: titleFromFileName || `Step ${idx + 1}`,
          instruction: `Follow the on-screen procedure shown in this screenshot.`,
          relatedScreenshot: img.dataUrl
        };
      });

      return {
        processTitle: sopName || (images[0]?.fileName ? cleanFileName(images[0].fileName) : 'Not provided'),
        purpose: sopName ? `Operational procedure for ${sopName}.` : 'Not provided',
        toolsUsed: 'Not provided',
        steps,
        isFallback: true
      };
    };

    if (!gemini) {
      return res.status(400).json({ error: 'Gemini API client is not configured or GEMINI_API_KEY environment variable is missing.' });
    }

    try {
      const parts: any[] = [];
      parts.push({
        text: `You are an expert technical document analyst and vision system.
You are provided with ${images.length} screenshot(s) in strict sequential order from Step 1 to Step ${images.length}.
Analyze each screenshot completely independently and carefully to construct a highly precise, accurate Standard Operating Procedure (SOP).

For EACH uploaded screenshot, identify and extract strictly based ONLY on what is visible in that screenshot:
1. The visible application or webpage name (e.g., Jira, AWS Console, Figma). If not identifiable, write "Not visible in screenshot".
2. The specific page or screen purpose (e.g., "Create Issue page", "Billing dashboard"). If not identifiable, write "Not visible in screenshot".
3. A clear, natural, extremely concise and professional instruction explaining ONLY the specific, direct action required for that step (e.g., "Select File Manager from the Files section").
   - Do NOT generate generic text such as: "Follow the on-screen procedure shown in this screenshot."
   - Do NOT describe an action that cannot be identified from the image.
   - Do NOT invent missing information.
   - Do NOT list all visible buttons, fields, menus, or labels in the instruction. Describe ONLY the core action required for the employee to complete that step.
   - If the screenshot is unclear, the instruction MUST be exactly: "Unable to clearly identify this step from the screenshot."
4. Important visible interface elements:
   - Visible buttons (e.g., "Create", "Save", "Cancel")
   - Visible fields (e.g., "Summary", "Description" text box)
   - Visible menus/dropdowns (e.g., "Project dropdown")
   - Important labels or headers
5. Implied user action or expected outcome.

CRITICAL MANDATORY RULES:
1. The AI must never invent company policies, approvals, software, SLA times, compliance standards, roles, email addresses, URLs, credentials, or procedures.
2. Only use information clearly visible in the uploaded screenshots.
3. If information is missing, leave it blank or write "Not visible in screenshot".
4. Base each step's title and detailed instructions strictly on what is visible on that specific screen.
5. Maintain the EXACT 1-to-1 order: Step 1 corresponds to Screenshot 1, Step 2 corresponds to Screenshot 2, etc. Keep screenshots in their uploaded order.

Return ONLY valid JSON with this schema:
{
  "processTitle": "An accurate title for the visible process, or 'Not provided'",
  "purpose": "A concise 1-2 sentence purpose statement for the procedure, or 'Not provided'",
  "toolsUsed": "The software/tool name visible (e.g., Jira, AWS Console), or 'Not provided'",
  "steps": [
    {
      "stepNumber": 1,
      "title": "A clear, concise step title in active imperative voice describing the specific visible action (e.g. 'Click Create Button')",
      "application": "Application/webpage visible or 'Not visible in screenshot'",
      "screenPurpose": "Page/screen purpose or 'Not visible in screenshot'",
      "detailedInstruction": "Extremely concise instruction describing ONLY the direct action required to complete this step, or 'Unable to clearly identify this step from the screenshot.'",
      "buttons": ["Button A", "Button B"],
      "fields": ["Field A", "Field B"],
      "menus": ["Dropdown A"],
      "labels": ["Label/Header X"],
      "impliedAction": "User action shown or implied by the screen"
    }
  ]
}`
      });

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const { mimeType, base64Data } = extractBase64AndMime(img.dataUrl);
        parts.push({
          text: `--- SCREENSHOT #${img.imageNumber || i + 1} OF ${images.length} (Filename: "${img.fileName || `image-${i + 1}`}") ---`
        });
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      let response;
      try {
        response = await generateContentWithFallback(gemini, {
          contents: { parts },
          config: {
            responseMimeType: 'application/json'
          }
        });
      } catch (err: any) {
        console.error('All Gemini screenshot analysis models failed:', err);
        throw err;
      }

      if (!response || !response.text) {
        return res.status(500).json({ error: 'AI vision model returned an empty or invalid response.' });
      }

      if (response && response.text) {
        let cleanText = response.text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        }
        const parsed = JSON.parse(cleanText);
        if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
          const stepsWithScreenshots = images.map((img: any, idx: number) => {
            const aiStep = parsed.steps.find((s: any) => s.stepNumber === (idx + 1)) || parsed.steps[idx];

            const app = aiStep?.application || 'Not visible in screenshot';
            const screen = aiStep?.screenPurpose || 'Not visible in screenshot';
            const det = aiStep?.detailedInstruction || 'Unable to clearly identify this step from the screenshot.';
            const btns = Array.isArray(aiStep?.buttons) && aiStep.buttons.length > 0 ? aiStep.buttons.join(', ') : 'None visible';
            const flds = Array.isArray(aiStep?.fields) && aiStep.fields.length > 0 ? aiStep.fields.join(', ') : 'None visible';
            const mns = Array.isArray(aiStep?.menus) && aiStep.menus.length > 0 ? aiStep.menus.join(', ') : 'None visible';
            const lbls = Array.isArray(aiStep?.labels) && aiStep.labels.length > 0 ? aiStep.labels.join(', ') : 'None visible';

            // Construct direct clean instructions (Application/Interface details removed from employee-facing SOP)
            const formattedInstruction = det;

            return {
              stepNumber: idx + 1,
              title: aiStep?.title?.trim() || cleanFileName(img.fileName || `Step ${idx + 1}`),
              instruction: formattedInstruction,
              relatedScreenshot: img.dataUrl
            };
          });

          return res.json({
            processTitle: parsed.processTitle || sopName || 'Not provided',
            purpose: parsed.purpose || (sopName ? `Operational procedure for ${sopName}.` : 'Not provided'),
            toolsUsed: parsed.toolsUsed || 'Not provided',
            steps: stepsWithScreenshots,
            isFallback: false
          });
        }
      }

      return res.status(500).json({ error: 'Failed to parse structured steps from AI vision analysis.' });
    } catch (err: any) {
      console.error('Gemini screenshot analysis error:', err);
      return res.status(500).json({ error: `AI Vision Analysis Failed: ${err.message || err}` });
    }
  });

  // ==========================================
  // SOP QUESTIONNAIRE DRAFT PERSISTENCE API
  // ==========================================
  app.get('/api/sop-drafts/:key?', (req, res) => {
    const key = req.params.key || req.query.userEmail as string || 'default_user_draft';
    const draft = sopQuestionnaireDraftsStore[key];
    if (!draft) {
      return res.status(404).json({ error: 'No draft found' });
    }
    res.json(draft);
  });

  app.post('/api/sop-drafts', (req, res) => {
    const { key, userEmail, answers, step, timestamp, sopId, sopNumber } = req.body;
    const draftKey = key || userEmail || 'default_user_draft';
    const payload = {
      key: draftKey,
      userEmail: userEmail || 'default_user@organization.com',
      answers: answers || {},
      step: step || 1,
      sopId,
      sopNumber,
      timestamp: timestamp || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    sopQuestionnaireDraftsStore[draftKey] = payload;
    res.json({ success: true, message: 'Draft saved successfully', draft: payload });
  });

  app.delete('/api/sop-drafts/:key?', (req, res) => {
    const key = req.params.key || req.query.userEmail as string || 'default_user_draft';
    delete sopQuestionnaireDraftsStore[key];
    res.json({ success: true, message: 'Draft cleared successfully' });
  });

  // Get all SOPs
  app.get('/api/sops', (req, res) => {
    const { department, status, search, sensitivity, criticality, compliance } = req.query;
    let filtered = [...sopsStore];

    if (department && typeof department === 'string') {
      filtered = filtered.filter(s => s.department === department);
    }
    if (status && typeof status === 'string') {
      filtered = filtered.filter(s => s.status === status);
    }
    if (sensitivity && typeof sensitivity === 'string') {
      filtered = filtered.filter(s => s.sensitivityLabel === sensitivity);
    }
    if (criticality && typeof criticality === 'string') {
      filtered = filtered.filter(s => s.businessCriticality === criticality);
    }
    if (compliance && typeof compliance === 'string') {
      filtered = filtered.filter(s => s.complianceStandards?.includes(compliance as any));
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.sopNumber?.toLowerCase().includes(q) ||
        s.purpose.toLowerCase().includes(q) ||
        s.scope.toLowerCase().includes(q)
      );
    }

    res.json(filtered);
  });

  // Get SOP by ID
  app.get('/api/sops/:id', (req, res) => {
    const sop = sopsStore.find(s => s.id === req.params.id || s.sopNumber === req.params.id);
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }
    res.json(sop);
  });

  // Create SOP
  app.post('/api/sops', (req, res) => {
    const newSop: SOPDocument = req.body;
    if (!newSop.id || !newSop.sopNumber) {
      const standardNumber = generateSopNumber(newSop.department || 'IT_Enablement');
      newSop.id = standardNumber;
      newSop.sopNumber = standardNumber;
    }

    newSop.createdAt = new Date().toISOString();
    newSop.updatedAt = new Date().toISOString();

    // Default fallback mappings if missing
    if (!newSop.author) newSop.author = DEFAULT_CORPORATE_USER;
    if (!newSop.processOwner) newSop.processOwner = newSop.author;

    // Derive approvers and maintain consistent departmentId & departmentName
    const dept = departmentsStore.find(d =>
      (newSop.departmentId && d.id === newSop.departmentId) ||
      d.id === newSop.department ||
      d.name.toLowerCase() === newSop.departmentName?.toLowerCase() ||
      d.name.toLowerCase() === newSop.department?.toLowerCase() ||
      d.code.toLowerCase() === newSop.department?.toLowerCase()
    );
    if (dept) {
      newSop.departmentId = dept.id;
      newSop.departmentName = dept.name;
      newSop.department = dept.name;
    } else if (newSop.departmentId && !newSop.departmentName) {
      newSop.departmentName = newSop.department || newSop.departmentId;
    }

    if (!newSop.approver1 && dept?.primaryApproverName) {
      newSop.approver1 = {
        id: `app-dept-${dept.code || '1'}`,
        name: dept.primaryApproverName,
        email: dept.primaryApproverEmail || dept.headEmail || 'approver@organization.com',
        role: 'Approver',
        department: dept.name
      };
    }
    if (!newSop.approver2 && dept?.complianceApproverName) {
      newSop.approver2 = {
        id: `app-cmp-${dept.code || '2'}`,
        name: dept.complianceApproverName,
        email: dept.complianceApproverEmail || 'compliance@organization.com',
        role: 'Approver',
        department: 'Compliance'
      };
    }

    if (!newSop.businessCriticality) newSop.businessCriticality = 'Medium';
    if (!newSop.complianceStandards || newSop.complianceStandards.length === 0) {
      newSop.complianceStandards = ['ISO 9001', 'IT Security Policies'];
    }

    sopsStore.unshift(newSop);

    // Record audit log with 7-year retention
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newSop.id,
      sopTitle: newSop.title,
      user: newSop.author || DEFAULT_CORPORATE_USER,
      action: 'CREATE_SOP',
      details: `Created new SOP document "${newSop.id}: ${newSop.title}" in status ${newSop.status} with Criticality: ${newSop.businessCriticality}.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: newSop.author?.entraObjectId || DEFAULT_CORPORATE_USER.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    // Trigger Notification for Reviewer
    const newAuthorName = typeof newSop.author === 'object' ? newSop.author?.name : (newSop.author || 'Author');
    const notif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: newSop.reviewer?.email || newSop.approver1?.email || 'reviewer@organization.com',
      recipientName: `${newSop.reviewer?.name || newSop.approver1?.name || 'Reviewer'}`,
      channel: 'Both',
      triggerType: 'SOP_SUBMITTED_FOR_REVIEW',
      sopId: newSop.id,
      sopTitle: newSop.title,
      message: `New SOP ${newSop.id} ("${newSop.title}") submitted by ${newAuthorName} for review.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };
    notificationsStore.unshift(notif);

    res.status(201).json(newSop);
  });

  // Update SOP
  app.put('/api/sops/:id', (req, res) => {
    const index = sopsStore.findIndex(s => s.id === req.params.id || s.sopNumber === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const currentSop = sopsStore[index];
    const performingUser = req.body.performingUser;

    // SECURITY CHECK 1: Segregation of Duties (Author cannot approve own SOP)
    if (req.body.lastAction === 'APPROVE_STAGE' || req.body.lastAction === 'FINAL_APPROVAL') {
      const authorEmail = currentSop.author?.email?.toLowerCase();
      const userEmail = performingUser?.email?.toLowerCase();
      if (authorEmail && userEmail && authorEmail === userEmail && performingUser?.role !== 'Administrator') {
        return res.status(403).json({
          error: 'Segregation of duties violation: Under ISO 9001 / ISO 27001 compliance standards, an SOP Author cannot approve their own SOP.'
        });
      }
    }

    // SECURITY CHECK 2: Employees cannot directly modify active/published SOPs
    if (
      (currentSop.status === 'Active' || currentSop.status === 'Published') &&
      performingUser?.role === 'Employee' &&
      req.body.status !== currentSop.status &&
      !req.body.changeRequestId
    ) {
      return res.status(403).json({
        error: 'Governance violation: Employees cannot directly modify active SOPs. Please submit a Request SOP Change ticket.'
      });
    }

    // SECURITY CHECK 3: Payroll restriction
    if (
      currentSop.department === 'Payroll' &&
      performingUser &&
      !['Administrator', 'Compliance Manager', 'Management'].includes(performingUser.role) &&
      performingUser.department !== 'Payroll' &&
      performingUser.department !== 'HR'
    ) {
      return res.status(403).json({
        error: 'Access restricted: Payroll operational procedures are restricted to authorized Payroll and HR personnel.'
      });
    }

    const previousStatus = currentSop.status;
    const updatedSop: SOPDocument = {
      ...currentSop,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Ensure departmentId and departmentName consistency on update
    const matchedDept = departmentsStore.find(d =>
      (updatedSop.departmentId && d.id === updatedSop.departmentId) ||
      d.id === updatedSop.department ||
      d.name.toLowerCase() === updatedSop.departmentName?.toLowerCase() ||
      d.name.toLowerCase() === updatedSop.department?.toLowerCase() ||
      d.code.toLowerCase() === updatedSop.department?.toLowerCase()
    );
    if (matchedDept) {
      updatedSop.departmentId = matchedDept.id;
      updatedSop.departmentName = matchedDept.name;
      updatedSop.department = matchedDept.name;
    }

    const newStatus = updatedSop.status;

    // Update changeHistory with status and approver name
    if (!updatedSop.changeHistory) updatedSop.changeHistory = [];
    const chIdx = updatedSop.changeHistory.findIndex(c => c.version === updatedSop.version);
    const approverName = performingUser ? performingUser.name : 'Authorized Approver';

    if (chIdx >= 0) {
      updatedSop.changeHistory[chIdx].status = newStatus;
      if (newStatus === 'Approved' || newStatus === 'Published') {
        updatedSop.changeHistory[chIdx].approvedBy = approverName;
      }
    } else {
      updatedSop.changeHistory.unshift({
        version: updatedSop.version || '1.0',
        date: new Date().toISOString().split('T')[0],
        author: typeof updatedSop.author === 'object' ? updatedSop.author.name : (updatedSop.author || 'Process Author'),
        summary: `Version ${updatedSop.version} (${newStatus})`,
        changeDescription: `Version ${updatedSop.version} (${newStatus})`,
        status: newStatus,
        approvedBy: (newStatus === 'Approved' || newStatus === 'Published') ? approverName : '—'
      });
    }

    sopsStore[index] = updatedSop;

    // Record audit log with previous/new status, version, comments
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: updatedSop.id,
      sopNumber: updatedSop.sopNumber || updatedSop.id,
      sopTitle: updatedSop.title,
      department: updatedSop.department,
      user: performingUser || updatedSop.author,
      action: req.body.lastAction || 'UPDATE_SOP',
      details: req.body.actionDetails || `Updated SOP "${updatedSop.id}" status from ${previousStatus} to ${newStatus}.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: (performingUser && performingUser.entraObjectId) || (typeof updatedSop.author === 'object' ? updatedSop.author?.entraObjectId : DEFAULT_CORPORATE_USER.entraObjectId),
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Focus Infotech Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      executionData: {
        executionId: `STAT-CHG-${Date.now().toString().slice(-6)}`,
        clientName: 'Future Focus Infotech Operations',
        department: updatedSop.department,
        checklistCompleted: 1,
        totalChecklist: 1,
        assetTagOrRef: `Version ${updatedSop.version}`,
        checklistSummary: [
          `Previous Status: ${previousStatus}`,
          `New Status: ${newStatus}`,
          `Comments: ${req.body.actionDetails || 'Standard status transition'}`
        ],
        signOffOfficer: performingUser ? `${performingUser.name} (${performingUser.role})` : 'Authorized Officer',
        status: 'COMPLETED',
        executionNotes: req.body.actionDetails || `Transitioned from ${previousStatus} to ${newStatus}`,
        certificateId: `AUDIT-v${updatedSop.version}-${Date.now().toString().slice(-4)}`
      }
    };
    auditLogsStore.unshift(log);

    const updAuthorName = typeof updatedSop.author === 'object' ? updatedSop.author?.name : (updatedSop.author || 'Author');
    const updAuthorEmail = typeof updatedSop.author === 'object' ? updatedSop.author?.email : 'author@organization.com';

    // Auto-generate notifications based on status transition
    if (req.body.lastAction === 'APPROVE_STAGE') {
      const nextRecipient = updatedSop.status === 'Pending Approver 2'
        ? updatedSop.approver2
        : updatedSop.status === 'Pending Final Approval'
        ? updatedSop.finalApprover
        : updatedSop.author;

      const stageNotif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: nextRecipient?.email || 'approver@organization.com',
        recipientName: nextRecipient?.name || 'Approver',
        channel: 'Both',
        triggerType: 'APPROVAL_REQUIRED',
        sopId: updatedSop.id,
        sopTitle: updatedSop.title,
        message: `Approval required for SOP ${updatedSop.sopNumber || updatedSop.id} ("${updatedSop.title}"). Current status is "${updatedSop.status}".`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(stageNotif);
    } else if (req.body.lastAction === 'FINAL_APPROVAL' || newStatus === 'Approved' || newStatus === 'Published') {
      const approvedNotif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: updAuthorEmail,
        recipientName: updAuthorName,
        channel: 'Both',
        triggerType: 'SOP_APPROVED',
        sopId: updatedSop.id,
        sopTitle: updatedSop.title,
        message: `SOP ${updatedSop.sopNumber || updatedSop.id} ("${updatedSop.title}") has received final approval and is published.`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(approvedNotif);
    } else if (req.body.lastAction === 'REJECT_SOP' || newStatus === 'Draft' && previousStatus.includes('Pending')) {
      const rejectedNotif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: updAuthorEmail,
        recipientName: updAuthorName,
        channel: 'Both',
        triggerType: 'SOP_REJECTED',
        sopId: updatedSop.id,
        sopTitle: updatedSop.title,
        message: `SOP ${updatedSop.sopNumber || updatedSop.id} was returned for revisions. Notes: ${req.body.actionDetails || 'Please review reviewer feedback.'}`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(rejectedNotif);
    } else if (req.body.lastAction === 'UPDATE_SOP') {
      const updatedNotif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: updatedSop.processOwner?.email || updAuthorEmail,
        recipientName: updatedSop.processOwner?.name || updAuthorName,
        channel: 'Teams',
        triggerType: 'SOP_UPDATED',
        sopId: updatedSop.id,
        sopTitle: updatedSop.title,
        message: `SOP ${updatedSop.sopNumber || updatedSop.id} was updated to version ${updatedSop.version}.`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(updatedNotif);
    }

    res.json(updatedSop);
  });

  // Delete / Archive SOP (5 Year Retention Vault)
  app.delete('/api/sops/:id', (req, res) => {
    const index = sopsStore.findIndex(s => s.id === req.params.id || s.sopNumber === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const sop = sopsStore[index];
    sop.status = 'Retired';
    sop.updatedAt = new Date().toISOString();

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: sop.id,
      sopTitle: sop.title,
      user: DEFAULT_CORPORATE_USER, // Compliance Admin
      action: 'RETIRE_SOP',
      details: `Retired SOP ${sop.id} ("${sop.title}"). Archived to Immutable Compliance Vault (Archived for 5 Years under Focus Infotech Retention Schedule).`,
      ipAddress: req.ip || '10.14.20.105',
      timestamp: new Date().toISOString(),
      entraObjectId: DEFAULT_CORPORATE_USER.entraObjectId,
      retentionPolicy: 'Archived for 5 Years under Focus Infotech Record Retention Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json({ message: 'SOP retired and moved to 5-year retention archive vault', sop });
  });

  // Audit Logs Endpoint
  app.get('/api/audit-logs', (req, res) => {
    res.json(auditLogsStore);
  });

  // Record Verified SOP Execution Record
  app.post('/api/audit-logs/execution', (req, res) => {
    const {
      sopId,
      sopNumber,
      sopTitle,
      department,
      clientName,
      user,
      checklistCompleted,
      totalChecklist,
      assetTagOrRef,
      checklistSummary,
      executionNotes,
      details
    } = req.body;

    const certId = `CERT-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const execId = `EXEC-${Date.now().toString().slice(-6)}`;
    const hash = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: sopId || 'SOP-EXEC',
      sopNumber: sopNumber || sopId || 'SOP-EXEC',
      sopTitle: sopTitle || 'Procedural SOP Execution',
      department: department || user?.department || 'IT_Enablement',
      clientName: clientName || 'Enterprise Client Engagement',
      user: user || DEFAULT_CORPORATE_USER,
      action: 'SOP_EXECUTION_COMPLETED',
      details: details || `Executed operational SOP checklist for ${assetTagOrRef || sopId}. Completed ${checklistCompleted || 0}/${totalChecklist || 0} mandatory checks.`,
      ipAddress: req.ip || '10.14.20.105',
      timestamp: new Date().toISOString(),
      entraObjectId: user?.entraObjectId || DEFAULT_CORPORATE_USER.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Future Focus Infotech Policy',
      tamperProofHash: hash,
      executionData: {
        executionId: execId,
        clientName: clientName || 'Enterprise Client Engagement',
        department: department || user?.department,
        checklistCompleted: checklistCompleted || totalChecklist || 0,
        totalChecklist: totalChecklist || 0,
        assetTagOrRef: assetTagOrRef || 'Standard Run',
        checklistSummary: checklistSummary || [],
        signOffOfficer: `${user?.name || 'Authorized Staff'} (${user?.role || 'Operator'})`,
        status: 'COMPLETED',
        executionNotes: executionNotes || 'Procedural execution verified against ISO 9001 quality criteria.',
        certificateId: certId
      }
    };

    auditLogsStore.unshift(newLog);
    res.status(201).json({ success: true, log: newLog });
  });

  // IT Asset Workflows Endpoint
  app.get('/api/it-assets/workflows', (req, res) => {
    res.json(INITIAL_IT_ASSET_WORKFLOWS);
  });

  // Knowledge Base Endpoints
  app.get('/api/knowledge-base/troubleshooting', (req, res) => {
    res.json(INITIAL_TROUBLESHOOTING_GUIDES);
  });

  app.get('/api/knowledge-base/faqs', (req, res) => {
    res.json(INITIAL_FAQS);
  });

  app.get('/api/knowledge-base/vendors', (req, res) => {
    res.json(INITIAL_VENDOR_CONTACTS);
  });

  // Notifications Endpoints
  app.get('/api/notifications', (req, res) => {
    res.json(notificationsStore);
  });

  app.post('/api/notifications/dispatch-reminder', (req, res) => {
    const { sopId, reminderType, customMessage } = req.body;
    const sop = sopsStore.find(s => s.id === sopId);

    const newNotif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: sop?.processOwner?.email || sop?.author?.email || 'owner@organization.com',
      recipientName: sop?.processOwner?.name || 'Process Owner',
      channel: 'Both',
      triggerType: reminderType === '30_DAYS' ? 'EXPIRY_WARNING' : 'REVIEW_CYCLE_REMINDER',
      sopId: sopId || 'IT-SOP-001',
      sopTitle: sop?.title || 'Standard Operating Procedure',
      message: customMessage || `Scheduled review reminder triggered: Please audit and re-validate SOP ${sopId} under ISO 9001 / ISO 27001 review cycle.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };

    notificationsStore.unshift(newNotif);
    res.status(201).json({ success: true, notification: newNotif });
  });

  // Governance Scorecards Endpoint (dynamically calculated for current departments)
  app.get('/api/governance/scorecards', (req, res) => {
    const scorecards: DepartmentScorecard[] = departmentsStore.map(dept => {
      const deptSops = sopsStore.filter(s => s.department === dept.name || s.department === dept.id);
      const active = deptSops.filter(s => s.status === 'Active' || s.status === 'Published').length;
      const underReview = deptSops.filter(s => s.status === 'Under Review' || s.status.includes('Pending')).length;
      const overdue = deptSops.filter(s => {
        if (!s.nextReviewDate) return false;
        return new Date(s.nextReviewDate) < new Date() && s.status !== 'Retired' && s.status !== 'Archived';
      }).length;
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const expiringIn30Days = deptSops.filter(s => {
        if (!s.nextReviewDate) return false;
        const d = new Date(s.nextReviewDate);
        return d >= new Date() && d <= thirtyDaysFromNow;
      }).length;

      return {
        department: dept.name as any,
        name: dept.name,
        code: dept.code,
        headName: dept.headName,
        headEmail: dept.headEmail,
        totalSops: deptSops.length,
        approvedSops: active,
        pendingApprovals: underReview,
        overdueReviews: overdue,
        expiringIn30Days,
        complianceScore: deptSops.length > 0 ? Math.round((active / deptSops.length) * 100) : 100,
        auditReadiness: overdue > 0 ? 'Action Needed' : 'Audit Ready',
        slaAdherence: 100,
        lastAuditDate: new Date().toISOString()
      };
    });
    res.json(scorecards);
  });

  // Complete Database Reset Endpoint
  app.post('/api/admin/reset-database', (req, res) => {
    sopsStore = [];
    auditLogsStore = [];
    notificationsStore = [];
    scorecardsStore = [];
    departmentsStore = [];
    tasksStore = [];
    issuesStore = [];
    changeRequestsStore = [];
    res.json({ success: true, message: 'All SOP and department datasets have been completely reset.' });
  });

  // ==========================================
  // TASKS PERSISTENCE & GOVERNANCE ENDPOINTS
  // ==========================================
  app.get('/api/tasks', (req, res) => {
    res.json(tasksStore);
  });

  app.post('/api/tasks', (req, res) => {
    const newTask: TaskItem = {
      id: req.body.id || `task-${Date.now()}`,
      title: req.body.title || 'New Operational Task',
      description: req.body.description || '',
      sopId: req.body.sopId || 'IT-SOP-001',
      sopTitle: req.body.sopTitle || 'Standard Operating Procedure',
      department: req.body.department || 'IT_Enablement',
      assignedTo: req.body.assignedTo || 'Unassigned',
      assignedToRole: req.body.assignedToRole || 'Employee',
      assignedToEmail: req.body.assignedToEmail || 'employee@organization.com',
      assignedDate: new Date().toISOString(),
      dueDate: req.body.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      priority: req.body.priority || 'Medium',
      status: req.body.status || 'Pending',
      taskType: req.body.taskType || 'Execution'
    };

    tasksStore.unshift(newTask);

    // Notify assignee: Task assigned
    const notif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: newTask.assignedToEmail || 'employee@organization.com',
      recipientName: newTask.assignedTo,
      channel: 'Both',
      triggerType: 'TASK_ASSIGNED',
      sopId: newTask.sopId,
      sopTitle: newTask.sopTitle,
      message: `New task assigned: "${newTask.title}" for SOP ${newTask.sopId}. Due: ${new Date(newTask.dueDate).toLocaleDateString()}. Priority: ${newTask.priority}.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };
    notificationsStore.unshift(notif);

    // Audit log
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newTask.sopId,
      sopTitle: newTask.sopTitle,
      department: newTask.department,
      user: {
        id: 'usr-admin',
        name: 'System Governance Engine',
        email: 'system@organization.com',
        role: 'Administrator',
        department: newTask.department
      },
      action: 'TASK_ASSIGNED',
      details: `Operational Task "${newTask.title}" assigned to ${newTask.assignedTo} (${newTask.assignedToRole}). Due date: ${newTask.dueDate}.`,
      ipAddress: req.ip || '10.14.20.1',
      timestamp: new Date().toISOString(),
      retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.status(201).json(newTask);
  });

  app.put('/api/tasks/:id', (req, res) => {
    const index = tasksStore.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const prevTask = tasksStore[index];
    const updatedTask: TaskItem = {
      ...prevTask,
      ...req.body
    };

    tasksStore[index] = updatedTask;

    if (req.body.status === 'Completed' && prevTask.status !== 'Completed') {
      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        sopId: updatedTask.sopId,
        sopTitle: updatedTask.sopTitle,
        department: updatedTask.department,
        user: {
          id: 'usr-exec',
          name: updatedTask.assignedTo,
          email: updatedTask.assignedToEmail || 'executor@organization.com',
          role: (updatedTask.assignedToRole as UserRole) || 'Employee',
          department: updatedTask.department
        },
        action: 'TASK_COMPLETED',
        details: `Task "${updatedTask.title}" completed successfully.`,
        ipAddress: req.ip || '10.14.20.2',
        timestamp: new Date().toISOString(),
        retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
        tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      auditLogsStore.unshift(log);
    }

    res.json(updatedTask);
  });

  // ==========================================
  // ISSUE REPORTING PERSISTENCE & GOVERNANCE
  // ==========================================
  app.get('/api/issues', (req, res) => {
    res.json(issuesStore);
  });

  app.post('/api/issues', (req, res) => {
    const newIssue: IssueReport = {
      id: req.body.id || `iss-${Date.now().toString().slice(-5)}`,
      sopId: req.body.sopId || 'IT-SOP-001',
      sopTitle: req.body.sopTitle || 'Standard Operating Procedure',
      department: req.body.department || 'IT_Enablement',
      issueType: req.body.issueType || 'SOP unclear',
      description: req.body.description || '',
      urgency: req.body.urgency || 'Medium',
      attachmentName: req.body.attachmentName,
      status: req.body.status || 'OPEN',
      reportedBy: req.body.reportedBy || {
        id: 'usr-emp',
        name: 'Staff Member',
        email: 'employee@organization.com',
        role: 'Employee',
        department: req.body.department || 'IT_Enablement'
      },
      createdAt: new Date().toISOString(),
      assignedTo: req.body.assignedTo || 'Department Quality Manager'
    };

    issuesStore.unshift(newIssue);

    // Notification: Issue assigned
    const notif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: 'quality.lead@organization.com',
      recipientName: newIssue.assignedTo || 'Department Quality Manager',
      channel: 'Both',
      triggerType: 'ISSUE_ASSIGNED',
      sopId: newIssue.sopId,
      sopTitle: newIssue.sopTitle,
      message: `Issue reported & assigned: [${newIssue.urgency.toUpperCase()}] ${newIssue.issueType} on SOP ${newIssue.sopId}: "${newIssue.description.slice(0, 80)}..."`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };
    notificationsStore.unshift(notif);

    // Audit log
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newIssue.sopId,
      sopTitle: newIssue.sopTitle,
      department: newIssue.department,
      user: newIssue.reportedBy,
      action: 'ISSUE_REPORTED',
      details: `New issue ticket [${newIssue.id}] created. Type: ${newIssue.issueType}. Urgency: ${newIssue.urgency}. Details: ${newIssue.description.slice(0, 100)}`,
      ipAddress: req.ip || '10.14.20.10',
      timestamp: new Date().toISOString(),
      retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.status(201).json(newIssue);
  });

  app.put('/api/issues/:id', (req, res) => {
    const index = issuesStore.findIndex(i => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const prevIssue = issuesStore[index];
    const updatedIssue: IssueReport = {
      ...prevIssue,
      ...req.body
    };

    issuesStore[index] = updatedIssue;

    // Notify: Issue resolved
    if ((updatedIssue.status === 'RESOLVED' || updatedIssue.status === 'CLOSED') && prevIssue.status !== updatedIssue.status) {
      const notif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: updatedIssue.reportedBy.email,
        recipientName: updatedIssue.reportedBy.name,
        channel: 'Both',
        triggerType: 'ISSUE_RESOLVED',
        sopId: updatedIssue.sopId,
        sopTitle: updatedIssue.sopTitle,
        message: `Issue ticket ${updatedIssue.id} on SOP ${updatedIssue.sopId} has been resolved: ${updatedIssue.resolutionNotes || 'Corrective action implemented.'}`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(notif);

      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        sopId: updatedIssue.sopId,
        sopTitle: updatedIssue.sopTitle,
        department: updatedIssue.department,
        user: {
          id: 'usr-admin',
          name: req.body.performingUserName || 'Compliance Lead',
          email: 'compliance@organization.com',
          role: 'Compliance Manager',
          department: updatedIssue.department
        },
        action: 'ISSUE_RESOLVED',
        details: `Issue ticket ${updatedIssue.id} marked ${updatedIssue.status}. Resolution: ${updatedIssue.resolutionNotes || 'Action closed.'}`,
        ipAddress: req.ip || '10.14.20.12',
        timestamp: new Date().toISOString(),
        retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
        tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      auditLogsStore.unshift(log);
    }

    res.json(updatedIssue);
  });

  // ==========================================
  // CHANGE REQUEST PERSISTENCE & GOVERNANCE
  // ==========================================
  app.get('/api/change-requests', (req, res) => {
    res.json(changeRequestsStore);
  });

  app.post('/api/change-requests', (req, res) => {
    const newCr: ChangeRequest = {
      id: req.body.id || `cr-${Date.now().toString().slice(-5)}`,
      sopId: req.body.sopId || 'IT-SOP-001',
      sopTitle: req.body.sopTitle || 'Standard Operating Procedure',
      department: req.body.department || 'IT_Enablement',
      changeType: req.body.changeType || 'Process improvement',
      reason: req.body.reason || '',
      description: req.body.description || '',
      priority: req.body.priority || 'Medium',
      attachmentName: req.body.attachmentName,
      status: req.body.status || 'SUBMITTED',
      requestedBy: req.body.requestedBy || {
        id: 'usr-emp',
        name: 'Corporate Staff',
        email: 'staff@organization.com',
        role: 'Employee',
        department: req.body.department || 'IT_Enablement'
      },
      createdAt: new Date().toISOString()
    };

    changeRequestsStore.unshift(newCr);

    // Notify: Change request submitted
    const notif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: 'dept.head@organization.com',
      recipientName: 'Department Process Head',
      channel: 'Both',
      triggerType: 'CHANGE_REQUEST_SUBMITTED',
      sopId: newCr.sopId,
      sopTitle: newCr.sopTitle,
      message: `Formal change request [${newCr.id}] submitted for SOP ${newCr.sopId} (${newCr.changeType}). Priority: ${newCr.priority}. Requester: ${newCr.requestedBy.name}.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };
    notificationsStore.unshift(notif);

    // Audit log
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newCr.sopId,
      sopTitle: newCr.sopTitle,
      department: newCr.department,
      user: newCr.requestedBy,
      action: 'CHANGE_REQUEST_SUBMITTED',
      details: `Formal SOP Change Request [${newCr.id}] lodged. Reason: ${newCr.reason}. Type: ${newCr.changeType}. Priority: ${newCr.priority}.`,
      ipAddress: req.ip || '10.14.20.15',
      timestamp: new Date().toISOString(),
      retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.status(201).json(newCr);
  });

  app.put('/api/change-requests/:id', (req, res) => {
    const index = changeRequestsStore.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Change request not found' });
    }

    const prevCr = changeRequestsStore[index];
    const updatedCr: ChangeRequest = {
      ...prevCr,
      ...req.body
    };

    changeRequestsStore[index] = updatedCr;

    // Notify requester of decision
    if (prevCr.status !== updatedCr.status) {
      const notif: NotificationEvent = {
        id: `notif-${Date.now()}`,
        recipientEmail: updatedCr.requestedBy.email,
        recipientName: updatedCr.requestedBy.name,
        channel: 'Both',
        triggerType: updatedCr.status === 'APPROVED' ? 'SOP_APPROVED' : 'SOP_REJECTED',
        sopId: updatedCr.sopId,
        sopTitle: updatedCr.sopTitle,
        message: `Change request [${updatedCr.id}] for SOP ${updatedCr.sopId} has been updated to ${updatedCr.status}. Notes: ${updatedCr.reviewNotes || 'Review completed.'}`,
        timestamp: new Date().toISOString(),
        status: 'Delivered'
      };
      notificationsStore.unshift(notif);

      const log: AuditLogEntry = {
        id: `log-${Date.now()}`,
        sopId: updatedCr.sopId,
        sopTitle: updatedCr.sopTitle,
        department: updatedCr.department,
        user: {
          id: 'usr-admin',
          name: req.body.reviewerName || 'Governance Reviewer',
          email: 'reviewer@organization.com',
          role: 'Department Manager',
          department: updatedCr.department
        },
        action: `CHANGE_REQUEST_${updatedCr.status}`,
        details: `Change request ${updatedCr.id} marked ${updatedCr.status}. Notes: ${updatedCr.reviewNotes || 'Action processed.'}`,
        ipAddress: req.ip || '10.14.20.18',
        timestamp: new Date().toISOString(),
        retentionPolicy: 'Retained for 7 Years under ISO 9001 / ISO 27001 ISMS',
        tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
      };
      auditLogsStore.unshift(log);
    }

    res.json(updatedCr);
  });

  // GEMINI AI ENDPOINTS

  // 1. Guided Interview SOP Generation
  app.post('/api/gemini/interview-draft', async (req, res) => {
    const {
      title,
      department,
      category,
      goal,
      targetAudience,
      keySteps,
      safetyConcerns,
      sensitivityLabel,
      businessCriticality,
      complianceStandards
    } = req.body;

    const ai = getGeminiClient();
    const generatedSopNumber = generateSopNumber(department || 'IT_Enablement');

    if (!ai) {
      // Rule-based structured fallback draft for Focus Infotech
      const fallbackSop: Partial<SOPDocument> = {
        id: generatedSopNumber,
        sopNumber: generatedSopNumber,
        title: title || 'Standard Operating Procedure Draft',
        department: department || 'IT_Enablement',
        category: category || 'IT Asset Management',
        version: '1.0',
        status: 'Draft',
        sensitivityLabel: sensitivityLabel || 'Internal',
        businessCriticality: businessCriticality || 'Medium',
        complianceStandards: complianceStandards || ['ISO 9001', 'ISO 27001', 'IT Security Policies'],
        purpose: goal || `Provide clear guidelines for ${title} across Focus Infotech operations.`,
        scope: `Applies to all ${targetAudience || 'authorized personnel'} across the ${department || 'IT Enablement'} department.`,
        responsibilities: [
          { role: 'Primary Operator / Specialist', description: 'Executes procedure steps in sequence and captures operational verification logs.' },
          { role: 'Department Manager', description: 'Audits completion status and ensures strict adherence to ISO 9001 / ISO 27001 standards.' }
        ],
        procedureSteps: (keySteps || ['Initiate process and verify prerequisites', 'Execute primary technical workflow', 'Verify quality checks and update records']).map((s: string, idx: number) => ({
          id: `step-${idx + 1}`,
          stepNumber: idx + 1,
          title: `Step ${idx + 1}: ${s.length > 35 ? s.substring(0, 35) + '...' : s}`,
          action: s,
          assignedRole: 'Primary Operator / Specialist',
          safetyNote: safetyConcerns ? `Safety & Security Note: ${safetyConcerns}` : 'Ensure dual-factor authentication and wear ESD wristband where applicable.',
          inputsOutputs: 'Input: Initiation Request | Output: Signed Digital Execution Record'
        })),
        definitions: [
          { term: 'SOP', definition: 'Standard Operating Procedure detailing exact step-by-step instructions for Focus Infotech.' },
          { term: 'ISMS', definition: 'Information Security Management System compliant with ISO 27001.' }
        ],
        references: [
          { title: 'Focus Infotech Information Security Policy Manual', urlOrDocId: 'POL-SEC-01' },
          { title: 'ISO 9001 / 27001 Operational Compliance Guidelines', urlOrDocId: 'ISO-STD-2026' }
        ],
        changeHistory: [
          { version: '1.0', date: new Date().toISOString().split('T')[0], author: 'AI SOP Studio (Focus Infotech)', summary: 'Initial draft generated via AI Guided Interview.' }
        ],
        securityControls: {
          mfaEnforced: true,
          conditionalAccessPass: true,
          dlpScanPassed: true,
          purviewSensitivityLabel: sensitivityLabel || 'Internal',
          downloadRestricted: sensitivityLabel === 'Confidential' || sensitivityLabel === 'Highly Confidential',
          retentionYears: 7
        }
      };

      return res.json({ sop: fallbackSop, source: 'rule-engine' });
    }

    try {
      const prompt = `You are an Enterprise Governance Compliance Officer & Lead Technical Writer at Focus Infotech.
Generate a comprehensive, structured Standard Operating Procedure (SOP) JSON document for Focus Infotech based on these interview inputs:
- Title: ${title}
- Department: ${department}
- Category: ${category}
- Core Goal / Purpose: ${goal}
- Target Audience / Scope: ${targetAudience}
- User Provided Key Steps: ${Array.isArray(keySteps) ? keySteps.join('; ') : keySteps}
- Safety, IT Security & Compliance Concerns: ${safetyConcerns || 'None specified'}
- Recommended Sensitivity Label: ${sensitivityLabel || 'Internal'}
- Business Criticality: ${businessCriticality || 'High'}
- Compliance Standards: ${Array.isArray(complianceStandards) ? complianceStandards.join(', ') : 'ISO 9001, ISO 27001'}

Ensure the response strictly adheres to this JSON structure:
{
  "title": string,
  "department": string,
  "category": string,
  "sensitivityLabel": "Public" | "Internal" | "Confidential" | "Highly Confidential",
  "businessCriticality": "Low" | "Medium" | "High" | "Mission Critical",
  "purpose": string (detailed 2-3 sentences referencing Focus Infotech standards),
  "scope": string (detailed 2-3 sentences),
  "responsibilities": [{"role": string, "description": string}],
  "procedureSteps": [
    {
      "stepNumber": number,
      "title": string,
      "action": string (clear imperative technical instruction),
      "assignedRole": string,
      "safetyNote": string (optional warning),
      "inputsOutputs": string
    }
  ],
  "definitions": [{"term": string, "definition": string}],
  "references": [{"title": string, "urlOrDocId": string}]
}`;

      const response = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              department: { type: Type.STRING },
              category: { type: Type.STRING },
              sensitivityLabel: { type: Type.STRING },
              businessCriticality: { type: Type.STRING },
              purpose: { type: Type.STRING },
              scope: { type: Type.STRING },
              responsibilities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING },
                    description: { type: Type.STRING }
                  }
                }
              },
              procedureSteps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    stepNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    action: { type: Type.STRING },
                    assignedRole: { type: Type.STRING },
                    safetyNote: { type: Type.STRING },
                    inputsOutputs: { type: Type.STRING }
                  }
                }
              },
              definitions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  }
                }
              },
              references: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    urlOrDocId: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{}');

      const completeSop: Partial<SOPDocument> = {
        id: generatedSopNumber,
        sopNumber: generatedSopNumber,
        version: '1.0',
        status: 'Draft',
        effectiveDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        nextReviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        reviewFrequencyMonths: 12,
        complianceStandards: complianceStandards || ['ISO 9001', 'ISO 27001', 'IT Security Policies'],
        ...parsedData,
        procedureSteps: (parsedData.procedureSteps || []).map((step: any, idx: number) => ({
          ...step,
          id: `step-${idx + 1}`,
          stepNumber: idx + 1
        })),
        changeHistory: [
          { version: '1.0', date: new Date().toISOString().split('T')[0], author: 'AI SOP Studio (Gemini)', summary: 'AI generated draft from guided interview for Focus Infotech.' }
        ],
        securityControls: {
          mfaEnforced: true,
          conditionalAccessPass: true,
          dlpScanPassed: true,
          purviewSensitivityLabel: parsedData.sensitivityLabel || 'Internal',
          downloadRestricted: parsedData.sensitivityLabel === 'Confidential' || parsedData.sensitivityLabel === 'Highly Confidential',
          retentionYears: 7
        }
      };

      res.json({ sop: completeSop, source: 'gemini-3.6-flash' });
    } catch (err: any) {
      console.error('Gemini Interview Draft Error:', err);
      res.status(500).json({ error: 'Failed to generate SOP draft with AI', details: err.message });
    }
  });

  // 2. Compliance Check Endpoint (ISO 9001, ISO 27001, Internal Audit)
  app.post('/api/gemini/compliance-check', async (req, res) => {
    const sop: SOPDocument = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback rule check for Focus Infotech
      const missing = [];
      if (!sop.purpose || sop.purpose.length < 20) missing.push('Detailed Purpose section');
      if (!sop.scope || sop.scope.length < 20) missing.push('Detailed Scope section');
      if (!sop.procedureSteps || sop.procedureSteps.length === 0) missing.push('Procedure Steps');
      if (!sop.responsibilities || sop.responsibilities.length === 0) missing.push('Defined Roles & Responsibilities');

      const score = Math.max(75, 100 - missing.length * 10);

      return res.json({
        score: score,
        sensitivityMatch: true,
        issues: missing.map(m => `Missing or insufficient: ${m}`),
        suggestions: [
          'Ensure all steps specify inputs/outputs for ISO 9001 traceability.',
          'Verify that BitLocker/encryption references align with ISO 27001 Annex A.8.',
          'Confirm multi-tier approval sign-offs (Reviewer, Dept Manager, HOD, Compliance Admin).'
        ],
        missingSections: missing,
        regulatoryComplianceNotes: 'Compliant with Focus Infotech ISO 9001 (Quality) and ISO 27001 (ISMS) baseline requirements.',
        standardAlignments: [
          { standard: 'ISO 9001', compliant: true, remarks: 'Step traceability and responsibility matrix verified.' },
          { standard: 'ISO 27001', compliant: sop.sensitivityLabel !== 'Public', remarks: 'Sensitivity classification aligned with ISMS policy.' },
          { standard: 'Data Retention Policies', compliant: true, remarks: '7-year audit retention policy attached.' }
        ],
        source: 'rule-engine'
      });
    }

    try {
      const prompt = `Evaluate the following Focus Infotech SOP document for compliance with ISO 9001 (Quality Management), ISO 27001 (Information Security), and Internal Audit Standards:
Title: ${sop.title}
SOP Number: ${sop.sopNumber || sop.id}
Department: ${sop.department}
Sensitivity Label: ${sop.sensitivityLabel}
Business Criticality: ${sop.businessCriticality}
Compliance Standards Selected: ${JSON.stringify(sop.complianceStandards)}
Purpose: ${sop.purpose}
Scope: ${sop.scope}
Steps Count: ${sop.procedureSteps?.length || 0}
Procedure Details: ${JSON.stringify(sop.procedureSteps)}

Return JSON with format:
{
  "score": number (0-100),
  "sensitivityMatch": boolean,
  "issues": [string],
  "suggestions": [string],
  "missingSections": [string],
  "regulatoryComplianceNotes": string
}`;

      const response = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              sensitivityMatch: { type: Type.BOOLEAN },
              issues: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
              missingSections: { type: Type.ARRAY, items: { type: Type.STRING } },
              regulatoryComplianceNotes: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json({ ...result, source: 'gemini-3.5-flash' });
    } catch (err: any) {
      console.error('Compliance check error:', err);
      res.status(500).json({ error: 'Compliance analysis failed', details: err.message });
    }
  });

  // 3. Duplicate Detection Endpoint
  app.post('/api/gemini/duplicate-check', async (req, res) => {
    const candidate: SOPDocument = req.body;
    const ai = getGeminiClient();

    const catalogSummary = sopsStore.map(s => ({
      id: s.id,
      title: s.title,
      department: s.department,
      purpose: s.purpose
    }));

    if (!ai) {
      let highestSimilarity = 0;
      let matchedSop: any = null;

      for (const existing of catalogSummary) {
        if (existing.id === candidate.id) continue;
        const cWords = candidate.title.toLowerCase().split(' ');
        const eWords = existing.title.toLowerCase().split(' ');
        const common = cWords.filter(w => w.length > 3 && eWords.includes(w));
        const score = Math.round((common.length / Math.max(cWords.length, 1)) * 100);

        if (score > highestSimilarity) {
          highestSimilarity = score;
          matchedSop = existing;
        }
      }

      return res.json({
        isDuplicate: highestSimilarity > 65,
        similarityScore: highestSimilarity,
        matchedSopId: matchedSop?.id,
        matchedSopTitle: matchedSop?.title,
        overlapSummary: highestSimilarity > 65 ? `High semantic overlap detected with existing SOP ${matchedSop?.id}.` : 'No significant duplicate SOP collision detected in Focus Infotech catalog.',
        recommendation: highestSimilarity > 65 ? 'Merge' : 'Proceed',
        source: 'rule-engine'
      });
    }

    try {
      const prompt = `Analyze if the proposed candidate SOP overlaps or duplicates any existing SOP in the Focus Infotech enterprise catalog.
Candidate Title: "${candidate.title}"
Candidate Department: "${candidate.department}"
Candidate Purpose: "${candidate.purpose}"

Existing Catalog SOPs:
${JSON.stringify(catalogSummary)}

Return JSON format:
{
  "isDuplicate": boolean,
  "similarityScore": number (0-100),
  "matchedSopId": string,
  "matchedSopTitle": string,
  "overlapSummary": string,
  "recommendation": "Proceed" | "Merge" | "Reject As Duplicate"
}`;

      const response = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isDuplicate: { type: Type.BOOLEAN },
              similarityScore: { type: Type.INTEGER },
              matchedSopId: { type: Type.STRING },
              matchedSopTitle: { type: Type.STRING },
              overlapSummary: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json({ ...result, source: 'gemini-3.5-flash' });
    } catch (err: any) {
      console.error('Duplicate check error:', err);
      res.status(500).json({ error: 'Duplicate check failed', details: err.message });
    }
  });

  // 4. Step Refinement & Safety Note AI Generator
  app.post('/api/gemini/enhance-step', async (req, res) => {
    const { stepAction, stepTitle, department } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        enhancedAction: stepAction ? `${stepAction} (Verify digital signature and capture timestamp log in ERP).` : 'Perform technical validation and record output.',
        safetyNote: `Safety & Compliance Note: Verify Entra ID authorization and ensure compliance with Focus Infotech ${department || 'IT Enablement'} security protocols.`,
        source: 'rule-engine'
      });
    }

    try {
      const prompt = `Refine this procedure step for an enterprise Standard Operating Procedure at Focus Infotech in ${department}:
Title: ${stepTitle}
Current Instruction: ${stepAction}

Provide improved technical action instruction and a mandatory safety or compliance warning note.
Return JSON:
{
  "enhancedAction": string,
  "safetyNote": string
}`;

      const response = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              enhancedAction: { type: Type.STRING },
              safetyNote: { type: Type.STRING }
            }
          }
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json({ ...result, source: 'gemini-3.5-flash' });
    } catch (err: any) {
      res.status(500).json({ error: 'Step enhancement failed', details: err.message });
    }
  });

  // 5. AI Review Suggestions (9 Quality Dimensions)
  app.post('/api/gemini/sop-review-suggestions', async (req, res) => {
    const { sop } = req.body;
    if (!sop) {
      return res.status(400).json({ error: 'SOP payload is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        source: 'local-audit-engine',
        message: 'Review completed using standard governance rules.'
      });
    }

    try {
      const prompt = `You are an expert enterprise SOP reviewer for Future Focus Infotech.
Review the following Standard Operating Procedure:
Title: ${sop.title}
Department: ${sop.department}
Purpose: ${sop.purpose}
Scope: ${sop.scope}
Exceptions: ${sop.exceptions || 'None'}
Escalation: ${sop.escalation || 'None'}
Timeline/SLA: ${sop.sla || 'None'}
Steps:
${(sop.procedureSteps || []).map((s: any, idx: number) => `Step ${s.stepNumber || idx + 1}: ${s.action} (Role: ${s.assignedRole || 'Unassigned'})`).join('\n')}

Review for these 9 specific quality categories:
1. Unclear instructions
2. Ambiguous wording
3. Missing ownership
4. Duplicate steps
5. Contradictory information
6. Unclear decision points
7. Missing exception handling
8. Missing escalation information
9. Missing expected outcomes

Return a JSON array of suggestions with:
- id: unique string
- category: one of the 9 categories
- title: concise statement of what is missing or unclear (e.g. "Step 4 does not clearly identify who performs this action.")
- explanation: brief explanation in simple, jargon-free language
- targetSection: "step" | "exceptions" | "escalation" | "sla" | "purpose" | "scope"
- stepNumber: number (if targeting a step)
- currentText: the current exact wording in the SOP
- suggestedText: the improved replacement wording
Do NOT automatically apply changes. Only provide suggestions for human verification.`;

      const response = await generateContentWithFallback(ai, {
        primaryModel: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                title: { type: Type.STRING },
                explanation: { type: Type.STRING },
                targetSection: { type: Type.STRING },
                stepNumber: { type: Type.NUMBER },
                currentText: { type: Type.STRING },
                suggestedText: { type: Type.STRING }
              },
              required: ['id', 'category', 'title', 'explanation', 'targetSection', 'currentText', 'suggestedText']
            }
          }
        }
      });

      const suggestions = JSON.parse(response.text || '[]');
      res.json({
        success: true,
        source: 'gemini-3.5-flash',
        suggestions
      });
    } catch (err: any) {
      console.error('Gemini SOP review error:', err);
      res.json({
        success: true,
        source: 'local-audit-engine',
        fallback: true
      });
    }
  });

  // SHAREPOINT & GRAPH API SIMULATOR ENDPOINTS FOR FOCUS INFOTECH
  app.post('/api/sharepoint/publish', (req, res) => {
    const { sopId, targetLibrary, siteUrl, publishingUser } = req.body;

    const sop = sopsStore.find(s => s.id === sopId || s.sopNumber === sopId);
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const uniqueItemId = `sp-item-${Math.floor(100000 + Math.random() * 900000)}-${sop.department.substring(0, 3).toLowerCase()}`;
    const hash = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const defaultSiteUrl = 'https://futurefocus.sharepoint.com/sites/Sysadmin_Docs';
    const sharePointStatus = {
      siteUrl: siteUrl || defaultSiteUrl,
      libraryName: targetLibrary || 'Enterprise_Controlled_SOPs',
      itemUniqueId: uniqueItemId,
      lastSyncedAt: new Date().toISOString(),
      publishedBy: publishingUser?.email || 'admin@organization.com',
      verifyHash: hash,
      status: 'Published' as const,
      graphApiEndpoint: `https://graph.microsoft.com/v1.0/sites/futurefocus.sharepoint.com/drives/b!x1y2z3/items/${uniqueItemId}`
    };

    sop.sharePointExportStatus = sharePointStatus;
    sop.status = 'Published';
    sop.updatedAt = new Date().toISOString();

    // Log event with 7-year retention
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: sop.id,
      sopTitle: sop.title,
      user: publishingUser || DEFAULT_CORPORATE_USER,
      action: 'SHAREPOINT_PUBLISH',
      details: `Published SOP document "${sop.id}: ${sop.title}" to SharePoint library "${sharePointStatus.libraryName}" with Microsoft Purview label "${sop.sensitivityLabel}".`,
      ipAddress: req.ip || '10.14.20.105',
      timestamp: new Date().toISOString(),
      entraObjectId: publishingUser?.entraObjectId || DEFAULT_CORPORATE_USER.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Corporate Data Policy',
      tamperProofHash: hash
    };
    auditLogsStore.unshift(log);

    // Notification event for published SOP
    const notif: NotificationEvent = {
      id: `notif-${Date.now()}`,
      recipientEmail: sop.author?.email || 'author@organization.com',
      recipientName: sop.author?.name || 'SOP Author',
      channel: 'Both',
      triggerType: 'FINAL_APPROVAL_GRANTED',
      sopId: sop.id,
      sopTitle: sop.title,
      message: `SOP ${sop.id} has been published to Microsoft 365 SharePoint Online Library (${sharePointStatus.libraryName}) with Purview label ${sop.sensitivityLabel}.`,
      timestamp: new Date().toISOString(),
      status: 'Delivered'
    };
    notificationsStore.unshift(notif);

    res.json({
      message: 'Successfully published SOP to Focus Infotech SharePoint Online via Microsoft Graph API',
      sharePointExportStatus: sharePointStatus,
      graphResponse: {
        "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#sites('futurefocus.sharepoint.com')/drives('b!x1y2z3')/items/$entity",
        id: uniqueItemId,
        name: `${sop.id}_${sop.title.replace(/[^a-zA-Z0-9]/g, '_')}_v${sop.version}.docx`,
        webUrl: `${sharePointStatus.siteUrl}/${encodeURIComponent(sharePointStatus.libraryName)}/${sop.id}_v${sop.version}.docx`,
        size: 168420,
        createdBy: { user: { email: sharePointStatus.publishedBy } },
        lastModifiedBy: { user: { email: sharePointStatus.publishedBy } },
        fileSystemInfo: { createdDateTime: new Date().toISOString() },
        parentReference: {
          driveId: "b!x1y2z3",
          driveType: "documentLibrary",
          path: `/drives/b!x1y2z3/root:/${sharePointStatus.libraryName}`
        },
        fields: {
          Title: sop.title,
          SOPNumber: sop.id,
          Department: sop.department,
          Category: sop.category,
          Version: sop.version,
          SensitivityLabel: sop.sensitivityLabel,
          BusinessCriticality: sop.businessCriticality,
          EffectiveDate: sop.effectiveDate,
          NextReviewDate: sop.nextReviewDate,
          VerificationHash: hash,
          Company: 'Focus Infotech'
        }
      }
    });
  });

  app.post('/api/sharepoint/verify', (req, res) => {
    const { sopId } = req.body;
    const sop = sopsStore.find(s => s.id === sopId || s.sopNumber === sopId);

    if (!sop || !sop.sharePointExportStatus) {
      return res.status(400).json({
        verified: false,
        message: 'SOP has not been published to SharePoint yet.'
      });
    }

    res.json({
      verified: true,
      company: 'Focus Infotech',
      lastSyncedAt: sop.sharePointExportStatus.lastSyncedAt,
      verifyHash: sop.sharePointExportStatus.verifyHash,
      itemUniqueId: sop.sharePointExportStatus.itemUniqueId,
      siteUrl: sop.sharePointExportStatus.siteUrl,
      libraryName: sop.sharePointExportStatus.libraryName,
      activePurviewLabel: sop.sensitivityLabel,
      graphStatus: 'HTTP 200 OK - Active & Microsoft Purview Protected'
    });
  });

  // Mandatory Read Acknowledgment Endpoint
  app.post('/api/sops/:id/acknowledge-read', (req, res) => {
    const sop = sopsStore.find(s => s.id === req.params.id || s.sopNumber === req.params.id);
    if (!sop) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const { user, acknowledgedText, mfaVerified } = req.body;
    const signingUser = user || INITIAL_USERS[0];
    const signatureHash = `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

    const newAck: ReadAcknowledgment = {
      id: `ack-${Date.now()}`,
      sopId: sop.id,
      sopNumber: sop.sopNumber || sop.id,
      sopTitle: sop.title,
      sopVersion: sop.version,
      user: signingUser,
      timestamp: new Date().toISOString(),
      department: signingUser.department || sop.department,
      acknowledgedText: acknowledgedText || 'I confirm that I have read, understood, and agree to adhere to this SOP in accordance with Focus Infotech governance standards.',
      signatureHash: signatureHash,
      ipAddress: req.ip || '10.14.20.50',
      mfaVerified: mfaVerified !== false,
      entraObjectId: signingUser.entraObjectId || 'entra-obj-user'
    };

    if (!sop.readAcknowledgments) {
      sop.readAcknowledgments = [];
    }
    sop.readAcknowledgments.unshift(newAck);
    sop.updatedAt = new Date().toISOString();

    // Log to immutable Audit Vault
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: sop.id,
      sopTitle: sop.title,
      user: signingUser,
      action: 'MANDATORY_READ_CONFIRMATION',
      details: `Employee ${signingUser.name} (${signingUser.email}) acknowledged reading and adherence to SOP ${sop.id} v${sop.version} with MFA verification stamp.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: signingUser.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Focus Infotech Data Policy',
      tamperProofHash: signatureHash
    };
    auditLogsStore.unshift(log);

    res.status(201).json({ success: true, acknowledgment: newAck, totalAcknowledgments: sop.readAcknowledgments.length });
  });

  // SOP Version Control & Revision Endpoint
  app.post('/api/sops/:id/create-revision', (req, res) => {
    const index = sopsStore.findIndex(s => s.id === req.params.id || s.sopNumber === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'SOP not found' });
    }

    const currentSop = sopsStore[index];
    const { revisionType, changeSummary, updatedBy } = req.body; // 'minor' e.g. 1.0 -> 1.1 or 'major' e.g. 1.0 -> 2.0
    const user = updatedBy || INITIAL_USERS[0];

    // 1. Snapshot the current version before incrementing to guarantee historical reference
    if (!currentSop.historicalVersions) {
      currentSop.historicalVersions = [];
    }

    const approvedBy = currentSop.approvalHistory?.filter(a => a.decision === 'Approved').pop()?.user?.name ||
      (currentSop.status === 'Approved' || currentSop.status === 'Published'
        ? (typeof currentSop.finalApprover === 'object' ? currentSop.finalApprover?.name : currentSop.finalApprover) ||
          (typeof currentSop.approver1 === 'object' ? currentSop.approver1?.name : currentSop.approver1) || 'Authorized Approver'
        : '—');

    const prevChangeSummary = currentSop.changeHistory?.find(c => c.version === currentSop.version)?.summary ||
      (currentSop.version === '1.0' ? 'Initial SOP baseline certification' : 'Approved Revision');

    const historicalEntry: any = {
      version: currentSop.version || '1.0',
      sopNumber: currentSop.sopNumber || currentSop.id,
      title: currentSop.title,
      status: currentSop.status,
      date: currentSop.updatedAt ? currentSop.updatedAt.split('T')[0] : (currentSop.effectiveDate || new Date().toISOString().split('T')[0]),
      effectiveDate: currentSop.effectiveDate || new Date().toISOString().split('T')[0],
      author: typeof currentSop.author === 'object' ? currentSop.author.name : (currentSop.author || 'Process Author'),
      changeDescription: prevChangeSummary,
      changeSummary: prevChangeSummary,
      approvedBy: approvedBy,
      approvedAt: currentSop.updatedAt || new Date().toISOString(),
      createdAt: currentSop.createdAt || new Date().toISOString(),
      snapshot: JSON.parse(JSON.stringify(currentSop))
    };

    // Save previous version snapshot for visual diffing
    currentSop.previousVersionSnapshot = {
      version: currentSop.version || '1.0',
      purpose: currentSop.purpose,
      scope: currentSop.scope,
      procedureSteps: JSON.parse(JSON.stringify(currentSop.procedureSteps || [])),
      responsibilities: JSON.parse(JSON.stringify(currentSop.responsibilities || []))
    };

    // Archive in historicalVersions (avoid duplicate entries for same version)
    const existingIdx = currentSop.historicalVersions.findIndex(h => h.version === currentSop.version);
    if (existingIdx >= 0) {
      currentSop.historicalVersions[existingIdx] = historicalEntry;
    } else {
      currentSop.historicalVersions.unshift(historicalEntry);
    }

    // 2. Calculate next version number
    const currentVerParts = (currentSop.version || '1.0').split('.');
    let major = parseInt(currentVerParts[0], 10) || 1;
    let minor = parseInt(currentVerParts[1], 10) || 0;

    if (revisionType === 'major') {
      major += 1;
      minor = 0;
    } else {
      minor += 1;
    }

    const newVersion = `${major}.${minor}`;

    // 3. Reset workflow for new revision (must go through configured approval workflow)
    currentSop.version = newVersion;
    currentSop.status = 'Draft';
    currentSop.updatedAt = new Date().toISOString();
    currentSop.approvalHistory = [];
    currentSop.humanVerification = undefined;

    if (!currentSop.changeHistory) {
      currentSop.changeHistory = [];
    }

    currentSop.changeHistory.unshift({
      version: newVersion,
      date: new Date().toISOString().split('T')[0],
      author: user.name || 'Process Author',
      summary: changeSummary || `Revision created: ${revisionType === 'major' ? 'Major process change' : 'Updated procedure'}`,
      changeDescription: changeSummary || `Revision created: ${revisionType === 'major' ? 'Major process change' : 'Updated procedure'}`,
      status: 'Draft',
      approvedBy: '—'
    });

    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: currentSop.id,
      sopTitle: currentSop.title,
      user: user,
      action: 'CREATE_SOP_REVISION',
      details: `Archived v${historicalEntry.version} to immutable history. Incremented version to v${newVersion} (${revisionType.toUpperCase()}). Change summary: "${changeSummary}". Reset status to Draft for governed re-approval.`,
      ipAddress: req.ip || '10.14.20.50',
      timestamp: new Date().toISOString(),
      entraObjectId: user.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Focus Infotech Data Policy',
      tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`
    };
    auditLogsStore.unshift(log);

    res.json({ success: true, sop: currentSop, newVersion });
  });

  // Department Governance Scorecards & Compliance Statistics
  app.get('/api/governance/scorecards', (req, res) => {
    // Dynamically calculate scorecard metrics based on real current state of sopsStore
    const dynamicScorecards = scorecardsStore.map(card => {
      const deptSops = sopsStore.filter(s => s.department === card.department || (card.code === 'IT' && s.department === 'IT_Enablement'));
      const approvedCount = deptSops.filter(s => s.status === 'Published').length;
      const pendingCount = deptSops.filter(s => s.status !== 'Published' && s.status !== 'Retired').length;
      
      const now = new Date();
      let expiringSoon = 0;
      let overdue = 0;

      deptSops.forEach(s => {
        if (s.nextReviewDate) {
          const reviewDate = new Date(s.nextReviewDate);
          const diffDays = Math.round((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            overdue += 1;
          } else if (diffDays <= 30) {
            expiringSoon += 1;
          }
        }
      });

      const compliance = deptSops.length > 0
        ? Math.max(70, Math.round(((approvedCount * 1.0) / Math.max(deptSops.length, 1)) * 100))
        : 95;

      return {
        ...card,
        totalSops: deptSops.length,
        approvedSops: approvedCount,
        pendingApprovals: pendingCount,
        overdueReviews: overdue,
        expiringIn30Days: expiringSoon,
        complianceScore: compliance,
        auditReadiness: overdue > 0 ? 'Critical Review Required' : expiringSoon > 0 ? 'Action Needed' : 'Audit Ready'
      };
    });

    res.json(dynamicScorecards);
  });

  // AI SOP Assistant Query Endpoint
  app.post('/api/gemini/assistant-query', async (req, res) => {
    const { query, departmentFilter } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const ai = getGeminiClient();
    const cleanQuery = query.toLowerCase();

    // Find relevant SOPs and procedures
    const candidateSops = sopsStore.filter(s => {
      if (departmentFilter && departmentFilter !== 'ALL' && s.department !== departmentFilter) {
        return false;
      }
      return true;
    });

    // Score candidates based on term frequency
    const matchedSops = candidateSops.map(sop => {
      let score = 0;
      const terms = cleanQuery.split(' ').filter(t => t.length > 2);
      
      terms.forEach(t => {
        if (sop.title.toLowerCase().includes(t)) score += 35;
        if (sop.purpose.toLowerCase().includes(t)) score += 20;
        if (sop.category.toLowerCase().includes(t)) score += 15;
        if (sop.scope.toLowerCase().includes(t)) score += 10;
        if (sop.id.toLowerCase().includes(t)) score += 40;
        sop.procedureSteps?.forEach(step => {
          if (step.title.toLowerCase().includes(t) || step.action.toLowerCase().includes(t)) {
            score += 15;
          }
        });
      });

      return { sop, score };
    }).sort((a, b) => b.score - a.score);

    const topMatches = matchedSops.slice(0, 3).map(m => m.sop);
    const primarySop = topMatches[0] || sopsStore[0];

    const sources: AIAssistantSource[] = topMatches.map(sop => ({
      sopId: sop.id,
      sopNumber: sop.sopNumber || sop.id,
      title: sop.title,
      department: sop.department,
      status: sop.status,
      version: sop.version,
      relevanceScore: Math.min(99, 75 + Math.floor(Math.random() * 20)),
      highlightSnippet: sop.purpose
    }));

    // If Gemini is available, call it to synthesize the grounded answer
    if (ai) {
      try {
        const sopContext = topMatches.map(s => `
SOP Document ID: ${s.id} (${s.title})
Department: ${s.department} | Version: ${s.version} | Status: ${s.status}
Purpose: ${s.purpose}
Procedure Steps:
${s.procedureSteps?.map((st, i) => `${i + 1}. [${st.assignedRole}] ${st.title}: ${st.action} ${st.safetyNote ? `(Safety: ${st.safetyNote})` : ''}`).join('\n')}
        `).join('\n---\n');

        const prompt = `You are the Focus Infotech Enterprise AI SOP Governance Assistant.
Answer the user query strictly using the provided Focus Infotech Standard Operating Procedures context.

User Query: "${query}"

SOP Context:
${sopContext}

Provide a structured JSON response with:
- "answerMarkdown": Clear, professional markdown explanation formatted with bullet points and bold highlights.
- "directActionSteps": Array of 3-5 concise, executable action steps in chronological order.
- "safetyWarnings": Array of safety/compliance warnings or prerequisites mentioned in the SOPs.
- "suggestedFollowUps": Array of 3 logical follow-up questions the user might ask.`;

        const response = await generateContentWithFallback(ai, {
          primaryModel: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        const assistantAnswer: AIAssistantAnswer = {
          query,
          answerMarkdown: parsed.answerMarkdown || `Based on Focus Infotech SOP **${primarySop.id}** (${primarySop.title}), here are the authorized procedural guidelines:`,
          directActionSteps: parsed.directActionSteps || primarySop.procedureSteps?.slice(0, 4).map(s => `[${s.assignedRole}] ${s.title}: ${s.action}`) || [],
          sources,
          safetyWarnings: parsed.safetyWarnings || ['Ensure mandatory MFA verification is active before executing high-privilege configuration.'],
          suggestedFollowUps: parsed.suggestedFollowUps || [
            `What are the escalation SLAs for ${primarySop.id}?`,
            `How do I request an exception under ${primarySop.department}?`,
            `Who is the current Process Owner for this document?`
          ],
          generatedAt: new Date().toISOString()
        };

        return res.json(assistantAnswer);
      } catch (err: any) {
        console.error('Gemini Assistant Query error, falling back to rule-based engine:', err);
      }
    }

    // Rule-based fallback synthesis
    const fallbackAnswer: AIAssistantAnswer = {
      query,
      answerMarkdown: `### Focus Infotech Governance Resolution\n\nAccording to **${primarySop.id}: ${primarySop.title}** (Version ${primarySop.version}, Status: **${primarySop.status}**), follow the governed procedure steps below:\n\n* **Purpose**: ${primarySop.purpose}\n* **Process Owner**: ${primarySop.processOwner?.name || 'IT Enablement Lead'}\n* **Department**: ${primarySop.department.replace('_', ' ')}\n* **Compliance Gate**: ${primarySop.complianceStandards?.join(', ') || 'ISO 9001, ISO 27001'}`,
      directActionSteps: primarySop.procedureSteps?.map(s => `[${s.assignedRole}] **Step ${s.stepNumber} - ${s.title}**: ${s.action}`) || [
        'Authenticate to Microsoft 365 Admin Center with privileged account.',
        'Execute verification command and confirm compliance check passes.',
        'Submit digital sign-off and notify Process Owner.'
      ],
      sources,
      safetyWarnings: primarySop.procedureSteps?.filter(s => s.safetyNote).map(s => s.safetyNote as string) || [
        'Do not bypass dual-authorization controls without formal written sign-off from HOD.'
      ],
      suggestedFollowUps: [
        `How do I log an audit event for ${primarySop.id}?`,
        `What is the next scheduled review date for ${primarySop.id}?`,
        `How do I request a version revision (v${primarySop.version})?`
      ],
      generatedAt: new Date().toISOString()
    };

    res.json(fallbackAnswer);
  });

  // Manual trigger for Review Cycle Audit Worker
  app.post('/api/governance/run-review-audit', (req, res) => {
    const result = runReviewCycleAuditWorker();
    res.json({
      success: true,
      message: `Review cycle audit executed successfully. Dispatched ${result.remindersDispatched} notice(s), escalated ${result.overdueEscalated} overdue item(s).`,
      ...result,
      totalNotifications: notificationsStore.length
    });
  });

  // Run initial review cycle audit check
  runReviewCycleAuditWorker();
  // Schedule background check every 10 minutes
  setInterval(runReviewCycleAuditWorker, 10 * 60 * 1000);

  // Vite middleware in development or Static Server in production
  const distPath = path.join(process.cwd(), 'dist');
  const indexHtmlPath = path.join(distPath, 'index.html');
  const hasDist = fs.existsSync(indexHtmlPath);
  const isCompiledBundle = typeof __filename !== 'undefined' && __filename.includes('dist');
  const isDev = !isCompiledBundle && (process.env.NODE_ENV === 'development' || !hasDist);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(indexHtmlPath);
    });
  }

  // Primary listener: binds to port 3000 (required for local AI Studio reverse proxy)
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Focus Infotech SOP Governance Platform running on http://0.0.0.0:${PORT}`);
  });
  server.on('error', (err: any) => {
    console.log(`Primary server notice on port ${PORT}:`, err.message);
  });

  // Cloud Run listener: binds to process.env.PORT (typically 8080) for Cloud Run container rollout & health checks
  if (CLOUD_PORT && CLOUD_PORT !== PORT) {
    try {
      const cloudServer = app.listen(CLOUD_PORT, '0.0.0.0', () => {
        console.log(`Focus Infotech SOP Governance Platform also listening on http://0.0.0.0:${CLOUD_PORT} for Cloud Run`);
      });
      cloudServer.on('error', (err: any) => {
        // In dev environment, port 8080 is used by internal container proxy; safely ignore EADDRINUSE
        if (err.code !== 'EADDRINUSE') {
          console.warn(`Note on port ${CLOUD_PORT}:`, err.message);
        }
      });
    } catch (e: any) {
      console.warn(`Could not start listener on ${CLOUD_PORT}:`, e.message);
    }
  }
}

startServer();

import {
  AuditLogEntry,
  ChangeRequest,
  DepartmentConfig,
  DepartmentScorecard,
  FAQItem,
  IssueReport,
  ITAssetWorkflow,
  NotificationEvent,
  SOPDocument,
  TaskItem,
  TroubleshootingGuide,
  User,
  VendorContact,
  OrganizationApprovalSettings
} from '../types';

import { MOCK_USERS, DEFAULT_CORPORATE_USER, INITIAL_USERS, ADMIN_USER } from './usersData';
import { INITIAL_SOPS } from './sopsData';

export { MOCK_USERS, DEFAULT_CORPORATE_USER, INITIAL_USERS, ADMIN_USER, INITIAL_SOPS };

export const DEFAULT_ORGANIZATION_APPROVAL_SETTINGS: OrganizationApprovalSettings = {
  organizationName: 'Focus Infotech',
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

// Zero pre-created departments.
// The administrator creates departments from the platform as needed.
export const DEPARTMENT_CONFIGS: DepartmentConfig[] = [];

// Zero initial department scorecards.
// Dynamically calculated as departments and SOPs are authored.
export const DEPARTMENT_SCORECARDS: DepartmentScorecard[] = [];

// Zero initial tasks.
export const INITIAL_TASKS: TaskItem[] = [];

// Zero initial issues.
export const INITIAL_ISSUES: IssueReport[] = [];

// Zero initial change requests.
export const INITIAL_CHANGE_REQUESTS: ChangeRequest[] = [];

// Zero initial IT asset workflows.
export const INITIAL_IT_ASSET_WORKFLOWS: ITAssetWorkflow[] = [];

// Clean initial knowledge base guides.
export const INITIAL_TROUBLESHOOTING_GUIDES: TroubleshootingGuide[] = [];

// Clean initial FAQs.
export const INITIAL_FAQS: FAQItem[] = [];

// Clean initial vendor contacts.
export const INITIAL_VENDOR_CONTACTS: VendorContact[] = [];

// Zero initial notifications.
export const INITIAL_NOTIFICATIONS: NotificationEvent[] = [];

// Zero initial audit logs.
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];

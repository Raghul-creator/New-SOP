import {
  Department,
  SensitivityLabel,
  BusinessCriticality,
  ComplianceStandard,
  ResponsibilityItem,
  ProcedureStep,
  DefinitionItem,
  ReferenceItem
} from '../types';

export type TemplateType =
  | 'Policy'
  | 'Process'
  | 'Work_Instruction'
  | 'Playbook'
  | 'Checklist'
  | 'Blank';

export interface SOPTemplate {
  id: string;
  type: TemplateType;
  level: string; // e.g. "Level 1: Policy", "Level 2: Process / SOP", "Level 3: Work Instruction"
  title: string;
  name: string;
  badge: string;
  badgeColor: string; // Tailwind color class for badge
  cardBorderColor: string;
  iconName: 'ShieldCheck' | 'Layers' | 'Wrench' | 'AlertTriangle' | 'FileCheck2' | 'FileText';
  summary: string;
  recommendedFor: string[];
  keyControls: string[];
  defaultValues: {
    titlePlaceholder: string;
    sopNumberPrefix: string;
    category: string;
    department: Department;
    sensitivityLabel: SensitivityLabel;
    businessCriticality: BusinessCriticality;
    complianceStandards: ComplianceStandard[];
    reviewFrequencyMonths: number;
    purpose: string;
    scope: string;
    responsibilities: ResponsibilityItem[];
    procedureSteps: ProcedureStep[];
    definitions: DefinitionItem[];
    references: ReferenceItem[];
    guidedInterviewGoalPlaceholder: string;
    guidedInterviewAudiencePlaceholder: string;
    guidedInterviewStepsPlaceholder: string;
    guidedInterviewSafetyPlaceholder: string;
  };
}

export const PREDEFINED_SOP_TEMPLATES: SOPTemplate[] = [
  {
    id: 'template-policy',
    type: 'Policy',
    level: 'Level 1: Governance Policy',
    title: 'Corporate Policy Template',
    name: 'Governance Policy',
    badge: 'Mandatory Governance',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cardBorderColor: 'hover:border-indigo-400',
    iconName: 'ShieldCheck',
    summary: 'High-level organizational mandates, core principles, compliance directives, and non-negotiable governance rules.',
    recommendedFor: [
      'Information Security & Access Management',
      'Data Privacy & Retention Mandates',
      'Supplier Governance & Ethical Conduct',
      'Acceptable Use & Device Security Policies'
    ],
    keyControls: [
      'Executive Leadership & Board Level Approval',
      'Annual Mandatory Employee Attestation',
      'Disciplinary & Non-Compliance Enforcement Clauses',
      '7-Year ISO Audit Retention Schedule'
    ],
    defaultValues: {
      titlePlaceholder: 'Corporate Information Security & Data Protection Policy',
      sopNumberPrefix: 'POL-IT-',
      category: 'Corporate Governance & IT Policy',
      department: 'IT_Enablement',
      sensitivityLabel: 'Confidential',
      businessCriticality: 'High',
      complianceStandards: ['ISO 27001', 'ISO 9001', 'IT Security Policies', 'Data Retention Policies'],
      reviewFrequencyMonths: 12,
      purpose: 'Establish mandatory principles, governance standards, and operational boundaries across Future Focus Infotech to protect enterprise data assets, uphold ISO 27001 ISMS and ISO 9001 quality standards, and ensure strict compliance with statutory and contractual obligations.',
      scope: 'This policy applies unconditionally to all employees, contract consultants, vendors, third-party contractors, executive leadership, and systems operating within Future Focus Infotech and associated global delivery centers.',
      responsibilities: [
        {
          role: 'Governance Committee & Executive Leadership',
          description: 'Ratifies and sponsors enterprise-wide compliance policies; authorizes disciplinary actions for non-compliance.'
        },
        {
          role: 'Information Security & Compliance Head',
          description: 'Maintains policy documentation, conducts quarterly compliance audits, and monitors regulatory alignment.'
        },
        {
          role: 'Department Managers & People Leads',
          description: 'Enforces adherence within their respective functional units and tracks team acknowledgment completion.'
        },
        {
          role: 'All Personnel & Contractors',
          description: 'Responsible for reading, understanding, and strictly adhering to all mandated principles and guidelines.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-pol-1',
          stepNumber: 1,
          title: 'Mandatory Policy Principles & Core Mandates',
          action: 'All personnel must enforce minimum privilege access, multi-factor authentication (MFA), and mandatory encryption on all devices carrying corporate data.',
          assignedRole: 'All Personnel & Contractors',
          safetyNote: 'MANDATORY GOVERNANCE: Failure to adhere to access controls constitutes a direct breach of ISMS policies.',
          inputsOutputs: 'Input: Corporate Access Request | Output: Governed Compliant State',
          checklistItems: [
            'MFA enforcement verified on all cloud identities',
            'No shared or unmanaged service credentials utilized',
            'All corporate data stored strictly within approved Microsoft 365 / SharePoint enclaves'
          ]
        },
        {
          id: 'step-pol-2',
          stepNumber: 2,
          title: 'Annual Compliance Attestation & Audit Verification',
          action: 'Conduct mandatory annual policy re-certification and digital acknowledgment capture via the Future Focus Infotech Governance Portal.',
          assignedRole: 'Information Security & Compliance Head',
          safetyNote: 'Non-responsive accounts are flagged for automated access suspension following 14-day grace period.',
          inputsOutputs: 'Input: Annual Audit Cycle | Output: Signed Employee Attestation Log',
          checklistItems: [
            '100% employee attestation tracking in SharePoint audit vault',
            'Escalation report issued for non-attested contractors'
          ]
        },
        {
          id: 'step-pol-3',
          stepNumber: 3,
          title: 'Non-Compliance Triage & Disciplinary Enforcement',
          action: 'Any identified policy violations must be escalated immediately to the Incident Response Team and HR Disciplinary Committee.',
          assignedRole: 'Department Managers & People Leads',
          safetyNote: 'Maintain strict confidentiality and tamper-evident audit logs for all investigated incidents.',
          inputsOutputs: 'Input: Incident Incident Escalation | Output: Formal Disciplinary / Remediation Record'
        }
      ],
      definitions: [
        { term: 'ISMS', definition: 'Information Security Management System compliant with ISO 27001:2022' },
        { term: 'Attestation', definition: 'Formal, legally binding digital sign-off confirming understanding and adherence to corporate policies' },
        { term: 'Non-Compliance', definition: 'Any willful or negligent failure to follow mandated policy directives' }
      ],
      references: [
        { title: 'Future Focus Infotech Information Security Policy POL-SEC-01', urlOrDocId: 'POL-SEC-01' },
        { title: 'ISO/IEC 27001:2022 Information Security Standards', urlOrDocId: 'ISO-27001-2022' }
      ],
      guidedInterviewGoalPlaceholder: 'What organizational rule, security mandate, or corporate standard does this policy establish?',
      guidedInterviewAudiencePlaceholder: 'Who must follow this policy (e.g. All global employees, IT administrators, contractors)?',
      guidedInterviewStepsPlaceholder: 'Section 1: Core Governance Directives\nSection 2: Annual Verification & Attestation\nSection 3: Disciplinary & Breach Escalation',
      guidedInterviewSafetyPlaceholder: 'Specify regulatory compliance standards (e.g., ISO 27001 Annex A.5, GDPR, SOC 2).'
    }
  },
  {
    id: 'template-process',
    type: 'Process',
    level: 'Level 2: Standard Operating Procedure (Process)',
    title: 'Standard Operating Procedure (SOP) Template',
    name: 'Operational Process / SOP',
    badge: 'Cross-Functional Process',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    cardBorderColor: 'hover:border-cyan-400',
    iconName: 'Layers',
    summary: 'End-to-end operational workflows, stage-gate decision points, inter-departmental handoffs, and SLA responsibility matrices.',
    recommendedFor: [
      'IT Asset Provisioning & Refresh Lifecycles',
      'Employee Onboarding & Identity Provisioning',
      'Change Management & Release Deployments',
      'Vendor Security Evaluation & Onboarding'
    ],
    keyControls: [
      '4-Tier Role Approval Workflow (Reviewer -> Manager -> HOD -> Compliance)',
      'Defined Input / Output Criteria per Milestone',
      'SLA Timers & Escalation Paths',
      '12-Month Scheduled Review Cycle'
    ],
    defaultValues: {
      titlePlaceholder: 'IT Hardware Allocation & Zero-Touch Deployment SOP',
      sopNumberPrefix: 'IT-SOP-',
      category: 'IT Asset Management',
      department: 'IT_Enablement',
      sensitivityLabel: 'Internal',
      businessCriticality: 'High',
      complianceStandards: ['ISO 9001', 'ISO 27001', 'IT Security Policies'],
      reviewFrequencyMonths: 12,
      purpose: 'Define the standard operational workflow for orchestrating end-to-end tasks, ensuring cross-functional consistency, adherence to quality standards (ISO 9001), and seamless SLA adherence across all Future Focus Infotech departments.',
      scope: 'Applies to all operational teams, process owners, department coordinators, and service delivery personnel engaged in this workflow.',
      responsibilities: [
        {
          role: 'Process Owner (Operational Lead)',
          description: 'Owns end-to-end workflow execution, quality control, and procedural updates.'
        },
        {
          role: 'Reviewer (Team Lead)',
          description: 'Performs peer verification of executed steps, data entry accuracy, and SLA adherence.'
        },
        {
          role: 'Approver (Department Manager / HOD)',
          description: 'Authorizes resource allocations, system changes, and policy sign-offs.'
        },
        {
          role: 'Compliance & Quality Auditor',
          description: 'Verifies audit trails, ISO documentation alignment, and SharePoint archival integrity.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-sop-1',
          stepNumber: 1,
          title: 'Request Initiation & Prerequisite Validation',
          action: 'Receive service request ticket, validate authorization approvals, and verify resource availability in CMDB.',
          assignedRole: 'Process Owner (Operational Lead)',
          safetyNote: 'Do not initiate workflow without verified ticket number and authorized manager sign-off.',
          inputsOutputs: 'Input: Authorized Service Ticket | Output: Validated Request Clearance',
          checklistItems: [
            'Manager approval attached to ticket',
            'User identity verified in Entra ID',
            'Asset serial registered in inventory'
          ]
        },
        {
          id: 'step-sop-2',
          stepNumber: 2,
          title: 'Core Operational Processing & Execution',
          action: 'Execute procedural stages in accordance with standard criteria, logging timestamps and milestone progress.',
          assignedRole: 'Process Owner (Operational Lead)',
          safetyNote: 'Ensure adherence to security baselines during all intermediate data transmissions.',
          inputsOutputs: 'Input: Validated Request | Output: Processed Deliverable State',
          checklistItems: [
            'System configurations applied per checklist',
            'Baseline security configurations validated'
          ]
        },
        {
          id: 'step-sop-3',
          stepNumber: 3,
          title: 'Quality Verification & Acceptance Sign-off',
          action: 'Perform quality checks, obtain stakeholder acceptance confirmation, and finalize ticket resolution logs.',
          assignedRole: 'Reviewer (Team Lead)',
          safetyNote: 'Retain signed acceptance artifact in document repository for ISO audit sampling.',
          inputsOutputs: 'Input: Completed Deliverable | Output: Verified & Closed Request Record'
        }
      ],
      definitions: [
        { term: 'SOP', definition: 'Standard Operating Procedure governed under Future Focus Infotech quality framework' },
        { term: 'Process Owner', definition: 'Accountable operational manager responsible for document governance and workflow lifecycle' },
        { term: 'SLA', definition: 'Service Level Agreement defining agreed operational turnaround times' }
      ],
      references: [
        { title: 'Future Focus Infotech Quality Management Manual QMS-MAN-2026', urlOrDocId: 'QMS-MAN-2026' },
        { title: 'ISO 9001:2015 Quality Management System Standard', urlOrDocId: 'ISO-9001-2015' }
      ],
      guidedInterviewGoalPlaceholder: 'What operational workflow does this SOP standardize across teams?',
      guidedInterviewAudiencePlaceholder: 'Which departments, roles, and engineers execute this procedure?',
      guidedInterviewStepsPlaceholder: 'Step 1: Request intake and validation\nStep 2: Operational execution & milestone checks\nStep 3: Verification, testing & acceptance sign-off',
      guidedInterviewSafetyPlaceholder: 'Include quality thresholds, approval dependencies, and ISO 9001 controls.'
    }
  },
  {
    id: 'template-work-instruction',
    type: 'Work_Instruction',
    level: 'Level 3: Technical Work Instruction / Runbook',
    title: 'Work Instruction (Runbook) Template',
    name: 'Technical Work Instruction',
    badge: 'Granular Execution',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cardBorderColor: 'hover:border-emerald-400',
    iconName: 'Wrench',
    summary: 'Granular, step-by-step tactical execution guides for engineers with exact CLI commands, UI navigation paths, and safety warnings.',
    recommendedFor: [
      'Microsoft Intune Autopilot Zero-Touch Enrollment',
      'NIST SP 800-88 SSD Cryptographic Wiping',
      'PowerShell Spooler & Printer Queue Troubleshooting',
      'Entra ID TAP (Temporary Access Pass) Issuance'
    ],
    keyControls: [
      'Exact Tooling, CLI Syntax & UI Navigation Paths',
      'Explicit Safety, Data Loss & Electrical Hazards Callouts',
      'Input / Output Verification Artifacts per Step',
      '6-Month Rapid Technical Review Cycle'
    ],
    defaultValues: {
      titlePlaceholder: 'Microsoft Intune Autopilot Laptop Staging Work Instruction',
      sopNumberPrefix: 'IT-WI-',
      category: 'IT Support & Technical Runbooks',
      department: 'IT_Enablement',
      sensitivityLabel: 'Internal',
      businessCriticality: 'Medium',
      complianceStandards: ['ISO 27001', 'IT Security Policies'],
      reviewFrequencyMonths: 6,
      purpose: 'Provide precise, tactical step-by-step technical instructions for frontline engineers and technicians to execute system configuration, provisioning, or troubleshooting tasks safely, correctly, and repeatably.',
      scope: 'Directly applicable to IT Support Engineers, System Administrators, Field Technicians, and Operations Specialists performing hands-on system tasks.',
      responsibilities: [
        {
          role: 'Executing Technician / Engineer',
          description: 'Directly executes the tactical steps, follows CLI commands exactly, and records diagnostic logs.'
        },
        {
          role: 'Technical Reviewer / Lead Engineer',
          description: 'Reviews script updates, validates tool versions, and oversees complex escalations.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-wi-1',
          stepNumber: 1,
          title: 'Prerequisite Environment & Tool Setup',
          action: 'Launch administrative console (PowerShell as Administrator or Intune Admin Center). Verify secure network connectivity and administrative privileges.',
          assignedRole: 'Executing Technician / Engineer',
          safetyNote: 'MANDATORY: Ensure test unit is plugged into dedicated surge-protected AC power prior to firmware/OS modifications.',
          inputsOutputs: 'Input: Target Hardware / Tenant ID | Output: Authenticated Admin Session',
          checklistItems: [
            'Administrative PowerShell 7.x session open',
            'Target machine connected to Future Focus Infotech staging VLAN',
            'BitLocker recovery key verified in Entra ID'
          ]
        },
        {
          id: 'step-wi-2',
          stepNumber: 2,
          title: 'Step-by-Step Command Execution & Configuration',
          action: 'Execute tactical configuration sequence. Apply required policy profiles, verify service status, and confirm error-free execution logs.',
          assignedRole: 'Executing Technician / Engineer',
          safetyNote: 'Do not interrupt script execution during firmware flashing or encryption initialization.',
          inputsOutputs: 'Input: Configuration Payload | Output: Applied Policy Registry Keys',
          checklistItems: [
            'Status code 0 (Success) confirmed on all script executions',
            'Registry baseline matches approved golden image schema'
          ]
        },
        {
          id: 'step-wi-3',
          stepNumber: 3,
          title: 'Verification Testing & Evidence Capture',
          action: 'Run diagnostic health checks. Capture output log screenshot or hash record, and attach to the service ticket.',
          assignedRole: 'Executing Technician / Engineer',
          safetyNote: 'Never expose plain-text passwords or secret keys in captured screenshots or log attachments.',
          inputsOutputs: 'Input: Configured System | Output: Verified Functional Test Report'
        }
      ],
      definitions: [
        { term: 'Work Instruction (WI)', definition: 'Detailed, highly specific procedural guide instructing an individual on how to perform a discrete technical task' },
        { term: 'Golden Image', definition: 'Standardized, hardened operating system build configured according to Future Focus Infotech security baselines' }
      ],
      references: [
        { title: 'Future Focus Infotech Endpoint Hardening Standard SEC-EP-01', urlOrDocId: 'SEC-EP-01' },
        { title: 'Microsoft Intune Technical Documentation', urlOrDocId: 'MS-INTUNE-DOCS' }
      ],
      guidedInterviewGoalPlaceholder: 'What specific technical procedure or troubleshooting task is being executed?',
      guidedInterviewAudiencePlaceholder: 'Which technical role executes these instructions (e.g. IT Support Engineers)?',
      guidedInterviewStepsPlaceholder: 'Step 1: Open PowerShell as Admin and verify connectivity\nStep 2: Run configuration commands and apply profiles\nStep 3: Test functionality and save verification logs',
      guidedInterviewSafetyPlaceholder: 'Call out syntax risks, data overwrite cautions, or hardware safety requirements.'
    }
  },
  {
    id: 'template-playbook',
    type: 'Playbook',
    level: 'Level 3: Incident Response & Emergency Playbook',
    title: 'Incident Response Playbook Template',
    name: 'Incident Response Playbook',
    badge: 'Critical Triage & SLA',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    cardBorderColor: 'hover:border-rose-400',
    iconName: 'AlertTriangle',
    summary: 'Rapid-action containment protocols, severity triage matrices, emergency communication trees, and post-incident forensic reviews.',
    recommendedFor: [
      'Ransomware & Malware Outbreak Containment',
      'Critical Network Outage & Failover Protocols',
      'Data Breach & Unauthorized Exfiltration Handling',
      'Disaster Recovery & Business Continuity Invocations'
    ],
    keyControls: [
      'Severity Level Triage (Sev 1 / Sev 2 / Sev 3) with SLA Timers',
      'Emergency Incident Commander & Communications Tree',
      'Strict Forensic Evidence Preservation & Chain of Custody',
      'Mandatory Post-Mortem RCA within 5 Business Days'
    ],
    defaultValues: {
      titlePlaceholder: 'Information Security Incident Response & Containment Playbook',
      sopNumberPrefix: 'IT-PB-',
      category: 'Security Operations & Incident Response',
      department: 'IT_Enablement',
      sensitivityLabel: 'Highly Confidential',
      businessCriticality: 'Mission Critical',
      complianceStandards: ['ISO 27001', 'IT Security Policies', 'Data Retention Policies'],
      reviewFrequencyMonths: 6,
      purpose: 'Establish standardized, rapid response protocols to detect, isolate, contain, and remediate high-severity incidents, minimizing business disruption and ensuring forensic integrity under ISO 27001 ISMS.',
      scope: 'Active across all Future Focus Infotech infrastructure, cloud tenants, corporate endpoints, network segments, and client delivery enclaves during a declared incident.',
      responsibilities: [
        {
          role: 'Incident Commander (SecOps Lead)',
          description: 'Directs all containment operations, assigns investigation tasks, and maintains executive status briefings.'
        },
        {
          role: 'Primary Forensic Analyst',
          description: 'Performs live memory captures, log analysis, network packet inspection, and preserves evidence.'
        },
        {
          role: 'Communications & Legal Liaison',
          description: 'Coordinates notifications to leadership, client stakeholders, and statutory bodies as legally required.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-pb-1',
          stepNumber: 1,
          title: 'Detection, Triage & Severity Classification',
          action: 'Identify alert indicators, declare incident severity (Sev 1 Critical, Sev 2 High, Sev 3 Medium), and establish the emergency bridge.',
          assignedRole: 'Incident Commander (SecOps Lead)',
          safetyNote: 'CRITICAL: Initiate SLA timer immediately upon triage confirmation. Sev 1 response window: <15 minutes.',
          inputsOutputs: 'Input: Security SIEM Alert | Output: Incident Bridge & Severity Declaration',
          checklistItems: [
            'Incident bridge activated in Microsoft Teams',
            'Severity level categorized and confirmed with CISO',
            'Incident ticket created in SecOps tracking system'
          ]
        },
        {
          id: 'step-pb-2',
          stepNumber: 2,
          title: 'Immediate Isolation & Containment Protocol',
          action: 'Isolate compromised endpoints via Microsoft Defender for Endpoint, revoke Entra ID active session tokens, and block malicious IPs on firewalls.',
          assignedRole: 'Primary Forensic Analyst',
          safetyNote: 'DO NOT power off endpoints abruptly to avoid corrupting volatile RAM forensics.',
          inputsOutputs: 'Input: Compromised Asset List | Output: Isolated Segment & Revoked Tokens',
          checklistItems: [
            'Endpoint network isolation executed via Defender API',
            'Entra ID user session revoked and password reset forced',
            'Threat IPs blacklisted across perimeter firewalls'
          ]
        },
        {
          id: 'step-pb-3',
          stepNumber: 3,
          title: 'Eradication, Recovery & Post-Mortem RCA',
          action: 'Eradicate malicious artifacts, restore systems from validated clean backups, and conduct Root Cause Analysis (RCA).',
          assignedRole: 'Incident Commander (SecOps Lead)',
          safetyNote: 'Complete formal ISO 27001 RCA document and submit to Governance Board within 5 business days.',
          inputsOutputs: 'Input: Contained Environment | Output: Restored System & Signed Post-Mortem Report'
        }
      ],
      definitions: [
        { term: 'Sev 1 (Critical)', definition: 'Enterprise-wide outage, ransomware infection, or confirmed exfiltration of confidential client data' },
        { term: 'Chain of Custody', definition: 'Documented chronological audit trail of evidence handling and forensic custody' }
      ],
      references: [
        { title: 'Future Focus Infotech ISMS Incident Policy POL-ISMS-12', urlOrDocId: 'POL-ISMS-12' },
        { title: 'NIST SP 800-61 Rev. 2 Computer Security Incident Handling Guide', urlOrDocId: 'NIST-800-61' }
      ],
      guidedInterviewGoalPlaceholder: 'What critical threat or outage incident does this playbook contain and resolve?',
      guidedInterviewAudiencePlaceholder: 'Incident response team, SecOps analysts, infrastructure engineers, and leadership.',
      guidedInterviewStepsPlaceholder: 'Step 1: Alert triage & Sev classification\nStep 2: Emergency isolation & session revocation\nStep 3: Forensic capture, clean restore & post-mortem RCA',
      guidedInterviewSafetyPlaceholder: 'Specify SLA timers, forensic RAM preservation rules, and emergency escalation paths.'
    }
  },
  {
    id: 'template-checklist',
    type: 'Checklist',
    level: 'Level 4: Quality & Compliance Audit Checklist',
    title: 'Audit & Quality Checklist Template',
    name: 'Quality & Audit Checklist',
    badge: 'Audit & Compliance Sign-off',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    cardBorderColor: 'hover:border-purple-400',
    iconName: 'FileCheck2',
    summary: 'Structured verification criteria, pass/fail inspection gates, compliance checklists, and auditor sign-off attestations.',
    recommendedFor: [
      'ISO 9001 / ISO 27001 Internal Quality Audits',
      'Quarterly Access Privilege & Entra Role Reviews',
      'Vendor Security Assessment (SIG Lite / SOC 2)',
      'Data Center & Facility Physical Security Audits'
    ],
    keyControls: [
      'Objective Pass / Fail / Not Applicable Criteria',
      'Sampling Methodology & Evidence Attachment Mandate',
      'Auditor & Auditee Double Digital Sign-off',
      'Corrective Action Plan (CAPA) Integration'
    ],
    defaultValues: {
      titlePlaceholder: 'ISO 27001 Access Control & Privilege Review Checklist',
      sopNumberPrefix: 'QA-CHK-',
      category: 'Quality Assurance & GRC',
      department: 'IT_Enablement',
      sensitivityLabel: 'Internal',
      businessCriticality: 'Medium',
      complianceStandards: ['ISO 9001', 'ISO 27001', 'Internal Audit Requirements'],
      reviewFrequencyMonths: 12,
      purpose: 'Provide a structured, verifiable audit checklist for evaluating compliance against Future Focus Infotech quality baselines, security standards, and statutory governance mandates.',
      scope: 'Applicable to internal quality auditors, department compliance leads, and operations teams undergoing periodic review.',
      responsibilities: [
        {
          role: 'Lead Internal Auditor',
          description: 'Executes audit checklists, verifies sample evidence, and records non-conformity findings.'
        },
        {
          role: 'Department Auditee Lead',
          description: 'Provides operational artifacts, demonstrates control compliance, and agrees to corrective actions.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-chk-1',
          stepNumber: 1,
          title: 'Audit Preparation & Sample Selection',
          action: 'Define audit scope, extract randomized sample records from SharePoint / ERP / Service Desk, and notify auditee lead.',
          assignedRole: 'Lead Internal Auditor',
          safetyNote: 'Ensure minimum statistical sample size complies with ISO 9001 sampling standard (minimum 10% of quarterly volume).',
          inputsOutputs: 'Input: Sampling Population | Output: Audited Sample Selection Manifest',
          checklistItems: [
            'Randomized sample dataset generated',
            'Prior audit CAPA action items reviewed',
            'Pre-audit briefing conducted with department manager'
          ]
        },
        {
          id: 'step-chk-2',
          stepNumber: 2,
          title: 'Inspection Execution & Control Verification',
          action: 'Inspect each sample record against control checklist criteria. Record pass/fail status and link evidence artifacts.',
          assignedRole: 'Lead Internal Auditor',
          safetyNote: 'All identified non-conformities must be supported by screenshot or system log evidence.',
          inputsOutputs: 'Input: Sample Evidence | Output: Completed Control Checklist',
          checklistItems: [
            'Document version control headers verified',
            '4-tier approval signatures validated',
            'Employee read acknowledgments confirmed'
          ]
        },
        {
          id: 'step-chk-3',
          stepNumber: 3,
          title: 'Finding Formulation & CAPA Agreement',
          action: 'Document audit summary, categorize findings (Minor NC / Major NC / Observation), and agree on corrective action plan (CAPA).',
          assignedRole: 'Lead Internal Auditor',
          safetyNote: 'Major non-conformities require executive briefing within 24 hours of audit closure.',
          inputsOutputs: 'Input: Audit Findings | Output: Signed CAPA Resolution Agreement'
        }
      ],
      definitions: [
        { term: 'Non-Conformity (NC)', definition: 'Non-fulfillment of a specified requirement under ISO 9001 or ISO 27001' },
        { term: 'CAPA', definition: 'Corrective and Preventive Action plan to address root cause of identified audit findings' }
      ],
      references: [
        { title: 'Future Focus Infotech Quality Audit Standard QA-STD-01', urlOrDocId: 'QA-STD-01' },
        { title: 'ISO 19011:2018 Guidelines for Auditing Management Systems', urlOrDocId: 'ISO-19011' }
      ],
      guidedInterviewGoalPlaceholder: 'What operational quality, security, or facility control is being audited?',
      guidedInterviewAudiencePlaceholder: 'Internal auditors, department compliance leads, and quality managers.',
      guidedInterviewStepsPlaceholder: 'Section 1: Audit preparation & sampling\nSection 2: Control inspection & evidence check\nSection 3: Findings categorization & CAPA sign-off',
      guidedInterviewSafetyPlaceholder: 'Specify sample size criteria, evidence standards, and CAPA resolution deadlines.'
    }
  },
  {
    id: 'template-blank',
    type: 'Blank',
    level: 'Custom Governed SOP Canvas',
    title: 'Blank Governed SOP Canvas',
    name: 'Blank Canvas',
    badge: 'Custom Architecture',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    cardBorderColor: 'hover:border-slate-400',
    iconName: 'FileText',
    summary: 'Start from a clean slate initialized with Future Focus Infotech 10-point governance schema and 4-tier approval routing.',
    recommendedFor: [
      'Custom Multi-Disciplinary SOPs',
      'Specialized Strategic Client GCC Workflows',
      'Emerging Technology Experimentation Procedures'
    ],
    keyControls: [
      'Standard 10-Field Governance Metadata Block',
      '4-Tier Approval Routing Hierarchy',
      'Purview Sensitivity & 7-Year Retention Schema'
    ],
    defaultValues: {
      titlePlaceholder: 'Custom Governed Standard Operating Procedure',
      sopNumberPrefix: 'SOP-',
      category: 'General Operations',
      department: 'IT_Enablement',
      sensitivityLabel: 'Internal',
      businessCriticality: 'High',
      complianceStandards: ['ISO 9001', 'ISO 27001'],
      reviewFrequencyMonths: 12,
      purpose: 'Operational procedural guidance for Future Focus Infotech business operations.',
      scope: 'All personnel and contractors engaged in this operational workflow.',
      responsibilities: [
        {
          role: 'Operational Lead',
          description: 'Executes procedure steps in sequence and verifies records.'
        },
        {
          role: 'Department Manager',
          description: 'Audits step completion and validates adherence to quality and security standards.'
        }
      ],
      procedureSteps: [
        {
          id: 'step-1',
          stepNumber: 1,
          title: 'Initiation & Authorization',
          action: 'Verify operational prerequisites, required authorizations, and prepare execution assets.',
          assignedRole: 'Operational Lead',
          safetyNote: 'Ensure compliance with Future Focus Infotech baseline security policies.',
          inputsOutputs: 'Input: Operational Request | Output: Validated Initiation State'
        }
      ],
      definitions: [
        { term: 'SOP', definition: 'Future Focus Infotech Standard Operating Procedure' },
        { term: 'ISMS', definition: 'Information Security Management System compliant with ISO 27001' }
      ],
      references: [
        { title: 'Future Focus Infotech IT Security & Compliance Policy', urlOrDocId: 'POL-SEC-01' },
        { title: 'ISO 9001 / ISO 27001 Operating Standard', urlOrDocId: 'ISO-STD-2026' }
      ],
      guidedInterviewGoalPlaceholder: 'Describe the core objective and operational goal of this SOP...',
      guidedInterviewAudiencePlaceholder: 'Who will execute this SOP?',
      guidedInterviewStepsPlaceholder: 'Step 1: Preparation\nStep 2: Execution\nStep 3: Verification',
      guidedInterviewSafetyPlaceholder: 'Specify safety warnings or compliance requirements.'
    }
  }
];

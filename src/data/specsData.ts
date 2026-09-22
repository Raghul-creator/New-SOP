export interface SpecSection {
  id: string;
  title: string;
  category: 'Overview' | 'Architecture' | 'Integrations' | 'Governance' | 'Schema' | 'Security' | 'Roadmap';
  content: string;
  diagramSvg?: string;
}

export const ARCHITECTURE_SPECS: SpecSection[] = [
  {
    id: 'prd',
    title: 'Product Requirements Document (PRD)',
    category: 'Overview',
    content: `
# Executive Summary & Platform Purpose
The Enterprise SOP Governance Platform provides a centralized, audited, and automated document lifecycle system for creating, reviewing, approving, and publishing Standard Operating Procedures (SOPs) across Microsoft 365 environments.

## Business Objectives
1. **Compliance & Audit Preparedness:** Guarantee strict revision tracking, digital signature sign-offs, and compliance checks (SOX, ISO 27001, HIPAA).
2. **Single Source of Truth:** Direct sync with SharePoint Online document libraries using Purview Sensitivity Labels.
3. **AI-Assisted Efficiency:** Reduce SOP drafting time from days to minutes using Gemini AI guided interviews, duplicate detection, and automated formatting.
4. **Governance Automation:** Automated review cycle notifications, deprecation tracking, and immutable audit logging.

## Core Personas & Governance Ownership
- **Process Owner (Accountable Lead):** The designated operational steward responsible for SOP accuracy, employee execution, and recurring review cycles across organizational transitions.
- **Reviewed By (Level 1 Reviewer):** Technical Lead who validates technical procedure accuracy and safety notes.
- **Approved By (Approver & Compliance):** HOD and Compliance officers who execute digital signature authorization.
- **Document Creator (Created By):** The original drafting author, automatically captured and preserved in the ISO 27001 audit vault and SharePoint system version logs.

## Future Focus Infotech 10-Field Document Control Standard
Every governed SOP adheres to the official 10-point metadata schema:
1. **SOP Number** (Deterministic, zero-collision e.g. \`ITS-SOP-001\`)
2. **SOP Title** (Descriptive operational procedure title)
3. **Department** (IT Enablement, InfoSec, HR, Finance, Procurement, Admin, Operations)
4. **Process Owner** (Accountable lead responsible over time)
5. **Reviewed By** (Level 1 Technical Lead)
6. **Approved By** (HOD & Management Sign-off)
7. **Version** (Major.Minor semantic versioning e.g. 1.0, 1.1)
8. **Effective Date** (Statutory go-live date)
9. **Next Review Date** (Automated 6/12 month review cycle)
10. **Status** (Draft, Under Review, Pending Approver, Approved, Published)
`
  },
  {
    id: 'solution-architecture',
    title: 'Solution Architecture',
    category: 'Architecture',
    content: `
# Full-Stack Solution Architecture
The platform is designed as a hybrid enterprise microservices application integrating with Microsoft Graph API and Google Gemini AI.

## Architectural Components
1. **Frontend Presentation Layer (React 19 + TypeScript + Tailwind CSS):**
   - Single Page Application (SPA) with responsive Fluent UI inspired design.
   - Modules for Dashboard, Authoring Studio, Workflow Approval Engine, Architecture Specs Hub, SharePoint Console, and Audit Vault.
2. **Application Server (Node.js + Express + TypeScript):**
   - RESTful API endpoints for SOP lifecycle management, workflow processing, and Graph API synchronization.
   - Integrated @google/genai Server SDK running server-side calls with gemini-3.6-flash.
3. **Microsoft 365 / Entra ID Gateway:**
   - MSAL.js / Entra ID OAuth 2.0 authentication integration.
   - Microsoft Graph API connector for SharePoint Online libraries, lists, and drive items.
4. **Data & Audit Persistence Engine:**
   - Dual-persistence model with structured JSON state, database synchronization, and immutable audit logs.
`
  },
  {
    id: 'entra-id-design',
    title: 'Microsoft Entra ID Integration Design',
    category: 'Integrations',
    content: `
# Microsoft Entra ID Authentication & Role Mapping

## Authentication Flow
- **Protocol:** OAuth 2.0 + OpenID Connect (OIDC) Authorization Code Flow with PKCE.
- **Token Handling:** Access Tokens and Refresh Tokens issued by Microsoft Identity Platform (https://login.microsoftonline.com/{tenantId}).
- **Scopes Required:**
  - User.Read (Profile & Directory lookup)
  - Sites.ReadWrite.All (SharePoint Document Library operations)
  - Files.ReadWrite.All (Document generation upload)
  - InformationProtectionPolicy.Read (Purview Sensitivity Label retrieval)

## Directory App Registration
- **App Name:** Enterprise SOP Governance Platform
- **Redirect URIs:** https://{app-host}/auth/callback
- **Token Issuance:** ID tokens, Access tokens for Microsoft Graph.
`
  },
  {
    id: 'sharepoint-integration',
    title: 'SharePoint & Graph API Integration Design',
    category: 'Integrations',
    content: `
# SharePoint Online Integration Architecture

## Target Structure
- **Site Collection:** https://contoso.sharepoint.com/sites/SOP-Governance
- **Document Libraries by Department:**
  - /FinanceControlledSOPs
  - /ITSecurityControlledSOPs
  - /OperationsControlledSOPs
  - /HRControlledSOPs
  - /LegalControlledSOPs

## Microsoft Graph API Endpoint Pattern
1. **Create Drive Item:**
   POST /v1.0/sites/{site-id}/drives/{drive-id}/root:/{sop-filename}.docx:/content
2. **Update Managed Metadata Columns:**
   PATCH /v1.0/sites/{site-id}/drives/{drive-id}/items/{item-id}/listItem/fields
3. **Set Sensitivity Label:**
   POST /v1.0/sites/{site-id}/drives/{drive-id}/items/{item-id}/assignSensitivityLabel
`
  },
  {
    id: 'permission-matrix',
    title: 'Enterprise Permission Matrix',
    category: 'Governance',
    content: `
# Role-Based Access Control (RBAC) Matrix

| Action / Capability | Author | Reviewer | Approver | Compliance Admin | SharePoint Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Create SOP Draft** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Edit Draft Content** | ✅ (Own) | ❌ | ❌ | ✅ | ❌ |
| **Inline Review Comments** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Submit for Review** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Review Sign-Off** | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Final Approval / Digital Signature** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **Publish to SharePoint** | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Set Sensitivity Labels** | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Deprecate / Archive SOP** | ❌ | ❌ | ✅ | ✅ | ❌ |
| **View Audit Logs** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Manage Department Mappings** | ❌ | ❌ | ❌ | ✅ | ✅ |
`
  },
  {
    id: 'sop-json-schema',
    title: 'Controlled SOP JSON Schema',
    category: 'Schema',
    content: JSON.stringify(
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "ControlledSOPDocument",
        "type": "object",
        "required": [
          "id",
          "sopNumber",
          "title",
          "department",
          "processOwner",
          "version",
          "status",
          "effectiveDate",
          "nextReviewDate",
          "procedureSteps"
        ],
        "properties": {
          "id": { "type": "string" },
          "sopNumber": { "type": "string", "pattern": "^[A-Z]{2,4}-SOP-\\d{3}$" },
          "title": { "type": "string", "minLength": 5, "maxLength": 200 },
          "department": { "type": "string" },
          "processOwner": {
            "type": "object",
            "description": "Operational accountable lead responsible over the SOP lifecycle",
            "properties": {
              "id": { "type": "string" },
              "name": { "type": "string" },
              "email": { "type": "string", "format": "email" },
              "role": { "type": "string" }
            }
          },
          "reviewer": {
            "type": "object",
            "description": "Level 1 Technical Reviewer"
          },
          "finalApprover": {
            "type": "object",
            "description": "Final Sign-off / Compliance Approver"
          },
          "version": { "type": "string", "pattern": "^\\d+\\.\\d+$" },
          "status": {
            "type": "string",
            "enum": [
              "Draft",
              "Under Review",
              "Changes Requested",
              "Pending Approver 1",
              "Pending Approver 2",
              "Pending Final Approval",
              "Approved",
              "Published",
              "Retired"
            ]
          },
          "effectiveDate": { "type": "string", "format": "date" },
          "nextReviewDate": { "type": "string", "format": "date" },
          "sensitivityLabel": {
            "type": "string",
            "enum": ["Public", "Internal", "Confidential", "Highly Confidential"]
          },
          "author": {
            "type": "object",
            "description": "Document Creator preserved for ISO 27001 audit vault and SharePoint version history"
          },
          "procedureSteps": {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["id", "stepNumber", "title", "action", "assignedRole"],
              "properties": {
                "id": { "type": "string" },
                "stepNumber": { "type": "integer" },
                "title": { "type": "string" },
                "action": { "type": "string" },
                "assignedRole": { "type": "string" },
                "safetyNote": { "type": "string" }
              }
            }
          }
        }
      },
      null,
      2
    )
  },
  {
    id: 'workflow-state-diagram',
    title: 'Workflow State Machine Specification',
    category: 'Governance',
    content: `
# Workflow State Machine Transitions

[ DRAFT ] ------------> (Submit for Review) ------------> [ UNDER REVIEW ]
    |                                                          |
    |                                                          |
    +-------------- (Request Changes) <------------------------+
                                                               |
                                                               v
                                                    (Peer Review Sign-off)
                                                               |
                                                               v
                                                     [ PENDING APPROVAL ]
                                                               |
                                                               +---> (Reject) ---> [ CHANGES REQUESTED ]
                                                               |
                                                               v
                                                   (Executive Approval + E-Sig)
                                                               |
                                                               v
                                                         [ APPROVED ]
                                                               |
                                                               v
                                                     [ PUBLISHING QUEUE ]
                                                               |
                                                  (Graph API SharePoint Push)
                                                               |
                                                               v
                                                        [ PUBLISHED ]
                                                               |
                                                  (Lifecycle End / Deprecate)
                                                               |
                                                               v
                                                        [ RETIRED / ARCHIVED ]
`
  },
  {
    id: 'security-threat-model',
    title: 'Security Threat Model (STRIDE Framework)',
    category: 'Security',
    content: `
# STRIDE Threat Analysis & Mitigations

| Threat Vector | Description | Risk Level | Mitigation Strategy |
| :--- | :--- | :---: | :--- |
| **Spoofing** | Attacker impersonates an Approver to falsify SOP sign-offs. | HIGH | Entra ID multi-factor auth (MFA), FIDO2 tokens, and digital signature hash verification tied to Entra ObjectIDs. |
| **Tampering** | Unauthorized editing of an Approved/Published SOP file in SharePoint. | CRITICAL | SharePoint Library write locks; SOP file checksums (sha256) logged in immutable audit vault. |
| **Repudiation** | User claims they did not sign or publish a modified SOP. | MEDIUM | Immutable audit log recording IP address, timestamp, Entra ID GUID, and cryptographic signature hash. |
| **Information Disclosure** | Unapproved exposure of Confidential or HR/Legal SOPs. | HIGH | Microsoft Purview Sensitivity Labels enforced; automatic watermark generation on DOCX/PDF export. |
| **Denial of Service** | Automated spamming of AI generation endpoints. | MEDIUM | Server-side API rate limiting, express backend authentication headers, and max token limits. |
| **Elevation of Privilege** | Author role attempts to trigger direct SharePoint publishing without approval. | CRITICAL | Server-enforced RBAC on /api/sharepoint/publish endpoint checking user.role === 'Approver' or 'SharePointAdmin'. |
`
  },
  {
    id: 'phased-implementation-plan',
    title: 'Phased Implementation Roadmap & Tech Stack',
    category: 'Roadmap',
    content: `
# Phased Implementation Plan

## Phase 1: Foundation & Identity (Completed)
- Entra ID directory simulation and RBAC permissions model.
- Department library configuration and audit logging infrastructure.

## Phase 2: SOP Authoring & Gemini AI (Completed)
- Guided AI interview questionnaire and structured SOP builder.
- Automatic step formatting, role assignment, and safety note tagging.

## Phase 3: Multi-Stage Workflow & E-Signature (Completed)
- Visual state machine tracker with stage actions.
- Inline comment threads and digital signature token generator.

## Phase 4: Document Generation & PDF/DOCX Preview (Completed)
- Formatted document renderer with control table, versioning, and Purview watermarks.

## Phase 5: SharePoint Online & Microsoft Graph Sync (Completed)
- Microsoft Graph API publishing console, column mapping, and live verification check.

## Phase 6: AI Search, Intelligence & Duplicate Detection (Completed)
- Semantic catalog search and Gemini duplicate similarity detector.

## Phase 7 & 8: Enterprise Readiness & Compliance (Completed)
- Review cycle alerts, deprecation workflow, STRIDE security controls, and audit log exports.
`
  }
];

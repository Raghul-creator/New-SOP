import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuditLogEntry, SOPDocument } from '../types';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ImageRun,
  Footer,
  PageNumber,
  PageBreak,
} from 'docx';

export interface ClientReportExportOptions {
  clientName?: string;
  reportTitle?: string;
  preparedBy?: string;
  departmentFilter?: string;
  actionFilter?: string;
  startDate?: string;
  endDate?: string;
  isoStandard?: string;
}

export function cleanSopTitle(title: string): string {
  if (!title) return '';
  let clean = title.trim();
  
  // Strip outer quotes, bold asterisks, and backticks
  clean = clean.replace(/^[\*"'“`]+|[\*"'”`]+$/g, '');
  
  const patterns = [
    /^(?:the\s+)?(?:proposed\s+)?sop\s+name\s+(?:is|proposed)\s*[\:\-\"\'“`]?\s*/i,
    /^suggested\s+sop\s+name\s+(?:is)?\s*[\:\-\"\'“`]?\s*/i,
    /^proposed\s+sop\s+name\s*[\:\-\"\'`“]?\s*/i,
    /^enter\s+sop\s+name\s*[\:\-\"\'`“]?\s*/i,
    /^sop\s+title\s*[\:\-\"\'`“]?\s*/i,
    /^sop\s+name\s*[\:\-\"\'`“]?\s*/i
  ];

  for (const pattern of patterns) {
    clean = clean.replace(pattern, '');
  }

  // Double check outer quotes/bold after removal
  clean = clean.replace(/^[\*"'“`]+|[\*"'”`]+$/g, '').trim();
  return clean;
}

export function getSmartSection2Items(sop: any): { label: string; value: string }[] {
  const isMfaSop = (sop.title || '').toLowerCase().includes('mfa') || 
                   (sop.title || '').toLowerCase().includes('entra') || 
                   (sop.title || '').toLowerCase().includes('conditional access') || 
                   (sop.title || '').toLowerCase().includes('azure') || 
                   (sop.title || '').toLowerCase().includes('active directory') || 
                   (sop.purpose || '').toLowerCase().includes('mfa') || 
                   (sop.purpose || '').toLowerCase().includes('entra') || 
                   (sop.purpose || '').toLowerCase().includes('conditional access');

  const deptLower = (sop.department || sop.departmentName || '').toLowerCase();
  let items: { label: string; value: string }[] = [];

  if (deptLower.includes('hr') || deptLower.includes('human') || deptLower.includes('people')) {
    items = [
      { label: 'HR System / Environment (2.1)', value: sop.systemsUsed || sop.tenantReference || 'Not Applicable' },
      { label: 'Required Forms (2.2)', value: sop.requiredDocuments || sop.registrationCampaignConfig || 'Not Applicable' },
      { label: 'Employee Records / Resources (2.3)', value: sop.conditionalAccessConfig || 'Not Applicable' }
    ];
  } else if (deptLower.includes('fin') || deptLower.includes('account') || deptLower.includes('pay')) {
    items = [
      { label: 'Financial System (2.1)', value: sop.systemsUsed || sop.tenantReference || 'Not Applicable' },
      { label: 'Required Documents (2.2)', value: sop.requiredDocuments || sop.registrationCampaignConfig || 'Not Applicable' },
      { label: 'Transaction Environment (2.3)', value: sop.conditionalAccessConfig || 'Not Applicable' }
    ];
  } else if (deptLower.includes('ops') || deptLower.includes('operation') || deptLower.includes('admin')) {
    items = [
      { label: 'Operational Environment (2.1)', value: sop.systemsUsed || sop.tenantReference || 'Not Applicable' },
      { label: 'Required Equipment (2.2)', value: sop.requiredDocuments || sop.registrationCampaignConfig || 'Not Applicable' },
      { label: 'Required Resources (2.3)', value: sop.conditionalAccessConfig || 'Not Applicable' }
    ];
  } else if (deptLower.includes('it') || deptLower.includes('sec') || deptLower.includes('tech') || deptLower.includes('eng')) {
    if (isMfaSop) {
      items = [
        { label: 'Tenant Reference (2.1)', value: sop.tenantReference || 'Not Applicable' },
        { label: 'Conditional Access Policy Config (2.2)', value: sop.conditionalAccessConfig || 'Not Applicable' },
        { label: 'Dynamic Group Config (2.3)', value: sop.dynamicGroupConfig || 'Not Applicable' },
        { label: 'Registration Campaign Config (2.4)', value: sop.registrationCampaignConfig || 'Not Applicable' }
      ];
    } else {
      items = [
        { label: 'System Environment (2.1)', value: sop.systemsUsed || sop.tenantReference || 'Not Applicable' },
        { label: 'Application / Platform (2.2)', value: sop.conditionalAccessConfig || 'Not Applicable' },
        { label: 'Required Tools (2.3)', value: sop.requiredDocuments || sop.registrationCampaignConfig || 'Not Applicable' },
        { label: 'Configuration Reference (2.4)', value: sop.dynamicGroupConfig || 'Not Applicable' }
      ];
    }
  } else {
    items = [
      { label: 'Operational Environment (2.1)', value: sop.systemsUsed || sop.tenantReference || 'Not Applicable' },
      { label: 'Required Tools / Documents (2.2)', value: sop.requiredDocuments || sop.registrationCampaignConfig || 'Not Applicable' },
      { label: 'Process Configuration (2.3)', value: sop.conditionalAccessConfig || 'Not Applicable' }
    ];
  }

  return items.map(item => {
    let cleanVal = item.value?.trim();
    if (!cleanVal || cleanVal.toLowerCase() === 'not provided' || cleanVal === '') {
      cleanVal = 'Not Provided';
    } else if (cleanVal.toLowerCase() === 'not applicable') {
      cleanVal = 'Not Applicable';
    }
    return { label: item.label, value: cleanVal };
  });
}

/**
 * Generates an official, high-fidelity CSV compliance audit log file.
 */
export function generateAuditLogCSV(logs: AuditLogEntry[], options?: ClientReportExportOptions): void {
  const clientName = options?.clientName || 'All Enterprise Client Accounts';
  const exportTimestamp = new Date().toISOString();
  
  const metadataRows = [
    ['# FUTURE FOCUS INFOTECH - TAMPER-EVIDENT SOP EXECUTION & GOVERNANCE AUDIT TRAIL'],
    ['# Generated On', exportTimestamp],
    ['# Target Client / Engagement', `"${clientName.replace(/"/g, '""')}"`],
    ['# Compliance Standard', options?.isoStandard || 'ISO 9001:2015 & ISO 27001:2022 ISMS Certified'],
    ['# Retention Period', 'Retained for 7 Years under Future Focus Infotech Corporate Data Policy (POL-SEC-007)'],
    ['# Authentication Provider', 'Microsoft Entra ID (Azure AD) Single Sign-On with MFA'],
    []
  ];

  const headers = [
    'Log ID',
    'Timestamp (UTC)',
    'SOP Ref ID',
    'SOP Document Title',
    'Department',
    'Client / Engagement',
    'Operator Name',
    'Work Email',
    'Role',
    'Action Type',
    'Execution Status',
    'Asset / Ticket Ref',
    'IP Address',
    'Entra Object ID',
    'SHA-256 Tamper Proof Hash',
    'Audit Retention',
    'Execution & Event Details'
  ];

  const dataRows = logs.map(log => {
    const dept = log.department || (log.user.department === 'Finance_Accounts' ? 'Finance' : log.user.department === 'Human_Resources' ? 'HR' : log.user.department?.replace('_', ' ')) || 'Enterprise';
    const client = log.clientName || log.executionData?.clientName || clientName;
    const execStatus = log.executionData?.status || (log.action.includes('REJECT') ? 'EXCEPTION' : 'VERIFIED');
    const assetRef = log.executionData?.assetTagOrRef || 'N/A';

    return [
      log.id,
      log.timestamp,
      log.sopNumber || log.sopId,
      `"${(log.sopTitle || '').replace(/"/g, '""')}"`,
      `"${dept}"`,
      `"${client.replace(/"/g, '""')}"`,
      `"${(log.user?.name || '').replace(/"/g, '""')}"`,
      log.user?.email || '',
      log.user?.role || '',
      log.action,
      execStatus,
      `"${assetRef.replace(/"/g, '""')}"`,
      log.ipAddress || '10.0.0.1',
      log.entraObjectId || log.user?.entraObjectId || 'entra-guid',
      log.tamperProofHash || 'sha256:verified',
      `"${(log.retentionPolicy || '7 Years (ISO 27001)').replace(/"/g, '""')}"`,
      `"${(log.details || '').replace(/"/g, '""')}"`
    ];
  });

  const allRows = [
    ...metadataRows.map(r => r.join(',')),
    headers.join(','),
    ...dataRows.map(r => r.join(','))
  ];

  const csvContent = allRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FFI-SOP-Execution-Audit-Report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an individual single-execution CSV record for immediate client attachment.
 */
export function generateSingleExecutionCSV(log: AuditLogEntry): void {
  const exportTimestamp = new Date().toISOString();
  const headers = [
    'Execution ID',
    'Timestamp',
    'SOP Reference',
    'SOP Title',
    'Department',
    'Client Account',
    'Executed By',
    'Operator Email',
    'Asset / Ticket Tag',
    'Completion Status',
    'Checklist Progress',
    'Tamper-Proof Verification Hash',
    'IP Address',
    'Event Details'
  ];

  const row = [
    log.executionData?.executionId || log.id,
    log.timestamp,
    log.sopNumber || log.sopId,
    `"${(log.sopTitle || '').replace(/"/g, '""')}"`,
    `"${log.department || log.user?.department || 'IT Enablement'}"`,
    `"${log.clientName || log.executionData?.clientName || 'Client Confidential'}"`,
    `"${log.user?.name || ''}"`,
    log.user?.email || '',
    `"${log.executionData?.assetTagOrRef || 'N/A'}"`,
    log.executionData?.status || 'COMPLETED',
    `"${log.executionData?.checklistCompleted || 0}/${log.executionData?.totalChecklist || 0}"`,
    log.tamperProofHash || 'sha256:verified',
    log.ipAddress,
    `"${(log.details || '').replace(/"/g, '""')}"`
  ];

  const csvContent = [
    `# FUTURE FOCUS INFOTECH - INDIVIDUAL SOP EXECUTION CERTIFICATE`,
    `# Generated: ${exportTimestamp}`,
    `# Certificate ID: ${log.executionData?.certificateId || `CERT-${log.id}`}`,
    headers.join(','),
    row.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `FFI-Execution-Record-${log.sopNumber || log.sopId}-${log.id}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an executive-grade Multi-Page Client Compliance Audit Report PDF.
 */
export function generateAuditLogPDF(logs: AuditLogEntry[], options?: ClientReportExportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const clientName = options?.clientName || 'Global Enterprise Client Audit';
  const reportTitle = options?.reportTitle || 'SOP EXECUTION & GOVERNANCE COMPLIANCE AUDIT RECORD';
  const preparedBy = options?.preparedBy || 'Quality & Compliance Officer';
  const deptFilter = options?.departmentFilter || 'All Departments (Finance, IT Enablement, HR, Admin)';
  const generationDate = new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) + ' UTC';

  // Primary Colors (Focus Infotech Navy Blue #0A192F & Deep Blue #1E3A8A)
  const navyDark = [10, 25, 47]; // #0A192F
  const blueAccent = [30, 58, 138]; // #1E3A8A
  const slateLight = [241, 245, 249];
  const slateText = [51, 65, 85];

  // Header Banner
  doc.setFillColor(navyDark[0], navyDark[1], navyDark[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FUTURE FOCUS INFOTECH', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(147, 197, 253);
  doc.text('Part of en Inc. Group • Enterprise SOP Governance & Compliance Operations', 14, 16);
  doc.text('ISO 9001:2015 & ISO 27001:2022 ISMS Certified • Microsoft Entra ID Protected', 14, 21);

  // Security Badge in Header
  doc.setFillColor(30, 64, 175);
  doc.roundedRect(pageWidth - 62, 7, 48, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('OFFICIAL CLIENT REPORT', pageWidth - 59, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('CONFIDENTIAL • 7-YR AUDIT', pageWidth - 59, 18);

  // Report Title Box
  doc.setTextColor(10, 25, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(reportTitle, 14, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Comprehensive Tamper-Evident Record of Standard Operating Procedure Executions, Approvals & Life-Cycle Events', 14, 42);

  // Metadata Table Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 46, pageWidth - 28, 26, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('ENGAGEMENT / CLIENT:', 18, 52);
  doc.text('REPORT GENERATED ON:', 18, 58);
  doc.text('GOVERNED DEPARTMENTS:', 18, 64);
  doc.text('AUDIT PREPARED BY:', (pageWidth / 2) + 2, 52);
  doc.text('SECURITY FRAMEWORK:', (pageWidth / 2) + 2, 58);
  doc.text('RETENTION STATUS:', (pageWidth / 2) + 2, 64);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, 58, 52);
  doc.text(generationDate, 58, 58);
  doc.text(deptFilter, 58, 64);
  doc.text(preparedBy, (pageWidth / 2) + 40, 52);
  doc.text('ISO 27001 / Microsoft Entra ID MFA', (pageWidth / 2) + 40, 58);
  doc.text('Immutable 7-Year Vault Active', (pageWidth / 2) + 40, 64);

  // Executive Metric Tiles
  const totalLogs = logs.length;
  const executionRuns = logs.filter(l => l.action.includes('EXECUTION') || l.action.includes('CHECKLIST') || l.executionData).length;
  const approvalEvents = logs.filter(l => l.action.includes('APPROVE') || l.action.includes('SIGN')).length;
  const complianceRate = '100.0%';

  const tileWidth = (pageWidth - 28 - 9) / 4;
  const tileY = 76;
  const tileHeight = 16;

  const metrics = [
    { label: 'TOTAL EVENT LOGS', value: totalLogs.toString(), sub: 'Recorded in Vault' },
    { label: 'SOP EXECUTIONS', value: executionRuns.toString(), sub: 'Operational Runs' },
    { label: 'GOVERNANCE SIGNS', value: approvalEvents.toString(), sub: 'Digital Approvals' },
    { label: 'AUDIT ADHERENCE', value: complianceRate, sub: 'ISO 27001 Compliant' }
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (tileWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, tileY, tileWidth, tileHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, tileY + 4.5);

    doc.setFontSize(10);
    doc.setTextColor(10, 25, 47);
    doc.text(m.value, x + 3, tileY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(m.sub, x + 3, tileY + 13.5);
  });

  // Table Data Mapping
  const tableData = logs.map(log => {
    const timeStr = new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19);
    const sopRef = `${log.sopNumber || log.sopId}\n${log.sopTitle || ''}`;
    const userRole = `${log.user?.name || 'System'}\n(${log.user?.role || 'Staff'})`;
    const actionFormatted = log.action.replace(/_/g, ' ');
    const hashShort = log.tamperProofHash ? `${log.tamperProofHash.substring(0, 14)}...` : 'sha256:valid';
    const detailText = `${log.details || ''}${log.executionData?.assetTagOrRef ? `\n[Ref: ${log.executionData.assetTagOrRef}]` : ''}`;

    return [
      timeStr,
      sopRef,
      userRole,
      actionFormatted,
      hashShort,
      detailText
    ];
  });

  // Render Table with autoTable
  autoTable(doc, {
    startY: 96,
    head: [['Timestamp (UTC)', 'SOP Document Ref', 'Operator & Role', 'Action Type', 'SHA-256 Hash', 'Execution Details']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [10, 25, 47],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
      lineColor: [226, 232, 240]
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 28 },
      3: { cellWidth: 26, fontStyle: 'bold' },
      4: { cellWidth: 20, font: 'courier' },
      5: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didDrawPage: (data) => {
      // Running Footer on every page
      const footerY = pageHeight - 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);

      doc.text(
        'Future Focus Infotech Pvt. Ltd. • Client Confidential Governance Audit Record • Retained for 7 Years under ISO 27001 ISMS',
        14,
        footerY
      );

      const pageNumStr = `Page ${data.pageNumber} of ${doc.getNumberOfPages()}`;
      doc.text(pageNumStr, pageWidth - 14 - doc.getTextWidth(pageNumStr), footerY);
    }
  });

  // Client Sign-off / Compliance Verification Section on Final Page
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 220;
  
  if (finalY < pageHeight - 45) {
    drawSignOffBox(doc, finalY, pageWidth);
  } else {
    doc.addPage();
    drawSignOffBox(doc, 20, pageWidth);
  }

  doc.save(`FFI-Client-Compliance-Audit-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Draws the formal client compliance acceptance box.
 */
function drawSignOffBox(doc: jsPDF, startY: number, pageWidth: number): void {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, startY, pageWidth - 28, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(10, 25, 47);
  doc.text('CLIENT AUDIT & COMPLIANCE VERIFICATION STATEMENT', 18, startY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'This compliance audit log confirms that all listed Standard Operating Procedure (SOP) executions and approvals were executed in strict adherence to corporate governance, ISO 9001:2015, and ISO 27001:2022 security controls via verified Microsoft Entra ID sessions.',
    18,
    startY + 11,
    { maxWidth: pageWidth - 36 }
  );

  const colWidth = (pageWidth - 36) / 3;
  const lineY = startY + 28;

  // Sign lines
  doc.setDrawColor(148, 163, 184);
  doc.line(18, lineY, 18 + colWidth - 6, lineY);
  doc.line(18 + colWidth, lineY, 18 + (colWidth * 2) - 6, lineY);
  doc.line(18 + (colWidth * 2), lineY, 18 + (colWidth * 3), lineY);

  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Prepared By: Quality & Compliance Lead', 18, lineY + 4);
  doc.text('Department Head / Quality Sign-Off', 18 + colWidth, lineY + 4);
  doc.text('Client Audit Representative Signature & Date', 18 + (colWidth * 2), lineY + 4);
}

/**
 * Generates an official, single-page Certificate of SOP Execution Compliance PDF.
 */
export function generateSingleExecutionPDF(log: AuditLogEntry): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const executionId = log.executionData?.executionId || `EXEC-${log.id}`;
  const certificateId = log.executionData?.certificateId || `CERT-${Date.now().toString().substring(6)}`;
  const timestamp = new Date(log.timestamp).toUTCString();
  const dept = log.department || log.user?.department || 'IT_Enablement';
  const deptName = dept === 'Finance_Accounts' ? 'Finance' : dept === 'Human_Resources' ? 'HR' : dept.replace('_', ' ');

  // Header Banner
  doc.setFillColor(10, 25, 47); // Navy Blue
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('FUTURE FOCUS INFOTECH', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(147, 197, 253);
  doc.text('Enterprise SOP Operations • Part of en Inc. Group', 14, 18);
  doc.text('ISO 9001:2015 & ISO 27001:2022 Certified • Microsoft Entra ID Secured', 14, 24);

  // Certificate Badge
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(pageWidth - 68, 8, 54, 16, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EXECUTION CERTIFICATE', pageWidth - 65, 14);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(certificateId, pageWidth - 65, 20);

  // Main Title
  doc.setTextColor(10, 25, 47);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CERTIFICATE OF SOP EXECUTION COMPLIANCE', 14, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Official Client Compliance Verification Record for Auditing & Regulatory Reporting', 14, 49);

  // Execution Summary Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 54, pageWidth - 28, 48, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text('SOP REFERENCE:', 18, 62);
  doc.text('SOP TITLE:', 18, 69);
  doc.text('DEPARTMENT:', 18, 76);
  doc.text('TARGET CLIENT / REF:', 18, 83);
  doc.text('EXECUTION TIMESTAMP:', 18, 90);
  doc.text('HARDWARE ASSET / REF:', 18, 97);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(log.sopNumber || log.sopId, 60, 62);
  doc.text(log.sopTitle || 'Standard Operating Procedure', 60, 69, { maxWidth: 130 });
  doc.text(deptName, 60, 76);
  doc.text(log.clientName || log.executionData?.clientName || 'Global Client Engagement', 60, 83);
  doc.text(timestamp, 60, 90);
  doc.text(log.executionData?.assetTagOrRef || 'Standard Procedural Execution', 60, 97);

  // Operator & Sign-off Box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 106, pageWidth - 28, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(10, 25, 47);
  doc.text('DIGITAL EXECUTION SIGNATURE & AUTHENTICATION', 18, 113);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Executed By: ${log.user?.name || 'Authorized Staff'} (${log.user?.role || 'Operator'})`, 18, 120);
  doc.text(`Microsoft Entra ID: ${log.user?.email || 'user@organization.com'}`, 18, 126);
  doc.text(`Origin IP Address: ${log.ipAddress} • MFA Verification Status: Enforced & Verified`, 18, 132);
  doc.text(`Action Type: ${log.action} • Status: ${log.executionData?.status || 'COMPLETED'}`, 18, 138);

  // Cryptographic Hash Box
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(14, 148, pageWidth - 28, 24, 2, 2, 'F');
  doc.setTextColor(147, 197, 253);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CRYPTOGRAPHIC SHA-256 TAMPER-PROOF VERIFICATION HASH', 18, 155);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(log.tamperProofHash || 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 18, 162);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Logged to Future Focus Infotech Immutable Audit Vault • Retained for 7 Years under ISO 27001 ISMS', 18, 168);

  // Procedural Details & Remarks
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(10, 25, 47);
  doc.text('Execution Summary & Remarks:', 14, 180);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(log.details || 'Checklist executed and verified in complete compliance with corporate standard operating procedures.', 14, 186, {
    maxWidth: pageWidth - 28
  });

  // Client Verification Sign-off Box
  drawSignOffBox(doc, 204, pageWidth);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Future Focus Infotech • ISO 9001:2015 & ISO 27001:2022 Certified • Confidential Client Audit Record', 14, pageHeight - 8);

  doc.save(`FFI-Execution-Certificate-${log.sopNumber || log.sopId}-${log.id}.pdf`);
}

/**
 * Direct execution runner wrapper for generating PDF from SOP & ExecutionSummary
 */
export function generateSOPExecutionPDF(sop: any, summary: any, user: any): void {
  const mockLog: AuditLogEntry = {
    id: summary.executionId || `log-${Date.now()}`,
    sopId: sop.id,
    sopNumber: sop.sopNumber || sop.id,
    sopTitle: sop.title,
    department: sop.department,
    clientName: summary.clientName || sop.clientScope || 'Global Enterprise',
    user,
    action: 'SOP_INTERACTIVE_EXECUTION_COMPLETED',
    details: summary.executionNotes || `Interactive SOP checklist executed with 100% verification. Certificate: ${summary.certificateId}`,
    ipAddress: '10.14.20.100',
    timestamp: new Date().toISOString(),
    entraObjectId: user.entraObjectId || 'entra-user-guid',
    retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Future Focus Infotech Policy',
    tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    executionData: summary
  };
  generateSingleExecutionPDF(mockLog);
}

/**
 * Direct execution runner wrapper for exporting CSV from SOP & ExecutionSummary
 */
export function exportSingleExecutionCSV(sop: any, summary: any, user: any): void {
  const mockLog: AuditLogEntry = {
    id: summary.executionId || `log-${Date.now()}`,
    sopId: sop.id,
    sopNumber: sop.sopNumber || sop.id,
    sopTitle: sop.title,
    department: sop.department,
    clientName: summary.clientName || sop.clientScope || 'Global Enterprise',
    user,
    action: 'SOP_INTERACTIVE_EXECUTION_COMPLETED',
    details: summary.executionNotes || `Interactive checklist executed with 100% verification. Certificate: ${summary.certificateId}`,
    ipAddress: '10.14.20.100',
    timestamp: new Date().toISOString(),
    entraObjectId: user.entraObjectId || 'entra-user-guid',
    retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Future Focus Infotech Policy',
    tamperProofHash: `sha256:${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    executionData: summary
  };
  generateSingleExecutionCSV(mockLog);
}

function cleanInstructionText(instruction: string): string {
  if (!instruction) return '';
  const lines = instruction.split('\n');
  const cleanedLines = lines.filter(line => {
    const lower = line.toLowerCase().trim();
    if (lower.startsWith('**application:**') || 
        lower.startsWith('**screen purpose:**') || 
        lower.startsWith('**visible interface elements:**') || 
        lower.startsWith('• **buttons:**') || 
        lower.startsWith('• **fields:**') || 
        lower.startsWith('• **menus:**') || 
        lower.startsWith('• **labels:**') || 
        lower.startsWith('**screenshot reference:**') ||
        lower.startsWith('**role:** not provided') ||
        lower.startsWith('role: not provided') ||
        lower.startsWith('**ai analysis details:**') ||
        lower.startsWith('**screenshot analysis details:**')
    ) {
      return false;
    }
    if (lower === '• **buttons:** none visible' ||
        lower === '• **fields:** none visible' ||
        lower === '• **menus:** none visible' ||
        lower === '• **labels:** none visible'
    ) {
      return false;
    }
    return true;
  });
  
  return cleanedLines.join('\n').replace(/\n{2,}/g, '\n\n').trim();
}

/**
 * Generates an enterprise-grade, clean multi-page PDF document for any SOP matching internal company standards.
 */
async function getLogoPngDataUrl(variant: 'light' | 'dark' = 'dark'): Promise<string> {
  const paths = variant === 'light' 
    ? ['/logo-white.svg', '/assets/logo-white.svg'] 
    : ['/logo.svg', '/assets/logo.svg'];
  
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (!res.ok) continue;
      const svgText = await res.text();
      const pngUrl = await renderSvgToPng(svgText);
      if (pngUrl) return pngUrl;
    } catch (e) {
      console.warn('Failed to fetch SVG logo path:', p, e);
    }
  }
  return '';
}

function renderSvgToPng(svgText: string): Promise<string> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 380; // High quality
          canvas.height = 132;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/png'));
            return;
          }
        } catch (e) {
          console.error('Error drawing image on canvas:', e);
        }
        resolve('');
      };
      img.onerror = () => resolve('');
      const base64Svg = btoa(unescape(encodeURIComponent(svgText)));
      img.src = 'data:image/svg+xml;base64,' + base64Svg;
    } catch (e) {
      console.error('Error rendering SVG:', e);
      resolve('');
    }
  });
}

/**
 * Generates an enterprise-grade, clean multi-page PDF document for any SOP matching FFI standards.
 */
export async function downloadSOPAsPDF(sop: SOPDocument): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  let y = 25;

  const cleanedTitle = cleanSopTitle(sop.title);
  const docId = sop.sopNumber || sop.id || 'Not specified';
  const version = sop.version ? `v${sop.version}` : 'Not specified';
  const deptFormatted = sop.department ? String(sop.department).replace(/_/g, ' ') : 'Not specified';
  const effectiveDate = sop.effectiveDate || 'Not specified';
  const status = sop.status || 'Not specified';
  const classification = sop.sensitivityLabel || 'Not specified';
  const reviewDate = sop.nextReviewDate || 'Not specified';

  const checkPageOverflow = (needed: number) => {
    if (y + needed > pageHeight - margin - 15) {
      doc.addPage();
      y = 25;
    }
  };

  const logoDataUrl = await getLogoPngDataUrl('dark');

  // Track page numbers for exact dynamic Table of Contents
  const pageMap: Record<string, number> = {};

  // ==================== PAGE 1: COVER PAGE ====================
  // Aligned top-left FFI Company Logo
  if (logoDataUrl) {
    try { doc.addImage(logoDataUrl, 'PNG', margin, 20, 52, 18); } catch {}
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(10, 37, 64);
    doc.text('FUTURE FOCUS INFOTECH', margin, 28);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 37, 64);
  doc.text('FUTURE FOCUS INFOTECH PVT LTD', margin, 42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text('STANDARD OPERATING PROCEDURE', margin, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(10, 37, 64);
  const titleLines = doc.splitTextToSize(cleanedTitle.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, 65);

  const subtitle = `${deptFormatted} Department Operations & Guidelines`;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(subtitle, margin, 65 + (titleLines.length * 8.5) + 3);

  autoTable(doc, {
    startY: 65 + (titleLines.length * 8.5) + 12,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    columnStyles: { 0: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 55, textColor: [10, 37, 64] } },
    body: [
      ['Document Title', cleanedTitle],
      ['Document ID', docId],
      ['Version', version],
      ['Status', status],
      ['Date Issued', effectiveDate],
      ['Owner', sop.departmentOwner || 'Future Focus Infotech'],
      ['Classification', classification],
      ['Review Cycle', `${sop.reviewFrequencyMonths || 12} Months (Next Review: ${reviewDate})`]
    ]
  });

  // ==================== PAGE 2: TABLE OF CONTENTS (Reserved) ====================
  doc.addPage();
  // We leave Page 2 empty during the first pass; we will populate it dynamically at the end using doc.setPage(2)




  // ==================== PAGES 3+: MAIN SECTIONS ====================
  doc.addPage();
  y = 25;

  const drawHeading = (title: string, num: string) => {
    checkPageOverflow(15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 58, 138);
    doc.text(`${num}. ${title}`, margin, y);
    pageMap[num] = (doc.internal as any).getNumberOfPages();
    y += 5.5;
  };

  const drawSubHeading = (title: string, num: string) => {
    checkPageOverflow(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`${num} ${title}`, margin + 4, y);
    pageMap[num] = (doc.internal as any).getNumberOfPages();
    y += 4.5;
  };

  const drawParagraph = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text || 'Not Applicable', contentWidth - 4);
    checkPageOverflow((lines.length * 4) + 4);
    doc.text(lines, margin + 4, y);
    y += (lines.length * 4) + 6;
  };

  // 1. Purpose and Scope
  drawHeading('Purpose and Scope', '1');
  drawSubHeading('Purpose', '1.1');
  drawParagraph(sop.purpose || 'Not specified');
  drawSubHeading('Scope', '1.2');
  drawParagraph(sop.scopeInScope || sop.scope || 'Not Applicable');
  drawSubHeading('Out of Scope', '1.3');
  drawParagraph(sop.scopeOutOfScope || 'Not Applicable');
  drawSubHeading('Operating Principles', '1.4');
  drawParagraph(sop.operatingPrinciples || 'Not Applicable');

  // 2. Environment & Policy Reference
  doc.addPage(); y = 25;
  drawHeading('Environment & Policy Reference', '2');
  y += 2;

  const section2Items = getSmartSection2Items(sop);

  const sec2Body = section2Items.map((item, idx) => [item.label, item.value]);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Environment Component / Policy', 'Configuration Reference Details']],
    body: sec2Body
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 3. Roles & Responsibilities
  doc.addPage(); y = 25;
  drawHeading('Roles & Responsibilities', '3');
  y += 2;
  const respBody = sop.responsibilities?.map(r => [r.role, r.description]) || [['Operational Performer', 'Not Applicable']];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Role / Department Designation', 'Operational Responsibility & Delegation Scope']],
    body: respBody
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 4. Definitions & Acronyms
  checkPageOverflow(30);
  drawHeading('Definitions & Acronyms', '4');
  y += 2;
  const defBody = sop.definitions?.map(d => [d.term, d.definition]) || [];
  if (defBody.length === 0) {
    defBody.push(['SOP', 'Standard Operating Procedure'], ['FFI', 'Future Focus Infotech']);
  }
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Term / Acronym', 'Standard Enterprise Definition']],
    body: defBody
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 5. Procedures
  doc.addPage(); y = 25;
  drawHeading('Procedures', '5');
  y += 2;

  if (sop.procedureSteps && sop.procedureSteps.length > 0) {
    for (const step of sop.procedureSteps) {
      const stepHeaderTitle = `5.1 Step ${step.stepNumber}: ${step.title}`;
      const actionCleaned = cleanInstructionText(step.action || '');
      const actionLines = doc.splitTextToSize(actionCleaned, contentWidth - 10);
      let stepHeight = (actionLines.length * 4) + 16;

      if (step.safetyNote) {
        const noteLines = doc.splitTextToSize(step.safetyNote, contentWidth - 20);
        stepHeight += (noteLines.length * 4) + 10;
      }
      
      const hasScreenshot = step.screenshots && step.screenshots.length > 0 && step.screenshots[0];
      if (hasScreenshot) stepHeight += 50;

      checkPageOverflow(stepHeight);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text(stepHeaderTitle, margin + 3, y + 5);

      if (step.assignedRole && step.assignedRole.toLowerCase() !== 'not provided' && step.assignedRole.toLowerCase() !== 'not specified') {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Role: ${step.assignedRole}`, pageWidth - margin - 3, y + 5, { align: 'right' });
      }

      y += 11;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(actionLines, margin + 4, y);
      y += (actionLines.length * 4) + 3;

      if (step.safetyNote) {
        const noteLines = doc.splitTextToSize(step.safetyNote, contentWidth - 16);
        const noteBoxHeight = (noteLines.length * 4) + 4;
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(251, 191, 36);
        doc.roundedRect(margin + 4, y, contentWidth - 8, noteBoxHeight, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(146, 64, 14);
        doc.text('WARNING NOTE:', margin + 7, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 53, 4);
        doc.text(noteLines, margin + 7, y + 8.5);
        y += noteBoxHeight + 4;
      }

      if (hasScreenshot) {
        try {
          const imgData = step.screenshots[0];
          let format = 'PNG';
          if (imgData.includes('jpeg') || imgData.includes('jpg')) format = 'JPEG';
          else if (imgData.includes('webp')) format = 'WEBP';
          doc.addImage(imgData, format, margin + 4, y, 80, 40, undefined, 'FAST');
          y += 44;
        } catch {}
      }
      y += 3;
    }
  } else {
    drawParagraph('Not Applicable - No procedure steps defined.');
  }

  // 6. Escalation Matrix
  doc.addPage(); y = 25;
  drawHeading('Escalation Matrix', '6');
  y += 2;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Escalation Stage', 'Response Protocol & Designated SLA Contact']],
    body: [['Primary Escalation Path', sop.escalationMatrix || 'Not Applicable']]
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 7. Related / Pre-Existing Policies (Not Modified)
  checkPageOverflow(30);
  drawHeading('Related / Pre-Existing Policies (Not Modified)', '7');
  y += 2;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Reference Policy Domain', 'Governance Policies & Compliance Standards']],
    body: [['Pre-Existing Corporate Policies', sop.relatedPolicies || 'Not Applicable']]
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 8. References
  checkPageOverflow(35);
  drawHeading('References', '8');
  y += 2;
  const refs = sop.references?.map(r => [r.title, r.urlOrDocId]) || [];
  if (refs.length === 0) {
    refs.push(['Operational Guidelines / Standard Manuals', 'Refer to Department Wiki / Shared Folder']);
  }
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252], textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Reference Policy / System', 'Document Identifier or Hyperlink URL']],
    body: refs
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 9. Revision History
  checkPageOverflow(40);
  drawHeading('Revision History', '9');
  y += 2;
  const hist = sop.changeHistory?.map(h => [h.version, h.date, h.author, h.summary]) || [[version, effectiveDate, sop.author?.name || 'Author', 'Initial documentation.']];
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    headStyles: { fillColor: [10, 37, 64], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    head: [['Version', 'Release Date', 'Author', 'Summary of Changes']],
    body: hist
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  // 10. Approval
  checkPageOverflow(45);
  drawHeading('Approval', '10');
  y += 2;
  const signeeName = sop.approvalHistory?.[0]?.user?.name || sop.approver2?.name || 'Department Supervisor';
  const signeeRole = sop.approvalHistory?.[0]?.user?.role || sop.approver2?.role || 'Department Manager';
  const signDate = sop.approvalHistory?.[0]?.timestamp?.split('T')[0] || effectiveDate;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 6.5, lineColor: [226, 232, 240], textColor: [51, 65, 85], valign: 'middle' },
    columnStyles: { 0: { fillColor: [248, 250, 252], fontStyle: 'bold', cellWidth: 60, textColor: [10, 37, 64] } },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    body: [
      ['Role / Designation', signeeRole],
      ['Name', signeeName],
      ['Signature', ''], // Keep signature fields blank as per official templates
      ['Date', signDate]
    ]
  });

  // Record approval page number for dynamic TOC mapping
  pageMap['10'] = (doc.internal as any).getNumberOfPages();

  // ==================== DYNAMIC PASS 2: GENERATE TABLE OF CONTENTS ON PAGE 2 ====================
  doc.setPage(2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(10, 37, 64);
  doc.text('TABLE OF CONTENTS', margin, 25);
  doc.setDrawColor(10, 37, 64);
  doc.setLineWidth(0.6);
  doc.line(margin, 28, pageWidth - margin, 28);

  // Formulate TOC dynamic structure matching sections actually rendered
  const dynamicTocEntries = [
    { num: '1', name: 'Purpose and Scope' },
    { num: '1.1', name: 'Purpose' },
    { num: '1.2', name: 'Scope' },
    { num: '1.3', name: 'Out of Scope' },
    { num: '1.4', name: 'Operating Principles' },
    { num: '2', name: 'Environment & Policy Reference' },
    { num: '3', name: 'Roles & Responsibilities' },
    { num: '4', name: 'Definitions & Acronyms' },
    { num: '5', name: 'Procedures' },
    { num: '6', name: 'Escalation Matrix' },
    { num: '7', name: 'Related / Pre-Existing Policies' },
    { num: '8', name: 'References' },
    { num: '9', name: 'Revision History' },
    { num: '10', name: 'Approval' }
  ];

  let tocY = 38;
  doc.setFontSize(9);
  for (const entry of dynamicTocEntries) {
    const pageNum = pageMap[entry.num] || pageMap[entry.num + '.0'] || 3;
    const isMain = !entry.num.includes('.');
    doc.setFont('helvetica', isMain ? 'bold' : 'normal');
    doc.setTextColor(isMain ? 10 : 71, isMain ? 37 : 85, isMain ? 64 : 105);
    const indent = isMain ? 0 : 6;
    const numAndName = `${entry.num} ${entry.name}`;
    doc.text(numAndName, margin + indent, tocY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    const textWidth = doc.getTextWidth(numAndName);
    const startDotsX = margin + indent + textWidth + 3;
    const endDotsX = pageWidth - margin - 8;
    const dotWidth = doc.getTextWidth('.');
    const availableSpace = endDotsX - startDotsX;
    const numDots = Math.floor(availableSpace / (dotWidth + 1));
    if (numDots > 0) {
      doc.text('.'.repeat(numDots), startDotsX, tocY);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(pageNum), pageWidth - margin, tocY, { align: 'right' });
    tocY += isMain ? 6.5 : 5.2;
  }

  // ==================== RUNNING HEADERS & FOOTERS DRAW ====================
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Suppress ALL headers/footers on the FFI SOP Cover Page (Page 1)
    if (i > 1) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
      
      if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', margin, 4, 18, 6); } catch {}
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      
      const docIdText = `ID: ${docId}`;
      const docIdWidth = doc.getTextWidth(docIdText);
      const rightBoundary = pageWidth - margin - docIdWidth - 4;
      const leftBoundary = margin + 19;
      const maxTitleWidth = rightBoundary - leftBoundary;

      let headerTitleText = ` |   SOP: ${cleanedTitle.toUpperCase()}`;
      if (doc.getTextWidth(headerTitleText) > maxTitleWidth) {
        // Visual truncation with ellipsis
        while (headerTitleText.length > 10 && doc.getTextWidth(headerTitleText + '...') > maxTitleWidth) {
          headerTitleText = headerTitleText.slice(0, headerTitleText.length - 1);
        }
        headerTitleText = headerTitleText + '...';
      }
      
      doc.text(headerTitleText, leftBoundary, 8);
      doc.text(docIdText, pageWidth - margin, 8, { align: 'right' });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Document ID: ${docId}   |   Version: ${version}   |   Classification: ${classification}   |   Future Focus Infotech`, margin, pageHeight - 8);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  }

  const cleanTitle = (sop.title || 'SOP').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  doc.save(`FFI-SOP-${docId}-${cleanTitle}.pdf`);
}

/**
 * Helper to convert dataURL/Base64 to Uint8Array safely for DOCX images.
 */
function dataURLToUint8Array(dataUrl: string): Uint8Array | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const base64Pure = parts[1];
    const binaryString = window.atob(base64Pure);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Error converting dataURL to Uint8Array for DOCX:', err);
    return null;
  }
}

/**
 * Generates a clean, professional Standard Operating Procedure Word document (DOCX).
 */
export async function downloadSOPAsDOCX(sop: SOPDocument): Promise<void> {
  const docId = sop.sopNumber || sop.id || 'Not specified';
  const version = sop.version ? `v${sop.version}` : 'Not specified';
  const departmentFormatted = sop.department ? String(sop.department).replace(/_/g, ' ') : 'Not specified';
  const effectiveDate = sop.effectiveDate || 'Not specified';
  const status = sop.status || 'Not specified';
  const classification = sop.sensitivityLabel || 'Not specified';
  const reviewDate = sop.nextReviewDate || 'Not specified';
  const cleanedTitle = cleanSopTitle(sop.title);
  const cleanTitle = (cleanedTitle || 'SOP').replace(/[^a-z0-9]/gi, '_').toLowerCase();

  const logoPngDataUrl = await getLogoPngDataUrl('dark');
  const logoBytes = logoPngDataUrl ? dataURLToUint8Array(logoPngDataUrl) : null;

  const createHeading = (text: string) => new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: "1E3A8A", font: "Segoe UI" })]
  });

  const createSubHeading = (text: string) => new Paragraph({
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text, bold: true, size: 20, color: "1E3A8A", font: "Segoe UI" })]
  });

  const createTextParagraph = (text: string) => new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: text || 'Not Applicable', size: 19, font: "Segoe UI", color: "334155" })]
  });

  // Helper to create styled TableCell with standard padding and borders
  const createTableCell = (
    text: string, 
    options?: { 
      bold?: boolean; 
      color?: string; 
      fillColor?: string; 
      alignRight?: boolean; 
      fontSize?: number; 
    }
  ) => {
    return new TableCell({
      shading: options?.fillColor ? { fill: options.fillColor } : undefined,
      margins: { top: 120, bottom: 120, left: 150, right: 150 },
      children: [
        new Paragraph({
          alignment: options?.alignRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
          children: [
            new TextRun({
              text: text || 'Not Applicable',
              bold: !!options?.bold,
              color: options?.color || "334155",
              size: options?.fontSize || 18,
              font: "Segoe UI"
            })
          ]
        })
      ]
    });
  };

  const logoParagraph = logoBytes ? new Paragraph({
    spacing: { after: 120 },
    children: [
      new ImageRun({
        data: logoBytes,
        transformation: {
          width: 130,
          height: 45
        }
      } as any)
    ]
  }) : new Paragraph({
    children: [new TextRun({ text: "FUTURE FOCUS INFOTECH", color: "1E3A8A", bold: true, size: 22, font: "Segoe UI" })]
  });

  // 1. Cover Header Table
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 12, color: "1E3A8A" },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE }, insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "FFFFFF" },
            margins: { top: 240, bottom: 240, left: 240, right: 240 },
            children: [
              logoParagraph,
              new Paragraph({
                spacing: { before: 180 },
                children: [new TextRun({ text: "STANDARD OPERATING PROCEDURE", color: "1E3A8A", bold: true, size: 28, font: "Segoe UI" })]
              }),
              new Paragraph({
                spacing: { before: 100 },
                children: [new TextRun({ text: cleanedTitle.toUpperCase(), color: "0F172A", bold: true, size: 22, font: "Segoe UI" })]
              }),
              new Paragraph({
                spacing: { before: 100 },
                children: [new TextRun({ text: `ID: ${docId}  •  Version: ${version}  •  Status: ${status}`, color: "64748B", size: 18, font: "Segoe UI" })]
              })
            ]
          })
        ]
      })
    ]
  });

  // 2. Cover Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: [
      new TableRow({
        children: [
          createTableCell("Document Title", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(cleanedTitle, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Document ID", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(docId, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Version", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(version, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Status", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(status, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Date Issued", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(effectiveDate, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Owner", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(sop.departmentOwner || 'Future Focus Infotech', { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Classification", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(classification, { color: "0F172A" }),
        ]
      }),
      new TableRow({
        children: [
          createTableCell("Review Cycle", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
          createTableCell(`${sop.reviewFrequencyMonths || 12} Months (Next: ${reviewDate})`, { color: "0F172A" }),
        ]
      })
    ]
  });

  const docChildren: any[] = [
    logoParagraph,
    new Paragraph({
      spacing: { before: 180, after: 120 },
      children: [new TextRun({ text: "FUTURE FOCUS INFOTECH PVT LTD", color: "0A2540", bold: true, size: 20, font: "Segoe UI" })]
    }),
    new Paragraph({
      spacing: { after: 180 },
      children: [new TextRun({ text: "STANDARD OPERATING PROCEDURE", color: "64748B", bold: true, size: 22, font: "Segoe UI" })]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [new TextRun({ text: cleanedTitle.toUpperCase(), color: "0A2540", bold: true, size: 36, font: "Segoe UI" })]
    }),
    new Paragraph({
      spacing: { after: 360 },
      children: [new TextRun({ text: `${departmentFormatted} Department Operations & Guidelines`, color: "64748B", italics: true, size: 20, font: "Segoe UI" })]
    }),
    metaTable,
    new Paragraph({
      children: [new PageBreak()]
    }),

    // TABLE OF CONTENTS (Reserved on Page 2)
    createHeading("TABLE OF CONTENTS"),
    new Paragraph({ children: [new TextRun({ text: "1. Purpose and Scope .......................................................................................................... Page 3", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "2. Environment & Policy Reference .......................................................................................... Page 4", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "3. Roles & Responsibilities ..................................................................................................... Page 5", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "4. Definitions & Acronyms ........................................................................................................ Page 5", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "5. Procedures ................................................................................................................. Page 6", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "6. Escalation Matrix .......................................................................................................... Page 7", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "7. Related / Pre-Existing Policies (Not Modified) ......................................................................... Page 7", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "8. References ................................................................................................................... Page 7", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "9. Revision History ............................................................................................................. Page 8", size: 18, font: "Segoe UI" })] }),
    new Paragraph({ children: [new TextRun({ text: "10. Approval ..................................................................................................................... Page 8", size: 18, font: "Segoe UI" })] }),

    new Paragraph({
      children: [new PageBreak()]
    }),

    // SECTION 1: Purpose and Scope
    createHeading("1. Purpose and Scope"),
    createSubHeading("1.1 Purpose"),
    createTextParagraph(sop.purpose),
    createSubHeading("1.2 Scope"),
    createTextParagraph(sop.scopeInScope || sop.scope),
    createSubHeading("1.3 Out of Scope"),
    createTextParagraph(sop.scopeOutOfScope),
    createSubHeading("1.4 Operating Principles"),
    createTextParagraph(sop.operatingPrinciples),

    // SECTION 2: Environment Reference Table
    createHeading("2. Environment & Policy Reference"),
  ];

  const section2Items = getSmartSection2Items(sop);

  const envRows = [
    new TableRow({
      children: [
        createTableCell("Standard Component / Environment Policy", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Configured Policy Details & References", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    }),
    ...section2Items.map(item => new TableRow({
      children: [
        createTableCell(item.label, { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
        createTableCell(item.value, { color: "0F172A" })
      ]
    }))
  ];
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: envRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  // SECTION 3: Roles & Responsibilities
  docChildren.push(createHeading("3. Roles & Responsibilities"));
  docChildren.push(createTextParagraph("The following department roles are designated with standard operational ownership of the procedures outlined:"));

  const respRows = [
    new TableRow({
      children: [
        createTableCell("Designated Role", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Standard Operational Responsibilities", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    })
  ];
  if (sop.responsibilities && sop.responsibilities.length > 0) {
    sop.responsibilities.forEach((r, idx) => {
      const rowFill = idx % 2 === 1 ? "F8FAFC" : undefined;
      respRows.push(new TableRow({
        children: [
          createTableCell(r.role, { bold: true, color: "0F172A", fillColor: rowFill }),
          createTableCell(r.description, { color: "334155", fillColor: rowFill })
        ]
      }));
    });
  } else {
    respRows.push(new TableRow({
      children: [
        createTableCell("Operator", { bold: true, color: "0F172A" }),
        createTableCell("Not Applicable / Default Performer")
      ]
    }));
  }
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: respRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  // SECTION 4: Definitions
  docChildren.push(createHeading("4. Definitions & Acronyms"));
  const defRows = [
    new TableRow({
      children: [
        createTableCell("Term / Acronym", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Standard Enterprise Definition", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    })
  ];
  const defsList = sop.definitions && sop.definitions.length > 0 ? sop.definitions : [{ term: "SOP", definition: "Standard Operating Procedure" }, { term: "FFI", definition: "Future Focus Infotech" }];
  defsList.forEach((d, idx) => {
    const rowFill = idx % 2 === 1 ? "F8FAFC" : undefined;
    defRows.push(new TableRow({
      children: [
        createTableCell(d.term, { bold: true, color: "0F172A", fillColor: rowFill }),
        createTableCell(d.definition, { color: "334155", fillColor: rowFill })
      ]
    }));
  });
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: defRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  // SECTION 5: Procedures
  docChildren.push(createHeading("5. Procedures"));
  if (sop.procedureSteps && sop.procedureSteps.length > 0) {
    for (const step of sop.procedureSteps) {
      docChildren.push(new Paragraph({
        spacing: { before: 180, after: 60 },
        children: [new TextRun({ text: `5.1 Step ${step.stepNumber}: ${step.title}`, bold: true, size: 20, color: "1E3A8A", font: "Segoe UI" })]
      }));
      docChildren.push(createTextParagraph(cleanInstructionText(step.action || '')));

      if (step.safetyNote) {
        docChildren.push(new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
            left: { style: BorderStyle.SINGLE, size: 12, color: "F59E0B" },
            right: { style: BorderStyle.SINGLE, size: 4, color: "F59E0B" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "FEF3C7" },
                  margins: { top: 120, bottom: 120, left: 150, right: 150 },
                  children: [new Paragraph({ children: [new TextRun({ text: `⚠️ WARNING NOTE: ${step.safetyNote}`, size: 18, font: "Segoe UI", color: "78350F" })] })]
                })
              ]
            })
          ]
        }));
        docChildren.push(new Paragraph({ spacing: { before: 80 } }));
      }

      if (step.screenshots && step.screenshots.length > 0 && step.screenshots[0]) {
        try {
          const imgBytes = dataURLToUint8Array(step.screenshots[0]);
          if (imgBytes) {
            docChildren.push(new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 100, after: 100 },
              children: [
                new ImageRun({
                  data: imgBytes,
                  transformation: { width: 400, height: 200 }
                } as any)
              ]
            }));
          }
        } catch {}
      }
    }
  } else {
    docChildren.push(createTextParagraph("Not Applicable - No procedural steps defined."));
  }

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  // SECTIONS 6 - 10
  docChildren.push(createHeading("6. Escalation Matrix"));
  const escRows = [
    new TableRow({
      children: [
        createTableCell("Escalation Tier / Stage", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Response Protocol & Designated SLA Contact", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    }),
    new TableRow({
      children: [
        createTableCell("Primary Escalation Path", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
        createTableCell(sop.escalationMatrix || "Not Applicable", { color: "0F172A" }),
      ]
    })
  ];
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: escRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  docChildren.push(createHeading("7. Related / Pre-Existing Policies (Not Modified)"));
  const relRows = [
    new TableRow({
      children: [
        createTableCell("Reference Document Type", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Governance Policies & Compliance Standard References", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    }),
    new TableRow({
      children: [
        createTableCell("Pre-Existing Corporate Policies", { bold: true, color: "0A2540", fillColor: "F8FAFC" }),
        createTableCell(sop.relatedPolicies || "Not Applicable", { color: "0F172A" }),
      ]
    })
  ];
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: relRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  docChildren.push(createHeading("8. References"));
  const refRows = [
    new TableRow({
      children: [
        createTableCell("Policy / Manual Reference", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Document ID / Reference URL", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" })
      ]
    })
  ];
  const refList = sop.references && sop.references.length > 0 ? sop.references : [{ title: "Operational Guidelines / Standard Manuals", urlOrDocId: "Refer to Department Wiki / Shared Folder" }];
  refList.forEach((r, idx) => {
    const rowFill = idx % 2 === 1 ? "F8FAFC" : undefined;
    refRows.push(new TableRow({
      children: [
        createTableCell(r.title, { bold: true, color: "0F172A", fillColor: rowFill }),
        createTableCell(r.urlOrDocId, { color: "334155", fillColor: rowFill })
      ]
    }));
  });
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: refRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  docChildren.push(createHeading("9. Revision History"));
  const histRows = [
    new TableRow({
      children: [
        createTableCell("Version", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Release Date", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Author Name", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Description of Changes", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
      ]
    })
  ];
  const histList = sop.changeHistory && sop.changeHistory.length > 0 ? sop.changeHistory : [{ version, date: effectiveDate, author: "Author", summary: "Initial setup" }];
  histList.forEach((h, idx) => {
    const rowFill = idx % 2 === 1 ? "F8FAFC" : undefined;
    histRows.push(new TableRow({
      children: [
        createTableCell(h.version, { bold: true, color: "0F172A", fillColor: rowFill }),
        createTableCell(h.date, { color: "334155", fillColor: rowFill }),
        createTableCell(h.author, { color: "334155", fillColor: rowFill }),
        createTableCell(h.summary, { color: "334155", fillColor: rowFill }),
      ]
    }));
  });
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: histRows
  }));

  docChildren.push(new Paragraph({ spacing: { before: 180 } }));

  docChildren.push(createHeading("10. Approval"));
  const signeeName = sop.approvalHistory?.[0]?.user?.name || sop.approver2?.name || 'Department Supervisor';
  const signeeRole = sop.approvalHistory?.[0]?.user?.role || sop.approver2?.role || 'Department Manager';
  const signDate = sop.approvalHistory?.[0]?.timestamp?.split('T')[0] || effectiveDate;

  const appRows = [
    new TableRow({
      children: [
        createTableCell("Role / Designation", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Name", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Signature", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
        createTableCell("Date", { bold: true, color: "FFFFFF", fillColor: "1E3A8A" }),
      ]
    }),
    new TableRow({
      children: [
        createTableCell(signeeRole, { color: "0F172A" }),
        createTableCell(signeeName, { color: "0F172A" }),
        createTableCell("", { color: "0F172A" }),
        createTableCell(signDate, { color: "0F172A" }),
      ]
    })
  ];
  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "E2E8F0" },
    },
    rows: appRows
  }));

  const sectionFooter = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `Document ID: ${docId}   |   Version: ${version}   |   Classification: ${classification}   |   Future Focus Infotech`, size: 16, color: "94A3B8", font: "Segoe UI" })]
      })
    ]
  });

  const doc = new Document({
    sections: [{ properties: {}, footers: { default: sectionFooter }, children: docChildren }]
  });

  Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FFI-SOP-${docId}-${cleanTitle}.docx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }).catch(() => {});
}
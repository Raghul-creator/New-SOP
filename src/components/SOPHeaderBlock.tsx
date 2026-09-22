import React from 'react';
import { SOPDocument } from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  Calendar,
  Layers,
  ShieldCheck,
  Building,
  FileText,
  Tag,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface SOPHeaderBlockProps {
  sop: SOPDocument;
  variant?: 'full' | 'compact' | 'card-strip';
  showAuditLineage?: boolean;
  className?: string;
}

export const SOPHeaderBlock: React.FC<SOPHeaderBlockProps> = ({
  sop,
  variant = 'full',
  showAuditLineage = true,
  className = ''
}) => {
  const departmentFormatted = (sop.department || 'Software_DevOps').replace(/_/g, ' ');
  const nextReview = sop.nextReviewDate || '15-Aug-2027';
  const currentVersion = sop.version || '1.0';
  const criticality = sop.businessCriticality || 'High';
  const sensitivity = sop.sensitivityLabel || 'Internal';

  // Review urgency calculation
  const getReviewStatusInfo = (reviewDateStr: string) => {
    try {
      const reviewDate = new Date(reviewDateStr);
      const now = new Date();
      const diffDays = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          status: 'Overdue',
          label: `Overdue by ${Math.abs(diffDays)} days`,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
          iconColor: 'text-rose-600'
        };
      } else if (diffDays <= 30) {
        return {
          status: 'Expiring Soon',
          label: `Review due in ${diffDays} days`,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          iconColor: 'text-amber-600'
        };
      } else {
        return {
          status: 'Compliant',
          label: 'Scheduled Annual Cycle',
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          iconColor: 'text-emerald-600'
        };
      }
    } catch {
      return {
        status: 'Compliant',
        label: 'Scheduled Annual Cycle',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        iconColor: 'text-emerald-600'
      };
    }
  };

  const reviewStatus = getReviewStatusInfo(nextReview);

  // Status color styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Published':
        return 'bg-emerald-600 text-white shadow-sm';
      case 'Approved':
        return 'bg-cyan-700 text-white shadow-sm';
      case 'Under Review':
        return 'bg-blue-600 text-white';
      case 'Pending Final Approval':
      case 'Pending Approver 2':
      case 'Pending Approver 1':
        return 'bg-amber-500 text-slate-950 font-bold';
      case 'Changes Requested':
        return 'bg-rose-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  if (variant === 'card-strip') {
    return (
      <div className={`p-3 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2 text-xs ${className}`}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 text-[11px]">
          {/* 1. Operational Department */}
          <div className="flex items-center space-x-2 sm:pr-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">Department</span>
              <span className="font-semibold text-slate-100 truncate block">{departmentFormatted}</span>
            </div>
          </div>

          {/* 2. Next Review Date */}
          <div className="flex items-center space-x-2 sm:px-2 pt-2 sm:pt-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">Next Review Date</span>
              <span className="font-mono font-bold text-amber-300 block">{nextReview}</span>
            </div>
          </div>

          {/* 3. Current Version */}
          <div className="flex items-center space-x-2 sm:pl-2 pt-2 sm:pt-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">Current Version</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-cyan-300">v{currentVersion}</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${getStatusBadge(sop.status)}`}>
                  {sop.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border-2 border-slate-900 rounded-xl overflow-hidden text-xs shadow-md bg-white ${className}`}>
      
      {/* 1. Header Bar with Institutional Brand & Governance Badges */}
      <div className="bg-slate-950 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center">
            <CompanyLogo variant="light" height={28} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {sop.sopNumber || sop.id}
              </span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                FUTURE FOCUS INFOTECH CONTROLLED STANDARD OPERATING PROCEDURE
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              Enterprise Governance Standard • Part of en Inc. Group • ISO 9001 / ISO 27001 ISMS Controlled
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] bg-purple-950/80 text-purple-300 border border-purple-800 px-2 py-0.5 rounded font-semibold">
            Purview: {sensitivity}
          </span>
          <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${getStatusBadge(sop.status)}`}>
            {sop.status}
          </span>
        </div>
      </div>

      {/* 2. Three Primary Highlight Columns: Operational Pillar, Next Review Date, Current Version */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-slate-200 bg-slate-900 text-white p-4 gap-4 md:gap-0">
        
        {/* Highlight 1: Operational Domain */}
        <div className="md:px-4 first:pl-0 flex items-start space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Building className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Operational Domain</span>
              <span className="text-[9px] bg-cyan-900/60 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-700">
                Service Line
              </span>
            </div>
            <div className="font-bold text-sm text-white">{departmentFormatted}</div>
            <div className="text-[11px] text-slate-300">Category: {sop.category || 'Enterprise Procedure'}</div>
            <div className="text-[10px] text-slate-400 font-mono">Scope: {sop.clientScope || 'Global Enterprise'}</div>
          </div>
        </div>

        {/* Highlight 2: Next Review Date */}
        <div className="md:px-4 flex items-start space-x-3 pt-3 md:pt-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Next Review Date</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded border ${reviewStatus.badgeClass}`}>
                {reviewStatus.status}
              </span>
            </div>
            <div className="font-mono font-bold text-sm text-amber-300">{nextReview}</div>
            <div className="text-[11px] text-slate-300">{reviewStatus.label}</div>
            <div className="text-[10px] text-slate-400">Effective: <span className="font-mono text-slate-300">{sop.effectiveDate}</span></div>
          </div>
        </div>

        {/* Highlight 3: Current Version */}
        <div className="md:px-4 last:pr-0 flex items-start space-x-3 pt-3 md:pt-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
            <Layers className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>Current Version</span>
              <span className="text-[9px] bg-emerald-900/60 text-emerald-200 px-1.5 py-0.2 rounded border border-emerald-700">
                Controlled Rev
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-cyan-300">v{currentVersion}</span>
              <span className="text-[10px] text-slate-300">({sop.status})</span>
            </div>
            <div className="text-[11px] text-slate-300">
              Classification: <strong className="text-white">{sensitivity}</strong>
            </div>
            <div className="text-[10px] text-slate-400">
              Criticality: <span className="text-rose-300 font-semibold">{criticality}</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Secondary 10-Field Metadata & Lineage Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b border-slate-300 bg-slate-50 text-xs">
        
        {/* Left Column: Procedural & System Metadata */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">1. SOP Standard Number:</span>
            <span className="font-mono font-bold text-slate-900 bg-slate-200/80 px-2 py-0.5 rounded">
              {sop.sopNumber || sop.id}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-slate-500 font-semibold">2. SOP Title:</span>
            <span className="font-bold text-slate-900 text-right">{sop.title}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">3. Department / Pillar:</span>
            <span className="font-semibold text-slate-800">{departmentFormatted}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">4. Operational Classification:</span>
            <span className="font-bold text-cyan-900 bg-cyan-100/70 px-2 py-0.5 rounded">
              {sensitivity} &bull; Criticality: {criticality}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">5. Category:</span>
            <span className="font-semibold text-slate-800">
              {sop.category || 'Standard Operating Procedure'}
            </span>
          </div>
        </div>

        {/* Right Column: Governance & Compliance Schedule */}
        <div className="p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">6. Compliance Alignment:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {(sop.complianceStandards || ['ISO 9001', 'ISO 27001']).join(', ')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">7. Version:</span>
            <span className="font-mono font-bold text-cyan-800">v{currentVersion}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">8. Effective Date:</span>
            <span className="font-mono text-slate-800 font-semibold">{sop.effectiveDate}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">9. Next Review Date:</span>
            <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {nextReview}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">10. Governance Status:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full border text-[11px] ${
              sop.status === 'Published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : sop.status === 'Approved'
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {sop.status}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Institutional Governance Notice */}
      {showAuditLineage && (
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>
              <strong>ISO 9001 / ISO 27001 Governance Lineage:</strong> Controlled Standard Operating Procedure preserved in SharePoint Online version logs & 7-year immutable audit vault.
            </span>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
              Retention: 7 Years
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

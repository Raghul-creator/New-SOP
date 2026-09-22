import React, { useState } from 'react';
import { SOPDocument, User } from '../types';
import { DEPARTMENT_CONFIGS } from '../data/mockData';
import {
  Share2,
  Building2,
  CheckCircle2,
  Play,
  RefreshCw,
  Search,
  Code2,
  Database,
  ExternalLink,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface SharePointConsoleViewProps {
  sops: SOPDocument[];
  currentUser: User;
  onPublishSop: (sopId: string, siteUrl?: string, libraryName?: string) => void;
}

export const SharePointConsoleView: React.FC<SharePointConsoleViewProps> = ({
  sops,
  currentUser,
  onPublishSop
}) => {
  const [selectedSopId, setSelectedSopId] = useState<string>(
    sops.find(s => s.status === 'Approved' || s.status === 'Published')?.id || sops[0]?.id || ''
  );
  const [targetSiteUrl, setTargetSiteUrl] = useState('https://contoso.sharepoint.com/sites/SOP-Governance');
  const [isPublishing, setIsPublishing] = useState(false);
  const [graphLog, setGraphLog] = useState<any>(null);

  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const activeSop = sops.find(s => s.id === selectedSopId);

  const handlePublish = async () => {
    if (!activeSop) return;

    setIsPublishing(true);
    setGraphLog(null);

    try {
      const deptConfig = DEPARTMENT_CONFIGS.find(d => d.id === activeSop.department);
      let libraryName = 'ControlledSOPs';
      if (deptConfig?.sharePointLibrary) {
        try {
          const urlObj = new URL(deptConfig.sharePointLibrary);
          const parts = urlObj.pathname.split('/').filter(Boolean);
          const last = parts[parts.length - 1];
          if (last && last.toLowerCase().includes('.aspx') && parts.length > 1) {
            libraryName = decodeURIComponent(parts[parts.length - 2]);
          } else if (last) {
            libraryName = decodeURIComponent(last);
          }
        } catch {
          libraryName = deptConfig.sharePointLibrary.split('/')[0] || 'ControlledSOPs';
        }
      }

      const res = await fetch('/api/sharepoint/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId: activeSop.id,
          targetLibrary: libraryName,
          siteUrl: targetSiteUrl,
          publishingUser: currentUser
        })
      });

      const data = await res.json();
      setGraphLog(data);
      onPublishSop(activeSop.id, targetSiteUrl, libraryName);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleVerify = async () => {
    if (!activeSop) return;

    setIsVerifying(true);
    try {
      const res = await fetch('/api/sharepoint/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sopId: activeSop.id })
      });
      const data = await res.json();
      setVerifyResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1A1C1E] text-white p-6 rounded-3xl border border-gray-800 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded-2xl">
            <Share2 className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
              Microsoft Graph API & SharePoint Online Publishing Console
            </h1>
            <p className="text-xs text-gray-300 mt-1">
              Direct OData synchronization to SharePoint document libraries with Purview sensitivity labels & metadata column mappings.
            </p>
          </div>
        </div>
      </div>

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Target Configuration */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-4 text-xs">
            <h2 className="font-bold text-[#1A1C1E] text-sm pb-2.5 border-b border-gray-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>1. Select SOP Document</span>
            </h2>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">Target SOP Document</label>
              <select
                value={selectedSopId}
                onChange={(e) => setSelectedSopId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sops.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.id} &mdash; {s.title} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">SharePoint Site Collection URL</label>
              <input
                type="text"
                value={targetSiteUrl}
                onChange={(e) => setTargetSiteUrl(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {activeSop && (
              <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-200/80 space-y-2.5">
                <div className="font-bold text-[#1A1C1E]">{activeSop.title}</div>
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <span className="bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono font-medium border border-indigo-100">
                    {activeSop.department}
                  </span>
                  <span className="bg-purple-50 text-purple-800 px-2.5 py-0.5 rounded-full font-bold border border-purple-100">
                    {activeSop.sensitivityLabel}
                  </span>
                  <span className="bg-gray-200 text-gray-800 px-2.5 py-0.5 rounded-full font-mono">
                    v{activeSop.version}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={handlePublish}
                disabled={isPublishing || !activeSop}
                className="w-full py-3 bg-[#1A1C1E] hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>Pushing to SharePoint via Graph API...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-indigo-400" />
                    <span>Publish Document to SharePoint</span>
                  </>
                )}
              </button>

              <button
                onClick={handleVerify}
                disabled={isVerifying || !activeSop}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify Active SharePoint Sync</span>
              </button>
            </div>
          </div>

          {/* Department Destination Mappings */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5 text-xs">
            <h3 className="font-bold text-[#1A1C1E] text-sm pb-2.5 border-b border-gray-100">
              Department Document Libraries
            </h3>
            <div className="space-y-2.5">
              {DEPARTMENT_CONFIGS.map(dept => (
                <div key={dept.id} className="p-3 bg-gray-50/70 rounded-2xl border border-gray-200/80">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-gray-900">{dept.name} ({dept.code})</div>
                    <a
                      href={dept.sharePointLibrary}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-800 text-[10px] flex items-center gap-1 font-semibold shrink-0"
                      title="Open SharePoint Library in new tab"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="font-mono text-[10px] text-indigo-700 truncate mt-1" title={dept.sharePointLibrary}>
                    {dept.sharePointLibrary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column 2 Cols: Live Graph API Stream Logs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Response Payload Console */}
          <div className="bg-[#1A1C1E] text-white p-6 rounded-3xl border border-gray-800 shadow-xs space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-gray-200">Microsoft Graph OData Response Log</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full text-indigo-300 font-medium">HTTP 201 Created</span>
            </div>

            {graphLog ? (
              <div className="space-y-3">
                <div className="text-emerald-400 font-semibold">{graphLog.message}</div>
                <div className="bg-black/50 p-4 rounded-2xl border border-gray-800 overflow-x-auto max-h-[380px] text-gray-300 text-[11px]">
                  <pre>{JSON.stringify(graphLog.graphResponse, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500">
                Click "Publish Document to SharePoint" to execute Graph API payload stream.
              </div>
            )}
          </div>

          {/* Verification Result Drawer */}
          {verifyResult && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-[#1A1C1E] pb-2.5 border-b border-gray-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>SharePoint Live Sync Verification</span>
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                  {verifyResult.graphStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div><strong>Unique Item ID:</strong> {verifyResult.itemUniqueId}</div>
                <div><strong>Library:</strong> {verifyResult.libraryName}</div>
                <div><strong>Last Synced:</strong> {new Date(verifyResult.lastSyncedAt).toLocaleString()}</div>
                <div><strong>Purview Label:</strong> <span className="font-bold text-purple-700">{verifyResult.activePurviewLabel}</span></div>
                <div className="col-span-2 truncate font-mono text-[10px] text-gray-500">
                  <strong>Verification Checksum:</strong> {verifyResult.verifyHash}
                </div>
              </div>
            </div>
          )}

          {/* Focus Infotech 10-Field SharePoint Schema Mapping Reference */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
              <h3 className="font-bold text-[#1A1C1E] text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>Focus Infotech 10-Field SharePoint Library Column Mapping</span>
              </h3>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-100 font-semibold">
                OData Fields
              </span>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-2xl">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-semibold text-gray-700">
                  <tr>
                    <th className="px-3.5 py-2.5 text-left">#</th>
                    <th className="px-3.5 py-2.5 text-left">Focus Infotech Field</th>
                    <th className="px-3.5 py-2.5 text-left">SharePoint Column</th>
                    <th className="px-3.5 py-2.5 text-left">Column Type</th>
                    <th className="px-3.5 py-2.5 text-left">Governance Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {[
                    { num: '1', field: 'SOP Number', sp: 'SOPNumber', type: 'Single line of text (Indexed)', role: 'Deterministic ID (e.g. ITS-SOP-001)' },
                    { num: '2', field: 'SOP Title', sp: 'Title', type: 'Single line of text', role: 'Operational Procedure Title' },
                    { num: '3', field: 'Department', sp: 'Department', type: 'Choice / Managed Metadata Term', role: 'Department Routing & Permissions' },
                    { num: '4', field: 'Process Owner', sp: 'ProcessOwner', type: 'Person or Group', role: 'Accountable Lead (Corporate Steward)' },
                    { num: '5', field: 'Reviewed By', sp: 'ReviewedBy', type: 'Person or Group', role: 'Level 1 Technical Sign-off' },
                    { num: '6', field: 'Approved By', sp: 'ApprovedBy', type: 'Person or Group', role: 'Final Governance Sign-off' },
                    { num: '7', field: 'Version', sp: 'SOPVersion', type: 'Single line of text (e.g. 1.0)', role: 'Major.Minor Revision Tracking' },
                    { num: '8', field: 'Effective Date', sp: 'EffectiveDate', type: 'Date and Time', role: 'Go-Live Statutory Date' },
                    { num: '9', field: 'Next Review Date', sp: 'NextReviewDate', type: 'Date and Time', role: '6/12 Month Automated Cycle' },
                    { num: '10', field: 'Status', sp: 'SOPStatus', type: 'Choice (Approved/Published)', role: 'Lifecycle State Machine' }
                  ].map(row => (
                    <tr key={row.num} className="hover:bg-gray-50/60 transition">
                      <td className="px-3.5 py-2.5 font-mono text-gray-400 font-bold">{row.num}</td>
                      <td className="px-3.5 py-2.5 font-semibold text-gray-900">{row.field}</td>
                      <td className="px-3.5 py-2.5 font-mono text-indigo-600 font-medium">{row.sp}</td>
                      <td className="px-3.5 py-2.5 text-gray-600 text-[11px]">{row.type}</td>
                      <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">{row.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-gray-600 text-[11px] space-y-1">
              <div className="font-semibold text-gray-800">
                Automatic SharePoint Built-In System Column Capture (ISO 9001 / ISO 27001 Traceability):
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-gray-600 text-[10px]">
                <li><strong>Created By (Author):</strong> Captured automatically by SharePoint in the system <code>Author</code> column from the OAuth token.</li>
                <li><strong>Modified By (Editor):</strong> Captured in the system <code>Editor</code> column on every version update.</li>
                <li><strong>Version History:</strong> Full historical delta and rollback history stored natively in SharePoint Online.</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

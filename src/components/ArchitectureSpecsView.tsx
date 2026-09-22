import React, { useState } from 'react';
import { ARCHITECTURE_SPECS, SpecSection } from '../data/specsData';
import {
  FolderGit2,
  Copy,
  Check,
  Download,
  BookOpen,
  Layers,
  ShieldCheck,
  Code2,
  Workflow,
  ShieldAlert,
  CalendarCheck
} from 'lucide-react';

export const ArchitectureSpecsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('prd');
  const [copied, setCopied] = useState<boolean>(false);

  const currentSpec = ARCHITECTURE_SPECS.find(s => s.id === activeTab) || ARCHITECTURE_SPECS[0];

  const handleCopySchema = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSchema = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <FolderGit2 className="w-6 h-6 text-indigo-100" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Enterprise Product Specification & Solution Architecture
            </h1>
            <p className="text-xs text-slate-300">
              Complete technical specification, PRD, Microsoft Entra ID PKCE Auth, SharePoint Managed Metadata, Controlled JSON Schema, and STRIDE Security Model.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Column: Spec Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">
            Specification Modules
          </h3>
          {ARCHITECTURE_SPECS.map(spec => (
            <button
              key={spec.id}
              onClick={() => setActiveTab(spec.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                activeTab === spec.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-l-4 border-indigo-600'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                {spec.id === 'prd' && <BookOpen className="w-3.5 h-3.5 text-indigo-500" />}
                {spec.id === 'solution-architecture' && <Layers className="w-3.5 h-3.5 text-blue-500" />}
                {spec.id === 'entra-id-design' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />}
                {spec.id === 'sharepoint-integration' && <Layers className="w-3.5 h-3.5 text-teal-500" />}
                {spec.id === 'permission-matrix' && <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
                {spec.id === 'sop-json-schema' && <Code2 className="w-3.5 h-3.5 text-emerald-500" />}
                {spec.id === 'workflow-state-diagram' && <Workflow className="w-3.5 h-3.5 text-purple-500" />}
                {spec.id === 'security-threat-model' && <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
                {spec.id === 'phased-implementation-plan' && <CalendarCheck className="w-3.5 h-3.5 text-slate-500" />}
                <span className="truncate">{spec.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Right Column: Spec Detail Viewer */}
        <div className="md:col-span-3 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[600px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
            <div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
                {currentSpec.category}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-2">{currentSpec.title}</h2>
            </div>

            {currentSpec.id === 'sop-json-schema' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopySchema(currentSpec.content)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Schema'}</span>
                </button>
                <button
                  onClick={() => handleDownloadSchema(currentSpec.content, 'controlled-sop-schema.json')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            )}
          </div>

          {currentSpec.id === 'sop-json-schema' ? (
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[500px]">
              <pre>{currentSpec.content}</pre>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-xs leading-relaxed space-y-4">
              {currentSpec.content.split('\n\n').map((paragraph, idx) => {
                if (paragraph.startsWith('# ')) {
                  return <h1 key={idx} className="text-lg font-bold text-slate-900 border-b pb-2 pt-2">{paragraph.replace('# ', '')}</h1>;
                }
                if (paragraph.startsWith('## ')) {
                  return <h2 key={idx} className="text-sm font-bold text-slate-800 pt-2">{paragraph.replace('## ', '')}</h2>;
                }
                if (paragraph.startsWith('```')) {
                  return (
                    <div key={idx} className="bg-slate-900 text-cyan-300 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                      <pre>{paragraph.replace(/```/g, '')}</pre>
                    </div>
                  );
                }
                return <p key={idx} className="text-slate-700 whitespace-pre-line">{paragraph}</p>;
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

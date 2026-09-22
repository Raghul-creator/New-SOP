import React from 'react';
import { SOPDocument, User, DepartmentConfig } from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  FileText,
  Plus,
  Camera,
  FileQuestion,
  ArrowRight,
  Sparkles,
  Building2,
  Layers
} from 'lucide-react';

interface DashboardViewProps {
  sops: SOPDocument[];
  currentUser: User;
  departments?: DepartmentConfig[];
  onNavigate: (view: string, sopId?: string, departmentFilter?: string) => void;
  onStartNewSop: (mode?: string, creationMode?: 'landing' | 'questions' | 'screenshots' | 'editable-page') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sops = [],
  currentUser,
  departments = [],
  onNavigate,
  onStartNewSop
}) => {
  // Sort SOPs to get the most recent ones first
  const recentSops = [...sops]
    .sort((a, b) => b.id.localeCompare(a.id))
    .slice(0, 5);

  const totalSops = sops.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Welcome & Primary Action Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <CompanyLogo variant="dark" height={32} />
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>SOP Creator Workspace</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1C1E]">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
            Create, manage, and distribute high-quality, step-by-step Standard Operating Procedures using AI-assisted authoring engines.
          </p>
        </div>

        <div>
          <button
            onClick={() => onStartNewSop()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New SOP</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metric Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate('library')}
          className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs hover:border-indigo-200 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total SOPs</span>
            <div className="text-3xl font-bold text-[#1A1C1E]">{totalSops}</div>
            <p className="text-xs text-gray-500">Standard operating procedures in your library</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs flex items-center justify-between col-span-2">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Workspace Health</span>
            <div className="text-lg font-bold text-gray-800">SOP Authoring Active</div>
            <p className="text-xs text-gray-500">Create new SOPs below by answering questions or uploading screenshots.</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Quick Access Creation Methods */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#1A1C1E]">
          SOP Creation Engines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Create SOP from Screenshots */}
          <div
            onClick={() => onStartNewSop(undefined, 'screenshots')}
            className="group bg-white rounded-3xl border border-gray-200 hover:border-indigo-600 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-5">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1C1E] group-hover:text-indigo-600 transition-colors">
                Create SOP from Screenshots
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Upload screenshots or process photos. The AI model will analyze visual elements (menus, fields, buttons) to generate a complete step-by-step procedure.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:underline">
              <span>Start screenshot wizard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Create SOP from Questions */}
          <div
            onClick={() => onStartNewSop(undefined, 'questions')}
            className="group bg-white rounded-3xl border border-gray-200 hover:border-indigo-600 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-5">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1C1E] group-hover:text-indigo-600 transition-colors">
                Create SOP from Questions
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Provide operational inputs through a guided Q&A interface. The AI will synthesize a beautifully structured and formatted standard SOP automatically.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:underline">
              <span>Start questionnaire wizard</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. Recent SOPs Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#1A1C1E]">
            Recent SOPs
          </h2>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition"
          >
            <span>View Library</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentSops.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No SOPs created yet. Use the buttons above to create your first standard operating procedure.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentSops.map(sop => (
              <div
                key={sop.id}
                onClick={() => onNavigate('library', sop.id)}
                className="flex items-center justify-between py-3.5 hover:bg-gray-50/60 rounded-xl px-2 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{sop.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{sop.id}</span>
                      <span>•</span>
                      <span>{sop.department}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    sop.status === 'Active' || sop.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    {sop.status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

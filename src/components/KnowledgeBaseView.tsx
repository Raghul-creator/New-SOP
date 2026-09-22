import React, { useState } from 'react';
import { TroubleshootingGuide, FAQItem, VendorContact, SOPDocument } from '../types';
import {
  BookOpen,
  Search,
  Wrench,
  HelpCircle,
  PhoneCall,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  troubleshootingGuides: TroubleshootingGuide[];
  faqs: FAQItem[];
  vendorContacts: VendorContact[];
  sops: SOPDocument[];
  onNavigateToSop: (sopId: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  troubleshootingGuides,
  faqs,
  vendorContacts,
  sops,
  onNavigateToSop
}) => {
  const [activeTab, setActiveTab] = useState<'troubleshooting' | 'faqs' | 'vendors'>('troubleshooting');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>(troubleshootingGuides[0]?.id || 'ts-001');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');

  const selectedGuide = troubleshootingGuides.find(g => g.id === selectedGuideId) || troubleshootingGuides[0];

  // Filtering
  const filteredGuides = troubleshootingGuides.filter(g =>
    g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.rootCause.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.symptoms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch =
      f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDeptFilter === 'all' || f.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredVendors = vendorContacts.filter(v =>
    v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.serviceCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.accountNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#1A1C1E] rounded-3xl p-6 text-white border border-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium">
                Focus Infotech Knowledge Base
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono">
                SOP-Linked Guidance
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              Technical Knowledge Base & Vendor Directory
            </h1>
            <p className="text-gray-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Cross-linked troubleshooting playbooks, operational FAQs, and verified enterprise vendor escalation contacts for Focus Infotech IT and corporate operations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search error codes, FAQs, vendors..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-white/10 border border-white/10 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white/15 transition-all"
            />
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-800">
          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'troubleshooting'
                ? 'bg-white text-[#1A1C1E] shadow-sm'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4 text-indigo-400" />
            <span>Troubleshooting Guides ({troubleshootingGuides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-white text-[#1A1C1E] shadow-sm'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>Operational FAQs ({faqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('vendors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              activeTab === 'vendors'
                ? 'bg-white text-[#1A1C1E] shadow-sm'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
            }`}
          >
            <PhoneCall className="w-4 h-4 text-indigo-400" />
            <span>Emergency Vendor Directory ({vendorContacts.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: TROUBLESHOOTING GUIDES */}
      {activeTab === 'troubleshooting' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guide List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Verified Playbooks ({filteredGuides.length})
            </h3>
            <div className="space-y-2.5">
              {filteredGuides.map(guide => {
                const isSelected = guide.id === selectedGuide?.id;
                return (
                  <div
                    key={guide.id}
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`p-4 rounded-3xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white hover:border-gray-300 border-gray-200/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase font-mono px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                        {guide.category}
                      </span>
                      <span className="text-[10px] font-mono text-indigo-600 font-semibold">{guide.relatedSopId}</span>
                    </div>
                    <h4 className="text-xs font-bold text-[#1A1C1E] line-clamp-2">{guide.title}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-1 mt-1">Root: {guide.rootCause}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide Details */}
          {selectedGuide && (
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {selectedGuide.category}
                    </span>
                    <span className="text-xs font-mono text-gray-500 font-semibold">Guide #{selectedGuide.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#1A1C1E] mt-1.5">{selectedGuide.title}</h2>
                </div>

                <button
                  onClick={() => onNavigateToSop(selectedGuide.relatedSopId)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold border border-indigo-200 flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open {selectedGuide.relatedSopId}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              {/* Symptoms */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Observable Symptoms & Error Codes
                </h4>
                <ul className="space-y-2 bg-amber-50/50 p-4 rounded-2xl border border-amber-200 text-xs text-gray-800">
                  {selectedGuide.symptoms.map((symp, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{symp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Root Cause */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Technical Root Cause
                </h4>
                <p className="text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200 leading-relaxed">
                  {selectedGuide.rootCause}
                </p>
              </div>

              {/* Step-by-Step Resolution */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Standard Resolution Procedure
                </h4>
                <div className="space-y-2">
                  {selectedGuide.resolutionSteps.map((step, idx) => (
                    <div key={idx} className="p-3.5 bg-white rounded-2xl border border-gray-200 flex items-start gap-3 shadow-xs">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-gray-800 font-medium leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Verification Stamp */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verified by: <b className="text-gray-900">{selectedGuide.verifiedBy}</b>
                </span>
                <span>Last Updated: {selectedGuide.updatedAt}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OPERATIONAL FAQS */}
      {activeTab === 'faqs' && (
        <div className="space-y-4">
          {/* Department Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Department:
            </span>
            {['all', 'Finance_Accounts', 'IT_Enablement', 'Human_Resources', 'Admin'].map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDeptFilter(dept)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  selectedDeptFilter === dept
                    ? 'bg-[#1A1C1E] text-white shadow-xs'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {dept === 'all'
                  ? 'All Departments'
                  : dept === 'Finance_Accounts'
                  ? 'Finance'
                  : dept === 'Human_Resources'
                  ? 'HR'
                  : dept.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map(faq => (
              <div key={faq.id} className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
                    {faq.department.replace('_', ' ')}
                  </span>
                  {faq.relatedSopId && (
                    <button
                      onClick={() => onNavigateToSop(faq.relatedSopId!)}
                      className="text-[10px] font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <span>{faq.relatedSopId}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                <h3 className="font-bold text-xs text-[#1A1C1E] flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>{faq.question}</span>
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed pl-6">{faq.answer}</p>

                <div className="pt-2 flex flex-wrap gap-1 pl-6">
                  {faq.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: EMERGENCY VENDOR DIRECTORY */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-3xl text-xs text-indigo-950 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Enterprise Vendor Governance: </span>
              All listed vendors maintain active Master Service Agreements (MSA) with Focus Infotech with verified SLA response times and dedicated escalation managers.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVendors.map(vendor => (
              <div key={vendor.id} className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#1A1C1E]">{vendor.vendorName}</h3>
                </div>

                <div className="text-xs text-gray-500 font-medium">{vendor.serviceCategory}</div>

                <div className="space-y-2 text-xs pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Corporate Account:</span>
                    <span className="font-mono font-bold text-gray-900">{vendor.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Emergency Phone:</span>
                    <span className="font-bold text-indigo-600">{vendor.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Contract SLA:</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {vendor.slaResponseTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Escalation Lead:</span>
                    <span className="text-gray-800">{vendor.escalationManager}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 block mb-2">{vendor.activeContract}</span>
                  <a
                    href={vendor.supportPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 bg-[#1A1C1E] hover:bg-gray-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <span>Launch Support Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

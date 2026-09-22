import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SOPDocument } from '../types';
import {
  Search,
  X,
  BookOpen,
  Building2,
  FileText,
  Tag,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sops: SOPDocument[];
  onSelectSop: (sopId: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  sops,
  onSelectSop
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
      setSelectedDept('ALL');
    }
  }, [isOpen]);

  // Keyboard shortcut ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // toggle handled by parent or opened
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) {
      // Return top active SOPs if search is blank
      return sops
        .filter(s => selectedDept === 'ALL' || s.department === selectedDept)
        .slice(0, 6)
        .map(s => ({
          sop: s,
          matchField: 'Catalog Entry',
          matchedSnippet: s.purpose?.slice(0, 120) || 'Standard Operating Procedure'
        }));
    }

    const query = searchTerm.toLowerCase();

    const results: Array<{
      sop: SOPDocument;
      matchField: string;
      matchedSnippet: string;
      score: number;
    }> = [];

    sops.forEach(sop => {
      if (selectedDept !== 'ALL' && sop.department !== selectedDept) {
        return;
      }

      let score = 0;
      let matchField = 'General';
      let matchedSnippet = '';

      // 1. SOP ID / Number match
      if (
        (sop.id && sop.id.toLowerCase().includes(query)) ||
        (sop.sopNumber && sop.sopNumber.toLowerCase().includes(query))
      ) {
        score += 100;
        matchField = 'SOP ID';
        matchedSnippet = `${sop.sopNumber || sop.id} - ${sop.title}`;
      }
      // 2. Title match
      else if (sop.title && sop.title.toLowerCase().includes(query)) {
        score += 80;
        matchField = 'Title';
        matchedSnippet = sop.title;
      }
      // 3. Department match
      else if (sop.department && sop.department.toLowerCase().includes(query)) {
        score += 50;
        matchField = 'Department';
        matchedSnippet = `Department: ${sop.department.replace('_', ' ')}`;
      }
      // 4. Keywords / Tags match
      else if (
        sop.keywords?.some(k => k.toLowerCase().includes(query)) ||
        (sop.tags && sop.tags.some(t => t.toLowerCase().includes(query)))
      ) {
        score += 70;
        matchField = 'Keywords / Tags';
        const matched = (sop.keywords || sop.tags || []).find(k => k.toLowerCase().includes(query));
        matchedSnippet = `Matched Tag: "${matched}"`;
      }
      // 5. Purpose match
      else if (sop.purpose && sop.purpose.toLowerCase().includes(query)) {
        score += 40;
        matchField = 'Purpose';
        matchedSnippet = sop.purpose;
      }
      // 6. Procedure Steps match
      else if (sop.procedureSteps && sop.procedureSteps.length > 0) {
        for (const step of sop.procedureSteps) {
          if (step.title?.toLowerCase().includes(query)) {
            score += 60;
            matchField = `Step ${step.stepNumber}: ${step.title}`;
            matchedSnippet = step.action || step.title;
            break;
          }
          if (step.action?.toLowerCase().includes(query)) {
            score += 50;
            matchField = `Step ${step.stepNumber} Procedure`;
            matchedSnippet = step.action;
            break;
          }
        }
      }
      // 7. Scope or Systems Used match
      else if (sop.scope && sop.scope.toLowerCase().includes(query)) {
        score += 30;
        matchField = 'Scope';
        matchedSnippet = sop.scope;
      } else if (sop.systemsUsed && sop.systemsUsed.toLowerCase().includes(query)) {
        score += 45;
        matchField = 'System Used';
        matchedSnippet = `System: ${sop.systemsUsed}`;
      }

      if (score > 0) {
        results.push({
          sop,
          matchField,
          matchedSnippet: matchedSnippet.slice(0, 140) + (matchedSnippet.length > 140 ? '...' : ''),
          score
        });
      }
    });

    return results.sort((a, b) => b.score - a.score);
  }, [sops, searchTerm, selectedDept]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-20 px-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Global search by Title, ID, Department, Purpose, Steps, or Keywords..."
            className="w-full text-sm sm:text-base text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl cursor-pointer"
          >
            <span className="text-xs font-mono font-bold bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">ESC</span>
          </button>
        </div>

        {/* Department Quick Filter Pills */}
        <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
          <span className="text-gray-400 font-medium text-[11px] mr-1">Filter:</span>
          {[
            { id: 'ALL', label: 'All Departments' },
            { id: 'IT_Enablement', label: 'IT Enablement' },
            { id: 'HR', label: 'HR' },
            { id: 'Finance', label: 'Finance' },
            { id: 'Payroll', label: 'Payroll' },
            { id: 'Compliance', label: 'Compliance' }
          ].map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`px-2.5 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap text-[11px] ${
                selectedDept === dept.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-200/80 border border-gray-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-gray-100">
          {searchResults.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No matching SOPs found</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for keywords like "laptop", "payroll", "security", or an ID like "IT-SOP-001".</p>
            </div>
          ) : (
            searchResults.map(item => {
              const { sop, matchField, matchedSnippet } = item;
              return (
                <div
                  key={sop.id}
                  onClick={() => {
                    onSelectSop(sop.id);
                    onClose();
                  }}
                  className="p-3 hover:bg-indigo-50/50 rounded-2xl transition cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {sop.sopNumber || sop.id}
                      </span>
                      <span className="font-bold text-sm text-gray-900 group-hover:text-indigo-900 transition">
                        {sop.title}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">v{sop.version}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        sop.status === 'Active' || sop.status === 'Published'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {sop.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {matchedSnippet}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1 text-gray-500">
                        <Building2 className="w-3 h-3" />
                        {sop.department.replace('_', ' ')}
                      </span>
                      <span className="inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span className="text-indigo-600 font-medium">
                        Matched in: {matchField}
                      </span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Found {searchResults.length} procedure(s)</span>
          <span className="flex items-center gap-1.5">
            <span>Press</span>
            <kbd className="font-mono bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">ENTER</kbd>
            <span>to open</span>
          </span>
        </div>

      </div>
    </div>
  );
};

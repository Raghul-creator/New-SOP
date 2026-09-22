import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Check, X, Info, Lightbulb, Edit3, HelpCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

export interface AIAssistantInlineProps {
  fieldName: string;
  processName: string;
  department: string;
  enteredData: Record<string, any>;
  onAccept: (value: string) => void;
  currentValue?: string;
  className?: string;
}

type SubActionType = 'explain' | 'suggest' | 'improve' | 'ask-me' | 'clear';

export const AIAssistantInline: React.FC<AIAssistantInlineProps> = ({
  fieldName,
  processName,
  department,
  enteredData,
  onAccept,
  currentValue = '',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SubActionType>('explain');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI responses cache map
  const [cache, setCache] = useState<Record<SubActionType, any>>({
    explain: null,
    suggest: null,
    improve: null,
    'ask-me': null,
    clear: null
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editableSuggestion, setEditableSuggestion] = useState('');

  const handleOpenAndFetch = async () => {
    setIsOpen(true);
    await fetchContent('explain');
  };

  const fetchContent = async (tab: SubActionType, forceRefresh = false) => {
    if (tab === 'improve' && !currentValue.trim() && !forceRefresh) {
      // Don't auto-fetch 'improve' if there is no text yet
      setActiveTab('improve');
      setIsEditing(false);
      return;
    }

    setActiveTab(tab);
    setIsEditing(false);

    if (!forceRefresh && cache[tab]) {
      // Use cached result
      const cached = cache[tab];
      if (tab === 'suggest' || tab === 'improve') {
        setEditableSuggestion(cached.result || cached.suggestion || '');
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/sop-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'field-assist',
          fieldName,
          processName,
          department,
          enteredData,
          subAction: tab,
          currentValue
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch AI assistance (status ${res.status})`);
      }

      const data = await res.json();
      
      setCache(prev => ({
        ...prev,
        [tab]: data
      }));

      if (tab === 'suggest' || tab === 'improve') {
        setEditableSuggestion(data.result || data.suggestion || '');
      }
    } catch (err: any) {
      console.error(`Error fetching FFI ${tab} assist:`, err);
      setError(err.message || 'Unable to retrieve AI assistance. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    const finalVal = isEditing ? editableSuggestion : (cache[activeTab]?.result || cache[activeTab]?.suggestion || '');
    if (finalVal) {
      onAccept(finalVal);
    }
    setIsOpen(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (cache[activeTab]) {
      setEditableSuggestion(cache[activeTab].result || cache[activeTab].suggestion || '');
    }
  };

  const currentCacheData = cache[activeTab];

  const tabs: { key: SubActionType; label: string; icon: React.ReactNode }[] = [
    { key: 'explain', label: 'Explain', icon: <Info className="w-3 h-3" /> },
    { key: 'suggest', label: 'Suggest', icon: <Sparkles className="w-3 h-3" /> },
    { key: 'improve', label: 'Improve', icon: <Edit3 className="w-3 h-3" /> },
    { key: 'ask-me', label: 'Ask Me', icon: <HelpCircle className="w-3 h-3" /> },
    { key: 'clear', label: 'Clear', icon: <ShieldAlert className="w-3 h-3" /> }
  ];

  return (
    <div className={`mt-1.5 ${className}`} id={`ai-assistant-container-${fieldName.toLowerCase().replace(/\s+/g, '-')}`}>
      {/* Trigger Button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpenAndFetch}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 hover:border-indigo-200 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Assistant</span>
        </button>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span className="font-semibold text-xs tracking-tight">AI Assistant &mdash; {fieldName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchContent(activeTab, true)}
                disabled={isLoading || (activeTab === 'improve' && !currentValue.trim())}
                className="text-[10px] text-indigo-600 hover:underline disabled:opacity-50 font-medium cursor-pointer"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-0.5 hover:bg-slate-200/50 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Assistant Sub-Action Tabs */}
          <div className="flex flex-wrap items-center gap-1 mb-3.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => fetchContent(tab.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 text-slate-500 bg-white border border-slate-100 rounded-lg">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mb-2" />
              <p className="text-[11px] font-medium text-indigo-950">Grounded FFI reasoning in progress...</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Filtering unverified assumptions</p>
            </div>
          ) : error ? (
            <div className="text-red-600 text-xs py-3 px-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="font-semibold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-500" />Analysis Error</p>
              <p className="text-red-500 mt-1">{error}</p>
              <button
                type="button"
                onClick={() => fetchContent(activeTab, true)}
                className="mt-2 text-indigo-600 hover:underline font-semibold cursor-pointer block text-[11px]"
              >
                Retry Request
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active Tab: Explain View */}
              {activeTab === 'explain' && currentCacheData && (
                <div className="space-y-2.5">
                  <div className="flex gap-2 text-slate-700 bg-white border border-slate-100 p-3 rounded-lg text-xs leading-relaxed shadow-3xs">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">What this field means:</span>
                      <p className="text-slate-600">{currentCacheData.explanation}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-slate-700 bg-amber-50/20 border border-amber-100/35 p-3 rounded-lg text-xs leading-relaxed shadow-3xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block mb-0.5">Professional Example:</span>
                      <p className="text-slate-600 italic font-mono text-[11px] leading-relaxed">{currentCacheData.example}</p>
                    </div>
                  </div>
                  
                  {currentCacheData.suggestion && (
                    <div className="border border-indigo-100 bg-indigo-50/10 rounded-lg p-3">
                      <span className="font-bold text-xs text-indigo-950 block mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        AI-Suggested Context Draft:
                      </span>
                      <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-white p-2.5 rounded-md border border-slate-100">
                        {currentCacheData.suggestion}
                      </p>
                      <div className="mt-2.5 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('suggest');
                            setEditableSuggestion(currentCacheData.suggestion);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer border border-indigo-200"
                        >
                          Use Suggestion Method
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Tab: Suggest View */}
              {activeTab === 'suggest' && (
                <div className="border border-indigo-100 bg-indigo-50/10 rounded-lg p-3">
                  <span className="font-bold text-xs text-indigo-950 block mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI-Suggested Draft:</span>
                  </span>

                  {isEditing ? (
                    <textarea
                      value={editableSuggestion}
                      onChange={(e) => setEditableSuggestion(e.target.value)}
                      rows={4}
                      className="w-full p-2.5 border border-indigo-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                      placeholder="Enter suggestion text..."
                    />
                  ) : (
                    <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs min-h-[50px]">
                      {currentCacheData?.result || currentCacheData?.suggestion || 'No suggestion could be pre-generated from current context.'}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setIsEditing(false);
                        }}
                        className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAccept}
                        disabled={!(isEditing ? editableSuggestion : (currentCacheData?.result || currentCacheData?.suggestion))}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" />
                        <span>Use Suggestion</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Tab: Improve View */}
              {activeTab === 'improve' && (
                <div className="border border-indigo-100 bg-indigo-50/10 rounded-lg p-3">
                  <span className="font-bold text-xs text-indigo-950 block mb-2 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Professionally Improved Draft:</span>
                  </span>

                  {!currentValue.trim() ? (
                    <div className="bg-white p-4 rounded-lg text-center text-slate-500 border border-slate-100 text-xs">
                      <p className="font-semibold text-slate-700 mb-1">Field is empty</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Please type some draft content into the form field first, then click "Improve" to let the assistant rewrite it professionally.
                      </p>
                    </div>
                  ) : (
                    <>
                      {isEditing ? (
                        <textarea
                          value={editableSuggestion}
                          onChange={(e) => setEditableSuggestion(e.target.value)}
                          rows={4}
                          className="w-full p-2.5 border border-indigo-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                        />
                      ) : (
                        <p className="text-slate-800 text-xs leading-relaxed whitespace-pre-wrap font-mono bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs min-h-[50px]">
                          {currentCacheData?.result || currentCacheData?.suggestion || 'Loading improvement...'}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                        {!isEditing ? (
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleCancel}
                            className="text-[11px] text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsOpen(false);
                              setIsEditing(false);
                            }}
                            className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-md cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleAccept}
                            disabled={!(isEditing ? editableSuggestion : (currentCacheData?.result || currentCacheData?.suggestion))}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3 h-3" />
                            <span>Use Suggestion</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Active Tab: Ask Me View */}
              {activeTab === 'ask-me' && currentCacheData && (
                <div className="flex gap-2 text-slate-700 bg-white border border-slate-100 p-3.5 rounded-lg text-xs leading-relaxed shadow-3xs">
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-950 block mb-1">AI Assistant Question:</span>
                    <p className="text-slate-700 font-medium leading-relaxed">{currentCacheData.question || 'All critical information appears complete. No outstanding questions.'}</p>
                    <p className="text-[10px] text-slate-400 mt-1.5 italic">You can answer this question by editing your draft in the input field above.</p>
                  </div>
                </div>
              )}

              {/* Active Tab: Clear View */}
              {activeTab === 'clear' && currentCacheData && (
                <div className="flex gap-2.5 text-slate-700 bg-white border border-amber-100 p-3.5 rounded-lg text-xs leading-relaxed shadow-3xs">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block mb-1">Assumption Scan &amp; Guidance:</span>
                    <p className="text-slate-600 leading-relaxed font-mono text-[11px] bg-amber-50/30 p-2 rounded border border-amber-50">{currentCacheData.warning || 'No unverified assumptions, fake names, unapproved software, or compliance claims were detected.'}</p>
                    <div className="mt-2.5 text-[10px] text-slate-500 leading-relaxed">
                      <strong className="text-slate-700">FFI Strict Document Policy:</strong> Do not use unapproved vendor systems, individual emails, mobile numbers, or unverified certification statements.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

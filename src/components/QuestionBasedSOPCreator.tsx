import React, { useState, useEffect } from 'react';
import {
  SOPDocument,
  User,
  DepartmentConfig
} from '../types';
import { CompanyLogo } from './CompanyLogo';
import { SimpleQuestionSOPForm } from './sop-creator/SimpleQuestionSOPForm';
import { SimpleScreenshotSOPForm } from './sop-creator/SimpleScreenshotSOPForm';
import { SimpleEditableSOPPage } from './sop-creator/SimpleEditableSOPPage';
import { SOPPreviewModal } from './SOPPreviewModal';
import {
  FileQuestion,
  Camera,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export interface QuestionBasedSOPCreatorProps {
  currentUser: User;
  departments: DepartmentConfig[];
  initialDepartment?: string;
  initialSop?: SOPDocument | null;
  initialCreationMode?: 'landing' | 'questions' | 'screenshots' | 'editable-page';
  existingSops?: SOPDocument[];
  onSaveSop: (sop: SOPDocument, submitForApproval?: boolean) => void;
  onSaveDepartment?: (dept: Partial<DepartmentConfig>) => Promise<any>;
  onCancel: () => void;
}

export const QuestionBasedSOPCreator: React.FC<QuestionBasedSOPCreatorProps> = ({
  currentUser,
  departments,
  initialDepartment,
  initialSop,
  initialCreationMode,
  existingSops = [],
  onSaveSop,
  onSaveDepartment,
  onCancel
}) => {
  // Determine initial mode: landing, questions, screenshots, or editable-page
  const [creationMode, setCreationMode] = useState<'landing' | 'questions' | 'screenshots' | 'editable-page'>(() => {
    if (initialSop) {
      return 'editable-page';
    }
    if (initialCreationMode) {
      return initialCreationMode;
    }
    return 'landing';
  });

  const [editableSop, setEditableSop] = useState<SOPDocument | null>(initialSop || null);

  useEffect(() => {
    if (initialSop) {
      setEditableSop(initialSop);
      setCreationMode('editable-page');
    }
  }, [initialSop]);

  // State for preview modal
  const [previewSop, setPreviewSop] = useState<SOPDocument | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleOpenPreview = (sop: SOPDocument) => {
    setPreviewSop(sop);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewSop(null);
  };

  const handleGenerated = (sop: SOPDocument) => {
    setEditableSop(sop);
    setCreationMode('editable-page');
  };

  // If currently in Editable SOP Page mode (shown immediately after generation or editing)
  if (creationMode === 'editable-page' && editableSop) {
    return (
      <SimpleEditableSOPPage
        initialSop={editableSop}
        currentUser={currentUser}
        departments={departments}
        onSaveDraft={(draftSop) => {
          onSaveSop(draftSop, false);
        }}
        onSaveSop={(finalSop) => {
          onSaveSop(finalSop, false);
        }}
        onBack={() => {
          setCreationMode('landing');
        }}
      />
    );
  }

  // If currently in Questions mode
  if (creationMode === 'questions') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
        <SimpleQuestionSOPForm
          currentUser={currentUser}
          departments={departments}
          initialDepartment={initialDepartment}
          initialSop={initialSop}
          existingSops={existingSops}
          onSaveSop={onSaveSop}
          onSaveDepartment={onSaveDepartment}
          onPreview={handleOpenPreview}
          onBack={() => setCreationMode('landing')}
          onGenerated={handleGenerated}
        />

        {/* Unified Preview Modal */}
        <SOPPreviewModal
          isOpen={isPreviewOpen}
          sop={previewSop}
          currentUser={currentUser}
          onClose={handleClosePreview}
        />
      </div>
    );
  }

  // If currently in Screenshots mode
  if (creationMode === 'screenshots') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-200">
        <SimpleScreenshotSOPForm
          currentUser={currentUser}
          departments={departments}
          initialDepartment={initialDepartment}
          initialSop={initialSop}
          existingSops={existingSops}
          onSaveSop={onSaveSop}
          onSaveDepartment={onSaveDepartment}
          onPreview={handleOpenPreview}
          onBack={() => setCreationMode('landing')}
          onGenerated={handleGenerated}
        />

        {/* Unified Preview Modal */}
        <SOPPreviewModal
          isOpen={isPreviewOpen}
          sop={previewSop}
          currentUser={currentUser}
          onClose={handleClosePreview}
        />
      </div>
    );
  }

  // Streamlined, very simple, beginner-friendly Landing page
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 animate-in fade-in duration-200">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Main Header */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <CompanyLogo variant="dark" height={42} className="mx-auto mb-5" />
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Create a New SOP
        </h1>
        <p className="text-base text-gray-600 mt-2">
          Create your SOP using one of these methods:
        </p>
      </div>

      {/* Two Clean & Simple Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Method 1: Answer Questions */}
        <div
          id="method-answer-questions"
          onClick={() => setCreationMode('questions')}
          className="group relative bg-white hover:bg-indigo-50/20 rounded-2xl border-2 border-gray-200 hover:border-indigo-600 p-8 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-center items-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center mb-5">
              <FileQuestion className="w-7 h-7" />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCreationMode('questions');
              }}
              className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-semibold transition-colors shadow-xs cursor-pointer mb-4"
            >
              Answer Questions
            </button>

            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Answer a few simple questions and generate an SOP.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:underline">
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Method 2: Upload Screenshots */}
        <div
          id="method-upload-screenshots"
          onClick={() => setCreationMode('screenshots')}
          className="group relative bg-white hover:bg-blue-50/20 rounded-2xl border-2 border-gray-200 hover:border-blue-600 p-8 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between text-center items-center"
        >
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex items-center justify-center mb-5">
              <Camera className="w-7 h-7" />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCreationMode('screenshots');
              }}
              className="w-full py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-semibold transition-colors shadow-xs cursor-pointer mb-4"
            >
              Upload Screenshots
            </button>

            <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
              Upload screenshots or photos and automatically create an SOP from them.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:underline">
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};

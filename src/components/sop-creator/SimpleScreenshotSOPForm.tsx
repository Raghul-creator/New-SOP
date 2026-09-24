import React, { useState, useEffect, useRef } from 'react';
import {
  SOPDocument,
  User,
  DepartmentConfig,
  ProcedureStep,
  ResponsibilityItem,
  ChangeHistoryItem
} from '../../types';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Camera,
  Upload,
  AlertCircle,
  Eye,
  Image as ImageIcon,
  Sparkles,
  X,
  CheckCircle2,
  Maximize2,
  Loader2,
  Building2,
  Edit,
  RefreshCw,
  Check
} from 'lucide-react';
import { CreateDepartmentModal } from '../CreateDepartmentModal';
import { AIAssistantInline } from './AIAssistantInline';
import { buildUnifiedSOPDocument } from './sopEngine';

export interface SimpleScreenshotSOPFormProps {
  currentUser: User;
  departments: DepartmentConfig[];
  initialDepartment?: string;
  initialSop?: SOPDocument | null;
  existingSops?: SOPDocument[];
  onSaveSop: (sop: SOPDocument, submitForApproval?: boolean) => void;
  onSaveDepartment?: (dept: Partial<DepartmentConfig>) => Promise<any>;
  onPreview?: (sop: SOPDocument) => void;
  onBack: () => void;
  onGenerated?: (sop: SOPDocument) => void;
}

export interface UploadedImageItem {
  id: string;
  imageNumber: number;
  fileName: string;
  previewUrl: string;
  fileSize?: number;
  stepTitle: string;
  stepAction: string;
  uploadedAt: number;
  isAnalyzing?: boolean;
  hasAnalyzed?: boolean;
}

export const SimpleScreenshotSOPForm: React.FC<SimpleScreenshotSOPFormProps> = ({
  currentUser,
  departments,
  initialDepartment,
  initialSop,
  existingSops = [],
  onSaveSop,
  onSaveDepartment,
  onBack,
  onGenerated
}) => {
  const [localDepartments, setLocalDepartments] = useState<DepartmentConfig[]>(departments);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);

  useEffect(() => {
    if (departments && departments.length > 0) {
      setLocalDepartments(departments);
    }
  }, [departments]);

  const allDepartments = localDepartments.length > 0 ? localDepartments : departments;

  // Resolve initial department ID
  const matchedDept = allDepartments.find(
    d => (initialSop?.departmentId && d.id === initialSop.departmentId) ||
         d.id === initialDepartment ||
         d.id === initialSop?.department ||
         (initialSop?.departmentName && d.name.toLowerCase() === initialSop.departmentName.toLowerCase()) ||
         (initialDepartment && d.name.toLowerCase() === initialDepartment.toLowerCase()) ||
         (initialDepartment && d.code.toLowerCase() === initialDepartment.toLowerCase()) ||
         (initialSop?.department && d.name.toLowerCase() === initialSop.department.toLowerCase()) ||
         (initialSop?.department && d.code.toLowerCase() === initialSop.department.toLowerCase())
  );
  const defaultDeptId = initialSop?.departmentId || matchedDept?.id || initialDepartment || (allDepartments[0]?.id) || '';

  const [sopName, setSopName] = useState(initialSop?.title || '');
  const [departmentId, setDepartmentId] = useState<string>(defaultDeptId);
  const [whoPerforms, setWhoPerforms] = useState(
    initialSop?.responsibilities?.[0]?.role || initialSop?.processOwner?.name || ''
  );
  const [purpose, setPurpose] = useState(initialSop?.purpose || '');

  useEffect(() => {
    if (!departmentId && allDepartments.length > 0) {
      const match = allDepartments.find(
        d => (initialSop?.departmentId && d.id === initialSop.departmentId) ||
             d.id === initialDepartment ||
             (initialDepartment && d.name.toLowerCase() === initialDepartment.toLowerCase()) ||
             (initialSop?.department && d.name.toLowerCase() === initialSop.department.toLowerCase())
      );
      setDepartmentId(initialSop?.departmentId || match?.id || allDepartments[0]?.id || '');
    }
  }, [allDepartments, departmentId, initialSop, initialDepartment]);

  // Uploaded Images State (strictly preserves upload order)
  const [uploadedImages, setUploadedImages] = useState<UploadedImageItem[]>(() => {
    if (initialSop?.procedureSteps && initialSop.procedureSteps.length > 0) {
      const items: UploadedImageItem[] = [];
      initialSop.procedureSteps.forEach((s, idx) => {
        const screenshotUrl = s.screenshots && s.screenshots.length > 0 ? s.screenshots[0] : '';
        if (screenshotUrl) {
          items.push({
            id: s.id || `img-${idx + 1}`,
            imageNumber: items.length + 1,
            fileName: s.title || `Screenshot_${idx + 1}.png`,
            previewUrl: screenshotUrl,
            stepTitle: s.title || `Step ${items.length + 1}`,
            stepAction: s.action || '',
            uploadedAt: Date.now(),
            hasAnalyzed: true
          });
        }
      });
      return items;
    }
    return [];
  });

  const [zoomedImage, setZoomedImage] = useState<{ url: string; fileName: string; imageNumber: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    const validImages = fileArray.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return allowedExtensions.includes(ext) || file.type.startsWith('image/');
    });

    if (validImages.length === 0) {
      setErrors(prev => ({
        ...prev,
        images: 'Please upload valid PNG, JPG, JPEG, or WEBP image files.'
      }));
      return;
    }

    setErrors(prev => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    const newItems: UploadedImageItem[] = [];
    for (let i = 0; i < validImages.length; i++) {
      const file = validImages[i];
      try {
        const dataUrl = await fileToDataUrl(file);
        newItems.push({
          id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          imageNumber: 0,
          fileName: file.name,
          previewUrl: dataUrl,
          fileSize: file.size,
          stepTitle: '',
          stepAction: '',
          uploadedAt: Date.now() + i
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    setUploadedImages(prev => {
      const combined = [...prev, ...newItems];
      return combined.map((item, idx) => ({
        ...item,
        imageNumber: idx + 1
      }));
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const nowTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            const renamedFile = new File([file], `Pasted_Screenshot_${nowTime}.png`, {
              type: file.type || 'image/png'
            });
            pastedFiles.push(renamedFile);
          }
        }
      }

      if (pastedFiles.length > 0) {
        e.preventDefault();
        processFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleRemoveImage = (id: string) => {
    setUploadedImages(prev => {
      const remaining = prev.filter(item => item.id !== id);
      return remaining.map((item, idx) => ({
        ...item,
        imageNumber: idx + 1
      }));
    });
  };

  const handleUpdateImageDetail = (id: string, field: 'stepTitle' | 'stepAction', value: string) => {
    setUploadedImages(prev =>
      prev.map(item => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Analyze a single screenshot utilizing Gemini vision analysis securely on the server
  const handleAnalyzeSingleImage = async (id: string) => {
    const item = uploadedImages.find(img => img.id === id);
    if (!item) return;

    // Toggle loader state
    setUploadedImages(prev =>
      prev.map(img => img.id === id ? { ...img, isAnalyzing: true } : img)
    );

    const currentDeptObj = allDepartments.find(d => d.id === departmentId);
    const actualDeptName = currentDeptObj ? currentDeptObj.name : 'Technical';

    try {
      const response = await fetch('/api/ai/analyze-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopName: sopName.trim() || 'Standard Operating Procedure',
          department: actualDeptName,
          images: [
            {
              imageNumber: item.imageNumber,
              fileName: item.fileName,
              dataUrl: item.previewUrl
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Vision API responded with ${response.status}`);
      }

      const data = await response.json();
      if (data.steps && data.steps.length > 0) {
        const stepResult = data.steps[0];
        setUploadedImages(prev =>
          prev.map(img =>
            img.id === id
              ? {
                  ...img,
                  stepTitle: stepResult.title || img.stepTitle || `Step ${img.imageNumber}`,
                  stepAction: stepResult.instruction || img.stepAction || 'Review active on-screen procedure.',
                  isAnalyzing: false,
                  hasAnalyzed: true
                }
              : img
          )
        );
      } else {
        throw new Error("No structured process steps detected in visual screen.");
      }
    } catch (err: any) {
      console.error('Vision analysis failed for step', item.imageNumber, err);
      alert(`AI Vision Assist failed: ${err.message || 'Please review screenshot quality.'}`);
      setUploadedImages(prev =>
        prev.map(img => img.id === id ? { ...img, isAnalyzing: false } : img)
      );
    }
  };

  const handleCreateDepartment = async (deptData: Partial<DepartmentConfig>) => {
    let createdDept: DepartmentConfig;
    if (onSaveDepartment) {
      createdDept = await onSaveDepartment(deptData);
    } else {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData)
      });
      if (!res.ok) {
        throw new Error('Failed to create department');
      }
      createdDept = await res.json();
    }

    if (createdDept && (createdDept.id || createdDept.name)) {
      const newId = createdDept.id || createdDept.name;
      setLocalDepartments(prev => {
        const exists = prev.some(d => d.id === newId || d.name.toLowerCase() === createdDept.name.toLowerCase());
        if (exists) return prev;
        return [...prev, createdDept];
      });
      setDepartmentId(newId);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!sopName.trim()) {
      newErrors.sopName = 'Please enter a name for the SOP.';
    }

    if (!departmentId) {
      newErrors.department = 'Please select a department.';
    }

    if (uploadedImages.length === 0) {
      newErrors.images = 'Please upload at least one screenshot.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerateSOP = async () => {
    if (!validateForm()) return;

    setIsGenerating(true);
    setGenerationStatus('Compiling visual screenshots and step instructions...');

    const currentDeptObj = allDepartments.find(d => d.id === departmentId);
    const actualDeptId = currentDeptObj ? currentDeptObj.id : departmentId;
    const actualDeptName = currentDeptObj ? currentDeptObj.name : departmentId;
    const performer = whoPerforms.trim() || 'Operational Staff';

    const inputsProcedureSteps = uploadedImages.map((img, idx) => ({
      stepNumber: idx + 1,
      title: img.stepTitle.trim() || `Execution Step ${idx + 1}`,
      action: img.stepAction.trim() || 'Execute required task shown in screenshot.',
      assignedRole: performer,
      screenshots: [img.previewUrl]
    }));

    const generatedSop = buildUnifiedSOPDocument({
      id: initialSop?.id,
      sopNumber: initialSop?.sopNumber,
      title: sopName.trim(),
      departmentId: actualDeptId,
      departmentName: actualDeptName,
      version: initialSop?.version || '1.0',
      status: 'Draft',
      purpose: purpose.trim(),
      scopeInScope: `Process execution of ${sopName.trim()} using visual screenshots.`,
      scopeOutOfScope: 'Handling edge cases or infrastructure failures not depicted in screenshots.',
      operatingPrinciples: 'All operations must be executed in accordance with FFI information security and compliance standards.',
      tenantReference: 'Not Applicable',
      conditionalAccessConfig: 'Not Applicable',
      dynamicGroupConfig: 'Not Applicable',
      registrationCampaignConfig: 'Not Applicable',
      escalationMatrix: 'Escalate to L2 Support and Department Manager within 2 hours of process block.',
      relatedPolicies: 'FFI Global Information Security Policy (POL-SEC-2026)',
      responsibilities: [
        {
          role: performer,
          description: `Executes visual instructions listed in this procedural SOP.`
        }
      ],
      procedureSteps: inputsProcedureSteps,
      currentUser
    });

    setTimeout(() => {
      if (onGenerated) {
        onGenerated(generatedSop);
      } else {
        onSaveSop(generatedSop, false);
      }
      setIsGenerating(false);
    }, 400);
  };

  return (
    <div id="simple-screenshot-sop-form" className="space-y-6 animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Camera className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Create SOP from Screenshots</h1>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload active screens to compile a high-fidelity visual standard operating procedure.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
        >
          Exit
        </button>
      </div>

      {/* Metadata Panel */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span>Procedure Metadata</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">SOP Name *</label>
            <input
              type="text"
              value={sopName}
              onChange={(e) => {
                setSopName(e.target.value);
                if (errors.sopName) setErrors(prev => ({ ...prev, sopName: '' }));
              }}
              placeholder="e.g. Server Incident Resolution Procedure"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
            />
            {errors.sopName && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.sopName}</p>
            )}
            <AIAssistantInline
              fieldName="SOP Name"
              processName={sopName}
              department={allDepartments.find(d => d.id === departmentId)?.name || ''}
              enteredData={{}}
              onAccept={(v) => setSopName(v)}
              currentValue={sopName}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Department *</label>
            <select
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                if (errors.department) setErrors(prev => ({ ...prev, department: '' }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="">Select Department</option>
              {allDepartments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
            {errors.department && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.department}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Primary Executing Role</label>
            <input
              type="text"
              value={whoPerforms}
              onChange={(e) => setWhoPerforms(e.target.value)}
              placeholder="e.g. Operations Engineer, Cloud Admin"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
            />
            <AIAssistantInline
              fieldName="Roles"
              processName={sopName}
              department={allDepartments.find(d => d.id === departmentId)?.name || ''}
              enteredData={{ sopName, whoPerforms }}
              onAccept={(v) => setWhoPerforms(v)}
              currentValue={whoPerforms}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Objective / Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe why this procedure is carried out"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-indigo-600 bg-gray-50/50"
            />
            <AIAssistantInline
              fieldName="Purpose"
              processName={sopName}
              department={allDepartments.find(d => d.id === departmentId)?.name || ''}
              enteredData={{ sopName, whoPerforms, purpose }}
              onAccept={(v) => setPurpose(v)}
              currentValue={purpose}
            />
          </div>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              Upload Sequential Steps Screenshots
            </h4>
            <p className="text-xs text-gray-500">Provide sequential UI screens to document step titles and instruction cards.</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Select Files</span>
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/30'
              : 'border-gray-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10'
          }`}
        >
          <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2.5" />
          <p className="text-xs font-bold text-slate-700">Drag &amp; drop multiple screenshot files, or click to choose</p>
          <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPG, JPEG, and WEBP. You can also paste screenshots directly with Ctrl+V.</p>
        </div>

        {errors.images && (
          <p className="text-xs text-red-600 flex items-center gap-1.5 mt-2"><AlertCircle className="w-4 h-4" />{errors.images}</p>
        )}

        {/* Ordered Image Cards Grid */}
        {uploadedImages.length > 0 && (
          <div className="space-y-4 pt-4">
            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Ordered Step Cards ({uploadedImages.length})
            </h5>

            <div className="space-y-4">
              {uploadedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-4 relative animate-in fade-in duration-150"
                >
                  {/* Step indicator badge */}
                  <div className="absolute -top-2.5 -left-2 px-2.5 py-0.5 bg-indigo-600 text-white font-extrabold text-[10px] rounded-lg shadow-sm">
                    Step {idx + 1}
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-full md:w-44 h-32 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-slate-950 group flex items-center justify-center">
                    <img
                      src={img.previewUrl}
                      alt={img.fileName}
                      className="max-w-full max-h-full object-contain group-hover:scale-102 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setZoomedImage({ url: img.previewUrl, fileName: img.fileName, imageNumber: idx + 1 })}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white cursor-pointer"
                        title="Zoom screenshot"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content Inputs */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Step Title</label>
                        <input
                          type="text"
                          value={img.stepTitle}
                          onChange={(e) => handleUpdateImageDetail(img.id, 'stepTitle', e.target.value)}
                          placeholder="e.g. Login to Management Console"
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">File Reference</label>
                        <span className="block px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] text-gray-500 font-mono truncate">
                          {img.fileName} {img.fileSize ? `(${Math.round(img.fileSize / 1024)} KB)` : ''}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">Action Instructions</label>
                      <textarea
                        value={img.stepAction}
                        onChange={(e) => handleUpdateImageDetail(img.id, 'stepAction', e.target.value)}
                        placeholder="Detail the actions and parameters to be executed..."
                        rows={2.5}
                        className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none"
                      />
                    </div>

                    {/* AI Assistant button inside card to analyze using vision */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleAnalyzeSingleImage(img.id)}
                        disabled={img.isAnalyzing}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer disabled:opacity-50"
                      >
                        {img.isAnalyzing ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                            <span>AI Vision Analyzing screen...</span>
                          </>
                        ) : img.hasAnalyzed ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">AI Vision Analyzed (Click to re-run)</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                            <span>AI Vision Assist &mdash; Extract step details</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-red-600 hover:text-red-700 text-[10px] font-bold rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove card</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Action Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Compile Visual SOP</h4>
          <p className="text-xs text-gray-500 mt-0.5">Press Compile to format your standard operating procedure document.</p>
        </div>
        <button
          type="button"
          onClick={handleGenerateSOP}
          disabled={isGenerating || uploadedImages.length === 0}
          className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compiling SOP...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Compile &amp; Generate SOP</span>
            </>
          )}
        </button>
      </div>

      {/* Lightbox zoomed modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img src={zoomedImage.url} alt={zoomedImage.fileName} className="max-h-[80vh] w-auto mx-auto object-contain rounded-lg" />
            <div className="p-3 text-center text-xs text-slate-300 font-mono">
              {zoomedImage.fileName} (Step {zoomedImage.imageNumber})
            </div>
          </div>
        </div>
      )}

      {/* Create department modal dialog */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => setIsCreateDeptModalOpen(false)}
        onSaveDepartment={handleCreateDepartment}
      />
    </div>
  );
};

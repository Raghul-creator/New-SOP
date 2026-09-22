import React, { useState, useEffect } from 'react';
import { DepartmentConfig, User } from '../types';
import {
  Building2,
  X,
  AlertCircle
} from 'lucide-react';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDepartment: (dept: Partial<DepartmentConfig>) => Promise<any>;
  existingDepartment?: DepartmentConfig | null;
  currentUser?: User;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onSaveDepartment,
  existingDepartment
}) => {
  const [name, setName] = useState(existingDepartment?.name || '');
  const [description, setDescription] = useState(existingDepartment?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(existingDepartment?.name || '');
      setDescription(existingDepartment?.description || '');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen, existingDepartment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Department Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveDepartment({
        ...(existingDepartment ? { id: existingDepartment.id } : {}),
        name: trimmedName,
        description: description.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {existingDepartment ? 'Edit Department' : 'Create Department'}
              </h2>
              <p className="text-xs text-gray-500">
                Add an operational department to organize and govern SOPs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Department Name */}
          <div className="space-y-1.5">
            <label htmlFor="dept-name-input" className="block text-xs font-bold text-gray-700">
              Department Name <span className="text-red-500">*</span>
            </label>
            <input
              id="dept-name-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Information Technology, Human Resources, Finance"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              required
            />
          </div>

          {/* Department Description (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="dept-description-input" className="block text-xs font-bold text-gray-700">
              Department Description (optional)
            </label>
            <textarea
              id="dept-description-input"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the operational scope, responsibilities, or processes managed by this department..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Action Buttons: [Cancel] [Create Department] */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

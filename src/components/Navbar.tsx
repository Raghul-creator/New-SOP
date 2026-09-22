import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { CompanyLogo } from './CompanyLogo';
import {
  LayoutDashboard,
  BookOpen,
  Building2,
  CheckSquare,
  Bell,
  AlertCircle,
  GitPullRequest,
  ShieldAlert,
  Search,
  ChevronDown,
  Sparkles,
  Lock,
  LogOut,
  UserCheck,
  Plus,
  CalendarClock,
  BarChart3,
  MoreHorizontal,
  FileText,
  ShieldCheck,
  History,
  Settings
} from 'lucide-react';

interface NavbarProps {
  currentUser?: User;
  activeView: string;
  setActiveView: (view: string) => void;
  onCreateSop?: () => void;
  onOpenReportIssue?: () => void;
  onOpenRequestChange?: () => void;
  onOpenNotifications?: () => void;
  onSwitchRole?: (role: UserRole) => void;
  onOpenAIAssistant?: () => void;
  onSignOut?: () => void;
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  onCreateSop,
  onOpenReportIssue,
  onOpenRequestChange,
  onOpenNotifications,
  onSwitchRole,
  onOpenAIAssistant,
  onSignOut,
  onOpenSearch
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const availableRoles: UserRole[] = [
    'Employee',
    'Department Manager',
    'Compliance Manager',
    'Administrator',
    'Management'
  ];

  const isGovernanceUser =
    currentUser?.role === 'Department Manager' ||
    currentUser?.role === 'Compliance Manager' ||
    currentUser?.role === 'Administrator' ||
    currentUser?.role === 'Management';

  return (
    <header className="bg-white border-b border-gray-200/80 sticky top-0 z-50 shadow-xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16">
          
          {/* Brand / Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => setActiveView('dashboard')}
          >
            <CompanyLogo variant="dark" height={36} />

            <div className="hidden sm:block border-l border-gray-200 pl-3">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  SOP v2.0
                </span>
              </div>
              <p className="text-[9px] text-gray-400 font-medium mt-0.5 uppercase tracking-wide">
                Governance Platform
              </p>
            </div>
          </div>

          {/* Center Search Bar */}
          <div
            onClick={() => onOpenSearch ? onOpenSearch() : setActiveView('library')}
            className="hidden md:flex items-center gap-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3.5 py-1.5 rounded-xl w-64 lg:w-80 cursor-pointer transition text-gray-400 hover:text-gray-600 shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-normal">Search SOPs, numbers, steps...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-white border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>

          {/* Right Controls & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Primary + CREATE SOP Button */}
            {onCreateSop && (
              <button
                onClick={onCreateSop}
                title="Create SOP"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-100 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ CREATE SOP</span>
              </button>
            )}

            {/* User Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="leading-tight font-bold text-gray-900">{currentUser?.name || 'User'}</div>
                  <div className="text-[10px] text-indigo-600 font-medium">{currentUser?.role || 'Employee'}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                      Switch Role Simulation
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Verify permissions
                    </p>
                  </div>
                  <div className="py-1">
                    {availableRoles.map(role => (
                      <button
                        key={role}
                        onClick={() => {
                          if (onSwitchRole) onSwitchRole(role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 cursor-pointer ${
                          currentUser?.role === role ? 'text-indigo-600 bg-indigo-50/50' : 'text-gray-700'
                        }`}
                      >
                        <span>{role}</span>
                        {currentUser?.role === role && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex space-x-1.5 overflow-x-auto py-2 border-t border-gray-100 no-scrollbar text-xs">
          
          {/* 1. Dashboard */}
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center space-x-2 px-3 py-1.5 font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* 2. Create SOP */}
          <button
            onClick={() => {
              if (onCreateSop) {
                onCreateSop();
              } else {
                setActiveView('authoring');
              }
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeView === 'authoring'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create SOP</span>
          </button>

          {/* 3. SOP Library */}
          <button
            onClick={() => setActiveView('library')}
            className={`flex items-center space-x-2 px-3 py-1.5 font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeView === 'library'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>SOP Library</span>
          </button>

          {/* 4. Departments */}
          <button
            onClick={() => setActiveView('departments')}
            className={`flex items-center space-x-2 px-3 py-1.5 font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeView === 'departments'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Departments</span>
          </button>

          {/* 5. Settings */}
          <button
            onClick={() => setActiveView('admin')}
            className={`flex items-center space-x-2 px-3 py-1.5 font-semibold rounded-xl transition whitespace-nowrap cursor-pointer ${
              activeView === 'admin'
                ? 'bg-[#1A1C1E] text-white shadow-2xs'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>

        </nav>
      </div>
    </header>
  );
};

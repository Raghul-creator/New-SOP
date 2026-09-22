import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { EntraIDSSOScreen } from './components/EntraIDSSOScreen';
import { DashboardView } from './components/DashboardView';
import { ArchitectureSpecsView } from './components/ArchitectureSpecsView';
import { SOPLibraryView } from './components/SOPLibraryView';
import { DepartmentsView } from './components/DepartmentsView';
import { MyTasksView } from './components/MyTasksView';
import { AdministrationView } from './components/AdministrationView';
import { QuestionBasedSOPCreator } from './components/QuestionBasedSOPCreator';
import { SOPCreatorErrorBoundary } from './components/SOPCreatorErrorBoundary';
import { CreateDepartmentModal } from './components/CreateDepartmentModal';
import { SOPWorkflowView } from './components/SOPWorkflowView';
import { SharePointConsoleView } from './components/SharePointConsoleView';
import { AuditLogView } from './components/AuditLogView';
import { ITAssetSOPModule } from './components/ITAssetSOPModule';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { ApprovalMatrixModal } from './components/ApprovalMatrixModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { MandatoryReadModal } from './components/MandatoryReadModal';
import { VersionRevisionModal } from './components/VersionRevisionModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { RequestChangeModal } from './components/RequestChangeModal';
import { SOPReviewCalendarView } from './components/SOPReviewCalendarView';
import { MySOPsView } from './components/MySOPsView';
import { GlobalSearchModal } from './components/GlobalSearchModal';

import {
  INITIAL_USERS,
  INITIAL_SOPS,
  INITIAL_AUDIT_LOGS,
  INITIAL_IT_ASSET_WORKFLOWS,
  INITIAL_TROUBLESHOOTING_GUIDES,
  INITIAL_FAQS,
  INITIAL_VENDOR_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_ISSUES,
  INITIAL_CHANGE_REQUESTS,
  DEPARTMENT_SCORECARDS,
  DEPARTMENT_CONFIGS,
  DEFAULT_ORGANIZATION_APPROVAL_SETTINGS
} from './data/mockData';
import {
  User,
  UserRole,
  SOPDocument,
  AuditLogEntry,
  SOPStatus,
  ApprovalDecision,
  NotificationEvent,
  DepartmentScorecard,
  TaskItem,
  IssueReport,
  ChangeRequest,
  DepartmentConfig,
  OrganizationApprovalSettings
} from './types';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('ffi_entra_sso_session');
    } catch {
      return false;
    }
  });

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem('ffi_entra_sso_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id && parsed.name) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_USERS[0];
  });

  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sops, setSops] = useState<SOPDocument[]>(INITIAL_SOPS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [notifications, setNotifications] = useState<NotificationEvent[]>(INITIAL_NOTIFICATIONS);
  const [scorecards, setScorecards] = useState<DepartmentScorecard[]>(DEPARTMENT_SCORECARDS);
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [issues, setIssues] = useState<IssueReport[]>(INITIAL_ISSUES);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(INITIAL_CHANGE_REQUESTS);

  const [selectedSopId, setSelectedSopId] = useState<string | null>(null);
  const [libraryDeptFilter, setLibraryDeptFilter] = useState<string | null>(null);
  const [targetDeptForNewSop, setTargetDeptForNewSop] = useState<string | undefined>(undefined);
  const [initialCreationMode, setInitialCreationMode] = useState<'landing' | 'questions' | 'screenshots' | 'editable-page'>('landing');

  // Dynamic Departments state
  const [departments, setDepartments] = useState<DepartmentConfig[]>(DEPARTMENT_CONFIGS);
  const [isCreateDeptModalOpen, setIsCreateDeptModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentConfig | null>(null);

  // Organization Approvals State
  const [orgApprovalSettings, setOrgApprovalSettings] = useState<OrganizationApprovalSettings>(DEFAULT_ORGANIZATION_APPROVAL_SETTINGS);

  // Modal states
  const [isApprovalMatrixOpen, setIsApprovalMatrixOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [readModalSop, setReadModalSop] = useState<SOPDocument | null>(null);
  const [revisionModalSop, setRevisionModalSop] = useState<SOPDocument | null>(null);

  // Issues and Change Request Modals
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);
  const [reportIssueSopId, setReportIssueSopId] = useState<string | null>(null);
  const [isRequestChangeOpen, setIsRequestChangeOpen] = useState(false);
  const [requestChangeSopId, setRequestChangeSopId] = useState<string | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Global shortcut for Search (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load backend data on startup
  useEffect(() => {
    fetch('/api/sops')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSops(data);
      })
      .catch(err => console.error('Failed to load backend SOPs:', err));

    fetch('/api/audit-logs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(err => console.error('Failed to load audit logs:', err));

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(err => console.error('Failed to load notifications:', err));

    fetch('/api/governance/scorecards')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setScorecards(data);
      })
      .catch(err => console.error('Failed to load scorecards:', err));

    fetch('/api/departments')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDepartments(data);
      })
      .catch(err => console.error('Failed to load departments:', err));

    fetch('/api/organization/approvals')
      .then(res => res.json())
      .then(data => {
        if (data && data.organizationName) setOrgApprovalSettings(data);
      })
      .catch(err => console.error('Failed to load organization approvals:', err));

    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setUsers(data);
      })
      .catch(err => console.error('Failed to load users:', err));
  }, []);

  const refreshSopsAndLogs = async () => {
    try {
      const [sopsRes, logsRes, notifRes, scoreRes, deptRes] = await Promise.all([
        fetch('/api/sops'),
        fetch('/api/audit-logs'),
        fetch('/api/notifications'),
        fetch('/api/governance/scorecards'),
        fetch('/api/departments')
      ]);
      const sopsData = await sopsRes.json();
      const logsData = await logsRes.json();
      const notifData = await notifRes.json();
      const scoreData = await scoreRes.json();
      const deptData = await deptRes.json();

      if (Array.isArray(sopsData)) setSops(sopsData);
      if (Array.isArray(logsData)) setAuditLogs(logsData);
      if (Array.isArray(notifData)) setNotifications(notifData);
      if (Array.isArray(scoreData)) setScorecards(scoreData);
      if (Array.isArray(deptData)) setDepartments(deptData);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleNavigate = (view: string, sopId?: string, departmentFilter?: string) => {
    if (sopId) setSelectedSopId(sopId);
    if (departmentFilter) setLibraryDeptFilter(departmentFilter);
    setActiveView(view);
  };

  const handleStartNewSop = (modeOrDept?: string, creationMode?: 'landing' | 'questions' | 'screenshots' | 'editable-page') => {
    setSelectedSopId(null);
    setInitialCreationMode(creationMode || 'landing');
    // Check if modeOrDept matches any known department
    const isDept = departments.some(
      d => d.name.toLowerCase() === modeOrDept?.toLowerCase() || d.id === modeOrDept
    );
    setTargetDeptForNewSop(isDept ? modeOrDept : undefined);
    setActiveView('authoring');
  };

  const handleSelectSopFromLibrary = (sopId: string, viewMode: 'edit' | 'workflow' | 'preview') => {
    setSelectedSopId(sopId);
    if (viewMode === 'workflow') {
      setActiveView('workflow');
    } else if (viewMode === 'edit') {
      const targetSop = sops.find(s => s.id === sopId);
      if (targetSop && (targetSop.status === 'Approved' || targetSop.status === 'Published')) {
        setRevisionModalSop(targetSop);
        return;
      }
      setActiveView('authoring');
    } else {
      setActiveView('library');
    }
  };

  const handleSaveDepartment = async (deptData: Partial<DepartmentConfig>) => {
    try {
      const isEdit = Boolean(deptData.id && departments.some(d => d.id === deptData.id));
      const url = isEdit ? `/api/departments/${deptData.id}` : '/api/departments';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptData)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save department');
      }
      const updated = await res.json();
      setDepartments(prev => {
        if (isEdit) return prev.map(d => d.id === updated.id ? updated : d);
        if (prev.some(d => d.id === updated.id || d.name.toLowerCase() === updated.name.toLowerCase())) {
          return prev.map(d => (d.id === updated.id || d.name.toLowerCase() === updated.name.toLowerCase()) ? updated : d);
        }
        return [...prev, updated];
      });
      setIsCreateDeptModalOpen(false);
      setEditingDepartment(null);
      await refreshSopsAndLogs();
      return updated;
    } catch (err) {
      console.error('Failed to save department:', err);
      throw err;
    }
  };

  const handleToggleDeptStatus = async (deptId: string, newStatus: 'Active' | 'Disabled') => {
    try {
      const res = await fetch(`/api/departments/${deptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setDepartments(prev => prev.map(d => d.id === updated.id ? updated : d));
        await refreshSopsAndLogs();
      }
    } catch (err) {
      console.error('Failed to update department status:', err);
    }
  };

  const handleSaveSop = async (sop: SOPDocument, submitForApproval = false) => {
    const exists = sops.some(s => s.id === sop.id);
    const url = exists ? `/api/sops/${sop.id}` : '/api/sops';
    const method = exists ? 'PUT' : 'POST';

    const sopPayload: SOPDocument = {
      ...sop,
      status: submitForApproval ? 'Under Review' : (sop.status || 'Draft')
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sopPayload,
          performingUser: currentUser,
          lastAction: submitForApproval ? 'SUBMIT_FOR_APPROVAL' : (exists ? 'UPDATE_SOP' : 'CREATE_SOP'),
          actionDetails: submitForApproval
            ? `Submitted SOP "${sop.title}" for 4-tier approval review.`
            : (exists ? `Updated draft SOP "${sop.title}".` : `Created draft SOP "${sop.title}".`)
        })
      });

      const savedSop = await res.json();
      await refreshSopsAndLogs();
      setSelectedSopId(savedSop.id);
      if (submitForApproval) {
        setActiveView('workflow');
      } else {
        setActiveView('library');
      }
    } catch (err) {
      console.error('Save failed:', err);
      // Fallback local update
      setSops(prev => exists ? prev.map(s => s.id === sop.id ? sopPayload : s) : [sopPayload, ...prev]);
      setSelectedSopId(sop.id);
      if (submitForApproval) {
        setActiveView('workflow');
      } else {
        setActiveView('library');
      }
    }
  };

  const handleUpdateSopStatus = async (
    sopId: string,
    newStatus: SOPStatus,
    actionDetails: string,
    decision?: ApprovalDecision
  ) => {
    const target = sops.find(s => s.id === sopId);
    if (!target) return;

    const updatedApprovalHistory = decision
      ? [...target.approvalHistory, decision]
      : target.approvalHistory;

    try {
      await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          approvalHistory: updatedApprovalHistory,
          performingUser: currentUser,
          lastAction: newStatus === 'Approved' ? 'FINAL_APPROVAL' : 'APPROVE_STAGE',
          actionDetails
        })
      });

      await refreshSopsAndLogs();
    } catch (err) {
      console.error('Status update failed:', err);
      // Local fallback
      setSops(prev => prev.map(s => s.id === sopId ? { ...s, status: newStatus, approvalHistory: updatedApprovalHistory } : s));
    }
  };

  const handleAddComment = async (sopId: string, commentText: string, stepId?: string) => {
    const target = sops.find(s => s.id === sopId);
    if (!target) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: currentUser,
      text: commentText,
      stepId,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    const updatedComments = [...target.comments, newComment];

    try {
      await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comments: updatedComments,
          performingUser: currentUser,
          lastAction: 'ADD_COMMENT',
          actionDetails: `Added review comment: "${commentText.substring(0, 40)}..."`
        })
      });

      await refreshSopsAndLogs();
    } catch (err) {
      console.error('Comment add failed:', err);
      setSops(prev => prev.map(s => s.id === sopId ? { ...s, comments: updatedComments } : s));
    }
  };

  const handlePublishToSharePoint = async (sopId: string, siteUrl?: string, libraryName?: string) => {
    try {
      const res = await fetch('/api/sharepoint/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId,
          siteUrl,
          targetLibrary: libraryName,
          publishingUser: currentUser
        })
      });

      await refreshSopsAndLogs();
      setActiveView('sharepoint');
    } catch (err) {
      console.error('SharePoint publish failed:', err);
      setSops(prev => prev.map(s => s.id === sopId ? { ...s, status: 'Published' } : s));
      setActiveView('sharepoint');
    }
  };

  const handleDeleteSop = async (sopId: string) => {
    if (!confirm('Are you sure you want to retire and archive this SOP document?')) return;

    try {
      await fetch(`/api/sops/${sopId}`, { method: 'DELETE' });
      await refreshSopsAndLogs();
    } catch (err) {
      console.error('Retire failed:', err);
      setSops(prev => prev.map(s => s.id === sopId ? { ...s, status: 'Retired' } : s));
    }
  };

  const handleSendManualReminder = async (sopId: string, type: string, message: string) => {
    try {
      await fetch('/api/notifications/dispatch-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sopId,
          reminderType: type,
          customMessage: message
        })
      });
      await refreshSopsAndLogs();
    } catch (err) {
      console.error('Dispatch reminder failed:', err);
    }
  };

  // Task Handlers
  const handleToggleTaskChecklist = (taskId: string, checklistId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId || !t.checklist) return t;
      const updatedChecklist = t.checklist.map(c => c.id === checklistId ? { ...c, completed: !c.completed } : c);
      const allCompleted = updatedChecklist.every(c => c.completed);
      return {
        ...t,
        checklist: updatedChecklist,
        status: allCompleted ? 'Completed' : 'In Progress'
      };
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'Completed' } : t));
  };

  // Issues & Change Requests Handlers
  const handleSubmitIssue = (newIssue: IssueReport) => {
    setIssues(prev => [newIssue, ...prev]);
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newIssue.sopId,
      sopTitle: newIssue.sopTitle,
      user: currentUser,
      action: 'ISSUE_REPORTED',
      details: `Reported issue "${newIssue.title}" [${newIssue.severity}]: ${newIssue.description.slice(0, 60)}...`,
      ipAddress: '10.240.12.84',
      entraObjectId: currentUser.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Future Focus Infotech Data Policy',
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const handleResolveIssue = (issueId: string) => {
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'Resolved' } : i));
  };

  const handleSubmitChangeRequest = (newCR: ChangeRequest) => {
    setChangeRequests(prev => [newCR, ...prev]);
    const log: AuditLogEntry = {
      id: `log-${Date.now()}`,
      sopId: newCR.sopId,
      sopTitle: newCR.sopTitle,
      user: currentUser,
      action: 'CHANGE_REQUESTED',
      details: `Proposed modification: "${newCR.changeTitle || newCR.title}" [${newCR.priority || 'Medium'}]`,
      ipAddress: '10.240.12.84',
      entraObjectId: currentUser.entraObjectId,
      retentionPolicy: 'Retained for 7 Years under ISO 27001 ISMS / Future Focus Infotech Data Policy',
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  // User Role Switcher
  const handleSwitchRole = (newRole: UserRole) => {
    const updatedUser: User = {
      ...currentUser,
      role: newRole
    };
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('ffi_entra_sso_user', JSON.stringify(updatedUser));
    } catch {}
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    if (currentUser.id === userId) {
      handleSwitchRole(newRole);
    }
  };

  const handleUpdateOrgApprovals = async (newSettings: OrganizationApprovalSettings) => {
    try {
      const res = await fetch('/api/organization/approvals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Failed to update organization approvals');
      const saved = await res.json();
      setOrgApprovalSettings(saved);
      // Refresh audit logs
      fetch('/api/audit-logs')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setAuditLogs(data); });
    } catch (err) {
      console.error('Error updating organization approvals:', err);
      throw err;
    }
  };

  const handleAddUser = async (newUserData: Partial<User>) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserData)
      });
      if (!res.ok) throw new Error('Failed to create user');
      const created = await res.json();
      setUsers(prev => [created, ...prev]);
    } catch (err) {
      console.error('Error adding user:', err);
      throw err;
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!res.ok) throw new Error('Failed to update user');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      throw err;
    }
  };

  const handleSignIn = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    try {
      localStorage.setItem('ffi_entra_sso_session', 'true');
      localStorage.setItem('ffi_entra_sso_user', JSON.stringify(user));
    } catch {}
  };

  const handleCreateReviewTask = (sopId: string, title: string, dept: string) => {
    const newTask: TaskItem = {
      id: `task-rev-${Date.now()}`,
      title: `Periodic ISO Review: ${title}`,
      description: `Conduct scheduled recertification and operational compliance review for standard procedure ${sopId}.`,
      assignedTo: currentUser.name,
      assignedToRole: currentUser.role,
      department: dept as any,
      status: 'Pending',
      priority: 'High',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      sopId: sopId,
      sopTitle: title,
      checklist: [
        { id: 'chk-1', text: 'Verify procedural step accuracy with operations team', completed: false },
        { id: 'chk-2', text: 'Audit security and access permission controls', completed: false },
        { id: 'chk-3', text: 'Submit revision or confirm continuation in effect', completed: false }
      ]
    };
    setTasks(prev => [newTask, ...prev]);
    setActiveView('tasks');
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem('ffi_entra_sso_session');
    } catch {}
  };

  if (!isAuthenticated) {
    return (
      <EntraIDSSOScreen
        onSignIn={handleSignIn}
      />
    );
  }

  const activeSopForWorkflow = sops.find(s => s.id === selectedSopId) || sops[0] || null;
  const activeSopForAuthoring = sops.find(s => s.id === selectedSopId) || null;

  return (
    <div className="min-h-screen bg-[#F1F3F5] font-sans text-[#1A1C1E] antialiased selection:bg-indigo-600 selection:text-white flex flex-col justify-between">
      <div>
        <Navbar
          currentUser={currentUser}
          activeView={activeView}
          setActiveView={setActiveView}
          onCreateSop={() => handleStartNewSop()}
          onOpenSearch={() => setIsGlobalSearchOpen(true)}
          onOpenReportIssue={() => {
            setReportIssueSopId(null);
            setIsReportIssueOpen(true);
          }}
          onOpenRequestChange={() => {
            setRequestChangeSopId(null);
            setIsRequestChangeOpen(true);
          }}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onSwitchRole={handleSwitchRole}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
          onSignOut={handleSignOut}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* 1. Dashboard View */}
          {activeView === 'dashboard' && (
            <DashboardView
              sops={sops}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onStartNewSop={handleStartNewSop}
            />
          )}

          {/* 2. SOP Library View */}
          {activeView === 'library' && (
            <SOPLibraryView
              sops={sops}
              departments={departments}
              currentUser={currentUser}
              initialDepartmentFilter={libraryDeptFilter}
              onSelectSop={handleSelectSopFromLibrary}
              onDeleteSop={handleDeleteSop}
              onStartNewSop={handleStartNewSop}
              onOpenMandatoryRead={(sop) => setReadModalSop(sop)}
              onOpenVersionRevision={(sop) => setRevisionModalSop(sop)}
              onOpenReportIssue={(sopId) => {
                setReportIssueSopId(sopId);
                setIsReportIssueOpen(true);
              }}
              onOpenRequestChange={(sopId) => {
                setRequestChangeSopId(sopId);
                setIsRequestChangeOpen(true);
              }}
            />
          )}

          {/* 2.5 My SOPs Author Workspace */}
          {activeView === 'my-sops' && (
            <MySOPsView
              sops={sops}
              currentUser={currentUser}
              onStartNewSop={() => handleStartNewSop()}
              onOpenSop={(sopId, viewMode) => {
                setSelectedSopId(sopId);
                if (viewMode === 'edit') {
                  setActiveView('authoring');
                } else if (viewMode === 'workflow') {
                  setActiveView('workflow');
                } else {
                  setActiveView('library');
                }
              }}
            />
          )}

          {/* 3. Departments View */}
          {activeView === 'departments' && (
            <DepartmentsView
              sops={sops}
              scorecards={scorecards}
              departments={departments}
              currentUser={currentUser}
              onFilterDepartmentInLibrary={(deptName) => {
                setLibraryDeptFilter(deptName);
                setActiveView('library');
              }}
              onOpenSop={(sopId) => {
                setSelectedSopId(sopId);
                setActiveView('library');
              }}
              onCreateSopForDept={(deptName) => {
                handleStartNewSop(deptName);
              }}
              onOpenCreateDeptModal={() => {
                setEditingDepartment(null);
                setIsCreateDeptModalOpen(true);
              }}
              onEditDeptModal={(dept) => {
                setEditingDepartment(dept);
                setIsCreateDeptModalOpen(true);
              }}
              onToggleDeptStatus={handleToggleDeptStatus}
            />
          )}

          {/* 4. My Tasks View */}
          {activeView === 'tasks' && (
            <MyTasksView
              tasks={tasks}
              sops={sops}
              issues={issues}
              changeRequests={changeRequests}
              currentUser={currentUser}
              onToggleTaskChecklist={handleToggleTaskChecklist}
              onCompleteTask={handleCompleteTask}
              onOpenSop={(sopId) => {
                setSelectedSopId(sopId);
                setActiveView('library');
              }}
              onResolveIssue={handleResolveIssue}
            />
          )}

          {/* 5. Notifications View */}
          {activeView === 'notifications' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-xs">
                <h1 className="text-2xl font-bold tracking-tight text-[#1A1C1E]">
                  Enterprise Governance Notifications
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Automated alerts for SOP reviews, recertifications, change requests, and approval milestones.
                </p>
              </div>

              <div className="space-y-3">
                {notifications.map(n => (
                  <div key={n.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {n.triggerType || 'NOTIFICATION'}
                        </span>
                        <span className="text-xs font-semibold text-gray-800">{n.sopTitle}</span>
                      </div>
                      <p className="text-xs text-gray-600">{n.message}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {new Date(n.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Administration View */}
          {activeView === 'admin' && (
            <AdministrationView
              users={users}
              auditLogs={auditLogs}
              scorecards={scorecards}
              departments={departments}
              currentUser={currentUser}
              orgApprovalSettings={orgApprovalSettings}
              onUpdateOrgApprovals={handleUpdateOrgApprovals}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUserRole={handleUpdateUserRole}
              onOpenCreateDeptModal={() => {
                setEditingDepartment(null);
                setIsCreateDeptModalOpen(true);
              }}
              onEditDeptModal={(dept) => {
                setEditingDepartment(dept);
                setIsCreateDeptModalOpen(true);
              }}
              onToggleDeptStatus={handleToggleDeptStatus}
            />
          )}

          {/* AI-Assisted Question-Based SOP Creator */}
          {activeView === 'authoring' && (
            <SOPCreatorErrorBoundary
              onReturnToDashboard={() => {
                setSelectedSopId(null);
                setActiveView('dashboard');
              }}
              onRetry={() => {
                setSelectedSopId(null);
                setActiveView('authoring');
              }}
            >
              <QuestionBasedSOPCreator
                currentUser={currentUser}
                initialDepartment={targetDeptForNewSop}
                initialSop={selectedSopId ? sops.find(s => s.id === selectedSopId) || null : null}
                initialCreationMode={initialCreationMode}
                departments={departments}
                existingSops={sops}
                onSaveSop={handleSaveSop}
                onSaveDepartment={handleSaveDepartment}
                onCancel={() => {
                  setSelectedSopId(null);
                  setActiveView('dashboard');
                }}
              />
            </SOPCreatorErrorBoundary>
          )}

          {/* 4-Tier Workflow View */}
          {activeView === 'workflow' && (
            <SOPWorkflowView
              sop={activeSopForWorkflow}
              currentUser={currentUser}
              onUpdateSopStatus={handleUpdateSopStatus}
              onAddComment={handleAddComment}
              onPublishToSharePoint={handlePublishToSharePoint}
              onOpenApprovalMatrix={() => setIsApprovalMatrixOpen(true)}
              onOpenRevisionModal={(sop) => setRevisionModalSop(sop)}
            />
          )}

          {/* IT Assets SOP Module */}
          {activeView === 'it-assets' && (
            <ITAssetSOPModule
              workflows={INITIAL_IT_ASSET_WORKFLOWS}
              sops={sops}
              currentUser={currentUser}
              onNavigateToSop={(sopId, mode) => {
                setSelectedSopId(sopId);
                setActiveView(mode);
              }}
              onOpenKnowledgeBase={() => setActiveView('knowledge-base')}
              onExecutionLogged={async () => {
                await refreshSopsAndLogs();
              }}
            />
          )}

          {/* Governance Scorecards placeholder */}
          {activeView === 'scorecards' && (
            <div className="p-6 bg-white rounded-2xl border border-gray-100 text-center py-12">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Governance Scorecards</h3>
              <p className="text-sm text-gray-500">Governance scorecards view has been retired.</p>
            </div>
          )}

          {/* Knowledge Base */}
          {activeView === 'knowledge-base' && (
            <KnowledgeBaseView
              troubleshootingGuides={INITIAL_TROUBLESHOOTING_GUIDES}
              faqs={INITIAL_FAQS}
              vendorContacts={INITIAL_VENDOR_CONTACTS}
              sops={sops}
              onNavigateToSop={sopId => {
                setSelectedSopId(sopId);
                setActiveView('workflow');
              }}
            />
          )}

          {/* SharePoint Console */}
          {activeView === 'sharepoint' && (
            <SharePointConsoleView
              sops={sops}
              currentUser={currentUser}
              onPublishSop={handlePublishToSharePoint}
            />
          )}

          {/* Audit Vault */}
          {activeView === 'audit' && (
            <AuditLogView auditLogs={auditLogs} currentUser={currentUser} />
          )}

          {/* Specs */}
          {activeView === 'specs' && (
            <ArchitectureSpecsView />
          )}

          {/* SOP Review Calendar & Periodic Recertification */}
          {activeView === 'calendar' && (
            <SOPReviewCalendarView
              sops={sops}
              currentUser={currentUser}
              onOpenSop={(sopId) => {
                setSelectedSopId(sopId);
                setActiveView('library');
              }}
              onRequestChange={(sopId) => {
                setRequestChangeSopId(sopId);
                setIsRequestChangeOpen(true);
              }}
              onDispatchReminder={(sopId) => {
                handleSendManualReminder(sopId, 'Periodic Review', 'Periodic review cycle reminder dispatched to process owner.');
              }}
              onCreateTask={(sopId, title, dept) => {
                handleCreateReviewTask(sopId, title, dept);
              }}
            />
          )}

        </main>
      </div>

      {/* Bento Grid Corporate Footer */}
      <footer className="bg-[#1A1C1E] text-gray-400 text-xs py-6 border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs font-mono shadow-sm">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-tight">Future Focus Infotech • SOP Governance Platform</span>
                <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded-full border border-indigo-800 font-semibold">v2.0</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                ISO 9001:2015 Quality Management & ISO/IEC 27001:2022 ISMS Governed Procedures
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>Departments: <strong>HR • IT Enablement • Finance • Payroll • Compliance</strong></span>
            <span>•</span>
            <span>Simple. Controlled. Traceable.</span>
          </div>
        </div>
      </footer>

      {/* Global Modals */}
      {isApprovalMatrixOpen && (
        <ApprovalMatrixModal
          isOpen={true}
          onClose={() => setIsApprovalMatrixOpen(false)}
        />
      )}

      {isNotificationsOpen && (
        <NotificationCenterModal
          isOpen={true}
          notifications={notifications}
          sops={sops}
          currentUser={currentUser}
          onSendManualReminder={handleSendManualReminder}
          onClose={() => setIsNotificationsOpen(false)}
        />
      )}

      {isAIAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center border border-gray-100 shadow-2xl">
            <h4 className="font-extrabold text-base text-gray-900 mb-2">AI Assistant</h4>
            <p className="text-xs text-gray-500 mb-4">The global AI Assistant dialog has been retired. Please use the Inline AI Assistant inside the SOP Creation forms.</p>
            <button
              onClick={() => setIsAIAssistantOpen(false)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {readModalSop && (
        <MandatoryReadModal
          isOpen={true}
          sop={readModalSop}
          currentUser={currentUser}
          onClose={() => setReadModalSop(null)}
          onAcknowledgeSuccess={async () => {
            setReadModalSop(null);
            await refreshSopsAndLogs();
          }}
        />
      )}

      {revisionModalSop && (
        <VersionRevisionModal
          isOpen={true}
          sop={revisionModalSop}
          currentUser={currentUser}
          onClose={() => setRevisionModalSop(null)}
          onRevisionCreated={async (updatedSop) => {
            setRevisionModalSop(null);
            await refreshSopsAndLogs();
            if (updatedSop) {
              setSelectedSopId(updatedSop.id);
              setActiveView('authoring');
            }
          }}
          onRevisionSuccess={async (updatedSop) => {
            setRevisionModalSop(null);
            await refreshSopsAndLogs();
            if (updatedSop) {
              setSelectedSopId(updatedSop.id);
              setActiveView('authoring');
            }
          }}
        />
      )}

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={isReportIssueOpen}
        onClose={() => {
          setIsReportIssueOpen(false);
          setReportIssueSopId(null);
        }}
        sops={sops}
        preselectedSopId={reportIssueSopId}
        currentUser={currentUser}
        onSubmitIssue={handleSubmitIssue}
      />

      {/* Request Change Modal */}
      <RequestChangeModal
        isOpen={isRequestChangeOpen}
        onClose={() => {
          setIsRequestChangeOpen(false);
          setRequestChangeSopId(null);
        }}
        sops={sops}
        preselectedSopId={requestChangeSopId}
        currentUser={currentUser}
        onSubmitChangeRequest={handleSubmitChangeRequest}
      />

      {/* Create / Edit Department Modal */}
      <CreateDepartmentModal
        isOpen={isCreateDeptModalOpen}
        onClose={() => {
          setIsCreateDeptModalOpen(false);
          setEditingDepartment(null);
        }}
        onSaveDepartment={handleSaveDepartment}
        existingDepartment={editingDepartment}
        currentUser={currentUser}
      />

      {/* Global Universal Search Modal (⌘K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        sops={sops}
        onSelectSop={(sopId) => {
          setSelectedSopId(sopId);
          setActiveView('library');
          setIsGlobalSearchOpen(false);
        }}
      />

    </div>
  );
}

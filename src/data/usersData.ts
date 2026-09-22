import { User } from '../types';

// The administrative/authentication master account.
// All demo/test users and dummy department heads have been removed per data reset.
export const ADMIN_USER: User = {
  id: 'usr-admin',
  name: 'Platform Administrator',
  email: 'admin@organization.com',
  role: 'Administrator',
  department: 'Operations',
  title: 'Enterprise Platform Administrator',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  entraObjectId: 'usr-entra-admin-001',
  entraGroups: ['SOP_Admins', 'SOP_Authors', 'SOP_Reviewers', 'SOP_Approvers'],
  mfaEnforced: true
};

export const DEFAULT_CORPORATE_USER: User = ADMIN_USER;
export const INITIAL_USERS: User[] = [ADMIN_USER];
export const MOCK_USERS: User[] = [ADMIN_USER];

import React, { useState } from 'react';
import { User } from '../types';
import { DEFAULT_CORPORATE_USER } from '../data/mockData';
import { CompanyLogo } from './CompanyLogo';
import {
  Shield,
  Lock,
  KeyRound,
  CheckCircle2,
  Building2,
  ArrowRight,
  Globe,
  Fingerprint,
  Info,
  Sparkles
} from 'lucide-react';

interface EntraIDSSOScreenProps {
  onSignIn: (user: User) => void;
}

export const EntraIDSSOScreen: React.FC<EntraIDSSOScreenProps> = ({
  onSignIn
}) => {
  const [customEmail, setCustomEmail] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [showEmailInput, setShowEmailInput] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCorporateSSOSignIn = () => {
    setIsAuthenticating(true);
    setError(null);

    setTimeout(() => {
      setIsAuthenticating(false);
      onSignIn(DEFAULT_CORPORATE_USER);
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError('Please enter your corporate work email address.');
      return;
    }

    if (!customEmail.includes('@')) {
      setError('Single Sign-On requires a valid organizational work email address.');
      return;
    }

    setIsAuthenticating(true);
    setError(null);

    setTimeout(() => {
      setIsAuthenticating(false);
      const generatedUser: User = {
        id: `usr-${Date.now()}`,
        name: customEmail.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: customEmail.toLowerCase().trim(),
        role: 'ComplianceAdmin',
        department: 'Software_DevOps',
        title: 'Enterprise Staff Member',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        entraObjectId: `entra-${Date.now()}`,
        entraGroups: ['SOP_Admins', 'SOP_Authors'],
        mfaEnforced: true
      };
      onSignIn(generatedUser);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#071326] text-white flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e3a8a_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Bar */}
      <header className="border-b border-[#132A4D] bg-[#0A192F]/90 backdrop-blur-md px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Future Focus Infotech Logo */}
            <div className="flex items-center gap-4">
              <CompanyLogo variant="light" height={42} />
              <div className="hidden md:block border-l border-[#1E3A68] pl-4">
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  en Inc. Group
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">
                  Enterprise SOP Governance & Operations Hub
                </p>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 bg-[#0D2342] px-3 py-1.5 rounded-lg border border-[#1A3A66]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Microsoft Entra ID SSO Protected</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 my-6">
        <div className="w-full max-w-lg bg-[#0B1E3B] border border-[#1E3A68] rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
          
          {/* Card Top Brand Banner */}
          <div className="bg-gradient-to-r from-[#0A192F] via-[#0F284E] to-[#0A192F] p-6 sm:p-8 border-b border-[#1E3A68] text-center relative">
            <div className="flex justify-center mb-5">
              <div className="bg-white px-5 py-3 rounded-xl shadow-inner border border-blue-400/20">
                <CompanyLogo variant="dark" height={36} />
              </div>
            </div>

            <div className="inline-flex items-center justify-center p-3 bg-white rounded-2xl shadow-md mb-4">
              {/* Microsoft 4-Color Logo */}
              <div className="grid grid-cols-2 gap-1 w-7 h-7">
                <div className="bg-[#F25022] rounded-xs"></div>
                <div className="bg-[#7FBA00] rounded-xs"></div>
                <div className="bg-[#00A4EF] rounded-xs"></div>
                <div className="bg-[#FFB900] rounded-xs"></div>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Enterprise Single Sign-On
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
              Sign in with your authorized corporate credentials to access governed SOP documents and compliance operations.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#08172D] border border-blue-400/20 text-[11px] text-cyan-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Tenant: organization.onmicrosoft.com
            </div>
          </div>

          {/* Authentication Actions Area */}
          <div className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Primary Corporate SSO Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleCorporateSSOSignIn}
                disabled={isAuthenticating}
                className="w-full py-4 px-5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-3 cursor-pointer group disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <div className="flex items-center gap-2 text-slate-800">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying Entra ID Security Token & MFA...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                      <div className="bg-[#F25022]"></div>
                      <div className="bg-[#7FBA00]"></div>
                      <div className="bg-[#00A4EF]"></div>
                      <div className="bg-[#FFB900]"></div>
                    </div>
                    <span>Sign In with Microsoft 365 / Entra ID SSO</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600" />
                  </>
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowEmailInput(!showEmailInput)}
                  className="text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 transition cursor-pointer"
                >
                  {showEmailInput ? 'Hide manual email entry' : 'Or enter custom organizational email address'}
                </button>
              </div>
            </div>

            {/* Optional Manual Work Email Form */}
            {showEmailInput && (
              <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-[#18345C] space-y-3 animate-in fade-in duration-200">
                <label className="block text-xs font-semibold text-slate-300">
                  Work Email Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="flex-1 px-3.5 py-2.5 bg-[#081830] border border-[#1A3A66] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  />
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
                  >
                    Authenticate
                  </button>
                </div>
              </form>
            )}

            {/* Security Compliance Pillars */}
            <div className="pt-4 border-t border-[#18345C] grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-[#081830] border border-[#142F54]">
                <Shield className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">ISO 27001 ISMS</div>
                <div className="text-[9px] text-slate-400">Encrypted</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#081830] border border-[#142F54]">
                <Fingerprint className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">FIDO2 / MFA</div>
                <div className="text-[9px] text-slate-400">Enforced</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#081830] border border-[#142F54]">
                <Globe className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-[10px] font-bold text-white">SharePoint M365</div>
                <div className="text-[9px] text-slate-400">Synced</div>
              </div>
            </div>

          </div>

          {/* Card Footer */}
          <div className="bg-[#07152B] px-6 py-3 border-t border-[#132A4D] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Entra ID Conditional Access Policy: Active
            </span>
            <span>Enterprise Edition</span>
          </div>

        </div>
      </main>

      {/* Corporate Governance Footer */}
      <footer className="border-t border-[#132A4D] bg-[#0A192F] py-4 px-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Future Focus Infotech Pvt. Ltd. (Part of en Inc. Group). All Rights Reserved.</p>
          <p className="text-slate-400">
            Authorized Personnel Only • Governed by Corporate Information Security Policy (POL-IT-001)
          </p>
        </div>
      </footer>
    </div>
  );
};

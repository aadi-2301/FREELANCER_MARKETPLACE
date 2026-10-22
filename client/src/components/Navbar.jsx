import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShoppingBag,
  FileCheck2,
  MessageSquare,
  Lock,
  Terminal,
  Activity,
  User,
  Wallet,
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab, onOpenCreateGig }) => {
  const { user, switchRole, authFetch, refreshUser } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);

  const handleToggleMfa = async () => {
    setMfaLoading(true);
    try {
      const res = await authFetch('/api/auth/mfa/toggle', { method: 'POST' });
      if (res.ok) {
        await refreshUser();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMfaLoading(false);
    }
  };

  const navItems = [
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'orders', label: 'Escrow Orders', icon: Lock },
    { id: 'deliverables', label: 'Deliverables Sandbox', icon: FileCheck2 },
    { id: 'messages', label: 'Encrypted Chat & DLP', icon: MessageSquare },
    { id: 'soc', label: 'SOC & Audit Ledger', icon: Activity },
    { id: 'examiner', label: 'Examiner Live Demo', icon: Terminal, highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-800">
      {/* Top Academic Banner */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border-b border-slate-800/80 px-4 py-1 text-xs text-slate-300 flex flex-wrap items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-sky-400">TCET</span>
          <span className="text-slate-400">| Department of Computer Science & Engineering (Cyber Security)</span>
          <span className="hidden md:inline bg-slate-800 text-sky-300 px-2 py-0.5 rounded text-[10px] font-mono border border-slate-700">
            CBCGS-HME 2023 Autonomy Scheme
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400 hidden sm:inline">Industrial Practices Project • Freelance Marketplace</span>
          <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero-Trust Verified
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveTab('marketplace')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:shadow-cyan-400/30 transition-all">
              <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-sky-300 bg-clip-text text-transparent">
                  Freelance<span className="text-sky-400">Shield</span>
                </span>
                <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 font-mono">Cyber-Resilient Marketplace</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? item.highlight
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-lg shadow-rose-500/10'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg shadow-sky-500/10'
                      : item.highlight
                      ? 'text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 animate-pulse'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? (item.highlight ? 'text-rose-400' : 'text-sky-400') : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Controls & Quick Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Create Gig button (Freelancer only) */}
            {user?.role === 'freelancer' && (
              <button
                onClick={onOpenCreateGig}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-sky-600/20 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Publish Gig</span>
              </button>
            )}

            {/* Wallet Balance Display */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Escrow Vault:</span>
              <span className="text-emerald-400 font-bold">${user?.wallet_balance?.toFixed(2) || '0.00'}</span>
            </div>

            {/* Quick Role Switcher (Crucial for live Examiner Demo!) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-lg text-xs transition-all"
              >
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=user`}
                  alt="avatar"
                  className="w-6 h-6 rounded-full bg-slate-700 border border-slate-600"
                />
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-slate-200 leading-none capitalize">{user?.username}</div>
                  <span className="text-[10px] text-sky-400 uppercase font-mono tracking-wider">{user?.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                  <div className="px-2 py-1.5 border-b border-slate-800 mb-2">
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Examiner Role Switcher</p>
                    <p className="text-xs text-slate-200 font-medium">Switch persona for live demo:</p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => { switchRole('client'); setRoleMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                        user?.role === 'client' ? 'bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        <div>
                          <div className="font-medium">Alex Rivera (Client)</div>
                          <div className="text-[10px] text-slate-400">Order gigs & release escrow</div>
                        </div>
                      </div>
                      {user?.role === 'client' && <span className="text-[10px] text-sky-400">ACTIVE</span>}
                    </button>

                    <button
                      onClick={() => { switchRole('freelancer'); setRoleMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                        user?.role === 'freelancer' ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <div>
                          <div className="font-medium">Sarah Chen (Freelancer)</div>
                          <div className="text-[10px] text-slate-400">Submit deliverables & get paid</div>
                        </div>
                      </div>
                      {user?.role === 'freelancer' && <span className="text-[10px] text-emerald-400">ACTIVE</span>}
                    </button>

                    <button
                      onClick={() => { switchRole('admin'); setRoleMenuOpen(false); }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-all ${
                        user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                        <div>
                          <div className="font-medium">TCET SOC Admin</div>
                          <div className="text-[10px] text-slate-400">Monitor telemetry & dispute resolution</div>
                        </div>
                      </div>
                      {user?.role === 'admin' && <span className="text-[10px] text-purple-400">ACTIVE</span>}
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between px-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-sky-400" /> 2FA (MFA)
                    </span>
                    <button
                      disabled={mfaLoading}
                      onClick={handleToggleMfa}
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium transition-all ${
                        user?.mfa_enabled
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {user?.mfa_enabled ? 'ENABLED (123456)' : 'ENABLE 2FA'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center space-x-1 py-2 overflow-x-auto border-t border-slate-800/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? item.highlight
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

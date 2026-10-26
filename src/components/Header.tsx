import React from 'react';
import {
  Camera,
  ShieldCheck,
  Wifi,
  WifiOff,
  Bell,
  Lock,
  Layers,
  FileText,
  BarChart3,
  CheckSquare,
  Archive,
  User,
  KeyRound,
} from 'lucide-react';
import { UserProfile, IntruderAlert, SyncQueueItem } from '../types';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  onSelectUser: (user: UserProfile) => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  pendingSyncItems: SyncQueueItem[];
  onOpenSyncModal: () => void;
  activeAlerts: IntruderAlert[];
  onOpenAlertModal: () => void;
  onOpenVaultModal: () => void;
  onOpenMfaModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  availableUsers,
  onSelectUser,
  isOfflineMode,
  onToggleOffline,
  pendingSyncItems,
  onOpenSyncModal,
  activeAlerts,
  onOpenAlertModal,
  onOpenVaultModal,
  onOpenMfaModal,
}) => {
  const activeAlertCount = activeAlerts.filter(a => a.status === 'active' || a.status === 'investigating').length;

  const navItems = [
    { id: 'cctv', label: 'CCTV Live Vision', icon: Camera },
    { id: 'reports', label: 'Daily Reports', icon: FileText },
    { id: 'trends', label: 'Trends & Analytics', icon: BarChart3 },
    { id: 'approvals', label: 'Attendance Approvals', icon: CheckSquare },
    { id: 'archive', label: 'Cloud Archive', icon: Archive },
    { id: 'security', label: 'Encrypted Vault & Logs', icon: Lock },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      {/* Top Banner / System HUD */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        {/* Brand & Live status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div className="font-extrabold tracking-wider text-white text-base flex items-center gap-1.5 font-['JetBrains_Mono',monospace]">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>AEGIS<span className="text-cyan-400">VISION</span></span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-sans font-semibold">
                AI CCTV v4.2
              </span>
            </div>
          </div>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:flex items-center text-slate-400 gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Biometric Neural Pipeline: <strong className="text-slate-200">Active</strong>
          </span>
        </div>

        {/* Global Controls: Encryption Vault, Remote Offline Sync, Intruder Siren Alert, MFA */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Encrypted Vault status badge */}
          <button
            onClick={onOpenVaultModal}
            aria-label="Encrypted Vault Status"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/50 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/50 transition-colors cursor-pointer"
            title="Database encrypted with AES-256 GCM & SHA-256 Ledger"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px] font-semibold">AES-256 ENCRYPTED</span>
          </button>

          {/* Offline / Remote Campus Simulator */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-md p-0.5">
            <button
              onClick={onToggleOffline}
              aria-label="Toggle network mode"
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                isOfflineMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-600/50 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle to simulate low-bandwidth remote campus location"
            >
              {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isOfflineMode ? 'Remote Offline Mode' : 'Campus LAN (Online)'}</span>
            </button>

            {pendingSyncItems.length > 0 && (
              <button
                onClick={onOpenSyncModal}
                aria-label="View pending offline sync queue"
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 text-[11px] font-semibold hover:bg-cyan-900 transition-colors animate-pulse cursor-pointer"
                title={`${pendingSyncItems.length} records queued for cloud sync`}
              >
                <span>Sync Queue: {pendingSyncItems.length}</span>
              </button>
            )}
          </div>

          {/* Real-time Intruder Alert Banner Button */}
          <button
            onClick={onOpenAlertModal}
            aria-label="View security and unknown person alerts"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-bold transition-all cursor-pointer ${
              activeAlertCount > 0
                ? 'bg-red-950/80 border-red-600 text-red-300 shadow-lg shadow-red-900/40 animate-pulse'
                : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${activeAlertCount > 0 ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
            <span>{activeAlertCount > 0 ? `INTRUDER ALERT (${activeAlertCount})` : 'Alerts (0)'}</span>
          </button>

          {/* User & Role Switcher with MFA state */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-700">
            <div className="relative group">
              <button
                className="flex items-center gap-2 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 hover:border-slate-600 text-left transition-colors"
                aria-label="Switch current active profile"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover border border-cyan-500/50"
                />
                <div className="leading-tight">
                  <div className="font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                    {currentUser.name}
                    {currentUser.mfaVerified && (
                      <span title="Multi-Factor Authentication Verified" className="text-cyan-400 text-[10px]">
                        ✓MFA
                      </span>
                    )}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-cyan-400 font-mono">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {/* Profile dropdown */}
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 w-60 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 z-50">
                <div className="px-2 py-1.5 text-[10px] text-slate-400 border-b border-slate-800 font-mono">
                  SWITCH DEMO ROLE & ACCESS
                </div>
                {availableUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => onSelectUser(user)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-slate-800 transition-colors ${
                      user.id === currentUser.id ? 'bg-slate-800/80 text-cyan-300 font-semibold' : 'text-slate-300'
                    }`}
                  >
                    <img src={user.avatar} alt={user.name} className="w-5 h-5 rounded-full object-cover" />
                    <div className="flex-1 truncate">
                      <div className="text-xs">{user.name}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{user.role} • {user.department}</div>
                    </div>
                  </button>
                ))}
                <div className="p-1 pt-1.5 border-t border-slate-800">
                  <button
                    onClick={onOpenMfaModal}
                    className="w-full flex items-center justify-center gap-1.5 px-2 py-1 bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded text-[11px] font-medium transition-colors"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Configure MFA Credentials
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <nav aria-label="Main Navigation" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1.5">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'approvals' && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 text-[10px] font-mono">
                    1 Pending
                  </span>
                )}
                {item.id === 'cctv' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};

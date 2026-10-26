import React, { useState } from 'react';
import {
  WifiOff,
  Wifi,
  RefreshCw,
  X,
  CheckCircle2,
  Database,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  HardDrive,
} from 'lucide-react';
import { SyncQueueItem, AttendanceRecord } from '../types';
import { computeSyncQueueResolution } from '../utils/rules';
import { playSyncPulse } from '../utils/audio';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  queueItems: SyncQueueItem[];
  currentRecords: AttendanceRecord[];
  onCommitSync: (syncedRecords: AttendanceRecord[]) => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  isOfflineMode,
  onToggleOffline,
  queueItems,
  currentRecords,
  onCommitSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ merged: number; conflicts: number } | null>(null);

  if (!isOpen) return null;

  const handleExecuteSync = () => {
    setIsSyncing(true);
    playSyncPulse();

    setTimeout(() => {
      const resolution = computeSyncQueueResolution(queueItems, currentRecords);
      onCommitSync(resolution.syncedRecords);
      setIsSyncing(false);
      setSyncResult({ merged: resolution.mergedCount, conflicts: resolution.conflictCount });
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isOfflineMode ? 'bg-amber-950 text-amber-400' : 'bg-cyan-950 text-cyan-400'}`}>
              {isOfflineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Remote Campus Offline Synchronization Hub</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${isOfflineMode ? 'bg-amber-950 border border-amber-600 text-amber-300' : 'bg-emerald-950 border border-emerald-600 text-emerald-300'}`}>
                  {isOfflineMode ? 'OFFLINE QUEUING' : 'CLOUD CONNECTED'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Guarantees zero attendance data loss in remote outposts with intermittent network bandwidth.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Sync Modal"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Network State Card */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-200 text-xs">Simulated Network Connection:</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {isOfflineMode
                  ? 'Currently disconnected from main Cloud Server. Logs are stored encrypted in IndexedDB.'
                  : 'Connected to high-speed campus fiber LAN. Automatic live sync is enabled.'}
              </div>
            </div>

            <button
              onClick={onToggleOffline}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                isOfflineMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isOfflineMode ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span>{isOfflineMode ? 'Restore Online Network' : 'Simulate Offline Outpost'}</span>
            </button>
          </div>

          {/* Sync Queue Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-300 font-mono">
                Encrypted Offline Queue ({queueItems.length} records pending)
              </span>
              <span className="text-[11px] text-cyan-400 font-mono">
                Store-and-Forward Engine: ACTIVE
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950/60">
              {queueItems.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{item.payload?.studentName || 'Attendance Log'}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {item.payload?.rollNumber} • {item.payload?.courseCode} • {new Date(item.queuedAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      Sig: {item.signature.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              ))}

              {queueItems.length === 0 && (
                <div className="text-center py-6 text-slate-500 text-xs">
                  All local mobile and edge CCTV device records are fully synchronized with the cloud!
                </div>
              )}
            </div>
          </div>

          {/* Sync Result feedback */}
          {syncResult && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <strong className="block text-emerald-100">Cloud Sync Successful!</strong>
                <span>
                  Synchronized {syncResult.merged} records with zero data loss. Conflicts resolved: {syncResult.conflicts}.
                </span>
              </div>
            </div>
          )}

          {/* Sync Trigger button */}
          <button
            onClick={handleExecuteSync}
            disabled={isSyncing || queueItems.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              queueItems.length > 0 && !isSyncing
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>
              {isSyncing
                ? 'Validating Hashes & Synchronizing with Cloud...'
                : queueItems.length > 0
                ? `Synchronize ${queueItems.length} Queued Records Now`
                : 'Queue Empty (Up to Date)'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

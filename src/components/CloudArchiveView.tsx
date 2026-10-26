import React, { useState } from 'react';
import {
  Archive,
  Cloud,
  HardDrive,
  Download,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Database,
  ArrowUpRight,
} from 'lucide-react';
import { ArchiveTierInfo } from '../types';
import { INITIAL_ARCHIVE_TIERS } from '../mock/initialData';

export const CloudArchiveView: React.FC = () => {
  const [tiers, setTiers] = useState<ArchiveTierInfo[]>(INITIAL_ARCHIVE_TIERS);
  const [retentionPolicy, setRetentionPolicy] = useState('365_days');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const handleExportHistoricalArchive = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-cyan-400" />
            <span>Scalable Cloud Storage & Historical Data Archiving</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated lifecycle tiering from NVMe Hot cache down to encrypted Cold Glacier buckets for compliance.
          </p>
        </div>

        <button
          onClick={handleExportHistoricalArchive}
          disabled={isExporting}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
        >
          {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span>{isExporting ? 'Packaging Archive...' : 'Create Compressed Archive Snapshot'}</span>
        </button>
      </div>

      {exportComplete && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Historical archive snapshot generated and securely signed with SHA-256 seal. Ready for cloud cold tier replication!</span>
        </div>
      )}

      {/* Storage Tiering Cards (Hot, Warm, Cold Glacier) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map(tier => (
          <div
            key={tier.tier}
            className={`p-5 rounded-xl border shadow-lg space-y-4 ${
              tier.tier === 'Hot'
                ? 'bg-slate-900 border-cyan-500/50'
                : tier.tier === 'Warm'
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-900 border-indigo-900/50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  tier.tier === 'Hot'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                    : tier.tier === 'Warm'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : 'bg-indigo-950 text-indigo-300 border border-indigo-700'
                }`}>
                  {tier.tier} Tier
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{tier.retention}</h3>
              </div>
              <Cloud className="w-5 h-5 text-slate-400" />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Volume:</span>
                <span className="font-mono font-bold text-slate-200">{tier.sizeGb} GB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Records:</span>
                <span className="font-mono font-bold text-slate-200">
                  {tier.recordsCount.toLocaleString()} logs
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cost Estimate:</span>
                <span className="font-mono text-emerald-400 font-bold">{tier.costEstimate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Synced:</span>
                <span className="font-mono text-slate-400 text-[11px]">{tier.lastBackupDate}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Replicated across 3 Availability Zones</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Archiving Policy Settings & Compliance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Automated Cloud Lifecycle & Retention Rules</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 block">Hot-to-Warm Eviction:</span>
            <span className="font-mono font-bold text-white text-sm">After 30 Days</span>
            <p className="text-[10px] text-slate-500">Transfers unedited daily logs to compressed parquet tables.</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 block">Glacier Cold Deep Freeze:</span>
            <span className="font-mono font-bold text-white text-sm">After 365 Days</span>
            <p className="text-[10px] text-slate-500">Encrypted with immutable WORM policy (Write Once Read Many).</p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
            <span className="text-slate-400 block">Total Campus Storage Managed:</span>
            <span className="font-mono font-bold text-cyan-400 text-sm">1.61 TB (4.4M Records)</span>
            <p className="text-[10px] text-slate-500">99.999999999% (11 9s) Data Durability guarantee.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

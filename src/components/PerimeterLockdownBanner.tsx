import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertOctagon,
  ShieldAlert,
  Clock,
  Radio,
  CheckCircle,
} from 'lucide-react';
import { CampusLockdownState } from '../types';

interface PerimeterLockdownBannerProps {
  lockdown: CampusLockdownState;
  onLiftLockdown: (authorizedBy: string) => void;
  authorizedUserName: string;
}

export const PerimeterLockdownBanner: React.FC<PerimeterLockdownBannerProps> = ({
  lockdown,
  onLiftLockdown,
  authorizedUserName,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!lockdown.isLockdownActive) return null;

  return (
    <div className="bg-red-950 border-y-2 border-red-600 text-white shadow-2xl relative z-30 animate-pulse-slow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Lockdown Alert Telemetry */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-600 rounded-xl text-white shadow-lg animate-bounce flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black tracking-widest uppercase bg-red-600 text-white px-2 py-0.5 rounded">
                EMERGENCY PERIMETER LOCKDOWN
              </span>
              <span className="font-mono text-xs font-bold text-red-200">
                {lockdown.alertCode}
              </span>
              <span className="text-xs text-red-300 font-mono">
                Sector: <strong>{lockdown.sectorName}</strong>
              </span>
            </div>
            <div className="text-xs text-red-200/90 mt-0.5 flex items-center gap-3 font-medium">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                Turnstiles Magnetically Sealed
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-amber-300" />
                Security Quick Response Units Dispatched
              </span>
            </div>
          </div>
        </div>

        {/* Right: Stand Down / Lift Lockdown Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {showConfirm ? (
            <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-red-500">
              <span className="text-xs text-slate-200 pl-2">Authorize stand down?</span>
              <button
                onClick={() => {
                  onLiftLockdown(authorizedUserName);
                  setShowConfirm(false);
                }}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Yes, Lift Lockdown
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-red-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-amber-400" />
              <span>Stand Down / Lift Lockdown</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Lock,
  X,
  Eye,
  AlertTriangle,
  BellRing,
  Clock,
  MapPin,
  Flame,
} from 'lucide-react';
import { PushNotificationAlert } from '../types';

interface IntruderPushNotificationOverlayProps {
  alert: PushNotificationAlert | null;
  onLockdown: (sectorId: string, sectorName: string) => void;
  onDismiss: () => void;
  onViewDetails: (alertRefId: string) => void;
}

export const IntruderPushNotificationOverlay: React.FC<IntruderPushNotificationOverlayProps> = ({
  alert,
  onLockdown,
  onDismiss,
  onViewDetails,
}) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!alert) return;
    setProgress(100);

    const totalDuration = alert.autoDismissMs || 14000;
    const intervalMs = 100;
    const decrement = (intervalMs / totalDuration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= decrement) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return prev - decrement;
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [alert, isPaused, onDismiss]);

  if (!alert) return null;

  return (
    <aside
      aria-label="Security Alert Notification"
      className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] transition-all duration-300 transform translate-y-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative bg-slate-900/98 border-2 border-red-500 rounded-2xl shadow-[0_0_35px_rgba(239,68,68,0.45)] backdrop-blur-xl overflow-hidden ring-4 ring-red-500/20">
        {/* Animated Beacon Strip on top */}
        <div className="h-1.5 w-full bg-slate-800 relative overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 transition-all duration-100"
          ></div>
        </div>

        <div className="p-4 space-y-3">
          {/* Header row: Push Notification Tag & Dismiss X */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="font-mono text-[11px] font-bold tracking-wider text-red-400 uppercase flex items-center gap-1">
                <BellRing className="w-3.5 h-3.5" />
                <span>BROWSER PUSH ALERT</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 border border-red-700 text-red-300 font-mono font-bold">
                HIGH PRIORITY
              </span>
            </div>

            <button
              onClick={onDismiss}
              aria-label="Dismiss notification"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Content: Thumbnail & Alert Details */}
          <div className="flex items-start gap-3">
            {/* Snapshot Thumbnail */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-red-500/80 bg-black flex-shrink-0 shadow-md">
              <img
                src={alert.snapshotUrl}
                alt="Intruder Snapshot"
                className="w-full h-full object-cover filter contrast-125"
              />
              <div className="absolute inset-0 bg-red-500/10 pointer-events-none"></div>
            </div>

            {/* Title & Info */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 animate-bounce" />
                <span className="truncate">{alert.title}</span>
              </h4>
              <div className="text-xs text-red-200 mt-0.5 flex items-center gap-1 truncate font-medium">
                <MapPin className="w-3 h-3 text-red-400 flex-shrink-0" />
                <span className="truncate">{alert.location}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                <span className="text-red-400 font-bold">Mismatch: {alert.confidence}%</span>
                <span>•</span>
                <span>{alert.cameraId}</span>
              </div>
            </div>
          </div>

          {/* Alert Message Text */}
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
            {alert.message}
          </p>

          {/* Quick Action Buttons: Quick Lockdown vs Quick Dismiss */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Quick Lockdown Button */}
            <button
              onClick={() => onLockdown(alert.cameraId, alert.location)}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all transform active:scale-95 cursor-pointer ring-2 ring-red-400/40"
            >
              <Lock className="w-4 h-4" />
              <span>Lockdown Sector</span>
            </button>

            {/* Quick Dismiss Button */}
            <button
              onClick={onDismiss}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Dismiss Alert</span>
            </button>
          </div>

          {/* Secondary Action: Inspect Live Feed in Detail */}
          <button
            onClick={() => onViewDetails(alert.alertRefId)}
            className="w-full text-center text-[11px] text-cyan-400 hover:text-cyan-300 font-medium py-1 transition-colors flex items-center justify-center gap-1"
          >
            <Eye className="w-3 h-3" />
            <span>Open Incident Surveillance Center</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

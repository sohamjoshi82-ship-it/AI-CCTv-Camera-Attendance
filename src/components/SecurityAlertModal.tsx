import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  UserPlus,
  Send,
  CheckCircle,
  Eye,
  Clock,
  MapPin,
  Camera,
  Filter,
} from 'lucide-react';
import { IntruderAlert } from '../types';

interface SecurityAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: IntruderAlert[];
  onUpdateAlertStatus: (alertId: string, newStatus: IntruderAlert['status'], notes?: string, guard?: string) => void;
  onEnrollAsStudentOrVisitor?: (alert: IntruderAlert) => void;
}

export const SecurityAlertModal: React.FC<SecurityAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onUpdateAlertStatus,
  onEnrollAsStudentOrVisitor,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [dispatchGuardName, setDispatchGuardName] = useState('Officer Vikram (QRT Unit 1)');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'active') return a.status === 'active' || a.status === 'investigating';
    if (filter === 'resolved') return a.status === 'resolved' || a.status === 'dismissed';
    return true;
  });

  const activeFocusAlert = alerts.find(a => a.id === selectedAlertId) || filteredAlerts[0] || alerts[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-red-600/70 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-red-950/40 border-b border-red-600/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 text-white rounded-lg animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Unknown Person Perimeter Intruder Alerts</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-500/20 text-red-300 border border-red-500/40">
                  REAL-TIME DISPATCH
                </span>
              </h3>
              <p className="text-xs text-red-200/80">
                Automated facial recognition flagged individuals with no biometric match in the campus database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Security Modal"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Focused Alert Detail & Dispatch Actions (Col 7) */}
          <div className="md:col-span-7 space-y-4">
            {activeFocusAlert ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${activeFocusAlert.status === 'active' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                    <span className="font-mono text-xs uppercase font-bold text-red-400">
                      INCIDENT REF: {activeFocusAlert.id}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                    activeFocusAlert.status === 'active'
                      ? 'bg-red-950 text-red-300 border border-red-600'
                      : activeFocusAlert.status === 'investigating'
                      ? 'bg-amber-950 text-amber-300 border border-amber-600'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
                  }`}>
                    {activeFocusAlert.status}
                  </span>
                </div>

                {/* CCTV Snapshot Preview */}
                <div className="relative aspect-video rounded-lg overflow-hidden border border-red-900/50 bg-black">
                  <img
                    src={activeFocusAlert.snapshotUrl}
                    alt="Unknown Person Snapshot"
                    className="w-full h-full object-cover filter contrast-125"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-red-300 border border-red-800">
                    UNRECOGNIZED: {activeFocusAlert.confidence}% CONFIDENCE
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                    CAMERA: {activeFocusAlert.cameraName} ({activeFocusAlert.cameraId})
                  </div>
                </div>

                {/* Incident Information */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-cyan-400" /> Detected Time
                    </div>
                    <div className="font-semibold text-slate-200 mt-1">
                      {new Date(activeFocusAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="text-slate-400 flex items-center gap-1 text-[11px]">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Sector
                    </div>
                    <div className="font-semibold text-slate-200 mt-1 truncate">
                      {activeFocusAlert.cameraName}
                    </div>
                  </div>
                </div>

                {activeFocusAlert.notes && (
                  <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-200">
                    <strong>Incident Log:</strong> {activeFocusAlert.notes}
                  </div>
                )}

                {activeFocusAlert.assignedGuard && (
                  <div className="p-2.5 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs text-amber-200 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    <span>Assigned Patrol: <strong>{activeFocusAlert.assignedGuard}</strong></span>
                  </div>
                )}

                {/* Triage Action Buttons */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Security Response Actions:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        onUpdateAlertStatus(
                          activeFocusAlert.id,
                          'investigating',
                          'Security quick response unit dispatched to intercept subject.',
                          dispatchGuardName
                        )
                      }
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Dispatch Campus Guard</span>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateAlertStatus(
                          activeFocusAlert.id,
                          'resolved',
                          'Visitor confirmed with department visitor pass.',
                          'Chief Inspector Vikram'
                        )
                      }
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Resolve as Verified Guest</span>
                    </button>

                    <button
                      onClick={() =>
                        onUpdateAlertStatus(
                          activeFocusAlert.id,
                          'dismissed',
                          'Dismissed as sensor reflection / camera angle false flag.'
                        )
                      }
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 text-xs transition-colors cursor-pointer"
                    >
                      <span>Dismiss / False Alarm</span>
                    </button>

                    {onEnrollAsStudentOrVisitor && (
                      <button
                        onClick={() => onEnrollAsStudentOrVisitor(activeFocusAlert)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Enroll Subject to Biometrics</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                No alert selected.
              </div>
            )}
          </div>

          {/* Right Column: Alert Incident Feed (Col 5) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                Recent Perimeter Incidents
              </h4>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-2 py-0.5 rounded ${filter === 'all' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-2 py-0.5 rounded ${filter === 'active' ? 'bg-red-950 text-red-300 font-bold' : 'text-slate-400'}`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-2 py-0.5 rounded ${filter === 'resolved' ? 'bg-emerald-950 text-emerald-300 font-bold' : 'text-slate-400'}`}
                >
                  Resolved
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredAlerts.map(alert => (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    activeFocusAlert?.id === alert.id
                      ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <img
                    src={alert.snapshotUrl}
                    alt="Alert thumb"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-700 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-red-400 truncate">
                        {alert.cameraId}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 truncate">{alert.cameraName}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      Mismatch: {alert.confidence}% • Status: <span className="uppercase text-slate-300">{alert.status}</span>
                    </div>
                  </div>
                </button>
              ))}

              {filteredAlerts.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No alerts match the selected filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Security dispatch coordinates directly linked to Campus QRT Network.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close Incident Center
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Header } from './components/Header';
import { CCTVMonitor } from './components/CCTVMonitor';
import { ReportsView } from './components/ReportsView';
import { TrendsDashboard } from './components/TrendsDashboard';
import { ApprovalWorkflow } from './components/ApprovalWorkflow';
import { CloudArchiveView } from './components/CloudArchiveView';
import { SecurityAlertModal } from './components/SecurityAlertModal';
import { OfflineSyncModal } from './components/OfflineSyncModal';
import { EncryptedVaultModal } from './components/EncryptedVaultModal';
import { MFAModal } from './components/MFAModal';
import { IntruderPushNotificationOverlay } from './components/IntruderPushNotificationOverlay';
import { PerimeterLockdownBanner } from './components/PerimeterLockdownBanner';
import {
  INITIAL_STUDENTS,
  INITIAL_CAMERAS,
  INITIAL_PROFILES,
  INITIAL_ATTENDANCE_RECORDS,
  INITIAL_INTRUDER_ALERTS,
  INITIAL_LEAVE_REQUESTS,
} from './mock/initialData';
import {
  Student,
  CameraFeed,
  UserProfile,
  AttendanceRecord,
  IntruderAlert,
  LeaveRequest,
  SyncQueueItem,
  PushNotificationAlert,
  CampusLockdownState,
} from './types';
import { generateTamperHash } from './utils/crypto';
import { executePerimeterLockdown, liftPerimeterLockdown } from './utils/rules';
import { playIntruderAlarm } from './utils/audio';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('cctv');
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES[0]);
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>(INITIAL_PROFILES);

  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE_RECORDS);
  const [intruderAlerts, setIntruderAlerts] = useState<IntruderAlert[]>(INITIAL_INTRUDER_ALERTS);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);

  // Offline / Remote Campus Simulation
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [pendingSyncQueue, setPendingSyncQueue] = useState<SyncQueueItem[]>([]);

  // Modals state
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState<boolean>(false);

  // Push Notification & Lockdown State
  const [pushAlert, setPushAlert] = useState<PushNotificationAlert | null>(null);
  const [lockdownState, setLockdownState] = useState<CampusLockdownState>({
    isLockdownActive: false,
    sectorId: '',
    sectorName: '',
    triggeredBy: '',
    reason: '',
    turnstilesLocked: false,
    securityDispatched: false,
    alertCode: '',
  });

  // Handler: When face recognition logs attendance
  const handleAttendanceMarked = (newRecord: AttendanceRecord) => {
    setAttendanceRecords(prev => [newRecord, ...prev]);

    // Recalculate student statistics
    setStudents(prevStudents =>
      prevStudents.map(student => {
        if (student.id === newRecord.studentId) {
          const newAttended = student.attendedClasses + (newRecord.status !== 'Absent' ? 1 : 0);
          const newTotal = student.totalClasses + 1;
          const newPct = Math.round((newAttended / newTotal) * 1000) / 10;
          return {
            ...student,
            attendedClasses: newAttended,
            totalClasses: newTotal,
            attendancePercentage: newPct,
            status: newPct < 75 ? 'warning' : 'active',
          };
        }
        return student;
      })
    );

    // If offline, queue for sync
    if (isOfflineMode) {
      const queueItem: SyncQueueItem = {
        id: `sync-${Date.now()}-${newRecord.id}`,
        type: 'ATTENDANCE_LOG',
        payload: newRecord,
        queuedAt: new Date().toISOString(),
        deviceFingerprint: 'cctv-edge-node-01',
        signature: generateTamperHash('OFFLINE_QUEUE_HEAD', { recordId: newRecord.id }),
        synced: false,
      };
      setPendingSyncQueue(prev => [queueItem, ...prev]);
    }
  };

  // Handler: When an unknown person alert is triggered
  const handleIntruderDetected = (newAlert: IntruderAlert) => {
    setIntruderAlerts(prev => [newAlert, ...prev]);

    // Trigger Browser-based Push Notification Simulation Overlay
    setPushAlert({
      id: `push-${Date.now()}`,
      alertRefId: newAlert.id,
      title: 'UNKNOWN PERSON DETECTED',
      message: newAlert.notes || 'Unidentified individual flagged at perimeter turnstile by biometric CCTV scan.',
      location: newAlert.cameraName,
      cameraId: newAlert.cameraId,
      snapshotUrl: newAlert.snapshotUrl,
      confidence: newAlert.confidence,
      timestamp: newAlert.timestamp,
      autoDismissMs: 14000,
    });
  };

  // Quick Action from Push Overlay: Trigger Immediate Sector Lockdown
  const handleQuickLockdown = (sectorId: string, sectorName: string) => {
    const newState = executePerimeterLockdown(
      sectorId,
      sectorName,
      currentUser.name,
      'Emergency perimeter seal initiated via push alert overlay'
    );
    setLockdownState(newState);
    setPushAlert(null);
    playIntruderAlarm();
  };

  // Quick Action from Push Overlay: Dismiss Notification
  const handleDismissPush = () => {
    setPushAlert(null);
  };

  // Stand down / lift lockdown
  const handleLiftLockdown = (authorizedBy: string) => {
    const lifted = liftPerimeterLockdown(authorizedBy);
    setLockdownState(lifted);
  };

  // Open incident details from push notification
  const handleViewAlertDetails = (alertRefId: string) => {
    setPushAlert(null);
    setIsAlertModalOpen(true);
  };

  // Handler: Update security alert status
  const handleUpdateAlertStatus = (
    alertId: string,
    newStatus: IntruderAlert['status'],
    notes?: string,
    guard?: string
  ) => {
    setIntruderAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId
          ? {
              ...alert,
              status: newStatus,
              notes: notes || alert.notes,
              assignedGuard: guard || alert.assignedGuard,
            }
          : alert
      )
    );
  };

  // Handler: Enroll unknown subject into database
  const handleEnrollAsStudentOrVisitor = (alert: IntruderAlert) => {
    const newStudentId = `std-guest-${Date.now().toString().slice(-4)}`;
    const newStudent: Student = {
      id: newStudentId,
      rollNumber: `VIS-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: 'Registered Visitor / Guest',
      department: 'Academic Administration',
      batch: 'Visitor Pass',
      avatar: alert.snapshotUrl,
      faceEmbedding: [0.35, 0.45, 0.55, 0.65, 0.75],
      attendancePercentage: 100,
      totalClasses: 1,
      attendedClasses: 1,
      status: 'active',
    };
    setStudents(prev => [newStudent, ...prev]);
    handleUpdateAlertStatus(
      alert.id,
      'resolved',
      `Subject enrolled with Visitor ID ${newStudent.rollNumber}. Biometrics saved to encrypted vault.`
    );
  };

  // Handler: Commit offline sync merge
  const handleCommitSync = (syncedRecords: AttendanceRecord[]) => {
    setAttendanceRecords(syncedRecords);
    setPendingSyncQueue([]);
  };

  // Handler: Toggle offline mode
  const handleToggleOffline = () => {
    setIsOfflineMode(prev => !prev);
  };

  // Handler: Confirm MFA elevation
  const handleConfirmMFA = () => {
    setCurrentUser(prev => ({ ...prev, mfaVerified: true }));
    setAvailableUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, mfaVerified: true } : u))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Global Navigation Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        availableUsers={availableUsers}
        onSelectUser={setCurrentUser}
        isOfflineMode={isOfflineMode}
        onToggleOffline={handleToggleOffline}
        pendingSyncItems={pendingSyncQueue}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        activeAlerts={intruderAlerts}
        onOpenAlertModal={() => setIsAlertModalOpen(true)}
        onOpenVaultModal={() => setIsVaultModalOpen(true)}
        onOpenMfaModal={() => setIsMfaModalOpen(true)}
      />

      {/* Emergency Perimeter Lockdown Banner */}
      <PerimeterLockdownBanner
        lockdown={lockdownState}
        onLiftLockdown={handleLiftLockdown}
        authorizedUserName={currentUser.name}
      />

      {/* Browser-Based Intruder Push Notification Simulation Overlay */}
      <IntruderPushNotificationOverlay
        alert={pushAlert}
        onLockdown={handleQuickLockdown}
        onDismiss={handleDismissPush}
        onViewDetails={handleViewAlertDetails}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'cctv' && (
          <CCTVMonitor
            cameras={cameras}
            students={students}
            onAttendanceMarked={handleAttendanceMarked}
            onIntruderDetected={handleIntruderDetected}
            isOfflineMode={isOfflineMode}
            isSectorLocked={lockdownState.isLockdownActive}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            records={attendanceRecords}
            students={students}
            onUpdateRecord={updated =>
              setAttendanceRecords(prev => prev.map(r => (r.id === updated.id ? updated : r)))
            }
          />
        )}

        {currentTab === 'trends' && (
          <TrendsDashboard students={students} records={attendanceRecords} />
        )}

        {currentTab === 'approvals' && (
          <ApprovalWorkflow
            leaveRequests={leaveRequests}
            attendanceRecords={attendanceRecords}
            students={students}
            currentUser={currentUser}
            onUpdateLeaveRequests={setLeaveRequests}
            onUpdateAttendanceRecords={setAttendanceRecords}
            isOfflineMode={isOfflineMode}
          />
        )}

        {currentTab === 'archive' && <CloudArchiveView />}

        {currentTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Encrypted Ledger & Security Settings</span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect cryptographic keys, security perimeter dispatch rules, and multi-factor access policies.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  onClick={() => setIsVaultModalOpen(true)}
                  className="p-4 rounded-xl bg-slate-950 border border-emerald-700/60 hover:border-emerald-500 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-emerald-400 text-sm">AES-256 Vault Inspector</div>
                  <div className="text-slate-400 text-xs mt-1">Audit cryptographic chain blocks</div>
                </button>
                <button
                  onClick={() => setIsAlertModalOpen(true)}
                  className="p-4 rounded-xl bg-slate-950 border border-red-700/60 hover:border-red-500 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-red-400 text-sm">Perimeter Intruder Dispatch</div>
                  <div className="text-slate-400 text-xs mt-1">Review active unknown person flags</div>
                </button>
                <button
                  onClick={() => setIsMfaModalOpen(true)}
                  className="p-4 rounded-xl bg-slate-950 border border-cyan-700/60 hover:border-cyan-500 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-cyan-400 text-sm">Configure MFA Tokens</div>
                  <div className="text-slate-400 text-xs mt-1">Manage TOTP and biometric keys</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Security & Intruder Alert Modal */}
      <SecurityAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        alerts={intruderAlerts}
        onUpdateAlertStatus={handleUpdateAlertStatus}
        onEnrollAsStudentOrVisitor={handleEnrollAsStudentOrVisitor}
      />

      {/* Offline Sync Modal */}
      <OfflineSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        isOfflineMode={isOfflineMode}
        onToggleOffline={handleToggleOffline}
        queueItems={pendingSyncQueue}
        currentRecords={attendanceRecords}
        onCommitSync={handleCommitSync}
      />

      {/* Encrypted Vault Modal */}
      <EncryptedVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
      />

      {/* Multi-Factor Authentication Modal */}
      <MFAModal
        isOpen={isMfaModalOpen}
        onClose={() => setIsMfaModalOpen(false)}
        currentUser={currentUser}
        onConfirmMFA={handleConfirmMFA}
      />
    </div>
  );
}

export type UserRole = 'admin' | 'faculty' | 'security' | 'student';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  department?: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  studentId?: string;
}

export interface Student {
  id: string;
  rollNumber: string;
  name: string;
  department: string;
  batch: string;
  avatar: string;
  faceEmbedding: number[]; // 5-dimensional normalized vector for matching simulation
  attendancePercentage: number;
  totalClasses: number;
  attendedClasses: number;
  status: 'active' | 'warning' | 'debarred';
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  resolution: string;
  fps: number;
  status: 'online' | 'degraded' | 'offline';
  ipAddress: string;
  coverImage: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  courseCode: string;
  courseName: string;
  timestamp: string; // ISO string
  cameraId: string;
  cameraName: string;
  confidenceScore: number; // 0 - 100
  status: 'Present' | 'Late' | 'Absent' | 'Excused';
  verificationMethod: 'AI_FACE_RECOGNITION' | 'FACULTY_EXCUSED' | 'OFFLINE_SYNCED';
  tamperHash: string; // SHA-256 cryptographic chain
  isOfflineQueued?: boolean;
}

export interface IntruderAlert {
  id: string;
  timestamp: string;
  cameraId: string;
  cameraName: string;
  snapshotUrl: string;
  confidence: number; // confidence that this face is unmapped
  status: 'active' | 'investigating' | 'resolved' | 'dismissed';
  notes?: string;
  assignedGuard?: string;
}

export type LeaveReasonCategory = 'Medical' | 'Sports / Competition' | 'Academic Conference' | 'Family Emergency' | 'Official College Duty';

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  department: string;
  courseCode: string;
  courseName: string;
  date: string; // YYYY-MM-DD
  reasonCategory: LeaveReasonCategory;
  explanation: string;
  attachedDocumentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  facultyRemarks?: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'ATTENDANCE_LOG' | 'LEAVE_APPLICATION' | 'INTRUDER_INCIDENT';
  payload: any;
  queuedAt: string;
  deviceFingerprint: string;
  signature: string;
  synced: boolean;
}

export interface ArchiveTierInfo {
  tier: 'Hot' | 'Warm' | 'Cold Glacier';
  retention: string;
  sizeGb: number;
  recordsCount: number;
  lastBackupDate: string;
  costEstimate: string;
  status: 'active' | 'archiving' | 'ready';
}

export interface CampusLockdownState {
  isLockdownActive: boolean;
  sectorId: string;
  sectorName: string;
  triggeredBy: string;
  triggeredAt?: string;
  reason: string;
  turnstilesLocked: boolean;
  securityDispatched: boolean;
  alertCode: string;
}

export interface PushNotificationAlert {
  id: string;
  alertRefId: string;
  title: string;
  message: string;
  location: string;
  cameraId: string;
  snapshotUrl: string;
  confidence: number;
  timestamp: string;
  autoDismissMs?: number;
}


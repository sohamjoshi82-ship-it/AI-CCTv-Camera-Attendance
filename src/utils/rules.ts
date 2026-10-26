import { AttendanceRecord, LeaveRequest, Student, SyncQueueItem } from '../types';
import { generateTamperHash } from './crypto';

/**
 * Calculates aggregate attendance statistics from an array of attendance records.
 */
export function calculateAttendanceStats(records: AttendanceRecord[], totalRegisteredStudents: number) {
  const present = records.filter(r => r.status === 'Present').length;
  const late = records.filter(r => r.status === 'Late').length;
  const excused = records.filter(r => r.status === 'Excused').length;
  const recordedCount = records.length;
  
  // Total absentees are students not present/late/excused or explicitly marked Absent
  const absentRecords = records.filter(r => r.status === 'Absent').length;
  const absent = Math.max(absentRecords, Math.max(0, totalRegisteredStudents - (present + late + excused)));

  const effectivePresent = present + late + excused;
  const percentage = totalRegisteredStudents > 0 
    ? Math.round((effectivePresent / totalRegisteredStudents) * 1000) / 10 
    : 0;

  return {
    totalRegistered: totalRegisteredStudents,
    present,
    late,
    excused,
    absent,
    attendancePercentage: Math.min(100, Math.max(0, percentage)),
    punctualityRate: (present + late) > 0 ? Math.round((present / (present + late)) * 100) : 100,
  };
}

/**
 * Evaluates student attendance percentage against college mandatory thresholds.
 * Threshold rules:
 * - >= 85%: 'Good' / 'Eligible for honors'
 * - 75% to 84.9%: 'Satisfactory' / 'Eligible'
 * - < 75%: 'Critical Warning' / 'Exam Debarment Risk'
 */
export function evaluateThresholdWarning(percentage: number): {
  category: 'good' | 'satisfactory' | 'critical';
  label: string;
  isDebarredRisk: boolean;
} {
  if (percentage >= 85) {
    return {
      category: 'good',
      label: 'Good Standing (>85%)',
      isDebarredRisk: false,
    };
  }
  if (percentage >= 75) {
    return {
      category: 'satisfactory',
      label: 'Satisfactory (75-85%)',
      isDebarredRisk: false,
    };
  }
  return {
    category: 'critical',
    label: 'Critical Warning (<75% Mandate)',
    isDebarredRisk: true,
  };
}

/**
 * Compares a 5D face vector descriptor against a student's stored biometric profile.
 * Computes cosine similarity / normalized Euclidean proximity.
 * Returns confidence percentage (0 to 100) and whether it exceeds the match threshold (85%).
 */
export function matchFaceDescriptor(
  inputVector: number[],
  studentVector: number[],
  matchThreshold = 85
): {
  confidence: number;
  isMatch: boolean;
  distance: number;
} {
  if (!inputVector || !studentVector || inputVector.length !== studentVector.length) {
    return { confidence: 0, isMatch: false, distance: 999 };
  }

  // Compute Euclidean distance
  let sumSq = 0;
  for (let i = 0; i < inputVector.length; i++) {
    const diff = inputVector[i] - studentVector[i];
    sumSq += diff * diff;
  }
  const distance = Math.sqrt(sumSq);

  // Convert distance to normalized percentage confidence (distance 0 = 100%, distance >= 1 = 0%)
  const confidence = Math.max(0, Math.min(100, Math.round((1 - distance) * 1000) / 10));
  const isMatch = confidence >= matchThreshold;

  return {
    confidence,
    isMatch,
    distance,
  };
}

/**
 * Approval workflow: Faculty reviews student attendance dispute/leave request.
 * If approved, retroactively creates or updates the attendance record to 'Excused'.
 */
export function processLeaveApproval(
  leave: LeaveRequest,
  currentRecords: AttendanceRecord[],
  decision: 'approved' | 'rejected',
  facultyRemarks: string,
  facultyName: string
): {
  updatedLeave: LeaveRequest;
  updatedRecords: AttendanceRecord[];
} {
  const updatedLeave: LeaveRequest = {
    ...leave,
    status: decision,
    reviewedBy: facultyName,
    reviewedAt: new Date().toISOString(),
    facultyRemarks,
  };

  let updatedRecords = [...currentRecords];

  if (decision === 'approved') {
    // Check if an existing record exists for this student and date/course
    const existingIndex = updatedRecords.findIndex(
      r => r.studentId === leave.studentId && r.courseCode === leave.courseCode && r.timestamp.startsWith(leave.date)
    );

    if (existingIndex >= 0) {
      // Update existing record to Excused
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        status: 'Excused',
        verificationMethod: 'FACULTY_EXCUSED',
        confidenceScore: 100,
        tamperHash: generateTamperHash(updatedRecords[existingIndex].tamperHash, {
          updatedStatus: 'Excused',
          approvedBy: facultyName,
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
      // Create a retroactive Excused attendance record
      const previousHash = updatedRecords.length > 0 ? updatedRecords[updatedRecords.length - 1].tamperHash : 'GENESIS_BLOCK_000';
      const newRecord: AttendanceRecord = {
        id: `att-excused-${Date.now()}-${leave.studentId}`,
        studentId: leave.studentId,
        studentName: leave.studentName,
        rollNumber: leave.rollNumber,
        department: leave.department,
        courseCode: leave.courseCode,
        courseName: leave.courseName,
        timestamp: `${leave.date}T09:00:00.000Z`,
        cameraId: 'CAM-MANUAL-EXCUSED',
        cameraName: 'Faculty Portal Approval',
        confidenceScore: 100,
        status: 'Excused',
        verificationMethod: 'FACULTY_EXCUSED',
        tamperHash: generateTamperHash(previousHash, {
          leaveId: leave.id,
          reason: leave.reasonCategory,
          faculty: facultyName,
        }),
      };
      updatedRecords.push(newRecord);
    }
  }

  return {
    updatedLeave,
    updatedRecords,
  };
}

/**
 * Offline Sync Resolution:
 * Merges queued offline items into the main synchronized dataset without duplicates.
 */
export function computeSyncQueueResolution(
  queueItems: SyncQueueItem[],
  existingRecords: AttendanceRecord[]
): {
  syncedRecords: AttendanceRecord[];
  mergedCount: number;
  conflictCount: number;
} {
  const recordMap = new Map<string, AttendanceRecord>();
  for (const rec of existingRecords) {
    recordMap.set(`${rec.studentId}-${rec.courseCode}-${rec.timestamp.slice(0, 10)}`, rec);
  }

  let mergedCount = 0;
  let conflictCount = 0;

  for (const item of queueItems) {
    if (item.type === 'ATTENDANCE_LOG' && item.payload) {
      const rec = item.payload as AttendanceRecord;
      const key = `${rec.studentId}-${rec.courseCode}-${rec.timestamp.slice(0, 10)}`;

      if (recordMap.has(key)) {
        // Conflict resolution: prefer earlier verified timestamp or non-absent status
        const existing = recordMap.get(key)!;
        if (existing.status === 'Absent' && rec.status === 'Present') {
          recordMap.set(key, { ...rec, isOfflineQueued: false, verificationMethod: 'OFFLINE_SYNCED' });
          mergedCount++;
        } else {
          conflictCount++;
        }
      } else {
        recordMap.set(key, { ...rec, isOfflineQueued: false, verificationMethod: 'OFFLINE_SYNCED' });
        mergedCount++;
      }
    }
  }

  return {
    syncedRecords: Array.from(recordMap.values()),
    mergedCount,
    conflictCount,
  };
}

/**
 * Executes emergency perimeter lockdown for a sector triggered by an intruder alert.
 */
export function executePerimeterLockdown(
  sectorId: string,
  sectorName: string,
  triggeredBy: string,
  reason: string
) {
  return {
    isLockdownActive: true,
    sectorId,
    sectorName,
    triggeredBy,
    triggeredAt: new Date().toISOString(),
    reason,
    turnstilesLocked: true,
    securityDispatched: true,
    alertCode: `CODE-RED-${Date.now().toString().slice(-4)}`,
  };
}

/**
 * Lifts/deactivates an active perimeter lockdown.
 */
export function liftPerimeterLockdown(authorizedBy: string) {
  return {
    isLockdownActive: false,
    sectorId: '',
    sectorName: '',
    triggeredBy: authorizedBy,
    triggeredAt: undefined,
    reason: 'Lockdown safely stood down by authorized personnel',
    turnstilesLocked: false,
    securityDispatched: false,
    alertCode: '',
  };
}


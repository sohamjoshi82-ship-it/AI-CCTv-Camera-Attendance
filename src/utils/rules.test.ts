import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAttendanceStats,
  evaluateThresholdWarning,
  matchFaceDescriptor,
  processLeaveApproval,
  computeSyncQueueResolution,
  executePerimeterLockdown,
  liftPerimeterLockdown,
} from './rules';
import { AttendanceRecord, LeaveRequest, SyncQueueItem } from '../types';

test('calculateAttendanceStats aggregates counts and computes correct percentages', () => {
  const mockRecords: AttendanceRecord[] = [
    {
      id: '1',
      studentId: 's1',
      studentName: 'Aarav',
      rollNumber: 'CS01',
      department: 'CS',
      courseCode: 'CS301',
      courseName: 'AI',
      timestamp: '2026-10-25T09:00:00Z',
      cameraId: 'CAM01',
      cameraName: 'Main Gate',
      confidenceScore: 98,
      status: 'Present',
      verificationMethod: 'AI_FACE_RECOGNITION',
      tamperHash: 'hash1',
    },
    {
      id: '2',
      studentId: 's2',
      studentName: 'Priya',
      rollNumber: 'CS02',
      department: 'CS',
      courseCode: 'CS301',
      courseName: 'AI',
      timestamp: '2026-10-25T09:15:00Z',
      cameraId: 'CAM01',
      cameraName: 'Main Gate',
      confidenceScore: 94,
      status: 'Late',
      verificationMethod: 'AI_FACE_RECOGNITION',
      tamperHash: 'hash2',
    },
    {
      id: '3',
      studentId: 's3',
      studentName: 'Rohan',
      rollNumber: 'CS03',
      department: 'CS',
      courseCode: 'CS301',
      courseName: 'AI',
      timestamp: '2026-10-25T09:00:00Z',
      cameraId: 'CAM01',
      cameraName: 'Main Gate',
      confidenceScore: 100,
      status: 'Excused',
      verificationMethod: 'FACULTY_EXCUSED',
      tamperHash: 'hash3',
    },
  ];

  const stats = calculateAttendanceStats(mockRecords, 4);
  assert.equal(stats.totalRegistered, 4);
  assert.equal(stats.present, 1);
  assert.equal(stats.late, 1);
  assert.equal(stats.excused, 1);
  assert.equal(stats.absent, 1); // 4 total - 3 attended = 1 absent
  assert.equal(stats.attendancePercentage, 75); // (3 / 4) * 100 = 75%
  assert.equal(stats.punctualityRate, 50); // 1 present out of 2 present+late = 50%
});

test('evaluateThresholdWarning correctly classifies mandatory academic attendance', () => {
  const good = evaluateThresholdWarning(90);
  assert.equal(good.category, 'good');
  assert.equal(good.isDebarredRisk, false);

  const satisfactory = evaluateThresholdWarning(78);
  assert.equal(satisfactory.category, 'satisfactory');
  assert.equal(satisfactory.isDebarredRisk, false);

  const critical = evaluateThresholdWarning(71.5);
  assert.equal(critical.category, 'critical');
  assert.equal(critical.isDebarredRisk, true);
});

test('matchFaceDescriptor recognizes matching embeddings and flags unknown persons', () => {
  const baseVector = [0.2, 0.5, 0.8, 0.1, 0.4];
  const identicalVector = [0.2, 0.5, 0.8, 0.1, 0.4];
  const slightVariation = [0.22, 0.49, 0.81, 0.09, 0.41];
  const completelyDifferent = [0.9, 0.1, 0.2, 0.8, 0.9];

  const exactMatch = matchFaceDescriptor(identicalVector, baseVector);
  assert.equal(exactMatch.confidence, 100);
  assert.equal(exactMatch.isMatch, true);

  const closeMatch = matchFaceDescriptor(slightVariation, baseVector);
  assert.equal(closeMatch.confidence >= 90, true);
  assert.equal(closeMatch.isMatch, true);

  const mismatch = matchFaceDescriptor(completelyDifferent, baseVector);
  assert.equal(mismatch.confidence < 70, true);
  assert.equal(mismatch.isMatch, false);
});

test('processLeaveApproval changes status to Excused upon approval with audit remarks', () => {
  const leave: LeaveRequest = {
    id: 'leave-1',
    studentId: 's1',
    studentName: 'Aarav Sharma',
    rollNumber: 'CS2023-01',
    department: 'Computer Science',
    courseCode: 'CS301',
    courseName: 'Artificial Intelligence',
    date: '2026-10-24',
    reasonCategory: 'Medical',
    explanation: 'Hospitalized with acute gastroenteritis',
    status: 'pending',
    submittedAt: '2026-10-24T10:00:00Z',
  };

  const initialRecords: AttendanceRecord[] = [
    {
      id: 'att-old',
      studentId: 's1',
      studentName: 'Aarav Sharma',
      rollNumber: 'CS2023-01',
      department: 'Computer Science',
      courseCode: 'CS301',
      courseName: 'Artificial Intelligence',
      timestamp: '2026-10-24T09:00:00Z',
      cameraId: 'CAM01',
      cameraName: 'Gate',
      confidenceScore: 0,
      status: 'Absent',
      verificationMethod: 'AI_FACE_RECOGNITION',
      tamperHash: 'orig-hash',
    },
  ];

  const result = processLeaveApproval(leave, initialRecords, 'approved', 'Medical certificate verified', 'Dr. Meera Rao');

  assert.equal(result.updatedLeave.status, 'approved');
  assert.equal(result.updatedLeave.reviewedBy, 'Dr. Meera Rao');
  assert.equal(result.updatedRecords.length, 1);
  assert.equal(result.updatedRecords[0].status, 'Excused');
  assert.equal(result.updatedRecords[0].verificationMethod, 'FACULTY_EXCUSED');
});

test('computeSyncQueueResolution merges queued records seamlessly without duplicates', () => {
  const queueItems: SyncQueueItem[] = [
    {
      id: 'q1',
      type: 'ATTENDANCE_LOG',
      payload: {
        id: 'rec-remote-1',
        studentId: 's5',
        studentName: 'Tanvi Verma',
        rollNumber: 'CS2023-05',
        department: 'Computer Science',
        courseCode: 'CS301',
        courseName: 'Artificial Intelligence',
        timestamp: '2026-10-25T08:55:00Z',
        cameraId: 'CAM-REMOTE-01',
        cameraName: 'Remote Campus Gate',
        confidenceScore: 96,
        status: 'Present',
        verificationMethod: 'OFFLINE_SYNCED',
        tamperHash: 'remote-hash-1',
      },
      queuedAt: '2026-10-25T08:55:00Z',
      deviceFingerprint: 'dev-tablet-01',
      signature: 'sig123',
      synced: false,
    },
  ];

  const initialRecords: AttendanceRecord[] = [];
  const resolution = computeSyncQueueResolution(queueItems, initialRecords);

  assert.equal(resolution.mergedCount, 1);
  assert.equal(resolution.syncedRecords.length, 1);
  assert.equal(resolution.syncedRecords[0].studentName, 'Tanvi Verma');
  assert.equal(resolution.syncedRecords[0].isOfflineQueued, false);
});

test('executePerimeterLockdown and liftPerimeterLockdown handle lockdown state transitions accurately', () => {
  const lockdown = executePerimeterLockdown('CAM-01', 'Gate 1 - North Campus Arch', 'Chief Inspector Vikram', 'Unidentified intruder breach');
  assert.equal(lockdown.isLockdownActive, true);
  assert.equal(lockdown.sectorId, 'CAM-01');
  assert.equal(lockdown.turnstilesLocked, true);
  assert.equal(lockdown.securityDispatched, true);
  assert.ok(lockdown.alertCode.startsWith('CODE-RED-'));

  const standDown = liftPerimeterLockdown('Dr. Aris Thorne');
  assert.equal(standDown.isLockdownActive, false);
  assert.equal(standDown.turnstilesLocked, false);
  assert.equal(standDown.triggeredBy, 'Dr. Aris Thorne');
});


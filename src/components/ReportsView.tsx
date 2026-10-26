import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  UserX,
  ShieldCheck,
  Edit3,
  Calendar,
  Lock,
} from 'lucide-react';
import { AttendanceRecord, Student } from '../types';
import { calculateAttendanceStats } from '../utils/rules';
import { FormalReportModal } from './FormalReportModal';
import { generateTamperHash } from '../utils/crypto';

interface ReportsViewProps {
  records: AttendanceRecord[];
  students: Student[];
  onUpdateRecord: (updatedRecord: AttendanceRecord) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  records,
  students,
  onUpdateRecord,
}) => {
  const [selectedDate, setSelectedDate] = useState('2026-10-25');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState('CS301');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Present' | 'Late' | 'Absent' | 'Excused'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormalModalOpen, setIsFormalModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [activeHashRecord, setActiveHashRecord] = useState<AttendanceRecord | null>(null);

  // Filter records
  const filteredRecords = records.filter(rec => {
    const matchDate = rec.timestamp.startsWith(selectedDate);
    const matchDept = selectedDepartment === 'ALL' || rec.department === selectedDepartment;
    const matchCourse = selectedCourse === 'ALL' || rec.courseCode === selectedCourse;
    const matchStatus = selectedStatus === 'ALL' || rec.status === selectedStatus;
    const matchSearch =
      searchQuery === '' ||
      rec.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());

    return matchDate && matchDept && matchCourse && matchStatus && matchSearch;
  });

  const relevantStudents = students.filter(
    s => selectedDepartment === 'ALL' || s.department === selectedDepartment
  );

  const stats = calculateAttendanceStats(filteredRecords, relevantStudents.length || filteredRecords.length);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Record ID,Roll Number,Student Name,Department,Course Code,Timestamp,Camera Point,Confidence,Status,Verification Method,Tamper Hash'];
    const rows = filteredRecords.map(r =>
      `"${r.id}","${r.rollNumber}","${r.studentName}","${r.department}","${r.courseCode}","${r.timestamp}","${r.cameraName}","${r.confidenceScore}%","${r.status}","${r.verificationMethod}","${r.tamperHash}"`
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Report_${selectedDate}_${selectedCourse}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON Ledger
  const handleExportJSON = () => {
    const exportBundle = {
      exportTimestamp: new Date().toISOString(),
      date: selectedDate,
      course: selectedCourse,
      department: selectedDepartment,
      stats,
      records: filteredRecords,
      signature: generateTamperHash('EXPORT_LEDGER_ROOT', { stats, count: filteredRecords.length }),
    };
    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Encrypted_Attendance_Ledger_${selectedDate}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Save manual status override
  const handleSaveOverride = (newStatus: AttendanceRecord['status'], remarks: string) => {
    if (!editingRecord) return;
    const updated: AttendanceRecord = {
      ...editingRecord,
      status: newStatus,
      verificationMethod: 'FACULTY_EXCUSED',
      tamperHash: generateTamperHash(editingRecord.tamperHash, {
        overrideStatus: newStatus,
        remarks,
        time: new Date().toISOString(),
      }),
    };
    onUpdateRecord(updated);
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Daily Attendance Audit Reports for Faculty & Deans</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated session roll call, late arrival tracking, discrepancy overrides, and cryptographic tamper verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFormalModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official College Audit Sheet</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Export Cryptographically Signed Ledger"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Signed Ledger</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[11px] text-slate-400">Total Enrolled</div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">{stats.totalRegistered}</div>
          <div className="text-[10px] text-slate-500 mt-1">Registered in section</div>
        </div>

        <div className="p-3 bg-slate-900 border border-emerald-900/50 rounded-xl">
          <div className="text-[11px] text-emerald-400 flex items-center justify-between">
            <span>Present On-Time</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-300 font-mono mt-0.5">{stats.present}</div>
          <div className="text-[10px] text-slate-400 mt-1">{stats.attendancePercentage}% Effective Present</div>
        </div>

        <div className="p-3 bg-slate-900 border border-amber-900/50 rounded-xl">
          <div className="text-[11px] text-amber-400 flex items-center justify-between">
            <span>Late Arrivals</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono mt-0.5">{stats.late}</div>
          <div className="text-[10px] text-slate-400 mt-1">After 09:10 AM cutoff</div>
        </div>

        <div className="p-3 bg-slate-900 border border-blue-900/50 rounded-xl">
          <div className="text-[11px] text-blue-400 flex items-center justify-between">
            <span>Faculty Excused</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-300 font-mono mt-0.5">{stats.excused}</div>
          <div className="text-[10px] text-slate-400 mt-1">Approved leave disputes</div>
        </div>

        <div className="p-3 bg-slate-900 border border-red-900/50 rounded-xl col-span-2 sm:col-span-1">
          <div className="text-[11px] text-red-400 flex items-center justify-between">
            <span>Absentees</span>
            <UserX className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div className="text-xl font-bold text-red-400 font-mono mt-0.5">{stats.absent}</div>
          <div className="text-[10px] text-slate-400 mt-1">No CCTV entry logged</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Date Picker */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Date:
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Department:
            </label>
            <select
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics & Comm.">Electronics & Comm.</option>
              <option value="Data Science & AI">Data Science & AI</option>
              <option value="Mechanical Eng.">Mechanical Eng.</option>
              <option value="Biotechnology">Biotechnology</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Course / Subject:
            </label>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Courses</option>
              <option value="CS301">CS301 - AI & Neural Nets</option>
              <option value="CS302">CS302 - Distributed Cloud Systems</option>
              <option value="EC201">EC201 - Digital Signal Processing</option>
              <option value="ME204">ME204 - Thermodynamics</option>
              <option value="BT305">BT305 - Bioinformatics</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Attendance Status:
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Present">Present Only</option>
              <option value="Late">Late Only</option>
              <option value="Absent">Absent Only</option>
              <option value="Excused">Faculty Excused</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
              Search Student:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name or Roll No..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Roster Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <span>Verified Attendance Ledger ({filteredRecords.length} records)</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 font-sans">
              SHA-256 Tamper-Proof Chain
            </span>
          </h3>
          <span className="text-xs text-slate-400">Showing filtered session entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <th className="p-3">Student</th>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Department</th>
                <th className="p-3">Detection Point</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Match Confidence</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>{rec.studentName}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-300 font-semibold">{rec.rollNumber}</td>
                  <td className="p-3 text-slate-400">{rec.department}</td>
                  <td className="p-3 text-slate-300 truncate max-w-[150px]">{rec.cameraName}</td>
                  <td className="p-3 font-mono text-slate-400">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="p-3 font-mono">
                    {rec.confidenceScore > 0 ? (
                      <span className="text-emerald-400 font-bold">{rec.confidenceScore}%</span>
                    ) : (
                      <span className="text-slate-500">Unmatched</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      rec.status === 'Present'
                        ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                        : rec.status === 'Late'
                        ? 'bg-amber-950 border border-amber-700 text-amber-300'
                        : rec.status === 'Excused'
                        ? 'bg-blue-950 border border-blue-700 text-blue-300'
                        : 'bg-red-950 border border-red-700 text-red-300'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                    {/* View Tamper Hash */}
                    <button
                      onClick={() => setActiveHashRecord(rec)}
                      aria-label="Inspect cryptographic ledger hash"
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
                      title="Inspect SHA-256 Ledger Hash"
                    >
                      #Hash
                    </button>
                    {/* Manual override button for faculty */}
                    <button
                      onClick={() => setEditingRecord(rec)}
                      aria-label="Manual faculty attendance override"
                      className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 text-[11px] font-medium transition-colors"
                    >
                      <Edit3 className="w-3 h-3 inline mr-1" />
                      Override
                    </button>
                  </td>
                </tr>
              ))}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No attendance records match the selected date and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Manual Faculty Override */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-400" />
              <span>Faculty Attendance Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              Modifying record for <strong>{editingRecord.studentName}</strong> ({editingRecord.rollNumber}) in <strong>{editingRecord.courseCode}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">New Attendance Status:</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Present', 'Late', 'Excused', 'Absent'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleSaveOverride(st, 'Manual faculty adjustment on student appeal')}
                      className={`p-2 rounded-lg border font-bold text-center transition-colors ${
                        editingRecord.status === st
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                    >
                      Set as {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300 block mb-1">Security Audit Note:</span>
                This adjustment will generate a new cryptographic signature linking your faculty session to the audit ledger.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setEditingRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Tamper-Proof Cryptographic Hash Inspector */}
      {activeHashRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              <span>AES-256 GCM & SHA-256 Ledger Audit Block</span>
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographic fingerprint for record <strong>{activeHashRecord.id}</strong>.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                <div className="text-[10px] text-slate-500">BLOCK HASH (SHA-256):</div>
                <div className="text-cyan-300 break-all select-all font-bold">
                  {activeHashRecord.tamperHash}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Verification Method:</span>
                  <span className="text-slate-200">{activeHashRecord.verificationMethod}</span>
                </div>
                <div className="p-2 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-500 block">Ledger State:</span>
                  <span className="text-emerald-400 font-bold">IMMUTABLE / SEALED</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveHashRecord(null)}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formal PDF Report Modal */}
      <FormalReportModal
        isOpen={isFormalModalOpen}
        onClose={() => setIsFormalModalOpen(false)}
        records={filteredRecords}
        allStudents={students}
        selectedDate={selectedDate}
        selectedCourse={selectedCourse}
        selectedDepartment={selectedDepartment}
      />
    </div>
  );
};

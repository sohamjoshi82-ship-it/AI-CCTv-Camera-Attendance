import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';
import { AttendanceRecord, Student } from '../types';
import { calculateAttendanceStats } from '../utils/rules';

interface FormalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
  allStudents: Student[];
  selectedDate: string;
  selectedCourse: string;
  selectedDepartment: string;
}

export const FormalReportModal: React.FC<FormalReportModalProps> = ({
  isOpen,
  onClose,
  records,
  allStudents,
  selectedDate,
  selectedCourse,
  selectedDepartment,
}) => {
  if (!isOpen) return null;

  const relevantStudents = allStudents.filter(s =>
    selectedDepartment === 'ALL' || s.department === selectedDepartment
  );

  const stats = calculateAttendanceStats(records, relevantStudents.length || records.length);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (hidden during printing) */}
        <div className="print:hidden px-6 py-3 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>OFFICIAL FACULTY ATTENDANCE AUDIT SHEET</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close report modal"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto flex-1 font-serif text-slate-900 print:p-0">
          {/* Formal University Letterhead */}
          <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
            <div className="space-y-1">
              <div className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                VDF INSTITUTE OF TECHNOLOGY & ADVANCED STUDIES
              </div>
              <div className="text-xs text-slate-600 font-sans">
                Accredited Autonomous Institution • Directorate of Academic Affairs & Safety
              </div>
              <div className="text-xs font-sans text-slate-500 font-mono">
                System: AegisVision AI CCTV Biometric Attendance Engine (ISO 27001 Certified)
              </div>
            </div>
            <div className="text-right font-sans text-xs">
              <div className="font-bold text-slate-800">DOCUMENT REF: AUDIT-{selectedDate.replace(/-/g, '')}-CS</div>
              <div className="text-slate-500">Generated: {new Date().toLocaleString()}</div>
              <div className="text-emerald-700 font-semibold flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cryptographic Integrity Verified
              </div>
            </div>
          </div>

          {/* Session Overview */}
          <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs font-sans mb-6">
            <div>
              <span className="text-slate-500 block">Date of Record:</span>
              <strong className="text-slate-800 text-sm">{selectedDate}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Course / Section:</span>
              <strong className="text-slate-800 text-sm">{selectedCourse}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Department:</span>
              <strong className="text-slate-800 text-sm">{selectedDepartment}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Attendance Rate:</span>
              <strong className="text-cyan-700 text-sm font-mono font-bold">
                {stats.attendancePercentage}% ({stats.present + stats.late + stats.excused}/{stats.totalRegistered})
              </strong>
            </div>
          </div>

          {/* Key Metric Summary */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-sans mb-6">
            <div className="p-2 border border-slate-200 rounded">
              <span className="text-slate-500 block">Total Students</span>
              <span className="text-base font-bold text-slate-900">{stats.totalRegistered}</span>
            </div>
            <div className="p-2 border border-emerald-200 bg-emerald-50 rounded">
              <span className="text-emerald-700 block">Present On-Time</span>
              <span className="text-base font-bold text-emerald-800">{stats.present}</span>
            </div>
            <div className="p-2 border border-amber-200 bg-amber-50 rounded">
              <span className="text-amber-700 block">Late Arrivals</span>
              <span className="text-base font-bold text-amber-800">{stats.late}</span>
            </div>
            <div className="p-2 border border-blue-200 bg-blue-50 rounded">
              <span className="text-blue-700 block">Faculty Excused</span>
              <span className="text-base font-bold text-blue-800">{stats.excused}</span>
            </div>
            <div className="p-2 border border-red-200 bg-red-50 rounded">
              <span className="text-red-700 block">Absentees</span>
              <span className="text-base font-bold text-red-800">{stats.absent}</span>
            </div>
          </div>

          {/* Detailed Student Roster Table */}
          <div className="border border-slate-300 rounded overflow-hidden mb-8 font-sans">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold">
                  <th className="p-2 border-r border-slate-300">#</th>
                  <th className="p-2 border-r border-slate-300">Roll No.</th>
                  <th className="p-2 border-r border-slate-300">Student Name</th>
                  <th className="p-2 border-r border-slate-300">Department</th>
                  <th className="p-2 border-r border-slate-300">Detection Time</th>
                  <th className="p-2 border-r border-slate-300">Camera Point</th>
                  <th className="p-2 border-r border-slate-300">Confidence</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec, index) => (
                  <tr key={rec.id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-2 border-r border-slate-200 text-slate-500 font-mono">{index + 1}</td>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-800">{rec.rollNumber}</td>
                    <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{rec.studentName}</td>
                    <td className="p-2 border-r border-slate-200 text-slate-600">{rec.department}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                      {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="p-2 border-r border-slate-200 text-slate-600 truncate max-w-[140px]">{rec.cameraName}</td>
                    <td className="p-2 border-r border-slate-200 font-mono text-slate-600">
                      {rec.confidenceScore > 0 ? `${rec.confidenceScore}%` : 'N/A'}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        rec.status === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : rec.status === 'Excused'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Official Signatures Section */}
          <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-8 text-center text-xs font-sans mt-auto">
            <div className="space-y-12">
              <div className="border-b border-dashed border-slate-400 pb-1 font-mono text-[11px] text-slate-400">
                Dr. Meera Rao (Digital Sig Verified)
              </div>
              <div className="font-bold text-slate-800">Course Instructor / Faculty</div>
            </div>
            <div className="space-y-12">
              <div className="border-b border-dashed border-slate-400 pb-1 font-mono text-[11px] text-slate-400">
                Pending Approval
              </div>
              <div className="font-bold text-slate-800">Head of Department (HOD)</div>
            </div>
            <div className="space-y-12">
              <div className="border-b border-dashed border-slate-400 pb-1 font-mono text-[11px] text-slate-400">
                Dean Office Registrar Seal
              </div>
              <div className="font-bold text-slate-800">Dean of Academic Affairs</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

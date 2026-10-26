import React, { useState } from 'react';
import {
  CheckSquare,
  FileCheck,
  FileX,
  Clock,
  Paperclip,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  PlusCircle,
  Eye,
  FileText,
  MessageSquare,
  User,
} from 'lucide-react';
import { LeaveRequest, LeaveReasonCategory, Student, AttendanceRecord, UserProfile } from '../types';
import { processLeaveApproval } from '../utils/rules';
import { playSuccessChime } from '../utils/audio';

interface ApprovalWorkflowProps {
  leaveRequests: LeaveRequest[];
  attendanceRecords: AttendanceRecord[];
  students: Student[];
  currentUser: UserProfile;
  onUpdateLeaveRequests: (updated: LeaveRequest[]) => void;
  onUpdateAttendanceRecords: (updated: AttendanceRecord[]) => void;
  isOfflineMode: boolean;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  leaveRequests,
  attendanceRecords,
  students,
  currentUser,
  onUpdateLeaveRequests,
  onUpdateAttendanceRecords,
  isOfflineMode,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'history' | 'apply'>('pending');
  const [previewDoc, setPreviewDoc] = useState<string | null>(null);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [facultyRemarkInput, setFacultyRemarkInput] = useState<string>('');

  // Student new application form state
  const [formData, setFormData] = useState({
    courseCode: 'CS301',
    courseName: 'Artificial Intelligence & Neural Nets',
    date: '2026-10-25',
    reasonCategory: 'Medical' as LeaveReasonCategory,
    explanation: '',
    attachedDocumentName: 'Medical_Certificate_VDF_Clinic.pdf',
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const resolvedRequests = leaveRequests.filter(r => r.status !== 'pending');

  // Handle student submit
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.explanation.trim()) return;

    // Use current student or fallback to Aarav
    const applicantStudent = students.find(s => s.id === currentUser.studentId) || students[0];

    const newRequest: LeaveRequest = {
      id: `leave-req-${Date.now()}`,
      studentId: applicantStudent.id,
      studentName: applicantStudent.name,
      rollNumber: applicantStudent.rollNumber,
      department: applicantStudent.department,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      date: formData.date,
      reasonCategory: formData.reasonCategory,
      explanation: formData.explanation,
      attachedDocumentName: formData.attachedDocumentName,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    onUpdateLeaveRequests([newRequest, ...leaveRequests]);
    setSubmitSuccess(true);
    setFormData({
      courseCode: 'CS301',
      courseName: 'Artificial Intelligence & Neural Nets',
      date: '2026-10-25',
      reasonCategory: 'Medical',
      explanation: '',
      attachedDocumentName: 'Medical_Certificate_VDF_Clinic.pdf',
    });

    playSuccessChime();
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveTab('pending');
    }, 1500);
  };

  // Faculty Approve
  const handleApprove = (request: LeaveRequest) => {
    const facultyName = currentUser.name;
    const result = processLeaveApproval(
      request,
      attendanceRecords,
      'approved',
      'Verified with supporting documentary evidence. Attendance granted.',
      facultyName
    );

    const updatedRequests = leaveRequests.map(r => (r.id === request.id ? result.updatedLeave : r));
    onUpdateLeaveRequests(updatedRequests);
    onUpdateAttendanceRecords(result.updatedRecords);
    playSuccessChime();
  };

  // Faculty Reject
  const handleConfirmReject = (request: LeaveRequest) => {
    const facultyName = currentUser.name;
    const result = processLeaveApproval(
      request,
      attendanceRecords,
      'rejected',
      facultyRemarkInput || 'Insufficient documentary justification provided.',
      facultyName
    );

    const updatedRequests = leaveRequests.map(r => (r.id === request.id ? result.updatedLeave : r));
    onUpdateLeaveRequests(updatedRequests);
    setRejectingRequestId(null);
    setFacultyRemarkInput('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <span>Attendance Exemption & Leave Approval Workflow</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Student medical/event absence requests, supporting documentation audit, and faculty retroactive attendance granting.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-800 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'pending' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Faculty Review</span>
            <span className="px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 text-[10px] font-mono">
              {pendingRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'history' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Approval History ({resolvedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'apply' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply For Attendance</span>
          </button>
        </div>
      </div>

      {/* Tab Content: Apply for Attendance (Student Form) */}
      {activeTab === 'apply' && (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <span>Submit Attendance Exemption Application</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Apply for attendance adjustment if absent due to medical treatment, university sports, conferences, or emergency.
            </p>
          </div>

          {submitSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-lg text-emerald-200 text-xs flex items-center gap-2 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Your attendance exemption request has been securely submitted to course faculty for review!</span>
            </div>
          )}

          <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
            {/* Course & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Course / Subject:</label>
                <select
                  value={formData.courseCode}
                  onChange={e => {
                    const code = e.target.value;
                    let name = 'Artificial Intelligence & Neural Nets';
                    if (code === 'CS302') name = 'Distributed Cloud Systems';
                    if (code === 'EC201') name = 'Digital Signal Processing';
                    if (code === 'ME204') name = 'Thermodynamics';
                    if (code === 'BT305') name = 'Bioinformatics';
                    setFormData({ ...formData, courseCode: code, courseName: name });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="CS301">CS301 - AI & Neural Nets</option>
                  <option value="CS302">CS302 - Distributed Cloud Systems</option>
                  <option value="EC201">EC201 - Digital Signal Processing</option>
                  <option value="ME204">ME204 - Thermodynamics</option>
                  <option value="BT305">BT305 - Bioinformatics</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Date of Missed Class:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Reason Category */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Reason Category:</label>
              <select
                value={formData.reasonCategory}
                onChange={e => setFormData({ ...formData, reasonCategory: e.target.value as LeaveReasonCategory })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Medical">Medical (Illness / Hospitalization)</option>
                <option value="Sports / Competition">University Sports / Tournament Competition</option>
                <option value="Academic Conference">Academic Conference / Hackathon / Paper Presentation</option>
                <option value="Official College Duty">Official College Duty (Placement / Cultural Committee)</option>
                <option value="Family Emergency">Family Emergency</option>
              </select>
            </div>

            {/* Explanation */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Detailed Reason & Description:</label>
              <textarea
                rows={3}
                required
                placeholder="State the detailed circumstances of absence, hospital visit, or competition schedule..."
                value={formData.explanation}
                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Simulated Attachment Upload */}
            <div>
              <label className="text-slate-300 block mb-1 font-semibold flex items-center justify-between">
                <span>Supporting Document / Certificate:</span>
                <span className="text-[10px] text-cyan-400 font-mono">Simulated Upload</span>
              </label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-300">
                <Paperclip className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs flex-1 truncate">{formData.attachedDocumentName}</span>
                <span className="text-[10px] text-emerald-400 font-bold">READY (420 KB)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit Application For Faculty Review</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab Content: Pending Review (Faculty Queue) */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Review queue for Professor <strong>{currentUser.name}</strong> ({pendingRequests.length} pending requests)
            </span>
            <span>Approval automatically updates student attendance percentage & marks Excused</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingRequests.map(req => {
              const student = students.find(s => s.id === req.studentId);
              return (
                <div
                  key={req.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 hover:border-cyan-500/50 transition-colors"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {student ? (
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full object-cover border border-cyan-500/50"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-cyan-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                          <span>{req.studentName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                            {student?.attendancePercentage || 85}% Att.
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {req.rollNumber} • {req.department}
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-amber-950 border border-amber-600 text-amber-300">
                      Pending
                    </span>
                  </div>

                  {/* Course & Date Info */}
                  <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Course:</span>
                      <span className="font-semibold text-slate-200 truncate block">{req.courseCode} - {req.courseName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Date of Absence:</span>
                      <span className="font-mono text-cyan-400 font-bold block">{req.date}</span>
                    </div>
                  </div>

                  {/* Category & Reason */}
                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-mono text-slate-400">Reason:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                        {req.reasonCategory}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                      {req.explanation}
                    </p>
                  </div>

                  {/* Attached Document Button */}
                  {req.attachedDocumentName && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-slate-300 font-mono text-[11px] truncate">
                          {req.attachedDocumentName}
                        </span>
                      </div>
                      <button
                        onClick={() => setPreviewDoc(req.attachedDocumentName || null)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View Doc
                      </button>
                    </div>
                  )}

                  {/* Action Buttons: Approve or Reject */}
                  {rejectingRequestId === req.id ? (
                    <div className="p-3 bg-red-950/30 border border-red-800 rounded-lg space-y-2 text-xs">
                      <label className="text-red-300 font-semibold block">Faculty Rejection Justification:</label>
                      <input
                        type="text"
                        placeholder="Reason for declining request..."
                        value={facultyRemarkInput}
                        onChange={e => setFacultyRemarkInput(e.target.value)}
                        className="w-full bg-slate-950 border border-red-700 rounded p-1.5 text-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setRejectingRequestId(null)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleConfirmReject(req)}
                          className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(req)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve Attendance</span>
                      </button>
                      <button
                        onClick={() => setRejectingRequestId(req.id)}
                        className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 hover:border-red-700 border border-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {pendingRequests.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-xs">
                All submitted student leave and attendance exemption applications have been reviewed!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Approval History */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Missed Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Decision</th>
                  <th className="p-3">Reviewed By</th>
                  <th className="p-3">Faculty Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {resolvedRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-850/50">
                    <td className="p-3 font-semibold text-slate-100">
                      <div>{req.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{req.rollNumber}</div>
                    </td>
                    <td className="p-3 text-slate-300">{req.courseCode}</td>
                    <td className="p-3 font-mono text-slate-400">{req.date}</td>
                    <td className="p-3 text-slate-300">{req.reasonCategory}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        req.status === 'approved'
                          ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                          : 'bg-red-950 border border-red-700 text-red-300'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-300">{req.reviewedBy || 'Faculty'}</td>
                    <td className="p-3 text-slate-400 italic max-w-xs truncate">
                      {req.facultyRemarks || 'Approved'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Simulated Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white text-slate-900 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm uppercase font-mono text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>Document Verification: {previewDoc}</span>
              </h4>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-700 uppercase">Metro City Multispeciality Hospital</div>
              <div className="text-slate-600">Patient: Verified Student Identity</div>
              <div className="text-slate-600">Diagnosis: Acute gastroenteritis & IV rehydration (Admission 24 hrs)</div>
              <div className="text-emerald-700 font-bold mt-2">Doctor Signature & Stamp: VERIFIED</div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

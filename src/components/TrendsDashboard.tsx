import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertOctagon,
  Send,
  Users,
  Award,
  Clock,
  Calendar,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Student, AttendanceRecord } from '../types';
import { evaluateThresholdWarning } from '../utils/rules';

interface TrendsDashboardProps {
  students: Student[];
  records: AttendanceRecord[];
}

export const TrendsDashboard: React.FC<TrendsDashboardProps> = ({
  students,
  records,
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [warningSentIds, setWarningSentIds] = useState<string[]>([]);
  const [activeDeptFilter, setActiveDeptFilter] = useState<string>('ALL');

  // Trend data across 7 days
  const sevenDayTrend = [
    { day: 'Mon 10/19', percentage: 91.2, present: 48, absent: 4 },
    { day: 'Tue 10/20', percentage: 89.5, present: 46, absent: 6 },
    { day: 'Wed 10/21', percentage: 94.0, present: 49, absent: 3 },
    { day: 'Thu 10/22', percentage: 88.0, present: 45, absent: 7 },
    { day: 'Fri 10/23', percentage: 86.4, present: 44, absent: 8 },
    { day: 'Sat 10/24', percentage: 84.0, present: 42, absent: 10 },
    { day: 'Sun 10/25', percentage: 90.8, present: 47, absent: 5 },
  ];

  // Hourly arrival peak times (e.g. CCTV gate turnstile scans)
  const hourlyArrivals = [
    { time: '08:00 AM', count: 14, percent: 18 },
    { time: '08:30 AM', count: 42, percent: 56 },
    { time: '09:00 AM', count: 78, percent: 100 }, // Peak arrival rush
    { time: '09:15 AM (Cutoff)', count: 28, percent: 36 },
    { time: '09:30 AM (Late)', count: 9, percent: 12 },
    { time: '10:00 AM', count: 3, percent: 4 },
  ];

  // Department averages
  const departments = [
    { name: 'Computer Science', rate: 88.5, studentsCount: 420 },
    { name: 'Biotechnology', rate: 96.0, studentsCount: 180 },
    { name: 'Electronics & Comm.', rate: 91.0, studentsCount: 310 },
    { name: 'Mechanical Eng.', rate: 82.0, studentsCount: 290 },
    { name: 'Data Science & AI', rate: 73.1, studentsCount: 210 },
  ];

  // Filter students on the critical watchlist (< 75% attendance)
  const criticalWatchlist = students.filter(s => {
    const warning = evaluateThresholdWarning(s.attendancePercentage);
    return warning.isDebarredRisk;
  });

  const handleSendWarning = (studentId: string) => {
    setWarningSentIds(prev => [...prev, studentId]);
  };

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>Attendance Trends & Longitudinal Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical campus turnstile throughput, peak rush hours, department benchmarks, and student debarment watchlists.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700 text-xs">
            <button
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                timeframe === '7d' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                timeframe === '30d' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Academic Month (30d)
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 7-Day Trend Chart & Peak Arrival Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Trend Card (Col 8) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Campus Turnstile Attendance Percentage Trend</span>
              </h3>
              <span className="text-[11px] text-slate-400">Aggregated across all 4 CCTV perimeter nodes</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">7-Day Mean: </span>
              <strong className="text-cyan-400 font-mono text-sm font-bold">89.1%</strong>
            </div>
          </div>

          {/* Bar / Column Visualizer */}
          <div className="pt-6 pb-2">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 px-2">
              {sevenDayTrend.map(item => {
                const heightPercent = `${Math.max(15, item.percentage - 40) * 1.6}%`;
                const isGood = item.percentage >= 88;
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-mono text-cyan-300 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      {item.percentage}%
                    </span>
                    <div className="w-full bg-slate-800 rounded-t-lg h-36 flex items-end p-1 relative">
                      <div
                        style={{ height: `${(item.percentage / 100) * 100}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          isGood
                            ? 'bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-500 group-hover:to-cyan-300'
                            : 'bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300'
                        }`}
                      ></div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 truncate max-w-full text-center">
                      {item.day.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom legend */}
          <div className="flex items-center justify-between text-[11px] pt-3 border-t border-slate-800 text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400"></span> Standard Attendance (&gt;88%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Dip / High Excused Leaves
              </span>
            </div>
            <span>Mandatory Academic Benchmark: 75%</span>
          </div>
        </div>

        {/* Peak Arrival Time Distribution (Col 4) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Gate Entry Rush Hours</span>
            </h3>
            <span className="text-[11px] text-slate-400">Peak student arrival timestamp density</span>
          </div>

          <div className="space-y-3 pt-2">
            {hourlyArrivals.map(slot => (
              <div key={slot.time} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono text-slate-300">{slot.time}</span>
                  <span className="font-mono text-cyan-400 font-bold">{slot.count} arrivals</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${slot.percent}%` }}
                    className={`h-full rounded-full ${
                      slot.time.includes('Peak') || slot.percent > 70
                        ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : slot.time.includes('Late')
                        ? 'bg-amber-400'
                        : 'bg-cyan-600'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-slate-200 block mb-0.5">Surveillance Optimization:</strong>
            Turnstiles experience maximum queue load between 08:45 AM - 09:05 AM. Dual-angle facial cameras engaged.
          </div>
        </div>
      </div>

      {/* Row 2: Department Performance & Critical Debarment Watchlist (< 75%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Benchmark Card (Col 6) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Department Attendance Leaderboard</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono font-bold">Top: Biotech (96.0%)</span>
          </div>

          <div className="space-y-3 pt-2">
            {departments.map(dept => (
              <div key={dept.name} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{dept.name}</span>
                  <span className={`font-mono font-bold ${dept.rate >= 85 ? 'text-emerald-400' : dept.rate >= 75 ? 'text-amber-400' : 'text-red-400'}`}>
                    {dept.rate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${dept.rate}%` }}
                    className={`h-full rounded-full ${
                      dept.rate >= 85 ? 'bg-emerald-400' : dept.rate >= 75 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                  ></div>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                  <span>Enrolled: {dept.studentsCount} Students</span>
                  <span>{dept.rate < 75 ? '⚠️ High Debarment Risk' : 'Standing: Satisfactory'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Watchlist: Students with Attendance < 75% (Col 6) */}
        <div className="lg:col-span-6 bg-slate-900 border border-red-900/60 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
            <div>
              <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Exam Debarment Risk Watchlist (&lt; 75% Mandate)</span>
              </h3>
              <span className="text-[11px] text-red-200/70">
                Students below statutory minimum required to sit for semester examinations
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-950 border border-red-600 text-red-300 font-bold">
              {criticalWatchlist.length} AT RISK
            </span>
          </div>

          <div className="space-y-3">
            {criticalWatchlist.map(student => {
              const hasSentNotice = warningSentIds.includes(student.id);
              return (
                <div
                  key={student.id}
                  className="p-3 rounded-xl bg-red-950/20 border border-red-800/60 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-red-500/50"
                    />
                    <div>
                      <div className="font-bold text-slate-100 text-xs flex items-center gap-2">
                        <span>{student.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-950 border border-red-600 text-red-300">
                          {student.attendancePercentage}%
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {student.rollNumber} • {student.department}
                      </div>
                      <div className="text-[10px] text-red-400 mt-0.5">
                        Attended {student.attendedClasses} / {student.totalClasses} classes (Shortfall: {Math.ceil(student.totalClasses * 0.75 - student.attendedClasses)} classes)
                      </div>
                    </div>
                  </div>

                  <div>
                    {hasSentNotice ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2.5 py-1 rounded bg-emerald-950/70 border border-emerald-700">
                        <CheckCircle className="w-3.5 h-3.5" /> Notice Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendWarning(student.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Notice</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {criticalWatchlist.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">
                All enrolled students currently meet the 75% attendance threshold.
              </div>
            )}
          </div>

          <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Students on the debarment watchlist can submit medical exemption slips under the <strong>Attendance Approvals</strong> portal.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

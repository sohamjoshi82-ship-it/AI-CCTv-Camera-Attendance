import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Grid,
  Video,
  Eye,
  Crosshair,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { CameraFeed, Student, AttendanceRecord, IntruderAlert } from '../types';
import { playSuccessChime, playIntruderAlarm } from '../utils/audio';
import { generateTamperHash } from '../utils/crypto';

interface CCTVMonitorProps {
  cameras: CameraFeed[];
  students: Student[];
  onAttendanceMarked: (record: AttendanceRecord) => void;
  onIntruderDetected: (alert: IntruderAlert) => void;
  isOfflineMode: boolean;
  isSectorLocked?: boolean;
}

interface DetectedEntity {
  id: string;
  name: string;
  rollNumber?: string;
  department?: string;
  confidence: number;
  box: { x: number; y: number; width: number; height: number };
  isUnknown: boolean;
  liveness: 'VERIFIED' | 'ANALYZING' | 'SPOOF_RISK';
  matchedStudent?: Student;
}

export const CCTVMonitor: React.FC<CCTVMonitorProps> = ({
  cameras,
  students,
  onAttendanceMarked,
  onIntruderDetected,
  isOfflineMode,
  isSectorLocked = false,
}) => {
  const [selectedCamId, setSelectedCamId] = useState<string>(cameras[0].id);
  const [isQuadView, setIsQuadView] = useState<boolean>(false);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [recentDetections, setRecentDetections] = useState<DetectedEntity[]>([]);
  const [lastMarkedToast, setLastMarkedToast] = useState<{ name: string; course: string; time: string; status: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeCamera = cameras.find(c => c.id === selectedCamId) || cameras[0];

  // Set default simulated detected faces on mount
  useEffect(() => {
    // Initial face detection on selected camera
    const aarav = students.find(s => s.name.includes('Aarav')) || students[0];
    setRecentDetections([
      {
        id: aarav.id,
        name: aarav.name,
        rollNumber: aarav.rollNumber,
        department: aarav.department,
        confidence: 98.4,
        box: { x: 38, y: 26, width: 24, height: 42 },
        isUnknown: false,
        liveness: 'VERIFIED',
        matchedStudent: aarav,
      },
    ]);
  }, [students]);

  // Handle real webcam start/stop
  const toggleWebcam = async () => {
    if (isWebcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsWebcamActive(false);
      setWebcamError(null);
    } else {
      try {
        setWebcamError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsWebcamActive(true);
      } catch (err: any) {
        console.error('Camera access error:', err);
        setWebcamError('Unable to access device webcam. Please allow camera permissions or test with simulated camera feeds.');
        setIsWebcamActive(false);
      }
    }
  };

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Action: Trigger detection of a specific student
  const triggerStudentRecognition = (student: Student) => {
    const isLate = Math.random() > 0.75;
    const confidence = Math.round((95 + Math.random() * 4.9) * 10) / 10;
    const now = new Date();

    const entity: DetectedEntity = {
      id: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      confidence,
      box: {
        x: Math.floor(25 + Math.random() * 40),
        y: Math.floor(20 + Math.random() * 30),
        width: 22,
        height: 40,
      },
      isUnknown: false,
      liveness: 'VERIFIED',
      matchedStudent: student,
    };

    setRecentDetections([entity]);

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      department: student.department,
      courseCode: 'CS301',
      courseName: 'Artificial Intelligence & Neural Nets',
      timestamp: now.toISOString(),
      cameraId: activeCamera.id,
      cameraName: activeCamera.name,
      confidenceScore: confidence,
      status: isLate ? 'Late' : 'Present',
      verificationMethod: isOfflineMode ? 'OFFLINE_SYNCED' : 'AI_FACE_RECOGNITION',
      tamperHash: generateTamperHash('HEAD_BLOCK_LATEST', {
        studentId: student.id,
        confidence,
        camera: activeCamera.id,
        timestamp: now.toISOString(),
      }),
      isOfflineQueued: isOfflineMode,
    };

    onAttendanceMarked(newRecord);

    setLastMarkedToast({
      name: student.name,
      course: 'CS301 (AI & Neural Nets)',
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      status: isLate ? 'Marked Late' : 'Marked Present',
    });

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Action: Trigger unknown intruder detection
  const triggerIntruderDetection = () => {
    const now = new Date();
    const entity: DetectedEntity = {
      id: `unknown-${Date.now()}`,
      name: 'UNKNOWN SUBJECT',
      confidence: 96.2, // 96.2% confidence unmapped
      box: { x: 42, y: 22, width: 26, height: 46 },
      isUnknown: true,
      liveness: 'ANALYZING',
    };

    setRecentDetections([entity]);

    const newAlert: IntruderAlert = {
      id: `alert-int-${Date.now()}`,
      timestamp: now.toISOString(),
      cameraId: activeCamera.id,
      cameraName: activeCamera.name,
      snapshotUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      confidence: 96.2,
      status: 'active',
      notes: `Unrecognized individual detected via real-time CCTV scan at ${activeCamera.name}. Not registered in enrolled biometric student database.`,
    };

    onIntruderDetected(newAlert);

    if (soundEnabled) {
      playIntruderAlarm();
    }
  };

  // Action: Simulate Crowd Entry (3 faces detected at once)
  const triggerCrowdEntry = () => {
    const selectedStudents = students.slice(0, 3);
    const entities: DetectedEntity[] = selectedStudents.map((st, idx) => ({
      id: st.id,
      name: st.name,
      rollNumber: st.rollNumber,
      department: st.department,
      confidence: Math.round((94 + Math.random() * 5.5) * 10) / 10,
      box: {
        x: 10 + idx * 30,
        y: 25,
        width: 22,
        height: 40,
      },
      isUnknown: false,
      liveness: 'VERIFIED',
      matchedStudent: st,
    }));

    setRecentDetections(entities);

    selectedStudents.forEach((student, index) => {
      setTimeout(() => {
        const now = new Date();
        const record: AttendanceRecord = {
          id: `att-crowd-${Date.now()}-${student.id}`,
          studentId: student.id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          department: student.department,
          courseCode: 'CS301',
          courseName: 'Artificial Intelligence & Neural Nets',
          timestamp: now.toISOString(),
          cameraId: activeCamera.id,
          cameraName: activeCamera.name,
          confidenceScore: 98.2,
          status: 'Present',
          verificationMethod: isOfflineMode ? 'OFFLINE_SYNCED' : 'AI_FACE_RECOGNITION',
          tamperHash: generateTamperHash('CROWD_BLOCK', { id: student.id, camera: activeCamera.id }),
          isOfflineQueued: isOfflineMode,
        };
        onAttendanceMarked(record);
      }, index * 200);
    });

    if (soundEnabled) {
      playSuccessChime();
    }
  };

  // Continuous auto-scan cycle (simulates turnstile flow)
  useEffect(() => {
    if (!isAutoScanning) return;
    const interval = setInterval(() => {
      // Pick random student or occasionally intruder
      const dice = Math.random();
      if (dice > 0.88) {
        // Intruder
        triggerIntruderDetection();
      } else {
        const randomStudent = students[Math.floor(Math.random() * students.length)];
        triggerStudentRecognition(randomStudent);
      }
    }, 12000); // Trigger every 12 seconds
    return () => clearInterval(interval);
  }, [isAutoScanning, students, activeCamera, soundEnabled, isOfflineMode]);

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span>AI CCTV Live Surveillance & Biometric Engine</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-600 text-emerald-400 font-mono animate-pulse">
              ● LIVE STREAMING
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-angle face detection, liveness verification, instant attendance logging & perimeter intruder detection.
          </p>
        </div>

        {/* Action button toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quad / Single View */}
          <button
            onClick={() => setIsQuadView(!isQuadView)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isQuadView
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{isQuadView ? 'Single Camera View' : 'Quad Grid 2x2'}</span>
          </button>

          {/* Real Webcam Trigger */}
          <button
            onClick={toggleWebcam}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isWebcamActive
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isWebcamActive ? 'Stop Real Webcam' : 'Use Device Webcam'}</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-colors"
            title={soundEnabled ? 'Mute AI Recognition Chimes' : 'Enable AI Recognition Chimes'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Auto scan toggle */}
          <button
            onClick={() => setIsAutoScanning(!isAutoScanning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isAutoScanning
                ? 'bg-purple-950/60 border-purple-700 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {isAutoScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>Auto Turnstile Simulator: {isAutoScanning ? 'ON' : 'PAUSED'}</span>
          </button>
        </div>
      </div>

      {/* Webcam error banner if any */}
      {webcamError && (
        <div className="p-3 bg-amber-950/70 border border-amber-600 rounded-lg text-amber-200 text-xs flex items-center justify-between">
          <span>{webcamError}</span>
          <button onClick={() => setWebcamError(null)} className="underline text-amber-100 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Main Video Viewport or Quad View */}
      {!isQuadView ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Large Main Camera Viewport (Col 1-3) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl group">
              {/* If Webcam active, render video tag, else simulated CCTV stream */}
              {isWebcamActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={activeCamera.coverImage}
                    alt={activeCamera.name}
                    className="w-full h-full object-cover opacity-85 filter contrast-110 brightness-90"
                  />
                  {/* CCTV scan line effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] pointer-events-none opacity-60"></div>
                </div>
              )}

              {/* High-Tech CCTV OSD (On-Screen Display) Overlay */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none text-slate-200 drop-shadow-md">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/60">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  <span className="font-bold text-red-400">REC [4K]</span>
                  <span>{activeCamera.id}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-cyan-300 truncate max-w-[200px]">{activeCamera.name}</span>
                </div>

                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded border border-slate-700/60">
                  <span className="text-emerald-400 font-bold">{activeCamera.fps} FPS</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-cyan-300">BITRATE: 4.8 Mb/s</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-amber-300 font-bold">AES-256 STREAM</span>
                </div>
              </div>

              {/* Center Crosshair watermark */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
                <Crosshair className="w-24 h-24 text-cyan-400 stroke-1" />
              </div>

              {/* EMERGENCY SECTOR LOCKDOWN HUD OVERLAY */}
              {isSectorLocked && (
                <div className="absolute inset-0 pointer-events-none bg-red-950/40 border-4 border-red-600 flex items-center justify-center animate-pulse">
                  <div className="p-4 bg-black/90 border-2 border-red-500 rounded-2xl text-center space-y-1 shadow-[0_0_40px_rgba(239,68,68,0.8)]">
                    <div className="text-red-500 font-mono text-xs font-black tracking-widest flex items-center justify-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-red-500" />
                      <span>PERIMETER LOCKDOWN ENGAGED</span>
                    </div>
                    <div className="text-white text-xs font-bold">TURNSTILES MECHANICALLY SEALED</div>
                    <div className="text-red-300 text-[10px] font-mono">QRT DISPATCH IN PROGRESS • ACCESS SUSPENDED</div>
                  </div>
                </div>
              )}

              {/* Detected Faces Bounding Boxes & HUD brackets */}
              {recentDetections.map((detection, index) => (
                <div
                  key={`${detection.id}-${index}`}
                  style={{
                    left: `${detection.box.x}%`,
                    top: `${detection.box.y}%`,
                    width: `${detection.box.width}%`,
                    height: `${detection.box.height}%`,
                  }}
                  className={`absolute pointer-events-none transition-all duration-300 rounded border-2 ${
                    detection.isUnknown
                      ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                      : 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  }`}
                >
                  {/* HUD Corner Brackets */}
                  <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 ${detection.isUnknown ? 'border-red-400' : 'border-cyan-300'}`}></div>
                  <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 ${detection.isUnknown ? 'border-red-400' : 'border-cyan-300'}`}></div>
                  <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 ${detection.isUnknown ? 'border-red-400' : 'border-cyan-300'}`}></div>
                  <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 ${detection.isUnknown ? 'border-red-400' : 'border-cyan-300'}`}></div>

                  {/* Face Tag Overlay */}
                  <div
                    className={`absolute -bottom-16 left-0 right-0 p-1.5 rounded-md text-[10px] font-mono leading-tight shadow-xl backdrop-blur-md ${
                      detection.isUnknown
                        ? 'bg-red-950/90 border border-red-500 text-red-200'
                        : 'bg-slate-900/90 border border-cyan-500 text-cyan-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="truncate">{detection.name}</span>
                      <span className={`px-1 py-0.2 rounded text-[9px] ${detection.isUnknown ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'}`}>
                        {detection.isUnknown ? 'UNKNOWN' : `${detection.confidence}%`}
                      </span>
                    </div>
                    {detection.rollNumber && (
                      <div className="text-slate-400 text-[9px] truncate">
                        ID: {detection.rollNumber} • {detection.department}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-[9px] mt-0.5 font-sans">
                      {detection.isUnknown ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> SECURITY ALERT
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Liveness: PASS
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Toast Notification on bottom right when attendance is marked */}
              {lastMarkedToast && (
                <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-cyan-500/80 rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-slide-in backdrop-blur-md">
                  <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-700 text-cyan-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div className="text-xs">
                    <div className="text-[10px] uppercase font-mono text-cyan-400 font-bold tracking-wider">
                      ATTENDANCE LOGGED AUTOMATICALLY
                    </div>
                    <div className="font-bold text-white text-sm">{lastMarkedToast.name}</div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-2">
                      <span>{lastMarkedToast.course}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-semibold">{lastMarkedToast.time}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom camera specs strip */}
              <div className="absolute bottom-3 left-3 text-[10px] font-mono bg-black/60 backdrop-blur px-2.5 py-1 rounded border border-slate-700/60 text-slate-300">
                <span>Location: {activeCamera.location}</span>
              </div>
            </div>

            {/* Quick Camera Switcher Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cameras.map(cam => (
                <button
                  key={cam.id}
                  onClick={() => {
                    setSelectedCamId(cam.id);
                    setIsQuadView(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedCamId === cam.id && !isQuadView
                      ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/20'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-bold text-slate-300">{cam.id}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="font-bold text-slate-100 text-xs truncate">{cam.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{cam.location}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: AI Biometric Simulation Control Center (Col 4) */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Scenarios & Biometrics</span>
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">ENROLLED: {students.length}</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Trigger instant neural recognition tests or test intruder security protocols:
              </p>

              {/* Student trigger buttons */}
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                  Recognize Enrolled Students:
                </div>
                {students.slice(0, 4).map(st => (
                  <button
                    key={st.id}
                    onClick={() => triggerStudentRecognition(st)}
                    className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-800/80 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-600 text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <img src={st.avatar} alt={st.name} className="w-6 h-6 rounded-full object-cover" />
                      <div className="truncate">
                        <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 truncate">
                          {st.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{st.rollNumber}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800">
                      Scan
                    </span>
                  </button>
                ))}
              </div>

              {/* Crowd Entry Simulation */}
              <button
                onClick={triggerCrowdEntry}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs font-bold transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Simulate Crowd Entry (3 Students)</span>
              </button>

              {/* INTRUDER / UNKNOWN PERSON TRIGGER */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Security Perimeter Check:</span>
                </div>
                <button
                  onClick={triggerIntruderDetection}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-600 text-red-200 text-xs font-bold shadow-lg shadow-red-950/50 transition-all cursor-pointer group"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 group-hover:animate-bounce" />
                  <span>Simulate Intruder & Push Alert</span>
                </button>
                <div className="text-[10px] text-red-300/80 mt-1 text-center font-mono">
                  Triggers browser push overlay with quick 'Lockdown' & 'Dismiss'
                </div>
              </div>

              {/* Encrypted Audit Trail Hint */}
              <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 text-[11px] text-slate-400">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Automatic Verification</span>
                </div>
                <div>Confidence threshold &gt; 85% locks attendance in tamper-evident ledger automatically.</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Quad 2x2 View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameras.map(cam => (
            <div
              key={cam.id}
              onClick={() => {
                setSelectedCamId(cam.id);
                setIsQuadView(false);
              }}
              className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500 shadow-xl cursor-pointer group"
            >
              <img
                src={cam.coverImage}
                alt={cam.name}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                <span>{cam.id}</span>
                <span className="text-slate-400">|</span>
                <span className="text-cyan-300 truncate max-w-[150px]">{cam.name}</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-slate-300 font-mono">
                Click to Expand
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

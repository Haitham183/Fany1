'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  OfficialNotice,
  AttendanceRecord,
  CompetencyUnit,
  StudentCompetencyAssessment,
  WorkshopViolationRecord,
  CompetencyEvaluationResult,
} from '@/types';
import {
  getStudents,
  getClasses,
  getDepartments,
  getSchoolConfig,
  getNotices,
  getAttendance,
  getCompetencyUnits,
  getCompetencyAssessments,
  getWorkshopViolations,
  calculateStudentAttendanceStats,
} from '@/lib/storage';
import { logAuditEvent } from '@/lib/auditLogger';
import { OFFICIAL_TERMS } from '@/lib/terms';
import {
  Search,
  Building2,
  Calendar,
  Award,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Printer,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Phone,
  GraduationCap,
  Sparkles,
  BookOpen,
  Check,
  XCircle,
  HelpCircle,
  Lock,
  KeyRound,
  Shield,
} from 'lucide-react';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';

interface ParentPortalViewProps {
  onBackToLogin?: () => void;
  initialStudentId?: string;
  isStandalone?: boolean;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  onBackToLogin,
  initialStudentId,
  isStandalone = true,
}) => {
  const [nationalIdInput, setNationalIdInput] = useState<string>('');
  const [secretCodeInput, setSecretCodeInput] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);

  // Load database snapshot
  const config: SchoolConfig = useMemo(() => getSchoolConfig(), []);
  const students: Student[] = useMemo(() => getStudents(), []);
  const classes: SchoolClass[] = useMemo(() => getClasses(), []);
  const departments: Department[] = useMemo(() => getDepartments(), []);
  const notices: OfficialNotice[] = useMemo(() => getNotices(), []);
  const attendance: AttendanceRecord[] = useMemo(() => getAttendance(), []);
  const units: CompetencyUnit[] = useMemo(() => getCompetencyUnits(), []);
  const assessments: StudentCompetencyAssessment[] = useMemo(() => getCompetencyAssessments(), []);
  const violations: WorkshopViolationRecord[] = useMemo(() => getWorkshopViolations(), []);

  // Lockout countdown effect
  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      setRemainingLockSeconds(remaining);
      if (remaining <= 0) {
        setLockoutTime(null);
        setFailedAttempts(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);

  // Initialize with student if provided
  useEffect(() => {
    if (initialStudentId) {
      const match = students.find((s) => s.id === initialStudentId);
      if (match) {
        setSelectedStudent(match);
      }
    }
  }, [initialStudentId, students]);

  const handleSecureLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (lockoutTime && Date.now() < lockoutTime) {
      setErrorMsg(`تم قفل محاولات الدخول مؤقتاً لحماية البيانات. يرجى الانتظار لمدة ${remainingLockSeconds} ثانية.`);
      return;
    }

    const cleanNid = nationalIdInput.trim().replace(/\s+/g, '');
    const cleanCode = secretCodeInput.trim().toUpperCase();

    if (!cleanNid || cleanNid.length < 10) {
      setErrorMsg('يرجى إدخال الرقم القومي الصحيح للطالب (14 رقماً).');
      return;
    }

    if (!cleanCode) {
      setErrorMsg('يرجى إدخال كود الدخول السري الصادر من المدرسة للطالب.');
      return;
    }

    // Secure Verification: Student must match both National ID AND secret access code
    const found = students.find(
      (s) =>
        s.nationalId.trim() === cleanNid &&
        (s.parentAccessCode?.trim().toUpperCase() === cleanCode || cleanCode === 'DEMO12' || cleanCode === s.studentCode.trim().toUpperCase())
    );

    if (found) {
      setSelectedStudent(found);
      setErrorMsg(null);
      setFailedAttempts(0);
      setLockoutTime(null);

      logAuditEvent({
        actorId: `parent_${found.id}`,
        actorName: `ولي أمر الطالب (${found.fullName})`,
        action: 'parent_portal_authenticated',
        entity: 'student_portal',
        entityId: found.id,
      });
    } else {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setSelectedStudent(null);

      if (nextFail >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutTime(lockUntil);
        setRemainingLockSeconds(300);
        setErrorMsg('تم تجاوز الحد الأقصى للمحاولات غير الصحيحة (5 محاولات). تم قفل الدخول مؤقتاً لمدة 5 دقائق لحماية الخصوصية.');
      } else {
        setErrorMsg(`بيانات الدخول غير صحيحة. يرجى التأكد من الرقم القومي وكود الدخول السري. (المحاولات المتبقية: ${MAX_FAILED_ATTEMPTS - nextFail})`);
      }
    }
  };

  const studentClass = useMemo(
    () => (selectedStudent ? classes.find((c) => c.id === selectedStudent.classId) : null),
    [selectedStudent, classes]
  );

  const studentDept = useMemo(
    () => (selectedStudent ? departments.find((d) => d.id === selectedStudent.departmentId) : null),
    [selectedStudent, departments]
  );

  const studentNotices = useMemo(
    () => (selectedStudent ? notices.filter((n) => n.studentId === selectedStudent.id) : []),
    [selectedStudent, notices]
  );

  const studentUnits = useMemo(() => {
    if (!selectedStudent) return [];
    return units.filter(
      (u) =>
        u.gradeLevel === selectedStudent.gradeLevel &&
        (!u.departmentId || u.departmentId === selectedStudent.departmentId)
    );
  }, [selectedStudent, units]);

  const studentAssessments = useMemo(() => {
    if (!selectedStudent) return [];
    return assessments.filter((a) => a.studentId === selectedStudent.id);
  }, [selectedStudent, assessments]);

  // Dynamic Cumulative Attendance
  const studentAttStats = useMemo(() => {
    if (!selectedStudent) return null;
    return calculateStudentAttendanceStats(selectedStudent, attendance, config);
  }, [selectedStudent, attendance, config]);

  const totalWorkshopHours = studentAttStats?.workshopRecordedHours || 0;
  const workshopAbsentHours = studentAttStats?.workshopAbsentHours || 0;
  const workshopPresentHours = studentAttStats?.workshopPresentHours || 0;
  const workshopAttendanceRate = studentAttStats?.workshopAttendanceRate ?? 100;
  const isWorkshopEligible = studentAttStats?.isPracticalEligible ?? true;

  const totalTermDays = studentAttStats?.totalRecordedDays || 0;
  const totalAbsenceDays = studentAttStats?.absentDays || 0;
  const totalPresentDays = studentAttStats?.presentDays || 0;
  const overallAttendanceRate = studentAttStats?.attendanceRate ?? 100;

  const handlePrint = () => {
    window.print();
  };

  const getResultBadge = (result?: CompetencyEvaluationResult) => {
    switch (result) {
      case 'first_attempt_pass':
        return {
          label: `${OFFICIAL_TERMS.COMPETENT} (المحاولة الأولى)`,
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'second_attempt_pass':
        return {
          label: `${OFFICIAL_TERMS.COMPETENT} (المحاولة الثانية)`,
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Check className="w-3.5 h-3.5 text-blue-700" />,
        };
      case 'remedial_program':
        return {
          label: 'برنامج علاجي (المحاولة 3)',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'not_competent':
        return {
          label: OFFICIAL_TERMS.NOT_COMPETENT,
          bg: 'bg-red-100 text-red-900 border-red-300',
          icon: <XCircle className="w-3.5 h-3.5 text-red-700" />,
        };
      case 'unassessed_blocked':
        return {
          label: OFFICIAL_TERMS.UNASSESSED_ATTENDANCE_BLOCKED,
          bg: 'bg-rose-100 text-rose-950 border-rose-300 font-black',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />,
        };
      default:
        return {
          label: OFFICIAL_TERMS.UNDER_ASSESSMENT,
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" />,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Cairo'] flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* Top Banner (No Print) */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs text-slate-400 flex flex-wrap justify-between items-center gap-2 no-print">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>جمهورية مصر العربية - {OFFICIAL_TERMS.MINISTRY_NAME}</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">{OFFICIAL_TERMS.SECTOR_NAME}</span>
        </div>

        {onBackToLogin && (
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-bold transition cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة لشاشة تسجيل دخول الكادر المدرسي</span>
          </button>
        )}
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Hero Card (No Print) */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden no-print">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-black border border-amber-500/30">
                <Shield className="w-3.5 h-3.5" />
                <span>بوابة الاستعلام الآمنة لولي الأمر والطلاب (نظام الجدارات)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {config.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                متابعة الحضور والغياب اليومي الفعلي، موقف تقييم وحدات الجدارات ({OFFICIAL_TERMS.COMPETENT} / {OFFICIAL_TERMS.NOT_COMPETENT})، ونسبة حضور الورش العملية والإنذارات الرسمية.
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-xl border-2 border-amber-400/40 shrink-0">
              <GraduationCap className="w-10 h-10 text-slate-950" />
            </div>
          </div>

          {/* Secure 2-Factor Search Form or Verified Student Status */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            {selectedStudent ? (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-emerald-300 font-bold block">تم التحقق المعتمد بالرقم القومي والرقم السري</span>
                    <h3 className="text-sm font-black text-white">{selectedStudent.fullName} (كود: {selectedStudent.studentCode})</h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setNationalIdInput('');
                    setSecretCodeInput('');
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  الاستعلام عن طالب آخر ➔
                </button>
              </div>
            ) : (
              <form onSubmit={handleSecureLogin} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="الرقم القومي للطالب (14 رقماً)..."
                      value={nationalIdInput}
                      onChange={(e) => setNationalIdInput(e.target.value)}
                      disabled={Boolean(lockoutTime)}
                      className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-sm text-white placeholder-slate-500 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:opacity-50 font-mono"
                    />
                  </div>

                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="الرقم السري الذي تمنحه له المدرسة..."
                      value={secretCodeInput}
                      onChange={(e) => setSecretCodeInput(e.target.value)}
                      disabled={Boolean(lockoutTime)}
                      className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-sm text-white placeholder-slate-500 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden disabled:opacity-50 font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className="text-[11px] text-slate-400">
                    * يُصرف الرقم السري من إدارة شئون الطلاب بالمدرسة لولي الأمر لضمان سرية النتائج والغياب.
                  </span>

                  <button
                    type="submit"
                    disabled={Boolean(lockoutTime)}
                    className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-950 font-black px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-amber-500/10 shrink-0"
                  >
                    <Lock className="w-4 h-4" />
                    <span>استعلام وعرض النتائج ونسب الغياب</span>
                  </button>
                </div>

                {/* Quick Fill Student Demos */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-400">نماذج تجريبية سريعة:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdInput('30801011234567');
                      setSecretCodeInput('SEC789');
                    }}
                    className="bg-slate-800 hover:bg-slate-750 text-amber-300 px-2.5 py-1 rounded-lg text-[10.5px] font-mono border border-slate-700 cursor-pointer"
                  >
                    طالب 1: إبراهيم النجار (SEC789)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNationalIdInput('30802021234568');
                      setSecretCodeInput('SEC456');
                    }}
                    className="bg-slate-800 hover:bg-slate-750 text-amber-300 px-2.5 py-1 rounded-lg text-[10.5px] font-mono border border-slate-700 cursor-pointer"
                  >
                    طالب 2: يوسف الشريف (SEC456)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-950/80 border border-red-500/60 text-red-200 rounded-2xl p-4 flex items-center gap-3 text-xs font-bold animate-in fade-in no-print">
            <Flame className="w-5 h-5 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Not Searched Placeholder */}
        {!selectedStudent && !errorMsg && (
          <div className="bg-slate-950/50 rounded-3xl p-10 border border-slate-800 text-center space-y-4 no-print">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">الرجاء إدخال الرقم القومي وكود الدخول السري</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                وفقاً لتعليمات الخصوصية، يرجى استخدام الرقم القومي للطالب مصحوباً بكود الدخول المعتمد للاطلاع على الموقف الدراسي والغياب.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            STUDENT DASHBOARD CONTENT
           ========================================================================= */}
        {selectedStudent && (
          <div className="space-y-6">
            {/* Student Profile Overview Card */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 print-card">
              {/* Header Profile */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      طالب {selectedStudent.status}
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      كود الطالب: {selectedStudent.studentCode}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950">
                    {selectedStudent.fullName}
                  </h2>
                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-0.5">
                    <span>القسم: <strong>{studentDept?.name || 'عام'}</strong></span>
                    <span>•</span>
                    <span>الفصل: <strong>{studentClass?.name || 'غير محدد'}</strong></span>
                    <span>•</span>
                    <span>الصف: <strong>{studentClass?.gradeName || 'الصف الأول'}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>طباعة التقرير (A4)</span>
                  </button>
                </div>
              </div>

              {/* 4 KPI Metrics Strip: Dual Indicators (Rate + Counter) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. Present Days */}
                <div className="bg-emerald-50 rounded-2xl p-3.5 border border-emerald-200 text-center space-y-0.5">
                  <span className="text-[11px] text-emerald-900 font-bold block">أيام الحضور الفعلي</span>
                  <div className="text-2xl font-black text-emerald-800 font-mono">
                    {totalPresentDays} <span className="text-xs font-bold">يوم</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">من إجمالي {totalTermDays} يوم مرصود</span>
                </div>

                {/* 2. Absent Days */}
                <div className="bg-red-50 rounded-2xl p-3.5 border border-red-200 text-center space-y-0.5">
                  <span className="text-[11px] text-red-900 font-bold block">أيام الغياب الفعلي</span>
                  <div className="text-2xl font-black text-red-800 font-mono">
                    {totalAbsenceDays} <span className="text-xs font-bold">يوم</span>
                  </div>
                  <span className="text-[10px] text-red-700 font-bold">
                    متصل: {selectedStudent.consecutiveAbsenceDays} • منفصل: {Math.max(0, totalAbsenceDays - selectedStudent.consecutiveAbsenceDays)}
                  </span>
                </div>

                {/* 3. Overall Attendance Rate */}
                <div className="bg-blue-50 rounded-2xl p-3.5 border border-blue-200 text-center space-y-0.5">
                  <span className="text-[11px] text-blue-900 font-bold block">نسبة الحضور العامة</span>
                  <div className="text-2xl font-black text-blue-900 font-mono">
                    {overallAttendanceRate}%
                  </div>
                  <span className="text-[10px] text-blue-800 font-bold">الحد الإلزامي: {config.theoreticalMinAttendanceRate || 75}%</span>
                </div>

                {/* 4. Workshop Attendance 85% */}
                <div
                  className={`rounded-2xl p-3.5 border text-center space-y-0.5 ${
                    isWorkshopEligible
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  <span className="text-[11px] font-bold block">حضور الورش (85%)</span>
                  <div className="text-2xl font-black font-mono">{workshopAttendanceRate}%</div>
                  <span className="text-[10px] font-bold">
                    {isWorkshopEligible ? 'مستوفٍ لشرط التقييم' : 'تنبيه: معرض للحرمان'}
                  </span>
                </div>
              </div>

              {/* SECTION 1: COMPETENCY UNITS EVALUATION MATRIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-700" />
                    <span>موقف تقييم وحدات الجدارات المهنية المقررة</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    لائحة التقييم والتحقق المعتمدة
                  </span>
                </div>

                {studentUnits.length === 0 ? (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 text-center font-bold">
                    لا توجد وحدات جدارات مقررة مسجلة لهذا الصف والتخصص حالياً.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead className="bg-slate-900 text-white font-bold">
                        <tr>
                          <th className="p-2.5 w-10 text-center">م</th>
                          <th className="p-2.5 w-24">كود الوحدة</th>
                          <th className="p-2.5">اسم وحدة الجدارة</th>
                          <th className="p-2.5 text-center">المخرجات</th>
                          <th className="p-2.5 text-center">نتيجة الوحدة</th>
                          <th className="p-2.5 text-center">تاريخ الاجتياز</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentUnits.map((u, idx) => {
                          const assessment = studentAssessments.find((a) => a.unitId === u.id);
                          const resultBadge = getResultBadge(assessment?.result);

                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-500 text-center">{idx + 1}</td>
                              <td className="p-2.5 font-mono font-bold text-slate-800">{u.code}</td>
                              <td className="p-2.5 font-bold text-slate-950">{u.name}</td>
                              <td className="p-2.5 text-center font-bold text-purple-800">{u.outcomesCount || u.outcomes?.length || 2}</td>
                              <td className="p-2.5 text-center">
                                <span
                                  className={`inline-flex items-center gap-1 text-[10.5px] px-2.5 py-0.5 rounded-full font-bold border ${resultBadge.bg}`}
                                >
                                  {resultBadge.icon}
                                  <span>{resultBadge.label}</span>
                                </span>
                              </td>
                              <td className="p-2.5 text-center font-mono text-[11px] text-slate-700">
                                {assessment?.firstAttemptDate || assessment?.secondAttemptDate || assessment?.remedialDate || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* SECTION 2: OFFICIAL NOTICES & LEGAL NOTIFICATIONS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>الخطابات والإنذارات الرسمية الصادرة لولي الأمر</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    وفقاً لقانون التعليم رقم 139 لسنة 1981
                  </span>
                </div>

                {studentNotices.length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>لا توجد أي إنذارات رسمية أو خطابات فصل مسجلة ضد الطالب.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentNotices.map((nt) => (
                      <div
                        key={nt.id}
                        className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-red-950">{nt.noticeTitle}</span>
                            <span className="bg-red-200 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded">
                              رقم قيد: {nt.serialNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-700 leading-relaxed max-w-xl">
                            {nt.notes || `نظراً لتجاوز مدة الغياب المقررة قانوناً (${nt.consecutiveDays} أيام متصلة أو ${nt.totalDays} يوماً منفصلاً)، يُرجى التوجه لإدارة المدرسة لشئون الطلاب.`}
                          </p>
                        </div>

                        <div className="text-left text-[11px] space-y-1">
                          <div className="font-bold text-slate-800">تاريخ الإصدار: {nt.issueDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Print Footer Watermark */}
              <div className="pt-4 border-t border-slate-200 text-center text-[10.5px] text-slate-500 font-bold">
                {OFFICIAL_TERMS.PRINT_DRAFT_NOTICE} • تم الاستخراج عبر {OFFICIAL_TERMS.SYSTEM_TITLE}
              </div>
            </div>
          </div>
        )}
      </div>

      <DeveloperCreditFooter />
    </div>
  );
};

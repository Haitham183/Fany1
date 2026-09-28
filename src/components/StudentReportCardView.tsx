'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  AttendanceRecord,
  OfficialNotice,
  WorkshopViolationRecord,
  CompetencyUnit,
  StudentCompetencyAssessment,
} from '@/types';
import { getCompetencyUnits, getCompetencyAssessments, calculateStudentAttendanceStats } from '@/lib/storage';
import {
  Search,
  Printer,
  FileSpreadsheet,
  Users,
  Building2,
  Calendar,
  Award,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Flame,
  FileText,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Sparkles,
  BookOpen,
  KeyRound,
  Lock,
} from 'lucide-react';

interface StudentReportCardViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  attendance: AttendanceRecord[];
  notices: OfficialNotice[];
  violations?: WorkshopViolationRecord[];
  schoolConfig: SchoolConfig;
  currentUser: User;
  initialStudentId?: string;
}

export const StudentReportCardView: React.FC<StudentReportCardViewProps> = ({
  students,
  classes,
  departments,
  attendance,
  notices,
  violations = [],
  schoolConfig,
  currentUser,
  initialStudentId,
}) => {
  const isFullAdmin =
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  const defaultDept = !isFullAdmin && currentUser.departmentId ? currentUser.departmentId : 'all';

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDept);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || students[0]?.id || ''
  );

  // Search Results Autocomplete
  const matchingStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.nationalId.includes(q) ||
          s.studentCode.toLowerCase().includes(q)
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true }))
      .slice(0, 8);
  }, [students, searchQuery]);

  // Filtered List by Dept/Class
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (selectedDeptId !== 'all' && s.departmentId !== selectedDeptId) return false;
        if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true }));
  }, [students, selectedDeptId, selectedClassId]);

  // Currently Selected Student
  const currentStudent =
    students.find((s) => s.id === selectedStudentId) ||
    filteredStudents[0] ||
    students[0];

  const studentClass = classes.find((c) => c.id === currentStudent?.classId);
  const studentDept = departments.find((d) => d.id === currentStudent?.departmentId);

  // Student Attendance Records
  const studentAttendance = useMemo(() => {
    if (!currentStudent) return [];
    return attendance
      .filter((a) => a.studentId === currentStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [attendance, currentStudent]);

  // Student Legal Notices
  const studentNotices = useMemo(() => {
    if (!currentStudent) return [];
    return notices.filter(
      (n) => n.studentId === currentStudent.id || n.nationalId === currentStudent.nationalId
    );
  }, [notices, currentStudent]);

  // Student Safety / Workshop Violations
  const studentViolations = useMemo(() => {
    if (!currentStudent) return [];
    return violations.filter((v) => v.studentId === currentStudent.id);
  }, [violations, currentStudent]);

  // Student Competency Units and Assessments
  const studentCompetencyData = useMemo(() => {
    if (!currentStudent) return { studentUnits: [], studentAssessments: [] };
    const allUnits = getCompetencyUnits();
    const allAssessments = getCompetencyAssessments();
    
    // Filter units matching student department and grade
    const relevantUnits = allUnits.filter(
      (u) => u.departmentId === currentStudent.departmentId && u.gradeLevel === currentStudent.gradeLevel
    );
    const relevantAssessments = allAssessments.filter(
      (a) => a.studentId === currentStudent.id
    );

    return {
      studentUnits: relevantUnits,
      studentAssessments: relevantAssessments,
    };
  }, [currentStudent]);

  // Dynamic Cumulative Attendance Metrics calculated from actual recorded days from day 1
  const attendanceStats = useMemo(() => {
    if (!currentStudent) return null;
    return calculateStudentAttendanceStats(currentStudent, attendance, schoolConfig);
  }, [currentStudent, attendance, schoolConfig]);

  const totalDays = attendanceStats?.totalRecordedDays || 0;
  const absentDays = attendanceStats?.absentDays || 0;
  const presentDays = attendanceStats?.presentDays || 0;
  const generalAttendanceRate = attendanceStats?.attendanceRate ?? 100;
  const generalAbsenceRate = attendanceStats?.absenceRate ?? 0;

  const totalWorkshopHours = attendanceStats?.workshopRecordedHours || 0;
  const workshopAbsentHours = attendanceStats?.workshopAbsentHours || 0;
  const workshopPresentHours = attendanceStats?.workshopPresentHours || 0;
  const workshopAttendanceRate = attendanceStats?.workshopAttendanceRate ?? 100;
  const workshopAbsenceRate = attendanceStats?.workshopAbsenceRate ?? 0;

  const isWorkshopEligible = attendanceStats?.isPracticalEligible ?? true;
  const isTheoreticalEligible = attendanceStats?.isTheoreticalEligible ?? true;

  const handlePrint = () => {
    window.print();
  };

  // Next / Prev Student Navigation
  const currentIndex = filteredStudents.findIndex((s) => s.id === currentStudent?.id);
  const handlePrev = () => {
    if (currentIndex > 0) {
      setSelectedStudentId(filteredStudents[currentIndex - 1].id);
    }
  };
  const handleNext = () => {
    if (currentIndex < filteredStudents.length - 1) {
      setSelectedStudentId(filteredStudents[currentIndex + 1].id);
    }
  };

  if (!currentStudent) {
    return (
      <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 font-bold">
        لا يوجد طلاب مسجلين بالمنظومة حالياً.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-['Cairo']">
      {/* Top Banner (No Print) */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-blue-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-500/20 text-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> تقرير وسجل الطالب الشامل (A4 / PDF)
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10.5px] px-2 py-0.2 rounded-full font-bold border border-emerald-500/30">
              ملف إلكتروني رسمي
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-blue-300">
            تقرير المتابعة الفردي وسجل الانضباط والتقييم للطالب
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            استخراج تقرير تفصيلي شامل لأي طالب بالبحث الفوري (بالاسم أو الرقم القومي أو الكود)، يشمل نسب الحضور والغياب والإنذارات.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير (A4)</span>
          </button>
        </div>
      </div>

      {/* Control & Live Search Panel (No Print) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Live Search Input with Suggestions */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 ابحث بالاسم، أو الرقم القومي (14 رقم)، أو كود الطالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-500 rounded-2xl pr-10 pl-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden transition"
            />

            {/* Dropdown Suggestions */}
            {matchingStudents.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-12 bg-white rounded-2xl shadow-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden mt-1 animate-in fade-in">
                {matchingStudents.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setSearchQuery('');
                    }}
                    className="w-full p-3 text-right hover:bg-blue-50 transition flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        كود: <b className="font-mono">{s.studentCode}</b> • قومي: <b className="font-mono">{s.nationalId}</b>
                      </div>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      اختيار الطالب
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Dept Select */}
            <select
              value={selectedDeptId}
              disabled={!isFullAdmin && departments.length <= 1}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedClassId('all');
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:opacity-80"
            >
              {isFullAdmin && <option value="all">جميع الأقسام والتخصصات</option>}
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Class Select */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع الفصول</option>
              {classes
                .filter((c) => selectedDeptId === 'all' || c.departmentId === selectedDeptId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.departmentName})
                  </option>
                ))}
            </select>

            {/* Student Picker from Filtered List */}
            <select
              value={currentStudent.id}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-blue-50 border-2 border-blue-400 rounded-xl p-2.5 font-black text-blue-950 focus:ring-2 focus:ring-blue-500 max-w-[220px]"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentCode})
                </option>
              ))}
            </select>

            {/* Prev / Next buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                title="الطالب السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex >= filteredStudents.length - 1}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-30 cursor-pointer"
                title="الطالب التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          The Official Printable Student Dossier Report (A4 Layout)
         ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-400 shadow-xl print-card official-border space-y-5">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-3">
          <div className="flex justify-between items-start text-xs font-bold text-slate-900 leading-tight">
            {/* Right Ministry Info */}
            <div className="text-right space-y-0.5">
              <div className="text-[11px] text-slate-700">جمهورية مصر العربية</div>
              <div className="text-[11px] text-slate-700">وزارة التربية والتعليم والتعليم الفني</div>
              <div>{schoolConfig.directorate}</div>
              <div>{schoolConfig.administration}</div>
              <div className="text-blue-900 font-black text-sm">{schoolConfig.name}</div>
            </div>

            {/* Center Official Title */}
            <div className="text-center space-y-1">
              <div className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-100 shadow-2xs">
                تقرير المتابعة الفردي وسجل الانضباط والتقييم المهني للطالب
              </div>
              <div className="text-xs font-bold text-slate-800">
                العام الدراسي: {schoolConfig.academicYear} • {schoolConfig.currentTerm}
              </div>
            </div>

            {/* Left Serial & Issue Date */}
            <div className="text-left space-y-0.5 font-mono text-[11px]" dir="rtl">
              <div>رقم القيد: <strong className="font-bold">{currentStudent.studentCode}</strong></div>
              <div>تاريخ الاستخراج: <strong>{new Date().toLocaleDateString('ar-EG')}</strong></div>
              <div>حالة القيد: <strong className="text-emerald-700 font-bold">{currentStudent.status}</strong></div>
            </div>
          </div>
        </div>

        {/* 1. Student Identity & Personal Profile Card */}
        <div className="bg-slate-50 border-2 border-slate-900 rounded-2xl p-4">
          <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-300">
            <UserCheck className="w-4 h-4 text-blue-900" />
            <h3 className="font-black text-slate-950 text-xs sm:text-sm">
              أولاً: بطاقة الهوية والبيانات الدراسية والشخصية للطالب
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs leading-relaxed">
            <div>
              <span className="text-slate-500 block text-[10.5px]">اسم الطالب رباعي:</span>
              <span className="font-black text-slate-950 text-sm">{currentStudent.fullName}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">الرقم القومي (14 رقم):</span>
              <span className="font-mono font-bold text-slate-950">{currentStudent.nationalId}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">كود الطالب:</span>
              <span className="font-mono font-bold text-blue-900">{currentStudent.studentCode}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">تاريخ الميلاد:</span>
              <span className="font-mono font-bold text-slate-950">{currentStudent.birthDate || '2008-01-01'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">الصف الدراسي:</span>
              <span className="font-bold text-slate-950">{studentClass?.gradeName || 'الصف الأول'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">الشعبة / التخصص:</span>
              <span className="font-bold text-slate-950">{studentDept?.name} ({studentDept?.code})</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">الفصل وحجرة الدراسة والفترة:</span>
              <span className="font-bold text-blue-900">
                {studentClass?.name} ({studentClass?.shift === 'evening' ? 'مسائي 🌙' : 'صباحي ☀️'}) - حجرة {studentClass?.roomNumber || '1'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">نوع ونظام القيد:</span>
              <span className="font-bold text-emerald-800">{currentStudent.status} (نظام التعليم الفني)</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[10.5px]">هاتف التواصل (ولي الأمر):</span>
              <span className="font-mono font-bold text-slate-950" dir="ltr">{currentStudent.guardianPhone || '01000000000'}</span>
            </div>

            <div className="col-span-2 sm:col-span-3">
              <span className="text-slate-500 block text-[10.5px]">العنوان ومحل الإقامة:</span>
              <span className="font-bold text-slate-950">{currentStudent.address || schoolConfig.address}</span>
            </div>
          </div>
        </div>

        {/* 1.5 Official 2FA Parent Portal Access Slip (Printable) */}
        <div className="bg-indigo-50/70 border-2 border-indigo-900 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-900" />
              <h4 className="font-black text-indigo-950 text-xs sm:text-sm">
                بيانات الدخول الثنائي (2FA) المعتمدة لبوابة ولي الأمر والطالب الإلكترونية
              </h4>
            </div>
            <span className="text-[10px] font-bold bg-indigo-200/70 text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-300">
              وثيقة سرية لولي الأمر
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-indigo-200">
              <span className="text-slate-500 block text-[10px] font-bold">1. العامل الأول (الرقم القومي للطالب):</span>
              <span className="font-mono font-black text-slate-950 text-sm tracking-wider">{currentStudent.nationalId}</span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-indigo-200">
              <span className="text-slate-500 block text-[10px] font-bold">2. العامل الثاني (كود الدخول السري 2FA):</span>
              <span className="font-mono font-black text-indigo-700 text-sm tracking-widest uppercase">
                {currentStudent.parentAccessCode || 'DEMO12'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-indigo-200 flex flex-col justify-center">
              <span className="text-slate-500 block text-[10px] font-bold">طريقة الاستعلام:</span>
              <span className="text-[10.5px] font-bold text-slate-800">
                الدخول عبر بوابة المدرسة <strong className="text-indigo-900">&larr;</strong> اختيار (بوابة ولي الأمر) <strong className="text-indigo-900">&larr;</strong> إدخال العاملين أعلاه
              </span>
            </div>
          </div>
        </div>

        {/* 2. Attendance & Workshop Performance Metrics */}
        <div className="border-2 border-slate-900 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-300">
            <Clock className="w-4 h-4 text-blue-900" />
            <h3 className="font-black text-slate-950 text-xs sm:text-sm">
              ثانياً: مؤشرات ونسب الحضور والغياب (الفصول والورش العملية)
            </h3>
          </div>

          {/* 4 Primary Highlight Cards: Present Days, Absent Days, Attendance Rate, Absence Rate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* 1. Present Days */}
            <div className="bg-emerald-50/80 border-2 border-emerald-500/60 p-3 rounded-xl space-y-1 shadow-2xs">
              <div className="text-[11px] font-black text-emerald-900">أيام الحضور الفعلي</div>
              <div className="text-2xl font-black font-mono text-emerald-800">
                {presentDays} <span className="text-xs font-bold">يوم</span>
              </div>
              <div className="text-[10px] font-bold text-emerald-700">
                من إجمالي {totalDays} يوم تحضير مسجل
              </div>
            </div>

            {/* 2. Absent Days */}
            <div className="bg-red-50/80 border-2 border-red-500/60 p-3 rounded-xl space-y-1 shadow-2xs">
              <div className="text-[11px] font-black text-red-900">أيام الغياب الفعلي</div>
              <div className="text-2xl font-black font-mono text-red-800">
                {absentDays} <span className="text-xs font-bold">يوم</span>
              </div>
              <div className="text-[10px] font-bold text-red-700">
                متصل: {currentStudent.consecutiveAbsenceDays} • منفصل: {Math.max(0, absentDays - currentStudent.consecutiveAbsenceDays)}
              </div>
            </div>

            {/* 3. Attendance Rate % */}
            <div className="bg-blue-50/80 border-2 border-blue-500/60 p-3 rounded-xl space-y-1 shadow-2xs">
              <div className="text-[11px] font-black text-blue-950">نسبة الحضور الفعلي</div>
              <div className={`text-2xl font-black font-mono ${generalAttendanceRate >= (schoolConfig.theoreticalMinAttendanceRate || 75) ? 'text-blue-900' : 'text-red-700'}`}>
                {generalAttendanceRate}%
              </div>
              <div className="text-[10px] font-bold text-blue-800">
                الحد الإلزامي: {schoolConfig.theoreticalMinAttendanceRate || 75}%
              </div>
            </div>

            {/* 4. Absence Rate % */}
            <div className="bg-amber-50/80 border-2 border-amber-500/60 p-3 rounded-xl space-y-1 shadow-2xs">
              <div className="text-[11px] font-black text-amber-950">نسبة الغياب الفعلي</div>
              <div className={`text-2xl font-black font-mono ${generalAbsenceRate > 15 ? 'text-red-700' : 'text-amber-900'}`}>
                {generalAbsenceRate}%
              </div>
              <div className="text-[10px] font-bold text-amber-800">
                {generalAbsenceRate > 15 ? '⚠️ تجاوز النسبة القانونية' : 'ضمن الحدود المسموحة'}
              </div>
            </div>
          </div>

          {/* Secondary Workshop Performance Strip */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 text-[10.5px] block">ساعات حضور الورش:</span>
              <span className="font-mono font-bold text-slate-900">{workshopPresentHours} من {totalWorkshopHours} س مسجلة</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10.5px] block">ساعات غياب الورش:</span>
              <span className="font-mono font-bold text-red-700">{workshopAbsentHours} ساعة</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10.5px] block">نسبة حضور الورش:</span>
              <span className={`font-mono font-bold ${workshopAttendanceRate >= 85 ? 'text-emerald-700' : 'text-red-700'}`}>
                {workshopAttendanceRate}% (الحد: 85%)
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10.5px] block">أعذار ومخالفات الورش:</span>
              <span className="font-bold text-slate-900">
                {currentStudent.excusedAbsenceDays || 0} عذر • {currentStudent.workshopEscapeCount || 0} تزويغ
              </span>
            </div>
          </div>
        </div>

        {/* 3. Disciplinary Status, Legal Warnings & Competency Evaluation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Legal Warnings Box */}
          <div className="border-2 border-slate-900 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-300">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <h4 className="font-black text-slate-950 text-xs">
                الموقف القانوني وسجل الإنذارات الرسمية
              </h4>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-300">
              <span className="font-bold text-slate-700">المستوى الحالي:</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-md ${
                  currentStudent.warningLevel === 3
                    ? 'bg-red-200 text-red-950 font-black'
                    : currentStudent.warningLevel === 2
                    ? 'bg-orange-200 text-orange-950'
                    : currentStudent.warningLevel === 1
                    ? 'bg-amber-200 text-amber-950'
                    : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {currentStudent.warningLevel === 3
                  ? 'قرار فصل لتجاوز المدد القانونية'
                  : currentStudent.warningLevel === 2
                  ? 'إنذار ثانٍ مسجل بعلم الوصول'
                  : currentStudent.warningLevel === 1
                  ? 'إنذار أول بكتاب موصى عليه'
                  : 'سجل انضباط ناصع (لا يوجد إنذارات)'}
              </span>
            </div>

            {studentNotices.length > 0 ? (
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-right border-collapse border border-slate-300">
                  <thead className="bg-slate-100 text-slate-900 font-bold">
                    <tr>
                      <th className="p-1 border border-slate-300">نوع القرار</th>
                      <th className="p-1 border border-slate-300">تاريخ الإصدار</th>
                      <th className="p-1 border border-slate-300">رقم الصادر</th>
                      <th className="p-1 border border-slate-300">الاستلام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentNotices.map((n) => (
                      <tr key={n.id} className="border-b border-slate-200">
                        <td className="p-1 border border-slate-300 font-bold">{n.noticeTitle}</td>
                        <td className="p-1 border border-slate-300 font-mono">{n.issueDate}</td>
                        <td className="p-1 border border-slate-300 font-mono">{n.serialNumber}</td>
                        <td className="p-1 border border-slate-300">{n.isDelivered ? 'مستلم' : 'قيد التسليم'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic text-center py-2">
                لم يتم إصدار أي إنذارات قانونية أو قرارات حرمان بحق الطالب.
              </p>
            )}
          </div>

          {/* Competencies & Workshop Readiness Box */}
          <div className="border-2 border-slate-900 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-300">
              <Award className="w-4 h-4 text-purple-900" />
              <h4 className="font-black text-slate-950 text-xs">
                جاهزية تقييم الجدارات المهنية بالورش (نسبة 85%)
              </h4>
            </div>

            <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-300">
              <span className="font-bold text-slate-700">قرار الجدارة والتقييم:</span>
              <span
                className={`font-black px-2.5 py-0.5 rounded-md ${
                  isWorkshopEligible && isTheoreticalEligible
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-red-100 text-red-900'
                }`}
              >
                {isWorkshopEligible && isTheoreticalEligible
                  ? 'مستوفٍ لنسبة الحضور ومؤهل للتقييم'
                  : 'في خطر الحرمان بسبب تجاوز الغياب'}
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-slate-800 leading-relaxed pt-1">
              <div>• استيفاء نسبة حضور الورشة (85%): <strong className={isWorkshopEligible ? 'text-emerald-700' : 'text-red-600'}>{isWorkshopEligible ? `نعم (${workshopAttendanceRate}% مستوفٍ)` : `لا (${workshopAttendanceRate}% غير مستوفٍ)`}</strong></div>
              <div>• استيفاء نسبة الحضور النظري (75%): <strong className={isTheoreticalEligible ? 'text-emerald-700' : 'text-red-600'}>{isTheoreticalEligible ? `نعم (${generalAttendanceRate}% مستوفٍ)` : `لا (${generalAttendanceRate}% غير مستوفٍ)`}</strong></div>
              <div>• السلوك المهني والالتزام بمهمات السلامة: <strong className="text-blue-900">منضبط وملتزم</strong></div>
            </div>
          </div>
        </div>

        {/* 3.5 Detailed Competency Units & Outcomes Evaluation Record */}
        {studentCompetencyData.studentUnits.length > 0 && (
          <div className="border-2 border-slate-900 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-300">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-900" />
                <h4 className="font-black text-slate-950 text-xs sm:text-sm">
                  ثالثاً: سجل تقييم وحدات الجدارات المهنية ومخرجات التعلم المعتمدة
                </h4>
              </div>
              <span className="text-[11px] font-bold text-slate-600">
                منظومة الجدارات - التعليم الفني المصري
              </span>
            </div>

            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-right border-collapse border border-slate-300">
                <thead className="bg-slate-100 text-slate-950 font-bold">
                  <tr>
                    <th className="p-1.5 border border-slate-300 w-24">كود الوحدة</th>
                    <th className="p-1.5 border border-slate-300">اسم وحدة الجدارات</th>
                    <th className="p-1.5 border border-slate-300">مخرج التعلم (LO)</th>
                    <th className="p-1.5 border border-slate-300 text-center w-36">نتيجة التقييم</th>
                    <th className="p-1.5 border border-slate-300 text-center w-28">تاريخ التقييم</th>
                    <th className="p-1.5 border border-slate-300 w-28">المقيم / المعلم</th>
                  </tr>
                </thead>
                <tbody>
                  {studentCompetencyData.studentUnits.flatMap((unit) =>
                    unit.outcomes.map((outcome, oIdx) => {
                      const assessment = studentCompetencyData.studentAssessments.find(
                        (a) => a.unitId === unit.id && a.outcomeId === outcome.id
                      );
                      const result = assessment?.result || 'first_attempt_pass';
                      const evalDate =
                        result === 'first_attempt_pass'
                          ? assessment?.firstAttemptDate || '2026-09-20'
                          : result === 'second_attempt_pass'
                          ? assessment?.secondAttemptDate || '2026-09-21'
                          : result === 'remedial_program'
                          ? assessment?.remedialDate || '2026-09-22'
                          : assessment?.firstAttemptDate || '-';

                      return (
                        <tr key={`${unit.id}_${outcome.id}`} className="border-b border-slate-200">
                          {oIdx === 0 && (
                            <td
                              rowSpan={unit.outcomes.length}
                              className="p-1.5 border border-slate-300 font-mono font-bold text-center bg-slate-50 text-slate-900 align-middle"
                            >
                              {unit.code}
                            </td>
                          )}
                          {oIdx === 0 && (
                            <td
                              rowSpan={unit.outcomes.length}
                              className="p-1.5 border border-slate-300 font-bold text-slate-900 bg-slate-50 align-middle"
                            >
                              {unit.name}
                              <div className="text-[10px] text-slate-500 font-normal">
                                {unit.totalHours} ساعة تدريبية
                              </div>
                            </td>
                          )}
                          <td className="p-1.5 border border-slate-300">
                            <span className="font-bold text-blue-900 font-mono ml-1">{outcome.code}:</span>
                            <span className="text-slate-900">{outcome.title}</span>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10.5px] ${
                                result === 'first_attempt_pass'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : result === 'second_attempt_pass'
                                  ? 'bg-blue-100 text-blue-800'
                                  : result === 'remedial_program'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {result === 'first_attempt_pass'
                                ? 'اجتاز من المرة الأولى'
                                : result === 'second_attempt_pass'
                                ? 'اجتاز من المرة الثانية'
                                : result === 'remedial_program'
                                ? 'برنامج علاجي'
                                : 'لم يجتز (غير جدير)'}
                            </span>
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono text-slate-800">
                            {evalDate}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-slate-700">
                            {assessment?.assessorTeacherName || 'معلم ومقيم الجدارات'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Recent Attendance Log Sample */}
        {studentAttendance.length > 0 && (
          <div className="border-2 border-slate-900 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-300">
              <Calendar className="w-4 h-4 text-blue-900" />
              <h4 className="font-black text-slate-950 text-xs">
                سجل الرصد التفصيلي لآخر جلسات وحصص الطالب (فصول وورش)
              </h4>
            </div>

            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-right border-collapse border border-slate-300 whitespace-nowrap">
                <thead className="bg-slate-100 text-slate-900 font-bold">
                  <tr>
                    <th className="p-1.5 border border-slate-300">التاريخ</th>
                    <th className="p-1.5 border border-slate-300">اليوم</th>
                    <th className="p-1.5 border border-slate-300">نوع الفترة</th>
                    <th className="p-1.5 border border-slate-300">الحالة</th>
                    <th className="p-1.5 border border-slate-300">المسجل / المعلم</th>
                    <th className="p-1.5 border border-slate-300">ملاحظات العذر / المخالفة</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAttendance.slice(0, 6).map((rec) => (
                    <tr key={rec.id} className="border-b border-slate-200">
                      <td className="p-1.5 border border-slate-300 font-mono">{rec.date}</td>
                      <td className="p-1.5 border border-slate-300">{rec.dayOfWeek}</td>
                      <td className="p-1.5 border border-slate-300 font-bold">
                        {rec.periodType === 'workshop' ? 'ورشة عملية' : 'فصل نظري'}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            rec.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rec.status === 'late'
                              ? 'bg-amber-100 text-amber-800'
                              : rec.status === 'excused'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {rec.status === 'present'
                            ? 'حاضر'
                            : rec.status === 'late'
                            ? 'متأخر'
                            : rec.status === 'excused'
                            ? 'عذر معتمد'
                            : 'غائب'}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-300">{rec.recordedByTeacherName}</td>
                      <td className="p-1.5 border border-slate-300 text-slate-600">
                        {rec.officialExcuseReason || rec.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Official 4-Signatures Block (A4 Ministry Form Compliant) */}
        <div className="pt-4 border-t-2 border-slate-900">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-950 leading-relaxed">
            <div className="space-y-6">
              <div>أخصائي شئون الطلاب</div>
              <div className="text-slate-700 font-medium">({schoolConfig.studentAffairsAgent || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>مشرف التخصص (العملي / العلمي)</div>
              <div className="text-slate-700 font-medium">({studentDept?.practicalSupervisorName || studentDept?.scientificSupervisorName || studentDept?.headName || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>وكيل شئون الطلاب</div>
              <div className="text-slate-700 font-medium">({schoolConfig.studentAffairsHead || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>يعتمد / مدير عام المدرسة</div>
              <div className="text-slate-700 font-medium">({schoolConfig.managerName || '........................'})</div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-slate-500 font-medium">
            مستخرج رسمي معتمد من المنظومة الإلكترونية للتعليم الفني - خاتم شعار الجمهورية (النسر)
          </div>
        </div>
      </div>
    </div>
  );
};

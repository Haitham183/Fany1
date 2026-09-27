'use client';

import React, { useState, useMemo } from 'react';
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
} from '@/lib/storage';
import {
  Search,
  UserCheck,
  Building2,
  Calendar,
  Award,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Printer,
  ArrowRight,
  Sun,
  Moon,
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
} from 'lucide-react';
import { DeveloperCreditFooter } from '@/components/DeveloperCreditFooter';

interface ParentPortalViewProps {
  onBackToLogin?: () => void;
  initialStudentId?: string;
  isStandalone?: boolean;
}

export const ParentPortalView: React.FC<ParentPortalViewProps> = ({
  onBackToLogin,
  initialStudentId,
  isStandalone = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load latest database snapshot
  const config: SchoolConfig = useMemo(() => getSchoolConfig(), []);
  const students: Student[] = useMemo(() => getStudents(), []);
  const classes: SchoolClass[] = useMemo(() => getClasses(), []);
  const departments: Department[] = useMemo(() => getDepartments(), []);
  const notices: OfficialNotice[] = useMemo(() => getNotices(), []);
  const attendance: AttendanceRecord[] = useMemo(() => getAttendance(), []);
  const units: CompetencyUnit[] = useMemo(() => getCompetencyUnits(), []);
  const assessments: StudentCompetencyAssessment[] = useMemo(() => getCompetencyAssessments(), []);
  const violations: WorkshopViolationRecord[] = useMemo(() => getWorkshopViolations(), []);

  // Initialize with student if provided
  React.useEffect(() => {
    if (initialStudentId) {
      const match = students.find((s) => s.id === initialStudentId);
      if (match) {
        setSelectedStudent(match);
        setHasSearched(true);
      }
    }
  }, [initialStudentId, students]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setHasSearched(true);

    const cleanQuery = searchQuery.trim().toLowerCase();
    if (!cleanQuery) {
      setErrorMsg('يرجى إدخال الرقم القومي المكون من 14 رقماً أو كود الطالب أو اسمه للبحث.');
      setSelectedStudent(null);
      return;
    }

    // Search by National ID, Student Code, or Full Name
    const found = students.find(
      (s) =>
        s.nationalId.trim() === cleanQuery ||
        s.studentCode.toLowerCase() === cleanQuery ||
        s.fullName.toLowerCase().includes(cleanQuery)
    );

    if (found) {
      setSelectedStudent(found);
      setErrorMsg(null);
    } else {
      setSelectedStudent(null);
      setErrorMsg('لم يتم العثور على طالب يطابق بيانات البحث المدخلة. تأكد من صحة الرقم القومي أو كود الطالب.');
    }
  };

  // Selected student related data
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

  const studentViolations = useMemo(
    () => (selectedStudent ? violations.filter((v) => v.studentId === selectedStudent.id) : []),
    [selectedStudent, violations]
  );

  // Student Competency Units and Assessments
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

  // Workshop Attendance Percentage Calculation (out of standard 120 practical hours)
  const totalWorkshopHours = 120;
  const workshopAbsentHours = selectedStudent?.workshopAbsenceHours || 0;
  const workshopPresentHours = Math.max(0, totalWorkshopHours - workshopAbsentHours);
  const workshopAttendanceRate = Math.round((workshopPresentHours / totalWorkshopHours) * 100);
  const isWorkshopEligible = workshopAttendanceRate >= (config?.practicalMinAttendanceRate || 85);

  // Overall attendance rate (estimated 60 days per term)
  const totalTermDays = 60;
  const totalAbsenceDays = selectedStudent?.totalAbsenceDays || 0;
  const overallAttendanceRate = Math.max(0, Math.min(100, Math.round(((totalTermDays - totalAbsenceDays) / totalTermDays) * 100)));

  const handlePrint = () => {
    window.print();
  };

  const getResultBadge = (result?: CompetencyEvaluationResult) => {
    switch (result) {
      case 'first_attempt_pass':
        return {
          label: 'اجتاز من المرة الأولى',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />,
        };
      case 'second_attempt_pass':
        return {
          label: 'اجتاز من الفترة الثانية',
          bg: 'bg-blue-100 text-blue-900 border-blue-300',
          icon: <Check className="w-3.5 h-3.5 text-blue-700" />,
        };
      case 'remedial_program':
        return {
          label: 'برنامج علاجي',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-700" />,
        };
      case 'not_competent':
        return {
          label: 'لم يجتز بعد',
          bg: 'bg-red-100 text-red-900 border-red-300',
          icon: <XCircle className="w-3.5 h-3.5 text-red-700" />,
        };
      default:
        return {
          label: 'قيد التدريب',
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
          <span>جمهورية مصر العربية - وزارة التربية والتعليم والتعليم الفني</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline">قطاع التعليم الفني والتدريب المهني</span>
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
                <Sparkles className="w-3.5 h-3.5" />
                <span>بوابة الاستعلام الإلكتروني لأولياء الأمور والطلاب</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                {config.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                متابعة لحظية ومباشرة لحضور وغياب الطالب في الحصص النظرية وتدريب الورش العملية، ونسب استيفاء الجدارات (85%) والإنذارات الرسمية الصادرة.
              </p>
            </div>

            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 shadow-xl border-2 border-amber-400/40 shrink-0">
              <GraduationCap className="w-10 h-10 text-slate-950" />
            </div>
          </div>

          {/* Quick Search Form */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute right-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="أدخل الرقم القومي للطالب (14 رقماً) أو كود الطالب أو اسمه..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700 rounded-2xl pr-11 pl-4 py-3 text-sm text-white placeholder-slate-500 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer shadow-lg shadow-amber-500/10 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>استعلام فوري</span>
              </button>
            </form>
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
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">الرجاء إدخال الرقم القومي أو كود الطالب</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                يُرجى كتابة الرقم القومي المدون بشهادة الميلاد أو بطاقة الرقم القومي (14 رقماً) لعرض بطاقة المتابعة الكاملة.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            STUDENT RESULT DOSSIER CARD (PRINT READY)
           ========================================================================= */}
        {selectedStudent && (
          <div className="space-y-6">
            {/* Action Bar (No Print) */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 no-print">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-xs text-emerald-400">
                  تم استرجاع ملف الطالب المعتمد من المنظومة المدرسية
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 text-xs cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة تقرير المتابعة المعتمد (A4)</span>
                </button>
              </div>
            </div>

            {/* Printable A4 Dossier Wrapper */}
            <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-300 space-y-6 print:p-0 print:border-0 print:shadow-none print:rounded-none">
              {/* Ministry Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-slate-900">جمهورية مصر العربية</div>
                  <div className="text-slate-700">وزارة التربية والتعليم والتعليم الفني</div>
                  <div className="text-slate-700">{config.directorate}</div>
                  <div className="text-slate-700">{config.administration}</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto border border-slate-700">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h2 className="font-black text-sm sm:text-base text-slate-950">{config.name}</h2>
                  <div className="text-[11px] font-bold text-slate-600">
                    العام الدراسي: <span className="font-mono">{config.academicYear}</span>
                  </div>
                </div>

                <div className="text-left space-y-1 text-xs">
                  <div className="bg-amber-100 text-amber-950 font-black px-2.5 py-1 rounded-md border border-amber-300 inline-block text-[11px]">
                    استعلام ولي الأمر
                  </div>
                  <div className="text-slate-500 text-[10px]">تاريخ الاستعلام:</div>
                  <div className="font-mono text-[11px] font-bold text-slate-800">
                    {new Date().toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>

              {/* Title Strip */}
              <div className="bg-slate-900 text-white text-center py-2.5 rounded-xl font-black text-sm sm:text-base flex items-center justify-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <span>تقرير المتابعة والانضباط المدرسي والجدارات لولي الأمر</span>
              </div>

              {/* Student Personal Information Card */}
              <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">اسم الطالب الرباعي:</span>
                    <strong className="text-slate-950 text-sm font-black">{selectedStudent.fullName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">الرقم القومي للطالب:</span>
                    <strong className="font-mono text-slate-900 font-bold text-sm tracking-wider">
                      {selectedStudent.nationalId}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">كود الطالب / رقم الجلوس:</span>
                    <strong className="font-mono text-slate-900 font-bold text-sm">
                      {selectedStudent.studentCode}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500 block text-[11px]">التخصص / القسم:</span>
                    <strong className="text-purple-900 font-bold">{studentDept?.name || 'تخصص عام'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">الصف والفصل:</span>
                    <strong className="text-blue-900 font-bold">
                      {studentClass?.name} ({studentClass?.gradeName})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">الفترة الدراسية:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800">
                      {studentClass?.shift === 'evening' ? (
                        <>
                          <Moon className="w-3.5 h-3.5 text-purple-600" /> <span>فترة مسائية</span>
                        </>
                      ) : (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-600" /> <span>فترة صباحية</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">المعلم المشرف:</span>
                    <strong className="text-slate-800">{studentClass?.supervisorTeacherName}</strong>
                  </div>
                </div>
              </div>

              {/* KPI Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Absences */}
                <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 text-center space-y-0.5">
                  <span className="text-[11px] text-slate-600 font-bold block">إجمالي أيام الغياب</span>
                  <div className="text-2xl font-black text-slate-950">
                    {selectedStudent.totalAbsenceDays}{' '}
                    <span className="text-xs font-normal text-slate-500">يوم</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    منها {selectedStudent.consecutiveAbsenceDays} متصلة
                  </span>
                </div>

                {/* Overall Attendance Rate */}
                <div className="bg-slate-100 rounded-2xl p-3.5 border border-slate-200 text-center space-y-0.5">
                  <span className="text-[11px] text-slate-600 font-bold block">نسبة الحضور العامة</span>
                  <div
                    className={`text-2xl font-black ${
                      overallAttendanceRate >= 90
                        ? 'text-emerald-700'
                        : overallAttendanceRate >= 80
                        ? 'text-amber-700'
                        : 'text-red-700'
                    }`}
                  >
                    {overallAttendanceRate}%
                  </div>
                  <span className="text-[10px] text-slate-500">من إجمالي أيام الدراسة</span>
                </div>

                {/* Workshop Attendance 85% */}
                <div
                  className={`rounded-2xl p-3.5 border text-center space-y-0.5 ${
                    isWorkshopEligible
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  <span className="text-[11px] font-bold block">حضور الورش (85%)</span>
                  <div className="text-2xl font-black">{workshopAttendanceRate}%</div>
                  <span className="text-[10px] font-bold">
                    {isWorkshopEligible ? 'مستوفي لشرط التقييم' : 'معرض للحرمان'}
                  </span>
                </div>

                {/* Legal Warning Level */}
                <div
                  className={`rounded-2xl p-3.5 border text-center space-y-0.5 ${
                    selectedStudent.warningLevel === 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : selectedStudent.warningLevel === 1
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : selectedStudent.warningLevel === 2
                      ? 'bg-orange-50 border-orange-300 text-orange-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  <span className="text-[11px] font-bold block">الموقف الانضباطي</span>
                  <div className="text-base font-black mt-1">
                    {selectedStudent.warningLevel === 0
                      ? 'طالب منضبط'
                      : selectedStudent.warningLevel === 1
                      ? 'إنذار أول'
                      : selectedStudent.warningLevel === 2
                      ? 'إنذار ثان'
                      : 'قرار فصل'}
                  </div>
                  <span className="text-[10px]">
                    {selectedStudent.warningLevel === 0
                      ? 'سجل نظيف'
                      : `${selectedStudent.warningLevel} إجراء قانوني`}
                  </span>
                </div>
              </div>

              {/* =========================================================================
                  SECTION 1: COMPETENCY UNITS & EVALUATION MATRIX (منظومة الجدارات)
                 ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-700" />
                    <span>سجل تقييم وحدات الجدارات المهنية والمهارات العملية</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    الحد الأدنى للاجتياز: استيفاء كافة مخرجات التعلم
                  </span>
                </div>

                {studentUnits.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                    لم يتم تسجيل وحدات جدارات مخصصة لهذا الصف بعد.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">م</th>
                          <th className="p-2.5">كود الوحدة</th>
                          <th className="p-2.5">اسم وحدة الجدارات</th>
                          <th className="p-2.5 text-center">المخرجات</th>
                          <th className="p-2.5 text-center">نتيجة التقييم</th>
                          <th className="p-2.5 text-center">تاريخ التقييم / الاجتياز</th>
                          <th className="p-2.5">ملاحظات المقيم</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {studentUnits.map((u, idx) => {
                          const assessment = studentAssessments.find((a) => a.unitId === u.id);
                          const resultBadge = getResultBadge(assessment?.result);

                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-500">{idx + 1}</td>
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
                              <td className="p-2.5 text-[11px] text-slate-600">
                                {assessment?.notes || 'تم استيفاء معايير الأداء'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SECTION 2: OFFICIAL NOTICES & LEGAL NOTIFICATIONS (الإنذارات الرسمية)
                 ========================================================================= */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>الخطابات والإنذارات الرسمية الصادرة لولي الأمر</span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    وفقاً للقرارات الوزارية المنظمة للتعليم الفني
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
                            {nt.notes || `نظراً لتجاوز الطالب مدة الغياب المقررة قانوناً (${nt.consecutiveDays} أيام متصلة أو ${nt.totalDays} يوماً منفصلاً)، يُرجى التوجه لإدارة المدرسة لشئون الطلاب.`}
                          </p>
                        </div>

                        <div className="text-left text-[11px] space-y-1">
                          <div className="font-bold text-slate-800">تاريخ الإصدار: {nt.issueDate}</div>
                          <div>
                            {nt.isDelivered ? (
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold border border-emerald-300">
                                ✓ تم الاستلام بعلم الوصول ({nt.deliveryDate})
                              </span>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-300">
                                ⏳ قيد التسليم بالبريد المسجل
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* =========================================================================
                  SECTION 3: WORKSHOP SAFETY & DISCIPLINE (السلامة والتزويغ)
                 ========================================================================= */}
              {studentViolations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-600" />
                      <span>سجل مخالفات السلامة والورش المهنية</span>
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {studentViolations.map((v) => (
                      <div
                        key={v.id}
                        className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs flex items-center justify-between gap-3 text-orange-950"
                      >
                        <div>
                          <span className="font-bold block">
                            {v.violationType === 'workshop_escape'
                              ? '🚨 هروب وتزويغ من فترة تدريب الورش'
                              : '⚠️ مخالفة تعليمات السلامة ومهمات الوقاية'}
                          </span>
                          <span className="text-[11px] text-slate-600">{v.description || v.violationTitle}</span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-slate-700">{v.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Signature Footer */}
              <div className="pt-6 border-t-2 border-slate-900 grid grid-cols-3 text-center text-xs gap-4 font-bold text-slate-900">
                <div className="space-y-8">
                  <div>مسئول شئون الطلاب</div>
                  <div className="font-black text-slate-800">{config.studentAffairsHead}</div>
                </div>

                <div className="space-y-8">
                  <div>مشرف التخصص (العملي / العلمي)</div>
                  <div className="font-black text-slate-800">{studentDept?.practicalSupervisorName || studentDept?.scientificSupervisorName || 'مشرف التخصص'}</div>
                </div>

                <div className="space-y-8">
                  <div>يعتمد مدير عام المدرسة</div>
                  <div className="font-black text-slate-950">{config.managerName}</div>
                </div>
              </div>

              {/* Watermark & Security Note */}
              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                هذا التقرير مستخرج إلكترونياً من المنظومة الرسمية للغياب والورش والجدارات المهنية • كود التحقق الرقمي:{' '}
                <span className="font-mono text-slate-600">
                  {selectedStudent.id.toUpperCase()}-{config.academicYear.replace(/\s+/g, '')}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Developer Credit Footer */}
      <DeveloperCreditFooter className="pb-4 no-print" />
    </div>
  );
};

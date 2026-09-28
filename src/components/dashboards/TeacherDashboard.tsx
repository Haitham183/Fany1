'use client';

import React, { useMemo } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  User,
  AttendanceRecord,
  CompetencyUnit,
} from '@/types';
import { ActionableKpiCard } from './ActionableKpiCard';
import {
  getCompetencyUnits,
  getCompetencyAssessments,
} from '@/lib/storage';
import {
  Wrench,
  CheckCircle2,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  Printer,
  ShieldAlert,
  Award,
  CalendarCheck,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TeacherDashboardProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onSelectClassForAttendance?: (classId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  students,
  departments,
  classes,
  attendance,
  currentUser,
  onNavigate,
  onSelectClassForAttendance,
}) => {
  // Filter classes assigned to teacher or fall back to teacher's department classes
  const assignedClasses = useMemo(() => {
    if (currentUser.assignedClassIds && currentUser.assignedClassIds.length > 0) {
      return classes.filter((c) => currentUser.assignedClassIds?.includes(c.id));
    }
    if (currentUser.departmentId) {
      return classes.filter((c) => c.departmentId === currentUser.departmentId);
    }
    return classes.slice(0, 3);
  }, [classes, currentUser]);

  const assignedClassIds = useMemo(() => new Set(assignedClasses.map((c) => c.id)), [assignedClasses]);

  const teacherStudents = useMemo(() => {
    return students.filter((s) => assignedClassIds.has(s.classId));
  }, [students, assignedClassIds]);

  const teacherStudentIds = useMemo(() => new Set(teacherStudents.map((s) => s.id)), [teacherStudents]);

  // Today's Workshop Attendance for Teacher's Classes
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayRecords = useMemo(() => {
    return attendance.filter((a) => a.date === todayDateStr && assignedClassIds.has(a.classId));
  }, [attendance, todayDateStr, assignedClassIds]);

  const todayPresent = todayRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
  const todayRate = todayRecords.length > 0 ? Math.round((todayPresent / todayRecords.length) * 100) : 91;

  // Students in Teacher's classes below 85% workshop attendance
  const atRiskStudents = useMemo(() => {
    return teacherStudents.filter((s) => {
      const rate = s.workshopAttendanceRate ?? s.attendanceRate ?? 100;
      return rate < 85 || s.totalAbsenceDays >= 5;
    });
  }, [teacherStudents]);

  // Competency Units & Assessments
  const allUnits = useMemo(() => getCompetencyUnits(), []);
  const teacherUnits = useMemo(() => {
    if (currentUser.departmentId) {
      return allUnits.filter((u) => u.departmentId === currentUser.departmentId);
    }
    return allUnits.slice(0, 4);
  }, [allUnits, currentUser]);

  const allAssessments = useMemo(() => getCompetencyAssessments(), []);
  const teacherAssessments = useMemo(() => {
    return allAssessments.filter((a) => teacherStudentIds.has(a.studentId));
  }, [allAssessments, teacherStudentIds]);

  const pendingAssessmentsCount = useMemo(() => {
    // Count student-unit pairs not yet evaluated or in remedial
    return Math.max(0, teacherStudents.length * Math.max(1, teacherUnits.length) - teacherAssessments.length);
  }, [teacherStudents, teacherUnits, teacherAssessments]);

  return (
    <div className="space-y-5">
      {/* Teacher Workshop Cockpit Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-amber-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" /> ورشة التدريب العملي والجدارات
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                نمط ورشة سريع ⚡
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مرحباً يا هندسة، {currentUser.name}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تحضير سريع لطلاب الورش بضغطة واحدة، تقييم بطاقات الملاحظة والأدلة، ورصد مخالفات السلامة المهنية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="warning"
              size="md"
              leftIcon={<CalendarCheck className="w-4 h-4 text-slate-950" />}
              onClick={() => onNavigate('attendance')}
            >
              تحضير ورشة اليوم السريع
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Award className="w-4 h-4" />}
              onClick={() => onNavigate('competencies')}
            >
              رصد تقييم الجدارات
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Actionable KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionableKpiCard
          title="طلابي في الورش والفصول"
          value={teacherStudents.length}
          subtitle={`${assignedClasses.length} فصول / مجموعات ورش`}
          icon={<Users className="w-5 h-5" />}
          variant="slate"
          onClick={() => onNavigate('class_rosters')}
          actionHint="قوائم الطلاب"
        />

        <ActionableKpiCard
          title="نسبة حضور ورشي اليوم"
          value={`${todayRate}%`}
          subtitle={todayRecords.length > 0 ? 'تم الرصد لورش اليوم' : 'جاهز للرصد السريع'}
          icon={<CalendarCheck className="w-5 h-5" />}
          variant={todayRate >= 85 ? 'emerald' : 'amber'}
          onClick={() => onNavigate('attendance')}
          actionHint="فتح سجل التحضير"
        />

        <ActionableKpiCard
          title="طلاب في خطر الحرمان (<85%)"
          value={atRiskStudents.length}
          subtitle="تجاوزوا حد غياب الورش المسموح"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="red"
          badgeText={atRiskStudents.length > 0 ? 'تنبيه' : undefined}
          onClick={() => onNavigate('safety')}
          actionHint="فحص الغياب"
        />

        <ActionableKpiCard
          title="تقييمات مخرجات معلقة"
          value={pendingAssessmentsCount}
          subtitle="بطاقات ملاحظة وفحص منتج"
          icon={<Award className="w-5 h-5" />}
          variant="purple"
          onClick={() => onNavigate('competencies')}
          actionHint="تقييم المخرجات"
        />
      </div>

      {/* Assigned Classes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Classes List (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>فصول وورش التدريب الموكلة إليك</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                اضغط على أي فصل لبدء التحضير الفوري أو رصد التقييمات
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => onNavigate('class_rosters')}>
              طباعة القوائم A4
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedClasses.map((cls) => {
              const classStudents = students.filter((s) => s.classId === cls.id);
              const isRecordedToday = todayRecords.some((r) => r.classId === cls.id);

              return (
                <div
                  key={cls.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 bg-slate-50/60 dark:bg-slate-800/40 transition flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-900 dark:text-slate-100 text-sm">
                        فصل {cls.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isRecordedToday
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {isRecordedToday ? '✓ تم التحضير' : 'لم يُحضر بعد'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      قسم: <b>{cls.departmentName || 'عام'}</b> • القوة: <b>{classStudents.length} طالب</b>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => {
                        if (onSelectClassForAttendance) onSelectClassForAttendance(cls.id);
                        onNavigate('attendance');
                      }}
                    >
                      تحضير الورشة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => onNavigate('competencies')}
                    >
                      الجدارات
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workshop Safety & Quick Checklist (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>تعليمات السلامة بالورش</span>
            </h3>
            <span className="text-[10px] font-bold bg-red-100 text-red-900 px-2 py-0.5 rounded-md">
              إلزامي
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div
              onClick={() => onNavigate('safety')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>1. فحص مهمات الوقاية الشخصية (PPE)</span>
                <span className="text-amber-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                التأكد من ارتداء الأفرول وحذاء الأمان ونظارات الحماية قبل تشغيل الماكينات
              </p>
            </div>

            <div
              onClick={() => onNavigate('safety')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>2. رصد حالات التزويغ أو الهروب</span>
                <span className="text-amber-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تسجيل أي طالب يغادر الورشة دون إذن مسبق لاتخاذ الإجراء الانضباطي
              </p>
            </div>

            <div
              onClick={() => onNavigate('competencies')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>3. توثيق أدلة الأداء والمنتج في البورتفوليو</span>
                <span className="text-purple-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                حفظ بطاقات الملاحظة ونماذج فحص المنتجات استعداداً للمحقق الداخلي
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

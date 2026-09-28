'use client';

import React, { useState, useMemo } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  CompetencyUnit,
} from '@/types';
import { ActionableKpiCard } from './ActionableKpiCard';
import { getCompetencyUnits, getCompetencyAssessments } from '@/lib/storage';
import {
  UserCheck,
  AlertTriangle,
  Flame,
  Award,
  Calendar,
  Wrench,
  CheckCircle2,
  MailWarning,
  Phone,
  HelpCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ParentDashboardProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  notices: OfficialNotice[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  selectedStudentId?: string;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({
  students,
  departments,
  classes,
  notices,
  attendance,
  currentUser,
  onNavigate,
  selectedStudentId,
}) => {
  // Identify parent's child/children
  const parentStudents = useMemo(() => {
    if (selectedStudentId) {
      const matched = students.filter((s) => s.id === selectedStudentId);
      if (matched.length > 0) return matched;
    }
    // Match by phone, guardian name, or fallback to first student
    const matched = students.filter(
      (s) =>
        s.guardianPhone === currentUser.phone ||
        s.guardianPhone === currentUser.username ||
        s.guardianName?.includes(currentUser.name)
    );
    return matched.length > 0 ? matched : students.slice(0, 1);
  }, [students, currentUser, selectedStudentId]);

  const [activeChildIndex, setActiveChildIndex] = useState(0);
  const currentStudent = parentStudents[activeChildIndex] || parentStudents[0] || students[0];

  const studentClass = useMemo(() => {
    return classes.find((c) => c.id === currentStudent?.classId);
  }, [classes, currentStudent]);

  const studentDept = useMemo(() => {
    return departments.find((d) => d.id === currentStudent?.departmentId);
  }, [departments, currentStudent]);

  const studentNotices = useMemo(() => {
    return notices.filter((n) => n.studentId === currentStudent?.id);
  }, [notices, currentStudent]);

  // CBE Units & Progress
  const allUnits = useMemo(() => getCompetencyUnits(), []);
  const studentUnits = useMemo(() => {
    return allUnits.filter(
      (u) => u.departmentId === currentStudent?.departmentId && u.gradeLevel === currentStudent?.gradeLevel
    );
  }, [allUnits, currentStudent]);

  const allAssessments = useMemo(() => getCompetencyAssessments(), []);
  const studentAssessments = useMemo(() => {
    return allAssessments.filter((a) => a.studentId === currentStudent?.id);
  }, [allAssessments, currentStudent]);

  const passedUnitsCount = useMemo(() => {
    return studentAssessments.filter(
      (a) => a.result === 'first_attempt_pass' || a.result === 'second_attempt_pass'
    ).length;
  }, [studentAssessments]);

  if (!currentStudent) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-black text-slate-900 dark:text-white">لم يتم العثور على بيانات الطالب</h3>
        <p className="text-xs text-slate-500">يرجى مراجعة إدارة المدرسة لربط حساب ولي الأمر بملف الطالب.</p>
      </div>
    );
  }

  // Legal Limits Law 139
  const totalAbs = currentStudent.totalAbsenceDays || 0;
  const consecAbs = currentStudent.consecutiveAbsenceDays || 0;
  const remainingToExpulsion = Math.max(0, 30 - totalAbs);
  const remainingToWarning1 = Math.max(0, 10 - totalAbs);

  const workshopRate = currentStudent.workshopAttendanceRate ?? 92;
  const isWorkshopEligible = workshopRate >= 85;

  return (
    <div className="space-y-5">
      {/* Multiple Children Tabs */}
      {parentStudents.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
          {parentStudents.map((child, idx) => (
            <button
              key={child.id}
              onClick={() => setActiveChildIndex(idx)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                idx === activeChildIndex
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              👨‍🎓 {child.fullName}
            </button>
          ))}
        </div>
      )}

      {/* Student Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-blue-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-400" /> بوابة متابعة ولي الأمر المباشرة
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                حالة القيد: {currentStudent.status || 'منتظم'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              ملف الطالب: {currentStudent.fullName}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              الصف: <b>{studentClass?.name || 'الأول'}</b> • تخصص: <b>{studentDept?.name || 'صناعي عام'}</b> • كود الطالب: <span className="font-mono">{currentStudent.studentCode}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Award className="w-4 h-4 text-amber-400" />}
              onClick={() => onNavigate('student_report')}
            >
              تقرير بطاقة الطالب (A4)
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Primary Interactive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Absence Meter */}
        <ActionableKpiCard
          title="عداد الغياب التراكمي (مادة 25)"
          value={`${totalAbs} / 30 يوم`}
          subtitle={
            totalAbs >= 30
              ? 'تجاوز حد الفصل القانوني'
              : totalAbs >= 10
              ? `متبقي ${remainingToExpulsion} يوم على الفصل`
              : `متبقي ${remainingToWarning1} أيام على الإنذار الأول`
          }
          icon={<Clock className="w-5 h-5" />}
          variant={totalAbs >= 20 ? 'red' : totalAbs >= 10 ? 'amber' : 'emerald'}
          badgeText={totalAbs >= 10 ? 'متابعة مطلوبة' : 'منضبط'}
          onClick={() => onNavigate('student_report')}
          actionHint="تفاصيل الغياب"
        />

        {/* Workshop Attendance */}
        <ActionableKpiCard
          title="نسبة حضور الورش العملية (الحد 85%)"
          value={`${workshopRate}%`}
          subtitle={isWorkshopEligible ? 'مستوفٍ للتدريب والتقييم' : 'تنبيه: معرض للحرمان من التقييم'}
          icon={<Wrench className="w-5 h-5" />}
          variant={isWorkshopEligible ? 'emerald' : 'red'}
          badgeText={isWorkshopEligible ? 'مستوفٍ' : 'تحت الحد'}
          onClick={() => onNavigate('student_report')}
          actionHint="حضور الورش"
        />

        {/* CBE Competency Units */}
        <ActionableKpiCard
          title="اجتياز وحدات الجدارات (CBE)"
          value={`${passedUnitsCount} / ${Math.max(1, studentUnits.length)}`}
          subtitle="وحدات تم اجتيازها بجدارة"
          icon={<Award className="w-5 h-5" />}
          variant="purple"
          onClick={() => onNavigate('competencies')}
          actionHint="نتائج التقييم"
        />

        {/* Official School Notices */}
        <ActionableKpiCard
          title="الإنذارات والإخطارات الرسمية"
          value={studentNotices.length}
          subtitle={studentNotices.length > 0 ? 'يوجد إخطارات مسجلة' : 'لا توجد إنذارات مسجلة'}
          icon={<MailWarning className="w-5 h-5" />}
          variant={studentNotices.length > 0 ? 'red' : 'slate'}
          onClick={() => onNavigate('notices')}
          actionHint="عرض الإنذارات"
        />
      </div>

      {/* 2-Column Insight: Absence Meter & School Direct Communication */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Absence Bar & Legal Clarification (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>مؤشر الانضباط وقانون التعليم رقم 139 لسنة 1981</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                متابعة الغياب المتصل والمنفصل لتفادي إجراءات الإنذار والفصل
              </p>
            </div>

            <span className="text-[11px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-xl">
              حد الفصل: 30 منفصل / 15 متصل
            </span>
          </div>

          {/* Visual Progress Bars */}
          <div className="space-y-4">
            {/* Separate Absence */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">الغياب المنفصل التراكمي:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {totalAbs} من أصل 30 يوماً ({Math.round((totalAbs / 30) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalAbs >= 25
                      ? 'bg-red-600'
                      : totalAbs >= 15
                      ? 'bg-amber-500'
                      : totalAbs >= 10
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (totalAbs / 30) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 أيام</span>
                <span>10 أيام (إنذار 1)</span>
                <span>20 يوماً (إنذار 2)</span>
                <span>30 يوماً (فصل)</span>
              </div>
            </div>

            {/* Consecutive Absence */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">الغياب المتصل الأخير:</span>
                <span className="font-mono text-slate-900 dark:text-white">
                  {consecAbs} من أصل 15 يوماً ({Math.round((consecAbs / 15) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    consecAbs >= 12
                      ? 'bg-red-600'
                      : consecAbs >= 8
                      ? 'bg-amber-500'
                      : consecAbs >= 5
                      ? 'bg-yellow-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (consecAbs / 15) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0 أيام</span>
                <span>5 أيام (إنذار 1)</span>
                <span>10 أيام (إنذار 2)</span>
                <span>15 يوماً (فصل)</span>
              </div>
            </div>
          </div>

          {/* Legal Guidance Box */}
          <div className="bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-3.5 text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
            💡 <strong>توجيه لولي الأمر:</strong> في حال كان غياب الطالب ناتجاً عن ظرف مرضي، يرجى تقديم التقرير الطبي المعتمد من التأمين الصحي لشئون الطلاب خلال أسبوع من تاريخ الغياب لخصم الأيام قانونياً من عداد الغياب.
          </div>
        </div>

        {/* School Contacts & Support (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>التواصل مع المدرسة</span>
            </h3>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
              مكتب الدعم
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                مكتب وكيل شئون الطلاب
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                لتقديم الأعذار الطبية والاستفسار عن الإنذارات
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                مكتب الأخصائي الاجتماعي
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                لطلب موعد مقابلة إرشادية أو دراسة ظروف الطالب
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                رئيس قسم {studentDept?.name || 'التخصص'}
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                لمتابعة مخرجات الجدارات ومواعيد البرامج العلاجية
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  getVerificationRecords,
} from '@/lib/storage';
import {
  Award,
  ShieldCheck,
  Clock,
  Wrench,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Sparkles,
  Users,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeptHeadDashboardProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const DeptHeadDashboard: React.FC<DeptHeadDashboardProps> = ({
  students,
  departments,
  classes,
  attendance,
  currentUser,
  onNavigate,
}) => {
  const userDept = departments.find((d) => d.id === currentUser.departmentId) || departments[0];

  const deptStudents = useMemo(() => {
    return students.filter((s) => s.departmentId === userDept?.id);
  }, [students, userDept]);

  const deptClasses = useMemo(() => {
    return classes.filter((c) => c.departmentId === userDept?.id);
  }, [classes, userDept]);

  // Competency Units of this department
  const allUnits = useMemo(() => getCompetencyUnits(), []);
  const deptUnits = useMemo(() => {
    return allUnits.filter((u) => u.departmentId === userDept?.id);
  }, [allUnits, userDept]);

  const allAssessments = useMemo(() => getCompetencyAssessments(), []);
  const deptStudentIds = new Set(deptStudents.map((s) => s.id));
  const deptAssessments = useMemo(() => {
    return allAssessments.filter((a) => deptStudentIds.has(a.studentId));
  }, [allAssessments, deptStudentIds]);

  // Remedial Students Count (remedial_program or not_competent in any unit outcome)
  const remedialAssessments = deptAssessments.filter(
    (a) => a.result === 'remedial_program' || a.result === 'not_competent'
  );
  const remedialStudentsCount = new Set(remedialAssessments.map((a) => a.studentId)).size;

  // Verifications drawn
  const allVerifications = useMemo(() => getVerificationRecords(), []);
  const deptVerifications = allVerifications.filter((v) =>
    deptUnits.some((u) => u.id === v.unitId)
  );

  // Workshop Attendance rate for this department
  const deptAttendance = attendance.filter((a) => deptStudentIds.has(a.studentId) && a.periodType === 'workshop');
  const deptPresent = deptAttendance.filter((a) => a.status === 'present' || a.status === 'late').length;
  const deptWorkshopRate =
    deptAttendance.length > 0
      ? Math.round((deptPresent / deptAttendance.length) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Department Head Action Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-amber-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-amber-400" /> إدارة التخصص والتحقق المهني
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                قسم {userDept?.name} ({userDept?.code})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مرحباً، {currentUser.name} (رئيس قسم {userDept?.name})
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              متابعة مصفوفة تقييم الجدارات، سحب عينات التحقق الداخلي بالخوارزمية العشوائية المعتمدة، والإشراف على البرامج العلاجية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="warning"
              size="md"
              leftIcon={<ShieldCheck className="w-4 h-4 text-slate-950" />}
              onClick={() => onNavigate('competencies')}
            >
              سحب عينة تحقق جديدة (PRNG)
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<Clock className="w-4 h-4" />}
              onClick={() => onNavigate('competencies')}
            >
              الخطة الزمنية للتقييم
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Actionable KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionableKpiCard
          title="وحدات الجدارات المقررة بالقسم"
          value={deptUnits.length}
          subtitle="وحدات تدريبية وفق منهجية CBE"
          icon={<Award className="w-5 h-5" />}
          variant="purple"
          onClick={() => onNavigate('competencies')}
          actionHint="إدارة الوحدات"
        />

        <ActionableKpiCard
          title="طلاب قيد البرنامج العلاجي"
          value={remedialStudentsCount}
          subtitle="يحتاجون تدريباً تكميلياً واختبار دور ثانٍ"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="amber"
          badgeText={remedialStudentsCount > 0 ? 'متابعة' : undefined}
          onClick={() => onNavigate('competencies')}
          actionHint="فتح البرامج العلاجية"
        />

        <ActionableKpiCard
          title="نسبة حضور الورش العملية بالقسم"
          value={`${deptWorkshopRate}%`}
          subtitle="الحد اللائحي للأهلية: 85%"
          icon={<Wrench className="w-5 h-5" />}
          variant={deptWorkshopRate >= 85 ? 'emerald' : 'red'}
          badgeText={deptWorkshopRate < 85 ? 'تحت الحد' : undefined}
          onClick={() => onNavigate('safety')}
          actionHint="تقرير ورش القسم"
        />

        <ActionableKpiCard
          title="عينات التحقق الداخلي المعتمدة"
          value={deptVerifications.length}
          subtitle="عينات عشوائية مطابقة للائحة"
          icon={<ShieldCheck className="w-5 h-5" />}
          variant="blue"
          onClick={() => onNavigate('competencies')}
          actionHint="سجل التحقق"
        />
      </div>

      {/* Department Units Status Overview */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600" />
              <span>موقف وحدات الجدارات ومعدل الاجتياز بالقسم</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              متابعة مخرجات التعلم ومعايير الأداء لكل وحدة في تخصص {userDept?.name}
            </p>
          </div>

          <Button variant="ghost" size="sm" onClick={() => onNavigate('competencies')}>
            عرض تفاصيل الجدارات
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {deptUnits.map((unit) => {
            const unitAssessments = deptAssessments.filter((a) => a.unitId === unit.id);
            const competentCount = unitAssessments.filter(
              (a) => a.result === 'first_attempt_pass' || a.result === 'second_attempt_pass'
            ).length;
            const passRate =
              unitAssessments.length > 0
                ? Math.round((competentCount / unitAssessments.length) * 100)
                : 0;

            return (
              <div
                key={unit.id}
                onClick={() => onNavigate('competencies')}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50/50 dark:bg-slate-800/40 transition cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10.5px] font-bold text-purple-700 dark:text-purple-300">
                      {unit.code}
                    </span>
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {unit.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">
                    {unit.totalHours} ساعة
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>نسبة الجدارة والاجتياز:</span>
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {passRate}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full"
                      style={{ width: `${passRate}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10.5px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>المخرجات: <b>{unit.outcomesCount || unit.outcomes?.length || 2} مخرجات</b></span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-0.5">
                    تقييم الوحدة &larr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

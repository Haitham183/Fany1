import React, { useMemo } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
  EarlyWarningAlert,
} from '@/types';
import { getSmartEarlyWarnings } from '@/lib/storage';
import {
  Users,
  Percent,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Wrench,
  Building2,
  FileText,
  Calendar,
  Zap,
  Car,
  Snowflake,
  Cog,
  Cpu,
  ArrowUpRight,
  ShieldAlert,
  BookOpen,
  GraduationCap,
  Bell,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  notices: OfficialNotice[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  departments,
  classes,
  notices,
  attendance,
  currentUser,
  onNavigate,
}) => {
  // Compute High-Level Metrics
  const totalStudentsCount = students.length;
  const warning1Count = students.filter((s) => s.warningLevel === 1).length;
  const warning2Count = students.filter((s) => s.warningLevel === 2).length;
  const expulsionCount = students.filter((s) => s.warningLevel === 3).length;
  const cleanStudentsCount = students.filter((s) => s.warningLevel === 0).length;

  // Real-time Attendance Rate (e.g., today's attendance calculation)
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayAttendanceRecords = attendance.filter((a) => a.date === todayDateStr);
  const todayPresent = todayAttendanceRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
  const todayTotal = todayAttendanceRecords.length;
  const todayAttendanceRate = totalStudentsCount > 0 && todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

  // Workshop Attendance vs Theoretical
  const workshopRecords = attendance.filter((a) => a.periodType === 'workshop');
  const workshopPresent = workshopRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
  const workshopRate = totalStudentsCount > 0 && workshopRecords.length > 0 ? Math.round((workshopPresent / workshopRecords.length) * 100) : 0;

  // Smart Early Warnings
  const earlyWarnings = useMemo(() => getSmartEarlyWarnings(), []);
  const criticalWarnings = earlyWarnings.filter((w) => w.severity === 'critical');
  const attentionWarnings = earlyWarnings.filter((w) => w.severity === 'warning');

  // Department Icon Mapper
  const getDeptIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'Car':
        return <Car className="w-5 h-5 text-blue-500" />;
      case 'Snowflake':
        return <Snowflake className="w-5 h-5 text-cyan-500" />;
      case 'Cog':
        return <Cog className="w-5 h-5 text-slate-600" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-emerald-500" />;
      default:
        return <Wrench className="w-5 h-5 text-slate-500" />;
    }
  };

  // Urgent attention students (Warning level > 0)
  const criticalStudents = students.filter((s) => s.warningLevel > 0).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-700 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-amber-500/30 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> لوحة القيادة والمتابعة الميدانية
              </span>
              <span className="text-[11px] text-slate-400">
                مرحبا بك، {currentUser.name} ({currentUser.roleTitle})
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white leading-normal">
                مؤشرات الانضباط المدرسي وحضور الورش الصناعية
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-2xl leading-relaxed mt-0.5">
                نظام رصد لحظي متقدم لربط الفصول النظرية بورش التدريب العملي، مع معالجة قانونية آلية للإنذارات وفقاً لقرارات وزارة التربية والتعليم والتعليم الفني المصرية.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80">
            {/* Role Scoped Primary Actions */}
            <button
              onClick={() => onNavigate('attendance')}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" /> {currentUser.role === 'teacher' ? 'تسجيل حضور فصولي اليوم' : 'رصد غياب ورشة / فصل'}
            </button>

            <button
              onClick={() => onNavigate('competencies')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> منظومة الجدارات 85%
            </button>

            <button
              onClick={() => onNavigate('ai_prediction')}
              className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-black px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer border border-indigo-400/40"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" /> التنبؤ الذكي بالتسرب والرسوب (AI)
            </button>

            <button
              onClick={() => onNavigate('class_rosters')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" /> {currentUser.role === 'teacher' ? 'طباعة قوائم فصلي (A4)' : 'قوائم الفصول المعتمدة'}
            </button>

            <button
              onClick={() => onNavigate('student_report')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <GraduationCap className="w-3.5 h-3.5" /> تقرير ملف الطالب (A4)
            </button>

            <button
              onClick={() => onNavigate('safety')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> سجل السلامة والتزويغ
            </button>

            {(currentUser.role === 'principal' || currentUser.role === 'affairs_deputy' || currentUser.role === 'affairs_officer') && (
              <>
                <button
                  onClick={() => onNavigate('census')}
                  className="bg-teal-700 hover:bg-teal-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" /> الإحصاء الصباحي
                </button>
                <button
                  onClick={() => onNavigate('ministry_sheets')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> السجلات الوزارية (1 سر)
                </button>
                <button
                  onClick={() => onNavigate('notices')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 text-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-red-400" /> الإنذارات ({notices.length})
                </button>
              </>
            )}

            {currentUser.role === 'dept_head' && (
              <button
                onClick={() => onNavigate('departments')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5" /> متابعة ورش القسم
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Smart Early Warnings & Proactive Engine Banner (Idea #3) */}
      {earlyWarnings.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-red-950/30 text-white rounded-3xl p-5 border border-amber-500/40 shadow-lg space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-2">
                  <span>محرك التنبيهات والمخاطر الاستباقية الذكية</span>
                  <span className="bg-red-500 text-white text-[10.5px] px-2 py-0.5 rounded-full font-mono">
                    {earlyWarnings.length} تنبيه نشط
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  كشف لحظي مبكر للطلاب المعرضين للإنذارات أو الحرمان من تقييم الجدارات (قبل وقوع المخالفة)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {earlyWarnings.slice(0, 3).map((w) => (
              <div
                key={w.id}
                className={`p-3.5 rounded-2xl border text-xs space-y-2 flex flex-col justify-between ${
                  w.severity === 'critical'
                    ? 'bg-red-950/40 border-red-800/80 text-red-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      {w.severity === 'critical' ? (
                        <Flame className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      )}
                      <span>{w.title}</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        w.severity === 'critical' ? 'bg-red-900 text-red-100' : 'bg-amber-900 text-amber-100'
                      }`}
                    >
                      {w.severity === 'critical' ? 'حرج' : 'تنبيه'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{w.message}</p>
                </div>

                {w.targetTab && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onNavigate(w.targetTab!)}
                      className="bg-slate-900/90 hover:bg-slate-800 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>{w.actionLabel || 'اتخاذ إجراء'}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold">إجمالي طلاب المدرسة</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalStudentsCount}</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <span>{cleanStudentsCount} طالب منتظم 100%</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 shadow-inner">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Daily Attendance Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold">نسبة الحضور العامة اليوم</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{todayAttendanceRate}%</div>
            <div className="text-[11px] text-slate-400 font-medium">
              {totalStudentsCount === 0
                ? 'لا يوجد طلاب مسجلون بالمدرسة'
                : todayTotal === 0
                ? 'لم يُسجل رصد حضور اليوم بعد'
                : todayAttendanceRate >= 85
                ? 'نسبة ممتازة ومطابقة للمستهدف'
                : 'أقل من النسبة المستهدفة'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Workshop Attendance Adherence */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold">حضور الورش العملية</div>
            <div className="text-2xl sm:text-3xl font-black text-amber-600">{workshopRate}%</div>
            <div className="text-[11px] text-amber-700 font-semibold">
              {totalStudentsCount === 0
                ? 'لا يوجد طلاب مسجلون'
                : workshopRecords.length === 0
                ? 'لا توجد حصص ورش مسجلة'
                : workshopRate >= 85
                ? 'مستوفٍ لنسبة الجدارات (85%)'
                : 'تنبيه: أقل من نسبة الجدارات (85%)'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Legal Warnings Count */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-bold">حالات الخطر والإنذارات</div>
            <div className="text-2xl sm:text-3xl font-black text-red-600">
              {warning1Count + warning2Count + expulsionCount}
            </div>
            <div className="text-[11px] text-red-700 font-semibold">
              {expulsionCount} قرار فصل | {warning2Count + warning1Count} إنذار
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Left Department Stats, Right Urgent Actions & At-Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Overview (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  الأقسام الصناعية والتخصصية بالمدرسة
                </h3>
                <p className="text-xs text-slate-500">
                  معدل التزام وتواجد الطلاب في ورش كل قسم
                </p>
              </div>
            </div>
          </div>

          {/* Department List in 2-column compact grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {departments.length === 0 ? (
              <div className="col-span-full p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                لا توجد أقسام مسجلة حالياً بالمدرسة. يمكنك إضافة وتعديل الأقسام من شاشة الإعدادات.
              </div>
            ) : (
              departments.map((dept) => {
                const deptStudents = students.filter((s) => s.departmentId === dept.id);
                const deptAbsences = deptStudents.reduce((acc, curr) => acc + curr.totalAbsenceDays, 0);
                const avgAbsence = deptStudents.length > 0 ? (deptAbsences / deptStudents.length).toFixed(1) : '0';
                const progressPercentage =
                  deptStudents.length > 0
                    ? Math.max(0, Math.min(100, Math.round(100 - Number(avgAbsence) * 3)))
                    : 0;

                return (
                  <div
                    key={dept.id}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-white shadow-2xs border border-slate-200 flex items-center justify-center shrink-0">
                          {getDeptIcon(dept.iconName)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate" title={dept.name}>
                            {dept.name}
                          </h4>
                          <div className="text-[10px] text-slate-500 truncate">
                            <span className="font-mono font-bold text-slate-600">{dept.code}</span> • <span>{deptStudents.length} طالب</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <span className="text-xs font-black text-slate-900">{progressPercentage}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          progressPercentage > 90
                            ? 'bg-emerald-500'
                            : progressPercentage > 80
                            ? 'bg-amber-500'
                            : progressPercentage > 0
                            ? 'bg-red-500'
                            : 'bg-slate-300'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Urgent Attention Students & Quick Legal Action (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    حالات تستوجب إجراءات قانونية فورية
                  </h3>
                  <p className="text-xs text-slate-500">
                    الطلاب الذين تخطوا مدد الغياب القانونية
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('notices')}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                عرض الكل <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 mt-2">
              {criticalStudents.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  لا توجد حالات تخطي للمدد القانونية حالياً. جميع الطلاب منضبطون.
                </div>
              ) : (
                criticalStudents.map((student) => {
                  const studentClass = classes.find((c) => c.id === student.classId);

                  return (
                    <div key={student.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 text-xs">{student.fullName}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
                              student.warningLevel === 3
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : student.warningLevel === 2
                                ? 'bg-orange-100 text-orange-800 border-orange-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            {student.warningLevel === 3
                              ? 'قرار فصل'
                              : student.warningLevel === 2
                              ? 'إنذار ثان'
                              : 'إنذار أول'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {studentClass?.name} | غياب: <strong className="text-red-600">{student.totalAbsenceDays} يوم</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('notices')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold px-2.5 py-1 rounded-lg transition"
                      >
                        إصدار النموذج
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Legal Tip Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 leading-relaxed">
            <strong>ملاحظة إدارية لمدير المدرسة:</strong> الإنذار الأول يُرسل بالبريد المسجل بعلم الوصول بعد 5 أيام غياب متصل أو 10 منفصل. والإنذار الثاني بعد 10 متصل أو 20 منفصل، ويصدر قرار الفصل بعد 15 يوماً متصلاً أو 30 يوماً منفصلاً.
          </div>
        </div>
      </div>
    </div>
  );
};

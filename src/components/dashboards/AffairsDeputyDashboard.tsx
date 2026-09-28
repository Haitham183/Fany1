'use client';

import React, { useState } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  OfficialNotice,
  User,
  AttendanceRecord,
} from '@/types';
import { ActionableKpiCard } from './ActionableKpiCard';
import {
  Users,
  AlertTriangle,
  Flame,
  FileCheck2,
  Clock,
  Printer,
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRightLeft,
  MailWarning,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AffairsDeputyDashboardProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  notices: OfficialNotice[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onNavigateToStudentReport?: (studentId: string) => void;
}

export const AffairsDeputyDashboard: React.FC<AffairsDeputyDashboardProps> = ({
  students,
  departments,
  classes,
  notices,
  attendance,
  currentUser,
  onNavigate,
  onNavigateToStudentReport,
}) => {
  const [fastSearchQuery, setFastSearchQuery] = useState('');

  // 1. Students Approaching Warning 1 (e.g., 4 days consecutive or 8-9 days separate)
  const studentsNearWarning1 = students.filter(
    (s) =>
      s.warningLevel === 0 &&
      ((s.consecutiveAbsenceDays >= 4 && s.consecutiveAbsenceDays < 5) ||
        (s.totalAbsenceDays >= 8 && s.totalAbsenceDays < 10))
  );

  // 2. Students Approaching Expulsion (e.g., 12-14 days consecutive or 25-29 days separate)
  const studentsNearExpulsion = students.filter(
    (s) =>
      s.warningLevel < 3 &&
      ((s.consecutiveAbsenceDays >= 12 && s.consecutiveAbsenceDays < 15) ||
        (s.totalAbsenceDays >= 25 && s.totalAbsenceDays < 30))
  );

  // 3. Draft notices needing delivery/printing
  const draftNotices = notices.filter((n) => !n.isDelivered);

  // 4. Students with unexcused absence > 0
  const studentsWithAbsence = students.filter((s) => s.totalAbsenceDays > 0);

  // Filter for fast search
  const searchResults = fastSearchQuery.trim()
    ? students
        .filter(
          (s) =>
            s.fullName.includes(fastSearchQuery.trim()) ||
            s.studentCode.includes(fastSearchQuery.trim()) ||
            s.nationalId.includes(fastSearchQuery.trim())
        )
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-5">
      {/* Deputy Action Center Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-indigo-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" /> مكتب وكيل شئون الطلاب والانضباط
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                المادة 25 - قانون 139
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مرحباً، {currentUser.name} (وكيل شئون الطلاب)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              متابعة العدادات القانونية للغياب (5/10 للإنذار و 15/30 للفصل)، وتجهيز خطابات البريد المسجل بعلم الوصول.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="warning"
              size="md"
              leftIcon={<MailWarning className="w-4 h-4 text-slate-950" />}
              onClick={() => onNavigate('notices')}
            >
              طباعة الإنذارات المسودة ({draftNotices.length})
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<FileCheck2 className="w-4 h-4" />}
              onClick={() => onNavigate('affairs')}
            >
              سجل الأعذار الطبية
            </Button>
          </div>
        </div>

        {/* Instant Student Finder Bar */}
        <div className="pt-2 border-t border-indigo-900/60 relative">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute start-3.5 top-3.5 text-indigo-300 pointer-events-none" />
            <input
              type="text"
              placeholder="🔍 استعلام فوري عن طالب (الاسم، كود الطالب، أو الرقم القومي)..."
              value={fastSearchQuery}
              onChange={(e) => setFastSearchQuery(e.target.value)}
              className="w-full ps-10 pe-3.5 py-2.5 bg-indigo-950/70 border border-indigo-700/60 rounded-xl text-xs font-bold text-white placeholder:text-indigo-300/70 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-30 start-0 end-0 max-w-md mt-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {searchResults.map((std) => (
                <div
                  key={std.id}
                  onClick={() => {
                    if (onNavigateToStudentReport) onNavigateToStudentReport(std.id);
                    else onNavigate('student_report');
                  }}
                  className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900 dark:text-slate-100 block">{std.fullName}</span>
                    <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-mono">
                      كود: {std.studentCode} • غياب: <strong className="text-red-600">{std.totalAbsenceDays} يوم</strong>
                    </span>
                  </div>
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    فتح البطاقة
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4 Interactive Actionable KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionableKpiCard
          title="طلاب قاربوا حد الإنذار الأول (8-9 أيام)"
          value={studentsNearWarning1.length}
          subtitle="إنذار مبكر قبل تجاوز 10 أيام منفصلة"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="amber"
          badgeText={studentsNearWarning1.length > 0 ? 'متابعة' : undefined}
          onClick={() => onNavigate('affairs')}
          actionHint="عرض الطلاب"
        />

        <ActionableKpiCard
          title="طلاب قاربوا حد الفصل النهائي (25+ يوم)"
          value={studentsNearExpulsion.length}
          subtitle="تجاوز 25 يوماً منفصلة أو 12 متصلة"
          icon={<Flame className="w-5 h-5" />}
          variant="red"
          badgeText="حرج"
          onClick={() => onNavigate('notices')}
          actionHint="إخطار أولياء الأمور"
        />

        <ActionableKpiCard
          title="إنذارات مسودة تتطلب الطباعة والإرسال"
          value={draftNotices.length}
          subtitle="خطابات بريدية مسجلة بعلم الوصول"
          icon={<MailWarning className="w-5 h-5" />}
          variant="purple"
          onClick={() => onNavigate('notices')}
          actionHint="طباعة النماذج"
        />

        <ActionableKpiCard
          title="سجل 41 - دفاتر الغياب الرسمية"
          value={studentsWithAbsence.length}
          subtitle="طالب مسجل لهم غياب فعلي"
          icon={<FileCheck2 className="w-5 h-5" />}
          variant="slate"
          onClick={() => onNavigate('official_sheets')}
          actionHint="طباعة السجل 41"
        />
      </div>

      {/* 2-Column List: Students Near Expulsion & Action Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Critical Students Near Expulsion (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" />
                <span>الطلاب في المنطقة الحرجة قانونياً (اقتراب من الفصل)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يجب إخطار الأخصائي الاجتماعي وولي الأمر فوراً قبل إصدار قرار الحرمان
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => onNavigate('affairs')}>
              سجل الطلاب
            </Button>
          </div>

          {studentsNearExpulsion.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              🎉 لا يوجد أي طالب يقترب من حد الفصل النهائي حالياً.
            </div>
          ) : (
            <div className="space-y-2.5">
              {studentsNearExpulsion.map((student) => {
                const sClass = classes.find((c) => c.id === student.classId);
                const sDept = departments.find((d) => d.id === student.departmentId);

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      if (onNavigateToStudentReport) onNavigateToStudentReport(student.id);
                      else onNavigate('student_report');
                    }}
                    className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {student.fullName}
                        </span>
                        <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.2 rounded font-black font-mono">
                          {student.totalAbsenceDays} يوم غياب
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400">
                        فصل: <b>{sClass?.name}</b> • قسم: <b>{sDept?.name}</b> • ولي الأمر: {student.guardianPhone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-700 dark:text-red-400">
                        متبقي {30 - student.totalAbsenceDays} أيام للفصل &larr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Legal Affairs Checklist (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>إجراءات الشئون المطلوبة</span>
            </h3>
            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md">
              لائحي
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div
              onClick={() => onNavigate('affairs')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>1. اعتماد تقارير التأمين الصحي للأعذار</span>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                خصم أيام الإجازات المرضية المعتمدة لرفع الإيقاف عن الطلاب
              </p>
            </div>

            <div
              onClick={() => onNavigate('notices')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>2. تصدير كشف إنذارات البريد (نموذج 2)</span>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                تسليم الخطابات لمكتب البريد مع الاحتفاظ بإيصال الإيداع المسجل
              </p>
            </div>

            <div
              onClick={() => onNavigate('official_sheets')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>3. استخراج دفتر 41 المستمر</span>
                <span className="text-indigo-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                الطباعة الرسمية لسجل الغياب الشهري المعتمد
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

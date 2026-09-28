'use client';

import React, { useMemo } from 'react';
import {
  Department,
  SchoolClass,
  Student,
  User,
  AttendanceRecord,
  SocialCaseRecord,
} from '@/types';
import { ActionableKpiCard } from './ActionableKpiCard';
import { getSocialCases } from '@/lib/storage';
import {
  HeartHandshake,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  PhoneCall,
  FileText,
  Calendar,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SocialWorkerDashboardProps {
  students: Student[];
  departments: Department[];
  classes: SchoolClass[];
  attendance: AttendanceRecord[];
  currentUser: User;
  onNavigate: (tab: string) => void;
  onOpenCase?: (caseId: string) => void;
}

export const SocialWorkerDashboard: React.FC<SocialWorkerDashboardProps> = ({
  students,
  departments,
  classes,
  attendance,
  currentUser,
  onNavigate,
  onOpenCase,
}) => {
  const allCases = useMemo(() => getSocialCases(), []);

  // Active cases (pending or in_progress)
  const activeCases = useMemo(() => {
    return allCases.filter((c) => c.status === 'in_progress' || c.status === 'pending');
  }, [allCases]);

  // Urgent / High priority cases
  const urgentCases = useMemo(() => {
    return allCases.filter((c) => (c.priority === 'urgent' || c.priority === 'high') && c.status !== 'resolved' && c.status !== 'closed');
  }, [allCases]);

  // Resolved cases
  const resolvedCases = useMemo(() => {
    return allCases.filter((c) => c.status === 'resolved');
  }, [allCases]);

  // Auto-referred students from Student Affairs / Law 139 (absence >= 5 days or escape count > 0) not yet having a case
  const existingCaseStudentIds = useMemo(() => new Set(allCases.map((c) => c.studentId)), [allCases]);
  const autoReferredStudents = useMemo(() => {
    return students.filter(
      (s) =>
        (s.totalAbsenceDays >= 5 || s.consecutiveAbsenceDays >= 3 || (s.workshopEscapeCount && s.workshopEscapeCount > 0)) &&
        !existingCaseStudentIds.has(s.id)
    );
  }, [students, existingCaseStudentIds]);

  // Cases not followed up for more than 14 days
  const unmonitoredCases = useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const fourteenDaysStr = fourteenDaysAgo.toISOString().split('T')[0];

    return activeCases.filter((c) => {
      const lastSession = c.sessions && c.sessions.length > 0 ? c.sessions[c.sessions.length - 1].date : c.referralDate;
      return lastSession < fourteenDaysStr;
    });
  }, [activeCases]);

  return (
    <div className="space-y-5">
      {/* Social Worker Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-3xl shadow-xl border border-teal-800/40 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5 text-teal-400" /> مكتب الإرشاد النفسي والرعاية الاجتماعية
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-[11px] px-2 py-0.5 rounded-full font-bold">
                سرية تامة 🔒
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              مرحباً، {currentUser.name} (الأخصائي الاجتماعي والتربوي)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              دراسة الحالات السلوكية والظروف الطارئة، معالجة أسباب الغياب المتكرر والتسرب، وتوثيق الجلسات الإرشادية الفردية والجماعية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="warning"
              size="md"
              leftIcon={<Flame className="w-4 h-4 text-slate-950" />}
              onClick={() => onNavigate('social_portal')}
            >
              الحالات العاجلة ({urgentCases.length})
            </Button>
            <Button
              variant="outline"
              size="md"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={() => onNavigate('social_portal')}
            >
              فتح سجل الحالات
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Interactive Actionable KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ActionableKpiCard
          title="حالات قيد المتابعة النشطة"
          value={activeCases.length}
          subtitle={`${urgentCases.length} حالة مصنفة عالية الخطورة`}
          icon={<HeartHandshake className="w-5 h-5" />}
          variant="blue"
          onClick={() => onNavigate('social_portal')}
          actionHint="عرض الحالات"
        />

        <ActionableKpiCard
          title="إحالات ذكية جديدة (تكرار غياب/هروب)"
          value={autoReferredStudents.length}
          subtitle="طلاب تجاوزوا 5 أيام غياب أو رُصد لهم هروب"
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="amber"
          badgeText={autoReferredStudents.length > 0 ? 'مطلوب فتح ملف' : undefined}
          onClick={() => onNavigate('social_portal')}
          actionHint="فتح دراسة حالة"
        />

        <ActionableKpiCard
          title="حالات بدون متابعة منذ 14+ يوماً"
          value={unmonitoredCases.length}
          subtitle="تتطلب جلسة إرشادية جديدة لتحديث الموقف"
          icon={<Clock className="w-5 h-5" />}
          variant={unmonitoredCases.length > 0 ? 'red' : 'slate'}
          badgeText={unmonitoredCases.length > 0 ? 'تذكير' : undefined}
          onClick={() => onNavigate('social_portal')}
          actionHint="جدولة جلسات"
        />

        <ActionableKpiCard
          title="حالات تم علاجها واستقرار سلوكها"
          value={resolvedCases.length}
          subtitle="تم انتظام الطالب وتحسن مستواه العملي"
          icon={<CheckCircle2 className="w-5 h-5" />}
          variant="emerald"
          onClick={() => onNavigate('social_portal')}
          actionHint="سجل الحالات المعالجة"
        />
      </div>

      {/* 2-Column Insight: Urgent Cases & Action Protocol */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Active & Urgent Cases (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-600" />
                <span>الحالات الاجتماعية التي تتطلب متابعة وجلسات إرشادية</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                متابعة الخطة العلاجية والتواصل مع ولي الأمر ومعلمي الورش
              </p>
            </div>

            <Button variant="ghost" size="sm" onClick={() => onNavigate('social_portal')}>
              عرض كل الحالات
            </Button>
          </div>

          {activeCases.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              🎉 لا توجد حالات مفتوحة حالياً. جميع الطلاب في حالة نفسية ودراسية مستقرة.
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeCases.slice(0, 5).map((sc) => {
                const sClass = classes.find((c) => c.id === sc.classId);
                const isUrgent = sc.priority === 'urgent' || sc.priority === 'high';

                return (
                  <div
                    key={sc.id}
                    onClick={() => {
                      if (onOpenCase) onOpenCase(sc.id);
                      else onNavigate('social_portal');
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-3 ${
                      isUrgent
                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:bg-red-50'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {sc.studentName}
                        </span>
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-black ${
                            sc.priority === 'urgent'
                              ? 'bg-red-600 text-white'
                              : sc.priority === 'high'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {sc.priority === 'urgent' ? 'عاجل جداً' : sc.priority === 'high' ? 'أولوية عالية' : 'متابعة دورية'}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {sc.category === 'absence_dropout_risk'
                            ? 'خطر تسرب وغياب'
                            : sc.category === 'workshop_escape_behavior'
                            ? 'هروب من الورش'
                            : sc.category === 'academic_competency_struggle'
                            ? 'تعثر جدارات'
                            : 'رعاية اجتماعية'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400">
                        فصل: <b>{sClass?.name || sc.className}</b> • الجلسات: <b>{sc.sessions?.length || 0} جلسة</b> • ولي الأمر: {sc.guardianPhone}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                        فتح دراسة الحالة &larr;
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Social Counseling Protocol Checklist (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>بروتوكول التدخل المهني</span>
            </h3>
            <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-md">
              تربوي
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div
              onClick={() => onNavigate('social_portal')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>1. المقابلة الإرشادية والتشخيص الأولي</span>
                <span className="text-teal-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                الاستماع للطالب وتحديد الأسباب الكامنة وراء الغياب أو المخالفة السلوكية
              </p>
            </div>

            <div
              onClick={() => onNavigate('social_portal')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>2. استدعاء ولي الأمر وإبرام العقد السلوكي</span>
                <span className="text-teal-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                إشراك الأسرة والتوقيع على التعهد المشترك لضمان انتظام الطالب
              </p>
            </div>

            <div
              onClick={() => onNavigate('social_portal')}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-400 transition cursor-pointer space-y-1"
            >
              <div className="font-black text-slate-900 dark:text-slate-100 flex items-center justify-between">
                <span>3. التنسيق مع معلم الورشة وشئون الطلاب</span>
                <span className="text-teal-600 font-bold">&larr;</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                متابعة التزام الطالب داخل الورشة وحصوله على فرصة التقييم العلاجي
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

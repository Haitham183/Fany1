'use client';

import React, { useState } from 'react';
import { DailyMorningCensus, SchoolConfig, User } from '@/types';
import { calculateDailyCensus } from '@/lib/storage';
import {
  Calendar,
  Printer,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Flame,
  ShieldCheck,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface DailyCensusViewProps {
  schoolConfig: SchoolConfig;
  currentUser: User;
}

export const DailyCensusView: React.FC<DailyCensusViewProps> = ({
  schoolConfig,
  currentUser,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const censusData: DailyMorningCensus = calculateDailyCensus(selectedDate);

  const handlePrint = () => {
    window.print();
  };

  const formattedDateArabic = new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(selectedDate));

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-emerald-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> الإحصاء اليومي الصباحي وسجل 5 سلوك ومواظبة
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            تقرير الإحصاء الصباحي وحصر الغياب المجمع للمدرسة
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            بيان إحصائي فوري لحضور وغياب الطلاب بالصفوف والأقسام وطباعة نموذج (5 سلوك ومواظبة).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold focus:outline-hidden"
            />
          </div>

          <button
            onClick={handlePrint}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl shadow-md transition flex items-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Printer className="w-4 h-4" /> طباعة الإحصاء الرسمي (A4)
          </button>
        </div>
      </div>

      {/* Metric Cards (No Print) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 no-print">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-bold">إجمالي المقيدين</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{censusData.totalEnrolled}</div>
          <div className="text-[10px] text-slate-400">طالب بجميع الصفوف</div>
        </div>

        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 shadow-sm">
          <div className="text-xs text-emerald-700 font-bold">الحاضرون اليوم</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{censusData.totalPresent}</div>
          <div className="text-[10px] text-emerald-700 font-semibold">بنسبة {censusData.overallAttendanceRate}%</div>
        </div>

        <div className="bg-red-50 rounded-2xl p-4 border border-red-200 shadow-sm">
          <div className="text-xs text-red-700 font-bold">الغائبون اليوم</div>
          <div className="text-2xl font-black text-red-900 mt-1">{censusData.totalAbsent}</div>
          <div className="text-[10px] text-red-700 font-semibold">غياب بدون عذر</div>
        </div>

        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
          <div className="text-xs text-amber-700 font-bold">المتأخرون عن الطابور</div>
          <div className="text-2xl font-black text-amber-900 mt-1">{censusData.totalLate}</div>
          <div className="text-[10px] text-amber-700">تم رصدهم بالبوابة</div>
        </div>

        <div className="bg-purple-50 rounded-2xl p-4 border border-purple-200 shadow-sm">
          <div className="text-xs text-purple-700 font-bold">التزويغ من الورش</div>
          <div className="text-2xl font-black text-purple-900 mt-1">{censusData.totalEscaped}</div>
          <div className="text-[10px] text-purple-700">هروب بعد الحصة الأولى</div>
        </div>
      </div>

      {/* Official Printable Report Document (A4 Official Layout) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-lg print-card official-border space-y-6">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex justify-between items-start text-xs font-bold text-slate-800 leading-relaxed">
            <div className="text-right space-y-0.5">
              <div>جمهورية مصر العربية</div>
              <div>وزارة التربية والتعليم والتعليم الفني</div>
              <div>{schoolConfig.directorate}</div>
              <div>{schoolConfig.administration}</div>
              <div className="text-amber-900 font-black text-sm">{schoolConfig.name}</div>
            </div>

            <div className="text-center">
              <div className="inline-block border-2 border-slate-900 px-5 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-50 shadow-2xs">
                استمارة الإحصاء اليومي الصباحي لحضور وغياب الطلاب (سجل 5 مواظبة)
              </div>
              <div className="text-xs text-slate-600 font-bold mt-1.5">
                عن يوم: {formattedDateArabic}
              </div>
            </div>

            <div className="text-left space-y-0.5 font-mono text-xs" dir="rtl">
              <div><span className="text-slate-600">التاريخ:</span> {censusData.date}</div>
              <div><span className="text-slate-600">العام الدراسي:</span> {schoolConfig.academicYear}</div>
              <div>
                <span className="text-slate-600">الفترة:</span>{' '}
                <strong className="text-slate-950 font-bold">
                  {schoolConfig.schoolShiftType === 'two_shifts'
                    ? 'فترتان (صباحية ومسائية)'
                    : schoolConfig.schoolShiftType === 'single_full_day'
                    ? 'فترة ممتدة (يوم كامل)'
                    : 'فترة واحدة صباحية'}
                </strong>
              </div>
              <div>
                <span className="text-slate-600">أيام الدراسة:</span>{' '}
                <strong className="text-slate-950 font-bold">
                  {schoolConfig.workDaysScheme === 'sat_to_thu'
                    ? 'السبت إلى الخميس (6 أيام)'
                    : schoolConfig.workDaysScheme === 'sat_to_wed'
                    ? 'السبت إلى الأربعاء (5 أيام)'
                    : 'الأحد إلى الخميس (5 أيام)'}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Summary Table by Grade Level (حصر حسب الصفوف الدراسية) */}
        <div className="space-y-2">
          <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>أولاً: حصر الحضور والغياب حسب الصفوف والفرق الدراسية:</span>
          </h4>

          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                <tr>
                  <th className="p-2 border-l border-slate-900">م</th>
                  <th className="p-2 border-l border-slate-900 text-right">الصف / الفرقة الدراسية</th>
                  <th className="p-2 border-l border-slate-900">إجمالي المقيدين</th>
                  <th className="p-2 border-l border-slate-900">عدد الحاضرين</th>
                  <th className="p-2 border-l border-slate-900">عدد الغائبين</th>
                  <th className="p-2">نسبة الحضور %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {censusData.byGrade.map((grade, idx) => (
                  <tr key={grade.gradeLevel} className="font-semibold">
                    <td className="p-2 border-l border-slate-300">{idx + 1}</td>
                    <td className="p-2 border-l border-slate-300 text-right font-bold text-slate-900">
                      {grade.gradeName}
                    </td>
                    <td className="p-2 border-l border-slate-300">{grade.enrolled}</td>
                    <td className="p-2 border-l border-slate-300 text-emerald-800 font-bold">{grade.present}</td>
                    <td className="p-2 border-l border-slate-300 text-red-700 font-bold">{grade.absent}</td>
                    <td className="p-2 font-black">{grade.rate}%</td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-100 font-black border-t-2 border-slate-900 text-slate-950">
                  <td colSpan={2} className="p-2.5 border-l border-slate-900 text-right">
                    إجمالي عام المدرسة
                  </td>
                  <td className="p-2.5 border-l border-slate-900">{censusData.totalEnrolled}</td>
                  <td className="p-2.5 border-l border-slate-900 text-emerald-800">{censusData.totalPresent}</td>
                  <td className="p-2.5 border-l border-slate-900 text-red-700">{censusData.totalAbsent}</td>
                  <td className="p-2.5 text-slate-950 text-sm">{censusData.overallAttendanceRate}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Summary Table by Department (حصر حسب الأقسام الصناعية والورش) */}
        <div className="space-y-2 pt-2">
          <h4 className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-2">
            <span>ثانياً: حصر الحضور والتواجد في الورش حسب التخصصات الصناعية:</span>
          </h4>

          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                <tr>
                  <th className="p-2 border-l border-slate-900">م</th>
                  <th className="p-2 border-l border-slate-900 text-right">القسم / التخصص الصناعي</th>
                  <th className="p-2 border-l border-slate-900">المقيدون بالقسم</th>
                  <th className="p-2 border-l border-slate-900">حاضرو الورش</th>
                  <th className="p-2 border-l border-slate-900">غائبون عن الورش</th>
                  <th className="p-2">نسبة انتظام الورشة %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {censusData.byDepartment.map((dept, idx) => (
                  <tr key={dept.departmentId} className="font-semibold">
                    <td className="p-2 border-l border-slate-300">{idx + 1}</td>
                    <td className="p-2 border-l border-slate-300 text-right font-bold text-slate-900">
                      {dept.departmentName}
                    </td>
                    <td className="p-2 border-l border-slate-300">{dept.enrolled}</td>
                    <td className="p-2 border-l border-slate-300 text-emerald-800 font-bold">{dept.present}</td>
                    <td className="p-2 border-l border-slate-300 text-red-700 font-bold">{dept.absent}</td>
                    <td className="p-2 font-black">{dept.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures Area */}
        <div className="mt-10 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-950">
          <div className="space-y-8">
            <div>مسئول الإحصاء وشئون الطلاب</div>
            <div className="text-slate-900">{schoolConfig.studentAffairsAgent || '.....................'}</div>
          </div>

          <div className="space-y-8">
            <div>وكيل شئون الطلاب</div>
            <div className="text-slate-900">{schoolConfig.studentAffairsHead || '.....................'}</div>
          </div>

          <div className="space-y-8">
            <div>يعتمد / مدير عام المدرسة</div>
            <div className="text-slate-900">{schoolConfig.managerName || '.....................'}</div>
          </div>
        </div>

        {/* Official Seal box */}
        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200">
          <span>* يُرسل أصل هذا الإحصاء يومياً لقسم التعليم الفني الصناعي بالإدارة التعليمية</span>
          <div className="w-20 h-20 border-2 border-dashed border-slate-400 rounded-full flex items-center justify-center text-center text-[10px] text-slate-400 font-bold">
            خاتم شعار الجمهورية
          </div>
          <span>تحريراً في: {censusData.date}</span>
        </div>
      </div>
    </div>
  );
};

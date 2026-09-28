'use client';

import React, { useState } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  AttendanceRecord,
} from '@/types';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  AlertOctagon,
  FileText,
  BookOpen,
} from 'lucide-react';
import { ClassRostersView } from '@/components/ClassRostersView';

interface OfficialMinistrySheetsViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  attendance: AttendanceRecord[];
  schoolConfig: SchoolConfig;
  currentUser: User;
}

export const OfficialMinistrySheetsView: React.FC<OfficialMinistrySheetsViewProps> = ({
  students,
  classes,
  departments,
  attendance,
  schoolConfig,
  currentUser,
}) => {
  const [activeSheetTab, setActiveSheetTab] = useState<'sheet_1_ser' | 'register_41' | 'register_5' | 'class_rosters'>('sheet_1_ser');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('أكتوبر');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classStudents = students
    .filter((s) => s.classId === selectedClass?.id)
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base' }));

  // Grade 1 students for Register 41
  const grade1Students = students
    .filter((s) => {
      if (s.gradeLevel !== 1) return false;
      if (selectedDeptId !== 'all' && s.departmentId !== selectedDeptId) return false;
      return true;
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base' }));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-blue-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-500/20 text-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" /> السجلات والدفاتر الوزارية الرسمية
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-blue-300">
            دفاتر شئون الطلاب الرسمية المعتمدة لوزارة التربية والتعليم
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            استخراج وطباعة السجلات القانونية: شيت 1 سر الشهري، سجل 41 مستجدين، وسجل 5 سلوك ومواظبة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> طباعة السجل (A4)
          </button>
        </div>
      </div>

      {/* Tabs Navigation (No Print) */}
      <div className="flex flex-wrap gap-2.5 border-b border-slate-200 pb-3 no-print">
        <button
          onClick={() => setActiveSheetTab('class_rosters')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeSheetTab === 'class_rosters'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" /> قوائم الفصول الدراسية المعتمدة (A4 / PDF)
        </button>

        <button
          onClick={() => setActiveSheetTab('sheet_1_ser')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeSheetTab === 'sheet_1_ser'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" /> مسودة شيت 1 سر الشهري (الغياب والإنذارات)
        </button>

        <button
          onClick={() => setActiveSheetTab('register_41')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeSheetTab === 'register_41'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" /> سجل 41 مستجدين (الصف الأول وقيد الطلاب)
        </button>

        <button
          onClick={() => setActiveSheetTab('register_5')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 ${
            activeSheetTab === 'register_5'
              ? 'bg-blue-700 text-white shadow-md ring-2 ring-blue-400/40'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-xs'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" /> سجل 5 سلوك ومواظبة الشامل
        </button>
      </div>

      {/* Filters (No Print) */}
      {activeSheetTab === 'sheet_1_ser' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">اختر الفصل الدراسي:</span>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - ({c.departmentName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">عن شهر:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {['أكتوبر', 'نوفمبر', 'ديسمبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو'].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeSheetTab === 'register_41' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center gap-3 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">تصفية حسب التخصص:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold p-2 text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">جميع تخصصات الصف الأول</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 1: مسودة شيت 1 سر الشهري
         ========================================================================= */}
      {activeSheetTab === 'sheet_1_ser' && selectedClass && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-lg print-card official-border space-y-6">
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start text-xs font-bold text-slate-800 leading-relaxed">
              <div className="text-right space-y-0.5">
                <div>جمهورية مصر العربية</div>
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{schoolConfig.directorate}</div>
                <div>{schoolConfig.administration}</div>
                <div className="text-blue-900 font-black text-sm">{schoolConfig.name}</div>
              </div>

              <div className="text-center">
                <div className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-50 shadow-2xs">
                  مسودة استمارة (1 سر) الشهرية للغياب والإنذارات القانونية
                </div>
                <div className="text-xs text-slate-700 font-bold mt-1.5">
                  عن شهر: <span className="font-black text-slate-950 underline">{selectedMonth}</span> - العام الدراسي {schoolConfig.academicYear}
                </div>
              </div>

              <div className="text-left space-y-0.5 font-mono text-xs">
                <div>الفصل: {selectedClass.name}</div>
                <div>القسم: {selectedClass.departmentName}</div>
                <div>المقيدين: {classStudents.length} طالب</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-center border-collapse whitespace-nowrap">
              <thead className="bg-slate-100 border-b border-slate-900 font-bold whitespace-nowrap">
                <tr className="whitespace-nowrap">
                  <th className="p-1.5 border-l border-slate-900 w-8 whitespace-nowrap">م</th>
                  <th className="p-1.5 border-l border-slate-900 text-right pr-2 whitespace-nowrap">اسم الطالب رباعي</th>
                  <th className="p-1.5 border-l border-slate-900 whitespace-nowrap">الرقم القومي</th>
                  <th className="p-1.5 border-l border-slate-900 whitespace-nowrap">غياب متصل</th>
                  <th className="p-1.5 border-l border-slate-900 whitespace-nowrap">غياب منفصل</th>
                  <th className="p-1.5 border-l border-slate-900 whitespace-nowrap">غياب الورش (ساعات)</th>
                  <th className="p-1.5 border-l border-slate-900 whitespace-nowrap">مستوى الإنذار</th>
                  <th className="p-1.5 whitespace-nowrap">الإجراء والشئون القانونية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-900 whitespace-nowrap">
                {classStudents.map((student, idx) => {
                  let warningText = 'طبيعي';
                  let warningStyle = 'text-emerald-800 font-bold';
                  let actionText = 'مستمر بالدراسة والورش';

                  if (student.warningLevel === 3 || student.consecutiveAbsenceDays >= 15 || student.totalAbsenceDays >= 30) {
                    warningText = 'قرار فصل قانوني';
                    warningStyle = 'text-red-700 font-black bg-red-50';
                    actionText = 'إصدار قرار فصل وتوجيه إخطار لولي الأمر';
                  } else if (student.warningLevel === 2 || student.consecutiveAbsenceDays >= 10 || student.totalAbsenceDays >= 20) {
                    warningText = 'إنذار ثان';
                    warningStyle = 'text-orange-700 font-bold bg-orange-50';
                    actionText = 'إنذار مسجل بعلم الوصول';
                  } else if (student.warningLevel === 1 || student.consecutiveAbsenceDays >= 5 || student.totalAbsenceDays >= 10) {
                    warningText = 'إنذار أول';
                    warningStyle = 'text-amber-700 font-bold bg-amber-50';
                    actionText = 'إرسال إنذار أول بكتاب موصى عليه';
                  }

                  return (
                    <tr key={student.id}>
                      <td className="p-2 border-l border-slate-300 font-bold">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-300 text-right font-bold">
                        {student.fullName}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                        {student.nationalId}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold font-mono">
                        {student.consecutiveAbsenceDays}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold font-mono">
                        {student.totalAbsenceDays}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono">
                        {student.workshopAbsenceHours || 0}
                      </td>
                      <td className={`p-2 border-l border-slate-300 ${warningStyle}`}>
                        {warningText}
                      </td>
                      <td className="p-2 text-right text-[11px]">{actionText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Signatures */}
          {(() => {
            const selectedClassDept = departments.find((d) => d.id === selectedClass.departmentId);
            const deptHeadName =
              selectedClassDept?.practicalSupervisorName ||
              selectedClassDept?.scientificSupervisorName ||
              selectedClassDept?.headName ||
              '............................';

            return (
              <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-4 gap-4 text-center text-xs font-bold text-slate-950">
                <div className="space-y-6">
                  <div>معلم الفصل / مشرف الورشة</div>
                  <div className="text-slate-800 font-medium">({selectedClass.supervisorTeacherName || '............................'})</div>
                </div>
                <div className="space-y-6">
                  <div>رئيس قسم ({selectedClass.departmentName})</div>
                  <div className="text-slate-800 font-medium">({deptHeadName})</div>
                </div>
                <div className="space-y-6">
                  <div>مسئول شيت 1 سر</div>
                  <div className="text-slate-800 font-medium">({schoolConfig.studentAffairsAgent || schoolConfig.studentAffairsHead})</div>
                </div>
                <div className="space-y-6">
                  <div>يعتمد / مدير عام المدرسة</div>
                  <div className="text-slate-800 font-medium">({schoolConfig.managerName})</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          TAB 2: سجل 41 مستجدين (الصف الأول الصناعي)
         ========================================================================= */}
      {activeSheetTab === 'register_41' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-lg print-card official-border space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start text-xs font-bold text-slate-800 leading-relaxed">
              <div className="text-right space-y-0.5">
                <div>جمهورية مصر العربية</div>
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{schoolConfig.directorate}</div>
                <div>{schoolConfig.administration}</div>
                <div className="text-blue-900 font-black text-sm">{schoolConfig.name}</div>
              </div>

              <div className="text-center">
                <div className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-50 shadow-2xs">
                  سجل (41 مستجدين) - قيد وقبول طلاب الصف الأول الصناعي
                </div>
                <div className="text-xs text-slate-700 font-bold mt-1.5">
                  العام الدراسي {schoolConfig.academicYear} - نظام ({schoolConfig.schoolSystemType === '3_years' ? '3 سنوات' : '3 و 5 سنوات متقدمة'})
                </div>
              </div>

              <div className="text-left space-y-0.5 font-mono text-xs">
                <div>تاريخ الطباعة: {new Date().toISOString().split('T')[0]}</div>
                <div>عدد المستجدين: {grade1Students.length} طالب</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                <tr>
                  <th className="p-2 border-l border-slate-900 w-10">م</th>
                  <th className="p-2 border-l border-slate-900">كود الطالب</th>
                  <th className="p-2 border-l border-slate-900 text-right">اسم الطالب رباعي</th>
                  <th className="p-2 border-l border-slate-900">الرقم القومي (14 رقم)</th>
                  <th className="p-2 border-l border-slate-900">تاريخ الميلاد</th>
                  <th className="p-2 border-l border-slate-900">القسم المنسق عليه</th>
                  <th className="p-2 border-l border-slate-900">ولي الأمر ووظيفته</th>
                  <th className="p-2 border-l border-slate-900">رقم الهاتف</th>
                  <th className="p-2">حالة القيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                {grade1Students.map((student, idx) => {
                  const dept = departments.find((d) => d.id === student.departmentId);
                  return (
                    <tr key={student.id}>
                      <td className="p-2 border-l border-slate-300 font-bold">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-300 font-mono font-bold text-blue-950">
                        {student.studentCode}
                      </td>
                      <td className="p-2 border-l border-slate-300 text-right font-bold">
                        {student.fullName}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                        {student.nationalId}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                        {student.birthDate}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold text-slate-900">
                        {dept?.name || 'عام'}
                      </td>
                      <td className="p-2 border-l border-slate-300 text-right text-[11px]">
                        {student.guardianName} ({student.guardianJob})
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-[11px]">
                        {student.guardianPhone}
                      </td>
                      <td className="p-2 font-bold text-emerald-800">{student.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-950">
            <div className="space-y-6">
              <div>لجنة القبول والتنسيق</div>
              <div className="text-slate-800 font-medium">({schoolConfig.studentAffairsAgent || 'مسئول التنسيق والقبول'})</div>
            </div>
            <div className="space-y-6">
              <div>رئيس قسم شئون الطلاب</div>
              <div className="text-slate-800 font-medium">({schoolConfig.studentAffairsHead})</div>
            </div>
            <div className="space-y-6">
              <div>يعتمد / مدير عام المدرسة</div>
              <div className="text-slate-800 font-medium">({schoolConfig.managerName})</div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: سجل 5 سلوك ومواظبة الشامل
         ========================================================================= */}
      {activeSheetTab === 'register_5' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-lg print-card official-border space-y-6">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-start text-xs font-bold text-slate-800 leading-relaxed">
              <div className="text-right space-y-0.5">
                <div>جمهورية مصر العربية</div>
                <div>وزارة التربية والتعليم والتعليم الفني</div>
                <div>{schoolConfig.directorate}</div>
                <div>{schoolConfig.administration}</div>
                <div className="text-blue-900 font-black text-sm">{schoolConfig.name}</div>
              </div>

              <div className="text-center">
                <div className="inline-block border-2 border-slate-900 px-6 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-50 shadow-2xs">
                  سجل (5 سلوك ومواظبة) العام الشامل لطلاب المدرسة
                </div>
                <div className="text-xs text-slate-700 font-bold mt-1.5">
                  العام الدراسي {schoolConfig.academicYear} - كشف المتابعة والانضباط المدرسي والورش
                </div>
              </div>

              <div className="text-left space-y-0.5 font-mono text-xs">
                <div>التاريخ: {new Date().toISOString().split('T')[0]}</div>
                <div>إجمالي الطلاب: {students.length} طالب</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-900 rounded-lg overflow-hidden">
            <table className="w-full text-xs text-center border-collapse">
              <thead className="bg-slate-100 border-b border-slate-900 font-bold">
                <tr>
                  <th className="p-2 border-l border-slate-900 w-10">م</th>
                  <th className="p-2 border-l border-slate-900 text-right">اسم الطالب</th>
                  <th className="p-2 border-l border-slate-900">القسم والفصل</th>
                  <th className="p-2 border-l border-slate-900">إجمالي أيام الغياب</th>
                  <th className="p-2 border-l border-slate-900">غياب بعذر معتمد</th>
                  <th className="p-2 border-l border-slate-900">غياب الورش (ساعات)</th>
                  <th className="p-2 border-l border-slate-900">مرات التزويغ</th>
                  <th className="p-2 border-l border-slate-900">الإنذار الأخير</th>
                  <th className="p-2">الملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-medium text-slate-900">
                {students.slice(0, 30).map((student, idx) => {
                  const dept = departments.find((d) => d.id === student.departmentId);
                  const cls = classes.find((c) => c.id === student.classId);
                  return (
                    <tr key={student.id}>
                      <td className="p-2 border-l border-slate-300 font-bold">{idx + 1}</td>
                      <td className="p-2 border-l border-slate-300 text-right font-bold">
                        {student.fullName}
                      </td>
                      <td className="p-2 border-l border-slate-300 text-slate-700">
                        {cls?.name} ({dept?.name})
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold font-mono">
                        {student.totalAbsenceDays}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-emerald-800">
                        {student.excusedAbsenceDays}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono">
                        {student.workshopAbsenceHours || 0}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-mono text-purple-800 font-bold">
                        {student.workshopEscapeCount || 0}
                      </td>
                      <td className="p-2 border-l border-slate-300 font-bold">
                        {student.warningLevel === 0 ? 'لا يوجد' : `إنذار ${student.warningLevel}`}
                      </td>
                      <td className="p-2 text-right text-[11px] text-slate-500">
                        {student.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-center text-xs font-bold text-slate-950">
            <div className="space-y-6">
              <div>مسئول سجل 5 مواظبة</div>
              <div>{schoolConfig.studentAffairsAgent || '............................'}</div>
            </div>
            <div className="space-y-6">
              <div>وكيل شئون الطلاب</div>
              <div>{schoolConfig.studentAffairsHead || '............................'}</div>
            </div>
            <div className="space-y-6">
              <div>يعتمد / مدير عام المدرسة</div>
              <div>{schoolConfig.managerName || '............................'}</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: قوائم الفصول الدراسية المعتمدة */}
      {activeSheetTab === 'class_rosters' && (
        <ClassRostersView
          students={students}
          classes={classes}
          departments={departments}
          schoolConfig={schoolConfig}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

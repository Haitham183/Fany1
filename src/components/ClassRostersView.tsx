'use client';

import React, { useState, useMemo } from 'react';
import {
  Student,
  SchoolClass,
  Department,
  SchoolConfig,
  User,
  AttendanceRecord,
} from '@/types';
import { getAttendance } from '@/lib/storage';
import { computeWeekDays } from '@/components/TeacherAttendanceTaker';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  Layers,
  FileDown,
  Sparkles,
  Grid,
  ListOrdered,
  Eye,
  ArrowUpDown,
  BookOpen,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface ClassRostersViewProps {
  students: Student[];
  classes: SchoolClass[];
  departments: Department[];
  schoolConfig: SchoolConfig;
  currentUser: User;
}

type RosterTemplateType = 'comprehensive' | 'attendance' | 'grades' | 'competencies';
type SortFieldType = 'name' | 'code' | 'nationalId' | 'status';

export const ClassRostersView: React.FC<ClassRostersViewProps> = ({
  students,
  classes,
  departments,
  schoolConfig,
  currentUser,
}) => {
  const isFullAdmin =
    currentUser.role === 'principal' ||
    currentUser.role === 'affairs_deputy' ||
    currentUser.role === 'affairs_officer';

  const defaultDept = !isFullAdmin && currentUser.departmentId ? currentUser.departmentId : 'all';

  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDept);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [rosterTemplate, setRosterTemplate] = useState<RosterTemplateType>('comprehensive');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortFieldType>('name');
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  // Attendance Records
  const attendanceRecords = useMemo(() => getAttendance(), [anchorDate, rosterTemplate]);

  // Dynamic Week Days based on calendar date & school schedule
  const weekDays = useMemo(() => {
    return computeWeekDays(anchorDate, schoolConfig.workDaysScheme || 'sun_to_thu');
  }, [anchorDate, schoolConfig.workDaysScheme]);

  const startDateStr = weekDays[0]?.date || '';
  const endDateStr = weekDays[weekDays.length - 1]?.date || '';

  const handlePrevWeek = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleCurrentWeek = () => {
    setAnchorDate(new Date());
  };

  // Filter Classes
  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDeptId !== 'all' && c.departmentId !== selectedDeptId) return false;
      if (selectedGrade !== 'all' && c.gradeLevel.toString() !== selectedGrade) return false;
      return true;
    });
  }, [classes, selectedDeptId, selectedGrade]);

  // Selected Class details
  const activeClass = classes.find((c) => c.id === selectedClassId) || filteredClasses[0] || classes[0];
  const activeDept = departments.find((d) => d.id === activeClass?.departmentId);

  // Filter & Sort Students for Single Class
  const classStudents = useMemo(() => {
    if (!activeClass) return [];
    let list = students.filter((s) => s.classId === activeClass.id);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.studentCode.toLowerCase().includes(q) ||
          s.nationalId.includes(q)
      );
    }

    return list.sort((a, b) => {
      if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true });
      if (sortBy === 'code') return a.studentCode.localeCompare(b.studentCode, 'ar', { numeric: true });
      if (sortBy === 'nationalId') return a.nationalId.localeCompare(b.nationalId);
      if (sortBy === 'status') return a.status.localeCompare(b.status, 'ar', { sensitivity: 'base' });
      return 0;
    });
  }, [students, activeClass, searchQuery, sortBy]);

  // Class Demographics Summary
  const regularCount = classStudents.filter((s) => s.status === 'منتظم').length;
  const servicesCount = classStudents.filter((s) => s.status === 'خدمات').length;
  const workersCount = classStudents.filter((s) => s.status === 'نظام عمال').length;
  const mergedCount = classStudents.filter((s) => s.status === 'دمج').length;

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel / CSV
  const handleExportCSV = (targetClass: SchoolClass, targetStudents: Student[]) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (rosterTemplate === 'comprehensive') {
      headers = [
        'م',
        'كود الطالب',
        'اسم الطالب رباعي',
        'الرقم القومي',
        'تاريخ الميلاد',
        'الحالة الدراسية',
        'هاتف التواصل',
        'العنوان',
      ];
      rows = targetStudents.map((s, idx) => [
        (idx + 1).toString(),
        s.studentCode,
        s.fullName,
        s.nationalId,
        s.birthDate || '',
        s.status,
        s.guardianPhone || '',
        s.address || '',
      ]);
    } else if (rosterTemplate === 'attendance') {
      headers = [
        'م',
        'كود الطالب',
        'اسم الطالب رباعي',
        'الحالة',
        ...weekDays.map((d) => `${d.dayOfWeek} (${d.formattedShort})`),
        'مجموع الغياب',
      ];
      rows = targetStudents.map((s, idx) => {
        const dayStatuses = weekDays.map((d) => {
          const rec = attendanceRecords.find((a) => a.studentId === s.id && a.date === d.date);
          if (rec?.status === 'present') return 'P';
          if (rec?.status === 'absent') return 'A';
          if (rec?.status === 'excused') return 'E';
          if (rec?.status === 'late') return 'L';
          return '-';
        });
        return [
          (idx + 1).toString(),
          s.studentCode,
          s.fullName,
          s.status,
          ...dayStatuses,
          s.totalAbsenceDays?.toString() || '0',
        ];
      });
    } else if (rosterTemplate === 'grades') {
      headers = ['م', 'كود الطالب', 'اسم الطالب رباعي', 'السلوك والمواظبة', 'التقييم التكويني', 'شهر 1', 'شهر 2', 'مهارات الورشة', 'المجموع'];
      rows = targetStudents.map((s, idx) => [
        (idx + 1).toString(),
        s.studentCode,
        s.fullName,
        '', '', '', '', '', '',
      ]);
    } else {
      headers = ['م', 'كود الطالب', 'اسم الطالب رباعي', 'ساعات الورشة', 'نسبة الحضور', 'حالة الجدارة'];
      rows = targetStudents.map((s, idx) => [
        (idx + 1).toString(),
        s.studentCode,
        s.fullName,
        s.workshopAbsenceHours?.toString() || '0',
        '92%',
        s.competencyStatus || 'مستوفٍ',
      ]);
    }

    const csvContent =
      '\uFEFF' +
      [
        `قائمة فصل: ${targetClass.name} - ${schoolConfig.name}`,
        `العام الدراسي: ${schoolConfig.academicYear} - التخصص: ${targetClass.departmentName}`,
        '',
        headers.join(','),
        ...rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `قائمة_${targetClass.name.replace(/[\/\s]/g, '_')}_${schoolConfig.academicYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render one class sheet
  const renderClassSheet = (targetClass: SchoolClass, targetStudents: Student[], isSingle: boolean = false) => {
    const dept = departments.find((d) => d.id === targetClass.departmentId);
    const regular = targetStudents.filter((s) => s.status === 'منتظم').length;
    const services = targetStudents.filter((s) => s.status === 'خدمات').length;
    const workers = targetStudents.filter((s) => s.status === 'نظام عمال').length;
    const merged = targetStudents.filter((s) => s.status === 'دمج').length;

    return (
      <div
        key={targetClass.id}
        className={`bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-400 shadow-xl print:shadow-none print:border-none print:p-0 print:m-0 space-y-4 ${
          !isSingle ? 'print-page-break' : ''
        }`}
      >
        {/* =========================================================================
            Official Egyptian Ministry of Education Header (A4 Certified)
           ========================================================================= */}
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
              <div className="inline-block border-2 border-slate-900 px-5 py-1.5 rounded-lg text-sm sm:text-base font-black text-slate-950 bg-slate-100 shadow-2xs">
                {rosterTemplate === 'comprehensive' && 'قائمة أسماء وبيانات طلاب الفصل (معتمدة)'}
                {rosterTemplate === 'attendance' && 'كشف رصد الحضور والغياب والتوقيعات اليومية'}
                {rosterTemplate === 'grades' && 'كشف رصد التقييمات ودرجات أعمال السنة'}
                {rosterTemplate === 'competencies' && 'كشف متابعة التدريب العملي والجدارات بالورش'}
              </div>
              <div className="text-xs font-bold text-slate-800">
                العام الدراسي: {schoolConfig.academicYear} • {schoolConfig.currentTerm}
                {rosterTemplate === 'attendance' && ` • الأسبوع: ${startDateStr} ↔ ${endDateStr}`}
              </div>
            </div>

            {/* Left Class Info */}
            <div className="text-left space-y-0.5" dir="rtl">
              <div><span className="text-slate-600">الصف:</span> {targetClass.gradeName}</div>
              <div><span className="text-slate-600">الشعبة / التخصص:</span> {targetClass.departmentName}</div>
              <div className="text-blue-900 font-black text-sm"><span className="text-slate-600">الفصل:</span> {targetClass.name}</div>
              <div>
                <span className="text-slate-600">الفترة:</span>{' '}
                <strong className="font-bold">{targetClass.shift === 'evening' ? 'مسائية 🌙' : 'صباحية ☀️'}</strong> | حجرة: {targetClass.roomNumber || '1'}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata & Demographics Strip */}
        <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-[11px] font-bold text-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>إجمالي مقيدي الفصل: <strong className="text-blue-900 text-xs font-black">{targetStudents.length}</strong> طالب</span>
            <span className="text-slate-400">|</span>
            <span>منتظم: <strong>{regular}</strong></span>
            <span>خدمات: <strong>{services}</strong></span>
            <span>عمال: <strong>{workers}</strong></span>
            <span>دمج: <strong>{merged}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span>رائد الفصل: <strong>{targetClass.supervisorTeacherName || 'مسئول الفصل'}</strong></span>
            <span className="text-slate-400">|</span>
            <span>مشرف العلمي: <strong>{dept?.scientificSupervisorName || '—'}</strong></span>
            <span className="text-slate-400">|</span>
            <span>مشرف العملي: <strong>{dept?.practicalSupervisorName || '—'}</strong></span>
          </div>
        </div>

        {/* =========================================================================
            Main Students Table (Strict Single-Line Format)
           ========================================================================= */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs border-2 border-slate-900 whitespace-nowrap">
            <thead>
              <tr className="bg-slate-200 text-slate-950 font-black border-b-2 border-slate-900 text-center whitespace-nowrap">
                <th className="py-1 px-1 border border-slate-900 w-7 whitespace-nowrap">م</th>
                <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">كود الطالب</th>
                <th className="py-1 px-2 border border-slate-900 text-right whitespace-nowrap">اسم الطالب رباعي</th>
                
                {rosterTemplate === 'comprehensive' && (
                  <>
                    <th className="py-1 px-1.5 border border-slate-900 w-28 whitespace-nowrap">الرقم القومي (14 رقم)</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-20 whitespace-nowrap">تاريخ الميلاد</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-14 whitespace-nowrap">الحالة</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-24 whitespace-nowrap">هاتف التواصل</th>
                    <th className="py-1 px-2 border border-slate-900 text-right whitespace-nowrap">العنوان ومحل الإقامة</th>
                  </>
                )}

                {rosterTemplate === 'attendance' && (
                  <>
                    <th className="py-1 px-1.5 border border-slate-900 w-14 whitespace-nowrap">الحالة</th>
                    {weekDays.map((d) => (
                      <th key={d.date} className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">
                        <div>{d.dayOfWeek}</div>
                        <div className="text-[10px] font-normal font-mono text-slate-700">{d.formattedShort}</div>
                      </th>
                    ))}
                    <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">مجموع الغياب</th>
                    <th className="py-1 px-2 border border-slate-900 w-28 whitespace-nowrap">توقيع المعلم</th>
                  </>
                )}

                {rosterTemplate === 'grades' && (
                  <>
                    <th className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">سلوك (10)</th>
                    <th className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">تقييم (20)</th>
                    <th className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">شهر 1 (15)</th>
                    <th className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">شهر 2 (15)</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">ورش عملي (40)</th>
                    <th className="py-1 px-1 border border-slate-900 w-14 whitespace-nowrap">المجموع (100)</th>
                    <th className="py-1 px-2 border border-slate-900 w-28 whitespace-nowrap">توقيع المقيم</th>
                  </>
                )}

                {rosterTemplate === 'competencies' && (
                  <>
                    <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">ساعات الورش</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-16 whitespace-nowrap">نسبة الحضور</th>
                    <th className="py-1 px-1.5 border border-slate-900 w-20 whitespace-nowrap">حالة التقييم</th>
                    <th className="py-1 px-2 border border-slate-900 w-24 whitespace-nowrap">قرار الجدارة</th>
                    <th className="py-1 px-2 border border-slate-900 w-32 whitespace-nowrap">توقيع المحقق الداخلي</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {targetStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 px-2 text-center text-slate-500 font-bold whitespace-nowrap">
                    لا يوجد طلاب مسجلين في هذا الفصل حتى الآن.
                  </td>
                </tr>
              ) : (
                targetStudents.map((student, index) => (
                  <tr
                    key={student.id}
                    className={`border-b border-slate-400 font-semibold whitespace-nowrap ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-amber-50 transition`}
                  >
                    <td className="py-1 px-1 border border-slate-900 text-center font-bold font-mono whitespace-nowrap text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-1 px-1.5 border border-slate-900 text-center font-mono text-[11px] whitespace-nowrap">
                      {student.studentCode}
                    </td>
                    <td className="py-1 px-2 border border-slate-900 font-bold text-slate-950 text-right whitespace-nowrap text-[11.5px]">
                      {student.fullName}
                    </td>

                    {rosterTemplate === 'comprehensive' && (
                      <>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono text-[11px] tracking-tight whitespace-nowrap">
                          {student.nationalId}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono text-[11px] whitespace-nowrap">
                          {student.birthDate || '2008-01-01'}
                        </td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center text-[11px] whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              student.status === 'منتظم'
                                ? 'bg-emerald-100 text-emerald-800'
                                : student.status === 'خدمات'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono text-[11px] whitespace-nowrap">
                          <span dir="ltr">{student.guardianPhone || '01000000000'}</span>
                        </td>
                        <td className="py-1 px-2 border border-slate-900 text-[10.5px] text-slate-800 text-right whitespace-nowrap">
                          {student.address || schoolConfig.administration}
                        </td>
                      </>
                    )}

                    {rosterTemplate === 'attendance' && (
                      <>
                        <td className="py-1 px-1.5 border border-slate-900 text-center text-[11px] whitespace-nowrap">
                          {student.status}
                        </td>
                        {weekDays.map((d) => {
                          const rec = attendanceRecords.find(
                            (a) => a.studentId === student.id && a.date === d.date
                          );
                          const st = rec?.status;
                          return (
                            <td key={d.date} className="py-1 px-1 border border-slate-900 text-center font-mono whitespace-nowrap">
                              {st === 'present' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  P
                                </span>
                              ) : st === 'absent' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black text-[11px] bg-red-100 text-red-900 border border-red-300">
                                  A
                                </span>
                              ) : st === 'excused' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black text-[11px] bg-blue-100 text-blue-900 border border-blue-300">
                                  E
                                </span>
                              ) : st === 'late' ? (
                                <span className="inline-block px-1.5 py-0.5 rounded font-black text-[11px] bg-amber-100 text-amber-900 border border-amber-300">
                                  L
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono text-[11px]">—</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-bold text-red-600 font-mono whitespace-nowrap text-[11px]">
                          {student.totalAbsenceDays || 0}
                        </td>
                        <td className="py-1 px-2 border border-slate-900 text-center whitespace-nowrap"></td>
                      </>
                    )}

                    {rosterTemplate === 'grades' && (
                      <>
                        <td className="py-1 px-1 border border-slate-900 text-center font-mono whitespace-nowrap"></td>
                        <td className="py-1 px-1 border border-slate-900 text-center font-mono whitespace-nowrap"></td>
                        <td className="py-1 px-1 border border-slate-900 text-center font-mono whitespace-nowrap"></td>
                        <td className="py-1 px-1 border border-slate-900 text-center font-mono whitespace-nowrap"></td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono whitespace-nowrap"></td>
                        <td className="py-1 px-1 border border-slate-900 text-center font-mono font-bold whitespace-nowrap"></td>
                        <td className="py-1 px-2 border border-slate-900 text-center whitespace-nowrap"></td>
                      </>
                    )}

                    {rosterTemplate === 'competencies' && (
                      <>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono whitespace-nowrap text-[11px]">
                          {student.workshopAbsenceHours || 0} س
                        </td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center font-mono font-bold text-emerald-700 whitespace-nowrap text-[11px]">
                          92%
                        </td>
                        <td className="py-1 px-1.5 border border-slate-900 text-center text-[11px] font-bold text-blue-900 whitespace-nowrap">
                          {student.competencyStatus || 'مستوفٍ'}
                        </td>
                        <td className="py-1 px-2 border border-slate-900 text-center text-[11px] font-bold whitespace-nowrap">
                          جدير [ ]
                        </td>
                        <td className="py-1 px-2 border border-slate-900 text-center whitespace-nowrap"></td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* =========================================================================
            Official 4-Signatures Block (A4 Ministry Compliant)
           ========================================================================= */}
        <div className="pt-6 border-t-2 border-slate-900">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-black text-slate-950 leading-relaxed">
            <div className="space-y-6">
              <div>مسئول شئون الطلاب</div>
              <div className="text-slate-700 font-medium">({schoolConfig.studentAffairsAgent || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>مشرف التخصص (العملي / العلمي)</div>
              <div className="text-slate-700 font-medium">({dept?.practicalSupervisorName || dept?.scientificSupervisorName || dept?.headName || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>وكيل شئون الطلاب</div>
              <div className="text-slate-700 font-medium">({schoolConfig.studentAffairsHead || '........................'})</div>
            </div>

            <div className="space-y-6">
              <div>مدير عام المدرسة وخاتم الشعار</div>
              <div className="text-slate-700 font-medium">({schoolConfig.managerName || '........................'})</div>
            </div>
          </div>

          <div className="mt-4 text-center text-[10px] text-slate-500 font-medium">
            طُبع من المنظومة الإلكترونية للتعليم الفني بتاريخ: {new Date().toLocaleDateString('ar-EG')} - اعتماد الإدارة المدرسية
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-['Cairo']">
      {/* Top Banner (No Print) */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 shadow-md border border-blue-800/40 flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-blue-500/20 text-blue-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-blue-500/30 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> المنظومة الرسمية لقوائم الفصول الدراسية
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10.5px] px-2 py-0.2 rounded-full font-bold border border-emerald-500/30">
              A4 جاهز للطباعة والـ PDF
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-blue-300">
            قوائم الفصول المعتمدة واستخراج السجلات (A4)
          </h2>
          <p className="text-[11px] text-slate-300 max-w-2xl leading-relaxed">
            عرض وطباعة قوائم الفصول لجميع التخصصات بنماذج متعددة: كشف بيانات، كشف حضور وتوقيعات، كشف درجات، وسجل الجدارات.
          </p>
        </div>

        {/* Action Buttons: Print, PDF, Excel */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExportCSV(activeClass, classStudents)}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="تصدير كشف الفصل بصيغة Excel CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير إكسيل</span>
          </button>

          <button
            onClick={handlePrint}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1.5 text-xs cursor-pointer"
            title="طباعة كشف الفصل على ورق A4 أو حفظه بصيغة PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة القائمة (A4)</span>
          </button>
        </div>
      </div>

      {/* Control & Filter Panel (No Print) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 no-print">
        {/* Row 1: Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <select
                value={selectedDeptId}
                disabled={!isFullAdmin && departments.length <= 1}
                onChange={(e) => {
                  setSelectedDeptId(e.target.value);
                  const newFiltered = classes.filter(
                    (c) => e.target.value === 'all' || c.departmentId === e.target.value
                  );
                  if (newFiltered.length > 0) setSelectedClassId(newFiltered[0].id);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 disabled:opacity-80"
              >
                {isFullAdmin && <option value="all">جميع التخصصات والأقسام</option>}
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level Filter */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <select
                value={selectedGrade}
                onChange={(e) => {
                  setSelectedGrade(e.target.value);
                  const newFiltered = classes.filter(
                    (c) =>
                      (selectedDeptId === 'all' || c.departmentId === selectedDeptId) &&
                      (e.target.value === 'all' || c.gradeLevel.toString() === e.target.value)
                  );
                  if (newFiltered.length > 0) setSelectedClassId(newFiltered[0].id);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold p-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">جميع الصفوف الدراسية</option>
                <option value="1">الصف الأول الصناعي</option>
                <option value="2">الصف الثاني الصناعي</option>
                <option value="3">الصف الثالث الصناعي (الدبلوم)</option>
                {schoolConfig.schoolSystemType !== '3_years' && (
                  <>
                    <option value="4">الصف الرابع المتقدم</option>
                    <option value="5">الصف الخامس المتقدم</option>
                  </>
                )}
              </select>
            </div>

            {/* Class Dropdown */}
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isBatchMode}
                className="bg-blue-50 border-2 border-blue-400 rounded-xl text-xs font-black p-2.5 text-blue-950 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - ({c.departmentName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="بحث بالاسم أو الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Templates & Batch Mode */}
        <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Template Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRosterTemplate('comprehensive')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                rosterTemplate === 'comprehensive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>قائمة بيانات شاملة</span>
            </button>

            <button
              onClick={() => setRosterTemplate('attendance')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                rosterTemplate === 'attendance'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>كشف رصد حضور وتوقيعات</span>
            </button>

            <button
              onClick={() => setRosterTemplate('grades')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                rosterTemplate === 'grades'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>كشف درجات وتقييم شهري</span>
            </button>

            <button
              onClick={() => setRosterTemplate('competencies')}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                rosterTemplate === 'competencies'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>سجل جدارات الورش</span>
            </button>
          </div>

          {/* Sort options & Batch print toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>ترتيب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortFieldType)}
                className="bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold p-1 text-slate-800"
              >
                <option value="name">أبجدياً بالاسم</option>
                <option value="code">بكود الطالب</option>
                <option value="nationalId">بالرقم القومي</option>
                <option value="status">بالحالة الدراسية</option>
              </select>
            </div>

            {/* Batch mode toggle */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-xl cursor-pointer border border-slate-300 hover:bg-slate-200 transition">
              <input
                type="checkbox"
                checked={isBatchMode}
                onChange={(e) => setIsBatchMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>عرض وطباعة كل فصول التصفية دفعة واحدة ({filteredClasses.length} فصل)</span>
            </label>
          </div>
        </div>

        {/* Row 3: Week Navigator (Attendance Only) */}
        {rosterTemplate === 'attendance' && (
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-3 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-bold text-blue-950">الأسبوع المعروض في الكشف:</span>
              <span className="text-xs font-black text-blue-800 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-2xs">
                من {startDateStr} إلى {endDateStr}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const d = new Date(anchorDate);
                  d.setDate(d.getDate() - 7);
                  setAnchorDate(d);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="الأسبوع السابق"
              >
                <ChevronRight className="w-4 h-4" />
                <span>الأسبوع السابق</span>
              </button>

              <button
                type="button"
                onClick={() => setAnchorDate(new Date())}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                الأسبوع الحالي
              </button>

              <button
                type="button"
                onClick={() => {
                  const d = new Date(anchorDate);
                  d.setDate(d.getDate() + 7);
                  setAnchorDate(d);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="الأسبوع القادم"
              >
                <span>الأسبوع القادم</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          Printable Rosters Container
         ========================================================================= */}
      <div className="space-y-8">
        {isBatchMode ? (
          filteredClasses.map((cls) => {
            const clsStudents = students
              .filter((s) => s.classId === cls.id)
              .sort((a, b) => {
                if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true });
                if (sortBy === 'code') return a.studentCode.localeCompare(b.studentCode, 'ar', { numeric: true });
                return a.fullName.localeCompare(b.fullName, 'ar', { sensitivity: 'base', numeric: true });
              });
            return renderClassSheet(cls, clsStudents, false);
          })
        ) : activeClass ? (
          renderClassSheet(activeClass, classStudents, true)
        ) : (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 text-slate-500 font-bold">
            لم يتم العثور على فصول مطابقة للتصفية المحددة.
          </div>
        )}
      </div>
    </div>
  );
};
